import { ClassStatus, PaymentStatus, PurchaseStatus } from 'db'
import { prisma } from 'db'
import type { ActionFunctionArgs } from 'react-router'
import { p24Service } from '../services/p24.server'

// P24 sends notifications as POST requests
// We need to parse the body, verify the signature, verify the transaction with P24, and then update our DB.

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const formData = await request.formData()
    const body: any = Object.fromEntries(formData)

    // The notification payload from P24 (usually form-urlencoded or JSON, standard P24 documentation suggests receiving it as POST properties)
    // If it comes as JSON, `request.json()` would be needed. Standard P24 often sends form-data.
    // Let's assume standard P24 notification fields:
    /*
              merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, sign
            */

    // If body is empty, it might be JSON
    let payload = body
    if (!payload.merchantId) {
      try {
        payload = await request.clone().json()
      } catch (_e) {
        // ignore
      }
    }

    // Check if we have necessary data
    const { merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, sign } = payload

    if (!sessionId || !orderId || !sign) {
      console.error('P24 Notify: Missing required fields', payload)
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    // 1. Check Signature (verify that this request comes from P24)
    // Note: The signature in notification is calculated using "crc" from config.
    const isValidSign = p24Service.checkNotificationSign(
      Number(merchantId),
      Number(posId),
      sessionId,
      Number(amount),
      Number(originAmount),
      currency,
      Number(orderId),
      Number(methodId),
      statement,
      sign
    )

    if (!isValidSign) {
      console.error('P24 Notify: Invalid signature')
      // Return OK to stop P24 from retrying? Or Error?
      // If we return 200, P24 assumes success. If invalid signature, it might be an attack.
      return Response.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // 2. Verify Transaction with P24 (Server-to-Server)
    const verified = await p24Service.verifyTransaction({
      sessionId,
      amount: Number(amount),
      currency,
      orderId: Number(orderId),
    })

    if (!verified) {
      console.error('P24 Notify: Verification failed with P24 API')
      return Response.json({ error: 'Verification failed' }, { status: 400 })
    }

    // 3. Update Database
    // sessionId in P24 logic usually maps to our payment.id or a unique string we sent.
    // In `dancer.packages.tsx`, we should send payment.id as sessionId.
    const paymentId = sessionId

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    })

    if (!payment) {
      console.error('P24 Notify: Payment not found', paymentId)
      return Response.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.paymentStatus === PaymentStatus.COMPLETED) {
      return new Response('OK', { status: 200 })
    }

    // Update Payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        transactionId: String(orderId),
        amount: Number(amount) / 100, // P24 amount is in grosz
      },
    })

    // Create UserPurchase if not exists (or activate it)
    // We need to know WHICH package was purchased.
    // We can store packageId in Payment metadata or we have to deduce it.
    // Let's assume we stored packageId in metadata when creating payment.
    const metadata = payment.metadata as any
    const packageId = metadata?.packageId

    if (!packageId) {
      console.error('P24 Notify: No packageId in payment metadata', paymentId)
      // Can't create purchase without packageId
      return new Response('OK', { status: 200 }) // Return OK to silence P24, but log error
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { classLinks: { include: { classTemplate: true } } },
    })

    if (!pkg) {
      console.error('P24 Notify: Package not found', packageId)
      return new Response('OK', { status: 200 })
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + pkg.validityDays)

    const userPurchase = await prisma.userPurchase.create({
      data: {
        userId: payment.userId,
        packageId: pkg.id,
        classesRemaining: pkg.classCount,
        expiryDate: expiryDate,
        status: PurchaseStatus.ACTIVE,
        classesUsed: 0,
        paymentId: payment.id,
      },
    })

    // 4. Handle Auto-Sign-In
    if (metadata.autoSignIn) {
      await handleAutoSignIn(payment.userId, userPurchase.id, pkg, metadata.autoSignIn)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('P24 Notify Error:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function handleAutoSignIn(userId: string, purchaseId: string, pkg: any, autoSignIn: boolean) {
  if (!autoSignIn) return

  // Logic: Find next upcoming scheduled ClassInstance for each ClassTemplate in the package
  // and register usage.

  // 1. Identify templates
  const templates = pkg.classLinks.map((link: any) => link.classTemplate)

  if (templates.length === 0 && pkg.classLinks.length === 0) {
    // Universal package? Logic for "next class" on universal package is ambiguous (which class?).
    // Usually auto-sign-in makes sense for specific courses.
    // If universal, perhaps we don't auto-sign-in or we'd need more info.
    // For now, assuming auto-sign-in works best for linked classes.
    return
  }

  for (const template of templates) {
    // Find next scheduled instance
    const nextInstance = await prisma.classInstance.findFirst({
      where: {
        classTemplateId: template.id,
        startTime: { gt: new Date() },
        status: ClassStatus.ACTIVE,
      },
      orderBy: { startTime: 'asc' },
    })

    if (nextInstance) {
      // Check if user already attending
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_classId: {
            userId,
            classId: nextInstance.id,
          },
        },
      })

      if (!existingAttendance) {
        // Check if purchase has remaining classes
        // We need to fetch current remaining from DB as it might have changed in loop
        const currentPurchase = await prisma.userPurchase.findUnique({
          where: { id: purchaseId },
        })

        if (currentPurchase && currentPurchase.classesRemaining > 0) {
          // Register
          await prisma.$transaction([
            prisma.attendance.create({
              data: {
                userId,
                classId: nextInstance.id,
              },
            }),
            prisma.userPurchase.update({
              where: { id: purchaseId },
              data: {
                classesRemaining: { decrement: 1 },
                classesUsed: { increment: 1 },
              },
            }),
          ])
        }
      }
    }
  }
}
