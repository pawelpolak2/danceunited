import type { EventClickArg } from '@fullcalendar/core'
import { prisma } from 'db'
import { Check, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { redirect, useFetcher, useLoaderData } from 'react-router'
import { ClassDetailsModal } from '../components/dashboard/ClassDetailsModal'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { ConfirmModal, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dancer.schedule'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'Schedule - Dance United' }, { name: 'description', content: 'View and sign up for classes' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'DANCER') return redirect('/')

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2)

  // Fetch ALL classes for the calendar
  const classes = await prisma.classInstance.findMany({
    where: {
      startTime: { gte: threeMonthsAgo },
      status: { not: 'CANCELLED' },
    },
    include: {
      classTemplate: true,
      actualTrainer: true,
      attendances: {
        where: { userId: user.userId },
        select: { userId: true }, // Optimization
      },
    },
    orderBy: { startTime: 'asc' },
  })

  const events = classes.map((c) => {
    const isAttending = c.attendances.length > 0
    return {
      id: c.id,
      title: c.classTemplate.name,
      start: c.startTime.toISOString(),
      end: c.endTime.toISOString(),
      // Green for attending, standard Hall colors otherwise
      backgroundColor: isAttending
        ? '#059669' // Emerald 600
        : c.actualHall === 'HALL1'
          ? '#d97706'
          : '#78350f',
      borderColor: isAttending ? '#047857' : '#b45309',
      extendedProps: {
        hall: c.actualHall,
        trainerName: `${c.actualTrainer.firstName} ${c.actualTrainer.lastName}`,
        duration: c.classTemplate.duration,
        isAttending,
      },
    }
  })

  return { user, events }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'DANCER') return redirect('/')

  const formData = await request.formData()
  const intent = formData.get('intent')
  const classId = formData.get('classId') as string

  if (!classId) return { error: 'Missing class ID' }

  try {
    if (intent === 'signup') {
      // Check if already signed up
      const existing = await prisma.attendance.findUnique({
        where: {
          userId_classId: {
            userId: user.userId,
            classId,
          },
        },
      })

      if (existing) return { success: true, message: 'Already signed up' }

      // Fetch Class Details to check template compatibility
      const classInstance = await prisma.classInstance.findUnique({
        where: { id: classId },
        include: { classTemplate: true },
      })
      if (!classInstance) return { error: 'Class not found' }

      // Find valid package
      const purchases = await prisma.userPurchase.findMany({
        where: {
          userId: user.userId,
          status: 'ACTIVE',
          classesRemaining: { gt: 0 },
          OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
        },
        include: {
          package: {
            include: { classLinks: true },
          },
        },
        orderBy: { expiryDate: 'asc' }, // Use earliest expiring first
      })

      const validPurchase = purchases.find((p) => {
        if (p.package.classLinks.length === 0) return true // Universal
        return p.package.classLinks.some((link) => link.classTemplateId === classInstance.classTemplateId)
      })

      if (!validPurchase) return { error: 'No valid package found for this class' }

      // Transaction: Create Attendance & Update Purchase
      await prisma.$transaction([
        prisma.attendance.create({
          data: {
            userId: user.userId,
            classId,
          },
        }),
        prisma.userPurchase.update({
          where: { id: validPurchase.id },
          data: {
            classesRemaining: { decrement: 1 },
            classesUsed: { increment: 1 },
            status: validPurchase.classesRemaining === 1 ? 'USED' : undefined,
          },
        }),
      ])

      return { success: true, intent: 'signup' }
    }

    if (intent === 'cancel') {
      // Transaction: Delete Attendance & Credit Package
      // Logic: Find the most relevant package to credit.
      // Ideally we would know WHICH package was used, but for now we credit the first active or recently finished one.
      // We look for a package that matches the class template.

      const classInstance = await prisma.classInstance.findUnique({
        where: { id: classId },
        include: { classTemplate: true },
      })

      if (!classInstance) return { error: 'Class not found' }

      // Find a package to credit.
      // Priority:
      // 1. Active package compatible with this class
      // 2. "USED" package compatible with this class (re-activate it)

      const purchaseToCredit = await prisma.userPurchase.findFirst({
        where: {
          userId: user.userId,
          package: {
            OR: [
              { classLinks: { none: {} } }, // Universal
              { classLinks: { some: { classTemplateId: classInstance.classTemplateId } } },
            ],
          },
          OR: [
            { status: 'ACTIVE' },
            { status: 'USED' }, // If it was just used up, we can re-activate
          ],
        },
        orderBy: { expiryDate: 'asc' }, // Credit the one expiring first (FIFO - likely the one used)
        // Let's credit the one expiring last to be generous, OR the one expiring first to ensure they use it?
        // Standard logic: Credit back where it likely came from. We don't have that link.
        // Let's pick the first available one to effectively "undo" a decrement.
      })

      if (purchaseToCredit) {
        await prisma.$transaction([
          prisma.attendance.delete({
            where: {
              userId_classId: {
                userId: user.userId,
                classId,
              },
            },
          }),
          prisma.userPurchase.update({
            where: { id: purchaseToCredit.id },
            data: {
              classesRemaining: { increment: 1 },
              classesUsed: { decrement: 1 },
              status: 'ACTIVE', // Ensure it is active if it was USED
            },
          }),
        ])
      } else {
        // Fallback if no package found (shouldn't happen if they signed up with one, but maybe expired?)
        // Just delete attendance
        await prisma.attendance.delete({
          where: {
            userId_classId: {
              userId: user.userId,
              classId,
            },
          },
        })
      }

      return { success: true, message: 'Reservation cancelled. Class credited back to your package.', intent: 'cancel' }
    }
  } catch (error) {
    console.error('Action failed:', error)
    return { error: 'Action failed' }
  }

  return null
}

