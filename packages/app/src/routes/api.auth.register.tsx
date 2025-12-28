import { prisma } from 'db'
import { redirect } from 'react-router'
import { createSessionCookie, hashPassword } from '../lib/auth.server'
import { validateRegistration } from '../lib/validation'
import type { Route } from './+types/api.auth.register'

// Handle GET requests (shouldn't happen, but prevents errors)
export function loader() {
  return redirect('/register')
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData()
    const firstName = formData.get('firstName') as string | null
    const lastName = formData.get('lastName') as string | null
    const email = formData.get('email') as string | null
    const password = formData.get('password') as string | null

    // Validate input
    const validation = validateRegistration({ firstName, lastName, email, password })
    if (!validation.valid) {
      // Return 200 status so React Router populates useActionData
      return Response.json({ success: false, errors: validation.errors }, { status: 200 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email as string },
    })

    if (existingUser) {
      return Response.json(
        { success: false, errors: { email: 'An account with this email already exists' } },
        { status: 200 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password as string)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: firstName as string,
        lastName: lastName as string,
        email: email as string,
        passwordHash,
        role: 'DANCER', // Default role
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    // Create session
    const sessionCookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    })

    // Redirect to home with session cookie
    return redirect('/', {
      headers: {
        'Set-Cookie': sessionCookie,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred during registration. Please try again.'
    return Response.json({ success: false, message: errorMessage, errors: {} }, { status: 500 })
  }
}
