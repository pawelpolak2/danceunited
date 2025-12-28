import { prisma } from 'db'
import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { createSessionCookie, hashPassword } from '../lib/auth.server'
import { validateRegistration } from '../lib/validation'
import type { Route } from './+types/register'

// biome-ignore lint/correctness/noEmptyPattern: this is boilerplate code!
export function meta({}: Route.MetaArgs) {
  return [{ title: 'Register - Dance United' }, { name: 'description', content: 'Create a new Dance United account' }]
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
    return Response.json({ success: false, message: errorMessage, errors: {} }, { status: 200 })
  }
}

type ActionData =
  | { success: false; errors: Record<string, string>; message?: string }
  | { success: false; message: string; errors: Record<string, string> }
  | undefined

export default function RegisterPage() {
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div>
          <h2 className="text-center font-bold text-3xl text-gray-900 dark:text-white">Create your account</h2>
          <p className="mt-2 text-center text-gray-600 text-sm dark:text-gray-400">
            Or{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              sign in to your existing account
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
                <p className="text-red-800 text-sm dark:text-red-200">Please check the form for errors</p>
              )}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                  actionData?.errors?.firstName
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="John"
              />
              {actionData?.errors?.firstName && (
                <p className="mt-1 text-red-600 text-sm dark:text-red-400">{actionData.errors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                  actionData?.errors?.lastName
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Doe"
              />
              {actionData?.errors?.lastName && (
                <p className="mt-1 text-red-600 text-sm dark:text-red-400">{actionData.errors.lastName}</p>
              )}
            </div>
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
                autoComplete="new-password"
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
              <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">
                Must be at least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  )
}
