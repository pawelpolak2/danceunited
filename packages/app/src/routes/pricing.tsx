import { prisma } from 'db'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/pricing'

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  const rawTemplates = await prisma.classTemplate.findMany({
    where: { isActive: true },
    include: {
      packageLinks: {
        include: {
          package: true,
        },
        orderBy: { package: { price: 'asc' } },
      },
      classInstances: {
        where: {
          startTime: { gt: new Date() },
          status: 'SCHEDULED',
        },
        orderBy: { startTime: 'asc' },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  // Filter templates based on whitelist visibility
  let visibleTemplates = rawTemplates
  if (user) {
    const whitelistedTemplates = await prisma.classWhitelist.findMany({
      where: { userId: user.userId },
      select: { classTemplateId: true },
    })
    const allowedIds = new Set(whitelistedTemplates.map((w) => w.classTemplateId))

    visibleTemplates = rawTemplates.filter((t) => !t.isWhitelistEnabled || allowedIds.has(t.id))
  } else {
    // Guest: Only show public templates
    visibleTemplates = rawTemplates.filter((t) => !t.isWhitelistEnabled)
  }

  // Fetch Global Packages (no class links)
  const rawGlobalPackages = await prisma.package.findMany({
    where: {
      isActive: true,
      classLinks: { none: {} },
    },
    orderBy: { price: 'asc' },
  })

  // Serialize Decimal to string
  const globalPackages = rawGlobalPackages.map((p) => ({
    ...p,
    price: p.price.toString(),
  }))

  const templates = visibleTemplates.map((t) => {
    let nextClassTime: string | null = null
    if (t.classInstances.length > 0) {
      const date = t.classInstances[0].startTime
      const day = date.toLocaleDateString('en-US', { weekday: 'long' })
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      nextClassTime = `${day}s ${time}`
    }

    // Flatten package links
    const packages = t.packageLinks.map((link) => ({
      ...link.package,
      price: link.package.price.toString(),
    }))

    return {
      ...t,
      nextClassTime,
      packages,
    }
  })

  return { templates, globalPackages }
}

export default function Pricing({ loaderData }: Route.ComponentProps) {
  const { templates, globalPackages } = loaderData

  // Separate "Individual Lessons" template if present
  const individualTemplate = templates.find((t) => t.name === 'Individual Lessons')
  const showIndividual = individualTemplate && individualTemplate.packages.length > 0

  const groupTemplates = templates.filter((t) => t.name !== 'Individual Lessons' && t.packages.length > 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mb-12">
          <ShinyText as="h1" variant="title" className="inline-block text-5xl">
            Pricing
          </ShinyText>
        </div>

        <div className="mx-auto max-w-5xl space-y-16">
          {/* Universal / Global Packages */}
          {globalPackages.length > 0 && (
            <div>
              <div className="mb-8 text-center">
                <ShinyText as="h2" variant="title" className="inline-block text-3xl text-gold">
                  Universal Passes
                </ShinyText>
                <p className="mt-2 text-gray-400">Valid for any group class style</p>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {globalPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="group hover:-translate-y-1 relative flex w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-gold/50 bg-gray-900/60 p-8 text-center shadow-xl backdrop-blur-sm transition-all hover:border-gold hover:shadow-[0_0_30px_-5px_var(--color-gold)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="relative z-10 w-full">
                      <div className="mb-4 inline-block rounded-full bg-gold px-3 py-1 font-bold text-black text-xs uppercase tracking-wider">
                        Best Value
                      </div>
                      <h3 className="mb-2 font-bold font-cinzel text-2xl text-white">{pkg.name}</h3>
                      {pkg.description && <div className="mb-4 text-gray-300 text-lg">{pkg.description}</div>}
                      <div className="mt-2 animate-pulse-slow font-bold text-4xl text-gold">
                        {pkg.price.toString()} zł
                      </div>
                      <div className="mt-2 font-medium text-gray-500 text-sm">
                        {pkg.classCount} Classes / {pkg.validityDays} Days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced / Specific Classes */}
          <div>
            <div className="mb-8 text-center">
              <ShinyText as="h2" variant="title" className="inline-block text-3xl text-gold">
                Advanced
              </ShinyText>
              <p className="mt-2 text-gray-400">Specific packages per class group</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group hover:-translate-y-1 relative flex flex-col overflow-hidden rounded-xl border border-amber-900/30 bg-gray-900/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-gold/50 hover:bg-gray-900/60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative z-10 flex h-full flex-col">
                    {/* Template Header */}
                    <h3 className="mb-2 font-bold font-cinzel text-gold text-xl">{template.name}</h3>
                    <div className="mb-6 flex min-h-[1.5rem] flex-col items-center justify-center gap-2 text-gray-400 text-sm">
                      {template.description && (
                        <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5">
                          {template.description}
                        </span>
                      )}
                      {template.nextClassTime && (
                        <span className="flex items-center gap-1 font-medium text-gold/80 text-xs uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
                          {template.nextClassTime}
                        </span>
                      )}
                    </div>

                    {/* Packages List */}
                    <div className="mt-auto space-y-3 border-amber-900/20 border-t pt-4">
                      {template.packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="group/row flex items-center justify-between rounded p-2 text-sm transition-colors hover:bg-white/5"
                        >
                          <span className={pkg.name.includes('Ballet') ? 'text-gold' : 'text-gray-300'}>
                            {pkg.name
                              .replace(`${template.name} - `, '')
                              .replace(`${template.name} + `, '')
                              .replace('Ballet', 'With Ballet')}
                          </span>
                          <span className="font-bold text-white">{pkg.price.toString()} zł</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Lessons */}
          {showIndividual && individualTemplate && (
            <div className="mt-16">
              <div className="mb-8 text-center">
                <ShinyText as="h2" variant="title" className="inline-block text-3xl text-gold">
                  Individual Lessons
                </ShinyText>
                <p className="mt-2 text-gray-400">Personal training sessions</p>
              </div>

              <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-amber-900/30 bg-gray-900/40 backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-amber-900/30 border-b bg-gray-900/60 text-gold">
                        <th className="px-6 py-4 font-cinzel font-semibold">Package</th>
                        <th className="px-6 py-4 font-cinzel font-semibold">Details</th>
                        <th className="px-6 py-4 text-right font-cinzel font-semibold">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/10 text-gray-300">
                      {individualTemplate.packages.map((pkg) => (
                        <tr key={pkg.id} className="transition-colors hover:bg-white/5">
                          <td className="px-6 py-4 font-medium text-white">{pkg.name}</td>
                          <td className="px-6 py-4 text-sm">
                            {pkg.classCount} Lesson{pkg.classCount > 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gold">{pkg.price.toString()} zł</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
