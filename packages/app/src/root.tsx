import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
} from 'react-router'

import type { Route } from './+types/root'
import { getCurrentUser } from './lib/auth.server'
import './app.css'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)
  return { user }
}

export default function App() {
  const { user } = useLoaderData<typeof loader>()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-gray-200 border-b bg-white dark:border-gray-800 dark:bg-gray-900">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-bold text-2xl text-gray-900 dark:text-white">
            Dance United
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-700 text-sm dark:text-gray-300">
                  {user.firstName} {user.lastName}
                </span>
                <Form method="post" action="/api/auth/logout">
                  <button
                    type="submit"
                    className="rounded-md px-4 py-2 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </Form>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-4 py-2 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-gray-200 border-t bg-gray-50 py-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 text-center text-gray-600 text-sm dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Dance United. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
