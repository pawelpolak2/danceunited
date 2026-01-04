import { MetallicLink, ShinyText } from '../components/ui'
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
    <main className="flex min-h-screen flex-col bg-gray-950">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl text-center">
          <ShinyText
            as="h1"
            variant="title"
            className="mb-6 whitespace-nowrap text-3xl tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl"
          >
            welcome to dance united
          </ShinyText>
          <ShinyText as="p" variant="body" className="mb-12 text-xl">
            Your premier platform for dance classes, community, and connection
          </ShinyText>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <MetallicLink
              to="/login"
              variant="primary"
              className="w-full rounded-lg border-2 px-8 py-3 text-lg sm:w-auto"
            >
              Login
            </MetallicLink>
            <MetallicLink
              to="/register"
              variant="primary"
              className="w-full rounded-lg border-2 px-8 py-3 text-lg sm:w-auto"
            >
              Register
            </MetallicLink>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-amber-900/20 border-t bg-gray-950 px-4 py-16">
        <div className="section-container">
          <ShinyText as="h2" variant="title" className="section-title text-3xl">
            why choose dance united?
          </ShinyText>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="feature-card">
              <div className="mb-4 text-4xl">💃</div>
              <ShinyText as="h3" variant="title" className="mb-2 font-semibold text-xl">
                Diverse Classes
              </ShinyText>
              <ShinyText variant="body">
                Explore a wide variety of dance styles from ballet to hip-hop, salsa to contemporary.
              </ShinyText>
            </div>
            <div className="feature-card">
              <div className="mb-4 text-4xl">👥</div>
              <ShinyText as="h3" variant="title" className="mb-2 font-semibold text-xl">
                Community
              </ShinyText>
              <ShinyText variant="body">
                Connect with fellow dancers, share experiences, and grow together in your dance journey.
              </ShinyText>
            </div>
            <div className="feature-card">
              <div className="mb-4 text-4xl">📅</div>
              <ShinyText as="h3" variant="title" className="mb-2 font-semibold text-xl">
                Easy Booking
              </ShinyText>
              <ShinyText variant="body">
                Book classes, manage your schedule, and track your progress all in one place.
              </ShinyText>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
