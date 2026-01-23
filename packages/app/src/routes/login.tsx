import { prisma } from 'db'
import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { FormError, FormField, MetallicButton, ShinyText } from '../components/ui'
import { createSessionCookie, getCurrentUser, verifyPassword } from '../lib/auth.server'
import { validateLogin } from '../lib/validation'
import type { Route } from './+types/login'

// biome-ignore lint/correctness/noEmptyPattern: this is boilerplate code!
export function meta({}: Route.MetaArgs) {
  return [{ title: 'Login - Dance United' }, { name: 'description', content: 'Login to your Dance United account' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)
  if (user) {
    return redirect(user.role === 'MANAGER' ? '/admin/dashboard' : '/schedule')
  }
  return null
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string | null
    const password = formData.get('password') as string | null

    // Validate input
    const validation = validateLogin({ email, password })
    if (!validation.valid) {
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

    // Redirect to dashboard with session cookie
    return redirect('/dashboard', {
      headers: {
        'Set-Cookie': sessionCookie,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during login. Please try again.'
    return Response.json({ success: false, message: errorMessage, errors: {} }, { status: 200 })
  }
}

type ActionData =
  | { success: false; errors: Record<string, string>; message?: string }
  | { success: false; message: string; errors: Record<string, string> }
  | undefined

export default function LoginPage() {
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="form-container">
        <div>
          <ShinyText as="h2" variant="title" className="text-center text-3xl">
            sign in to your account
          </ShinyText>
          <p className="mt-2 text-center text-sm">
            <ShinyText variant="body" className="text-sm">
              Or{' '}
              <a href="/register" className="shiny-text font-medium hover:opacity-80">
                create a new account
              </a>
            </ShinyText>
          </p>
        </div>
        <Form method="post" className="mt-8 space-y-6">
          {actionData && !actionData.success && <FormError message={actionData.message} errors={actionData.errors} />}
          <div className="form-field">
            <FormField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              error={actionData?.errors?.email}
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              error={actionData?.errors?.password}
            />
          </div>

          <div>
            <MetallicButton
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md border-2 px-4 py-2 text-sm"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </MetallicButton>
          </div>
        </Form>
      </div>
    </div>
  )
}
