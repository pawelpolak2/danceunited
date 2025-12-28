import { Link } from 'react-router'
import type { Route } from './+types/_index'

// biome-ignore lint/correctness/noEmptyPattern: this is boilerplate code!
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dance United - Home' },
    { name: 'description', content: 'Welcome to Dance United - Your dance community platform' },
  ]
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-gray-900 tracking-tight sm:text-6xl dark:text-white">
            Welcome to Dance United
          </h1>
          <p className="mb-12 text-gray-600 text-xl dark:text-gray-300">
            Your premier platform for dance classes, community, and connection
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="w-full rounded-lg bg-blue-600 px-8 py-3 font-semibold text-lg text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="w-full rounded-lg border-2 border-blue-600 px-8 py-3 font-semibold text-blue-600 text-lg transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-gray-200 border-t bg-gray-50 px-4 py-16 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-gray-900 dark:text-white">
            Why Choose Dance United?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 text-4xl">💃</div>
              <h3 className="mb-2 font-semibold text-gray-900 text-xl dark:text-white">Diverse Classes</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Explore a wide variety of dance styles from ballet to hip-hop, salsa to contemporary.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 text-4xl">👥</div>
              <h3 className="mb-2 font-semibold text-gray-900 text-xl dark:text-white">Community</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with fellow dancers, share experiences, and grow together in your dance journey.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 text-4xl">📅</div>
              <h3 className="mb-2 font-semibold text-gray-900 text-xl dark:text-white">Easy Booking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Book classes, manage your schedule, and track your progress all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
