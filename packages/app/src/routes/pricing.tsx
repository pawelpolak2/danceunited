import { prisma } from 'db'
import { Calendar, Ticket } from 'lucide-react'
import { ShinyText } from '../components/ui'
import type { Route } from './+types/pricing'

export async function loader() {
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
                  <div className="absolute top-1/2 left-0 h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                  <div className="relative inline-block bg-gray-950 px-8">
                    <ShinyText
                      as="h2"
                      variant="title"
                      className="text-3xl text-gold uppercase tracking-widest md:text-4xl"
                    >
                      {category}
                    </ShinyText>
                  </div>
                </div>

                {/* Grid Layout: 1 col on mobile, 3 cols on desktop */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {categoryPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="group hover:-translate-y-2 relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 backdrop-blur-sm transition-all duration-300 hover:border-gold/50 hover:bg-gray-900/60 hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.2)]"
                    >
                      {/* Card Content Container */}
                      <div className="relative z-10 flex h-full flex-col items-center p-8 text-center">
                        {/* A. Header: Name & Price */}
                        <div className="mb-8 w-full">
                          <h3 className="mb-4 font-bold font-cinzel text-2xl text-gold uppercase tracking-wide drop-shadow-sm">
                            {pkg.name}
                          </h3>
                          <div className="flex items-baseline justify-center gap-1 text-white">
                            <span className="font-bold text-5xl tracking-tighter drop-shadow-lg">{pkg.price}</span>
                            <span className="font-light text-gray-400 text-xl">zł</span>
                          </div>
                        </div>

                        {/* B. Meta-Data Section */}
                        <div className="mb-8 grid w-full grid-cols-2 gap-4">
                          {/* Class Count */}
                          <div className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/5 p-3 transition-colors group-hover:border-gold/20 group-hover:bg-gold/10">
                            <Ticket className="mb-2 h-6 w-6 text-gold opacity-80" />
                            <span className="font-bold text-lg text-white">{pkg.classCount}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Classes</span>
                          </div>

                          {/* Validity Days */}
                          <div className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/5 p-3 transition-colors group-hover:border-gold/20 group-hover:bg-gold/10">
                            <Calendar className="mb-2 h-6 w-6 text-gold opacity-80" />
                            <span className="font-bold text-lg text-white">{pkg.validityDays}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Days</span>
                          </div>
                        </div>

                        {/* C. Description */}
                        <div className="mb-8 flex-grow">
                          {pkg.description ? (
                            <p className="whitespace-pre-wrap text-gray-400 text-sm leading-relaxed">
                              {pkg.description}
                            </p>
                          ) : (
                            <p className="text-gray-600 text-sm italic">No additional description</p>
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
            <div className="text-gray-500 text-xl italic">Currently no packages available.</div>
          )}
        </div>
      </section>
    </div>
  )
}
