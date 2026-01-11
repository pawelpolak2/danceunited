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
import { EasterEggGuide, ExplosionManager, MetallicButton, MetallicLink, MoonPhaseManager, ShinyText, WeeklyEasterEggManager } from './components/ui'
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
  {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.css',
  },
  {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/index.global.min.css',
  },
  {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/index.global.min.css',
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
    <div className="flex min-h-screen flex-col bg-gray-950">
      <header className="border-amber-900/20 border-b bg-gray-950">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logos/logo-transparent.png" alt="Dance United" className="h-10 w-auto" />
              <ShinyText as="span" variant="title" className="text-2xl">
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
              <>
                {user.role === 'DANCER' && (
                  <MetallicLink to="/dashboard" className="rounded-md border-2 px-4 py-2 text-sm">
                    Dashboard
                  </MetallicLink>
                )}
                {user.role === 'TRAINER' && (
                  <MetallicLink to="/trainer-dashboard" className="rounded-md border-2 px-4 py-2 text-sm">
                    Dashboard
                  </MetallicLink>
                )}
                <ShinyText variant="body" className="text-sm">
                  {user.firstName} {user.lastName}
                </ShinyText>
                <Form method="post" action="/api/auth/logout">
                  <MetallicButton type="submit" className="rounded-md border-2 px-4 py-2 text-sm">
                    Logout
                  </MetallicButton>
                </Form>
              </>
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
          </div>
        </nav>
      </header>
      <main className="flex-1 bg-gray-950">
        <Outlet />
      </main>
      <footer className="border-amber-900/20 border-t bg-gray-950 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm">
          <ShinyText variant="body">&copy; {new Date().getFullYear()} dance united. All rights reserved.</ShinyText>
        </div>
      </footer>
      <ExplosionManager />
      <MoonPhaseManager />
      <WeeklyEasterEggManager />
      <EasterEggGuide />
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
