import { useLoaderData } from 'react-router'
import { Carousel, GoldDust, MetallicLink, ShinyText } from '../components/ui'
import { useTranslation } from '../contexts/LanguageContext'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/_index'

// biome-ignore lint/correctness/noEmptyPattern: this is boilerplate code!
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dance United - Home' },
    { name: 'description', content: 'Welcome to Dance United - Your dance community platform' },
  ]
}

export const links: Route.LinksFunction = () => [
  { rel: 'preload', href: '/img/hero-1.webp', as: 'image' }, // Preload LCP candidate
]

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)
  return { user }
}

export default function HomePage() {
  const { user } = useLoaderData<typeof loader>()
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen flex-col bg-gray-950">
      <GoldDust />
      {/* Hero Section */}
      <section className="relative flex min-h-[600px] flex-col items-center justify-center overflow-hidden pt-16 pb-8 text-white sm:min-h-[700px]">
        {/* Background Carousel */}
        <div className="absolute inset-0 z-0">
          <Carousel
            images={['/img/hero-1.webp', '/img/hero-2.webp', '/img/hero-3.webp']}
            className="h-full w-full opacity-60"
            autoPlayInterval={5000}
          />
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-gray-950/90 via-gray-950/50 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 w-full max-w-4xl px-4 text-center">
          <ShinyText
            as="h1"
            variant="title"
            className="mb-6 text-2xl tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl"
          >
            {t('HOME_HERO_TITLE')}
          </ShinyText>
          <ShinyText as="p" variant="body" className="mb-12 text-gray-200 text-xl">
            {t('HOME_HERO_SUBTITLE')}
          </ShinyText>
        </div>
        {/* CTA Buttons */}
        <div className="relative z-20 w-full max-w-4xl px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <MetallicLink
                to={user.role === 'MANAGER' ? '/admin/dashboard' : '/schedule'}
                variant="primary"
                className="w-full max-w-[280px] rounded-lg border-2 px-8 py-3 text-lg sm:w-auto"
              >
                {t('HOME_CTA_DASHBOARD')}
              </MetallicLink>
            ) : (
              <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <MetallicLink
                  to="/login"
                  variant="primary"
                  className="w-full max-w-[280px] rounded-lg border-2 px-8 py-3 text-lg sm:w-auto"
                >
                  {t('HOME_CTA_LOGIN')}
                </MetallicLink>
                <MetallicLink
                  to="/register"
                  variant="primary"
                  className="w-full max-w-[280px] rounded-lg border-2 px-8 py-3 text-lg sm:w-auto"
                >
                  {t('HOME_CTA_REGISTER')}
                </MetallicLink>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-amber-900/20 border-t bg-gray-950 px-4 py-16">
        <div className="section-container">
          <ShinyText as="h2" variant="title" className="section-title text-3xl">
            {t('HOME_FEATURES_TITLE')}
          </ShinyText>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="feature-card">
              <div className="mb-4 text-4xl">💃</div>
              <ShinyText as="h3" variant="title" className="mb-2 font-semibold text-xl">
                {t('HOME_FEATURE_1_TITLE')}
              </ShinyText>
              <ShinyText variant="body">{t('HOME_FEATURE_1_DESC')}</ShinyText>
            </div>
            <div className="feature-card">
              <div className="mb-4 text-4xl">👥</div>
              <ShinyText as="h3" variant="title" className="mb-2 font-semibold text-xl">
                {t('HOME_FEATURE_2_TITLE')}
              </ShinyText>
              <ShinyText variant="body">{t('HOME_FEATURE_2_DESC')}</ShinyText>
            </div>
            <div className="feature-card">
              <div className="mb-4 text-4xl">📅</div>
              <ShinyText as="h3" variant="title" className="mb-2 font-semibold text-xl">
                {t('HOME_FEATURE_3_TITLE')}
              </ShinyText>
              <ShinyText variant="body">{t('HOME_FEATURE_3_DESC')}</ShinyText>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
