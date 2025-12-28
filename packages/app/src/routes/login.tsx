import { prisma } from 'db'
import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { createSessionCookie, verifyPassword } from '../lib/auth.server'
import { validateLogin } from '../lib/validation'
import type { Route } from './+types/login'

// biome-ignore lint/correctness/noEmptyPattern: this is boilerplate code!
export function meta({}: Route.MetaArgs) {
  return [{ title: 'Login - Dance United' }, { name: 'description', content: 'Login to your Dance United account' }]
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

    // Redirect to home with session cookie
    return redirect('/', {
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
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div>
          <h2 className="text-center font-bold text-3xl text-gray-900 dark:text-white">Sign in to your account</h2>
          <p className="mt-2 text-center text-gray-600 text-sm dark:text-gray-400">
            Or{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              create a new account
            </a>
          </p>
        </div>
        <Form method="post" className="mt-8 space-y-6">
          {actionData && !actionData.success && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              {actionData.message && (
                <p className="mb-2 text-red-800 text-sm dark:text-red-200">{actionData.message}</p>
              )}
              {actionData.errors && Object.keys(actionData.errors).length > 0 && (
                <ul className="list-inside list-disc space-y-1 text-red-800 text-sm dark:text-red-200">
                  {Object.values(actionData.errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
              {!actionData.message && (!actionData.errors || Object.keys(actionData.errors).length === 0) && (
                <p className="text-red-800 text-sm dark:text-red-200">Invalid email or password</p>
              )}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                  actionData?.errors?.email
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="you@example.com"
              />
              {actionData?.errors?.email && (
                <p className="mt-1 text-red-600 text-sm dark:text-red-400">{actionData.errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                  actionData?.errors?.password
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="••••••••"
              />
              {actionData?.errors?.password && (
                <p className="mt-1 text-red-600 text-sm dark:text-red-400">{actionData.errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  )
}
