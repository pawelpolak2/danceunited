import { prisma } from 'db'
import { redirect } from 'react-router'
import { createSessionCookie, verifyPassword } from '../lib/auth.server'
import { validateLogin } from '../lib/validation'
import type { Route } from './+types/api.auth.login'

// Handle GET requests (shouldn't happen, but prevents errors)
export function loader() {
  return redirect('/login')
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string | null
    const password = formData.get('password') as string | null

    // Validate input
    const validation = validateLogin({ email, password })
    if (!validation.valid) {
      // Return 200 status so React Router populates useActionData
      return Response.json({ success: false, errors: validation.errors }, { status: 200 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    })

    if (!user) {
      return Response.json({ success: false, errors: { email: 'Invalid email or password' } }, { status: 200 })
    }

    // Check if user is active
    if (!user.isActive) {
      return Response.json(
        { success: false, errors: { email: 'Your account has been deactivated. Please contact support.' } },
        { status: 200 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password as string, user.passwordHash)
    if (!isValidPassword) {
      return Response.json({ success: false, errors: { email: 'Invalid email or password' } }, { status: 200 })
    }

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
    console.error('Login error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during login. Please try again.'
    return Response.json({ success: false, message: errorMessage, errors: {} }, { status: 500 })
  }
}
