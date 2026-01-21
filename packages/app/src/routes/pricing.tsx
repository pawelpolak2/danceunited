import { prisma } from 'db'
import { Ticket, Calendar } from 'lucide-react'
import { ShinyText } from '../components/ui'
import type { Route } from './+types/pricing'

export async function loader({ request }: Route.LoaderArgs) {
  // Fetch all active packages
  const packages = await prisma.package.findMany({
    where: {
      isActive: true,
    },
    orderBy: { price: 'asc' },
  })

  // Group by category
  // We'll just do the simple serialization and grouping
  const serializedPackages = packages.map((p) => ({
    ...p,
    price: p.price.toString(),
  }))

  const grouped: Record<string, typeof serializedPackages> = {}
  for (const pkg of serializedPackages) {
    const category = pkg.category
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(pkg)
  }

  return { groupedPackages: grouped }
}

export default function Pricing({ loaderData }: Route.ComponentProps) {
  const { groupedPackages } = loaderData

  const categoryOrder = ['UNIVERSAL', 'ADULTS', 'YOUTH', 'KIDS', 'SPORT']
  const presentCategories = Object.keys(groupedPackages)

  const sortedCategories = presentCategories.sort((a, b) => {
    const idxA = categoryOrder.indexOf(a)
    const idxB = categoryOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mb-16">
          <ShinyText as="h1" variant="title" className="inline-block text-5xl md:text-6xl">
            PRICING
          </ShinyText>
        </div>

        <div className="mx-auto max-w-7xl space-y-20">
          {sortedCategories.map((category) => {
            const categoryPackages = groupedPackages[category]
            if (!categoryPackages || categoryPackages.length === 0) return null

            return (
              <div key={category} className="space-y-12">
                {/* Section Header */}
                <div className="relative text-center">
                  <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                  <div className="relative inline-block bg-gray-950 px-8">
                    <ShinyText as="h2" variant="title" className="text-3xl md:text-4xl text-gold uppercase tracking-widest">
                      {category}
                    </ShinyText>
                  </div>
                </div>

                {/* Grid Layout: 1 col on mobile, 3 cols on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categoryPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 backdrop-blur-sm transition-all duration-300 hover:border-gold/50 hover:bg-gray-900/60 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.2)]"
                    >
                      {/* Card Content Container */}
                      <div className="p-8 flex flex-col items-center h-full relative z-10 text-center">

                        {/* A. Header: Name & Price */}
                        <div className="mb-8 w-full">
                          <h3 className="text-gold font-cinzel font-bold text-2xl mb-4 tracking-wide uppercase drop-shadow-sm">
                            {pkg.name}
                          </h3>
                          <div className="flex items-baseline justify-center gap-1 text-white">
                            <span className="text-5xl font-bold tracking-tighter drop-shadow-lg">
                              {pkg.price}
                            </span>
                            <span className="text-xl text-gray-400 font-light">zł</span>
                          </div>
                        </div>

                        {/* B. Meta-Data Section */}
                        <div className="w-full grid grid-cols-2 gap-4 mb-8">
                          {/* Class Count */}
                          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 border border-white/5 transition-colors group-hover:bg-gold/10 group-hover:border-gold/20">
                            <Ticket className="w-6 h-6 text-gold mb-2 opacity-80" />
                            <span className="text-lg font-bold text-white">{pkg.classCount}</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Classes</span>
                          </div>

                          {/* Validity Days */}
                          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 border border-white/5 transition-colors group-hover:bg-gold/10 group-hover:border-gold/20">
                            <Calendar className="w-6 h-6 text-gold mb-2 opacity-80" />
                            <span className="text-lg font-bold text-white">{pkg.validityDays}</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Days</span>
                          </div>
                        </div>

                        {/* C. Description */}
                        <div className="mb-8 flex-grow">
                          {pkg.description ? (
                            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                              {pkg.description}
                            </p>
                          ) : (
                            <p className="text-gray-600 text-sm italic">
                              No additional description
                            </p>
                          )}
                        </div>



                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {sortedCategories.length === 0 && (
            <div className="text-gray-500 italic text-xl">Currently no packages available.</div>
          )}
        </div>
      </section>
    </div>
  )
}

