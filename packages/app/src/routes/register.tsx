import { prisma } from 'db'
import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { FormError, FormField, MetallicButton, ShinyText } from '../components/ui'
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
      <div className="form-container">
        <div>
          <ShinyText as="h2" variant="title" className="text-center text-3xl">
            create your account
          </ShinyText>
          <p className="mt-2 text-center text-sm">
            <ShinyText variant="body" className="text-sm">
              Or{' '}
              <a href="/login" className="shiny-text font-medium hover:opacity-80">
                sign in to your existing account
              </a>
            </ShinyText>
          </p>
        </div>
        <Form method="post" className="mt-8 space-y-6">
          {actionData && !actionData.success && <FormError message={actionData.message} errors={actionData.errors} />}
          <div className="form-field">
            <FormField
              label="First name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              placeholder="John"
              error={actionData?.errors?.firstName}
            />
            <FormField
              label="Last name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              placeholder="Doe"
              error={actionData?.errors?.lastName}
            />
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
              autoComplete="new-password"
              required
              placeholder="••••••••"
              error={actionData?.errors?.password}
              hint="Must be at least 8 characters with uppercase, lowercase, and a number"
            />
          </div>

          <div>
            <MetallicButton
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md border-2 px-4 py-2 text-sm"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </MetallicButton>
          </div>
        </Form>
      </div>
    </div>
  )
}