export default function DancerSchedulePage() {
  const { events } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()

  const [isMyClassesOnly, setIsMyClassesOnly] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Close modal on successful fetcher completion
  const isSubmittingRef = useRef(false)

  // Track submission state
  useEffect(() => {
    if (fetcher.state === 'submitting' || fetcher.state === 'loading') {
      isSubmittingRef.current = true
    } else if (fetcher.state === 'idle' && isSubmittingRef.current) {
      if (fetcher.data?.success) {
        setIsModalOpen(false)
        setSelectedEvent(null)
      }
      isSubmittingRef.current = false
    }
  }, [fetcher.state, fetcher.data])

  const filteredEvents = useMemo(() => {
    if (!isMyClassesOnly) return events
    return events.filter((e) => e.extendedProps.isAttending)
  }, [events, isMyClassesOnly])

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const event = events.find((e) => e.id === clickInfo.event.id)
      if (event) {
        setSelectedEvent(event)
        setIsModalOpen(true)
      }
    },
    [events]
  )

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [classToCancel, setClassToCancel] = useState<string | null>(null)

  // ... (previous handles)

  const handleSignUp = (classId: string) => {
    const formData = new FormData()
    formData.append('intent', 'signup')
    formData.append('classId', classId)
    fetcher.submit(formData, { method: 'post' })
  }

  const handleCancelClick = (classId: string) => {
    setClassToCancel(classId)
    setIsConfirmModalOpen(true)
  }

  const handleConfirmCancel = () => {
    if (classToCancel) {
      const formData = new FormData()
      formData.append('intent', 'cancel')
      formData.append('classId', classToCancel)
      fetcher.submit(formData, { method: 'post' })
    }
    setIsConfirmModalOpen(false)
    setClassToCancel(null)
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-1">
            <ShinyText as="h1" variant="title" className="font-serif text-4xl text-amber-400">
              Class Schedule
            </ShinyText>
            <ShinyText variant="body" className="text-lg opacity-80">
              Browse classes and manage your bookings
            </ShinyText>
          </div>

          <div className="flex w-full gap-3 md:w-auto">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-amber-500/20 bg-gray-900/50 px-4 py-2 transition-colors hover:bg-gray-800">
              <input
                type="checkbox"
                checked={isMyClassesOnly}
                onChange={(e) => setIsMyClassesOnly(e.target.checked)}
                className="h-4 w-4 rounded border-amber-500/50 bg-gray-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
              />
              <span className="font-medium text-amber-100 text-sm">Show My Classes Only</span>
            </label>
          </div>
        </div>

        {fetcher.data?.error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-red-200">
            <X className="h-5 w-5" /> {fetcher.data.error}
          </div>
        )}
        {fetcher.data?.success && fetcher.data?.message && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-900/20 p-4 text-green-200">
            <Check className="h-5 w-5" /> {fetcher.data.message}
          </div>
        )}

        <div className="rounded-lg border border-amber-900/20 bg-gray-900/30 p-1">
          <DashboardCalendar events={filteredEvents} onEventClick={handleEventClick} height="auto" />
        </div>
      </div>

      <ClassDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classInstance={selectedEvent}
        isAttending={selectedEvent?.extendedProps?.isAttending}
        onSignUp={handleSignUp}
        onCancel={handleCancelClick}
        isProcessing={fetcher.state !== 'idle'}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Reservation"
        description="Are you sure you want to cancel this reservation? The class will be credited back to your package."
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Keep it"
        isDestructive
        isLoading={fetcher.state !== 'idle'}
      />
    </div>
  )
}
