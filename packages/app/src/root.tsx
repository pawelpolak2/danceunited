import { ChevronDown, LayoutDashboard, LogOut, Settings, User as UserIcon } from 'lucide-react'
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
  useLocation,
} from 'react-router'

import type { Route } from './+types/root'
import { Footer } from './components/Footer'
import { MetallicLink, MobileNav, ShinyText } from './components/ui'
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
    href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap',
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
  // useLocation logic to handle global overflow
  const location = useLocation()

  // Dashboard routes (Admin, Trainer, Dancer) will handle their own scrolling
  // This logic toggles the overflow of the main content area
  // Checks for /admin, /trainer, /dancer, and /dashboard
  const isDashboard =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/trainer') ||
    location.pathname.startsWith('/dancer') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/trainer-dashboard') // specific check from other branch logic if needed

  return (
    <div className={`flex flex-col bg-gray-950 ${isDashboard ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {!isDashboard && (
        <header className="relative z-50 flex-none border-amber-900/20 border-b bg-gray-950">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3">
                <img src="/logos/logo-transparent.png" alt="Dance United" className="h-16 w-auto" />
                <ShinyText as="span" variant="title" className="text-3xl">
                  dance united
                </ShinyText>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden items-center gap-6 md:flex">
                <Link to="/about">
                  <ShinyText
                    variant="body"
                    className="text-xl uppercase tracking-wider transition-colors hover:text-gold"
                  >
                    About Us
                  </ShinyText>
                </Link>
                <Link to="/team">
                  <ShinyText
                    variant="body"
                    className="text-xl uppercase tracking-wider transition-colors hover:text-gold"
                  >
                    Team
                  </ShinyText>
                </Link>
                <Link to="/pricing">
                  <ShinyText
                    variant="body"
                    className="text-xl uppercase tracking-wider transition-colors hover:text-gold"
                  >
                    Pricing
                  </ShinyText>
                </Link>
                <Link to="/schedule">
                  <ShinyText
                    variant="body"
                    className="text-xl uppercase tracking-wider transition-colors hover:text-gold"
                  >
                    Schedule
                  </ShinyText>
                </Link>
                <Link to="/contact">
                  <ShinyText
                    variant="body"
                    className="text-xl uppercase tracking-wider transition-colors hover:text-gold"
                  >
                    Contact
                  </ShinyText>
                </Link>
                <Link to="/gallery">
                  <ShinyText
                    variant="body"
                    className="text-xl uppercase tracking-wider transition-colors hover:text-gold"
                  >
                    Gallery
                  </ShinyText>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <details className="group relative">
                  <summary className="flex cursor-pointer list-none items-center gap-2 transition-colors hover:text-amber-400 [&::webkit-details-marker]:hidden">
                    <UserIcon className="h-5 w-5 text-amber-500" />
                    <ShinyText variant="body" className="text-sm">
                      {user.firstName}
                    </ShinyText>
                    <ChevronDown className="h-4 w-4 text-amber-500/70 transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="absolute top-full right-0 z-50 mt-2 flex w-56 flex-col gap-1 rounded-xl border border-amber-900/30 bg-gray-950 py-2 shadow-2xl backdrop-blur-md">
                    {/* Dashboard Link */}
                    {(user.role === 'DANCER' || user.role === 'TRAINER' || user.role === 'MANAGER') && (
                      <Link
                        to={
                          user.role === 'MANAGER'
                            ? '/admin/dashboard'
                            : user.role === 'TRAINER'
                              ? '/trainer/dashboard' // Updated to standard path
                              : '/dancer/dashboard' // Updated to standard path
                        }
                        className="flex items-center gap-3 px-4 py-2 text-amber-50/80 text-sm transition-colors hover:bg-amber-900/20 hover:text-amber-100"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    )}

                    {/* Settings / Profile */}
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-amber-50/80 text-sm transition-colors hover:bg-amber-900/20 hover:text-amber-100"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <div className="my-1 border-amber-900/20 border-t" />

                    {/* Logout */}
                    <Form method="post" action="/api/auth/logout" className="w-full">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-red-300 text-sm transition-colors hover:bg-red-900/20 hover:text-red-200"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </Form>
                  </div>

                  {/* Backdrop to close on click outside */}
                  <div
                    className="fixed inset-0 z-40 hidden group-open:block"
                    onClick={(e) => {
                      const details = e.currentTarget.parentElement as HTMLDetailsElement
                      details.removeAttribute('open')
                    }}
                  />
                </details>
              ) : (
                <>
                  <MetallicLink to="/login" className="rounded-md border-2 px-4 py-2 text-sm">
                    Login
                  </MetallicLink>
                  <MetallicLink to="/register" className="rounded-md border-2 px-4 py-2 text-sm">
                    Register
                  </MetallicLink>
                </>
              )}
              <MobileNav />
            </div>
          </nav>
        </header>
      )}
      <main className={`flex-1 bg-gray-950 ${isDashboard ? 'relative overflow-hidden' : 'overflow-y-auto'}`}>
        <Outlet />
      </main>

      {!isDashboard && <Footer />}
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
    <main className="container mx-auto bg-gray-950 p-4 pt-16">
      <ShinyText as="h1" variant="title" className="mb-4 text-4xl">
        {message}
      </ShinyText>
      <ShinyText as="p" variant="body" className="mb-4 text-lg">
        {details}
      </ShinyText>
      {stack && (
        <pre className="w-full overflow-x-auto rounded-lg border border-amber-900/20 bg-gray-900/30 p-4 text-gold text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
