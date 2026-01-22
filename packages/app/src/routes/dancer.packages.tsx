import { Check, Package as PackageIcon, ShieldCheck } from 'lucide-react'
import { prisma } from 'db'
import { redirect, useLoaderData } from 'react-router'
import { MetallicButton, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dancer.packages'

export function meta(_args: Route.MetaArgs) {
    return [
        { title: 'Packages - Dance United' },
        { name: 'description', content: 'Purchase class packages' },
    ]
}

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'DANCER') return redirect('/')

    // Fetch all active packages with their linked templates
    const packagesRaw = await prisma.package.findMany({
        where: { isActive: true },
        include: {
            classLinks: {
                include: {
                    classTemplate: {
                        include: {
                            whitelist: {
                                where: { userId: user.userId }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { price: 'asc' }
    })

    // Filter packages:
    // Show if:
    // 1. It has NO linked classes (assumed Universal)
    // 2. OR It has linked classes, and User has access to AT LEAST ONE of them.
    //    Access means: !isWhitelistEnabled OR (isWhitelistEnabled AND whitelist.length > 0)

    const visiblePackages = packagesRaw.filter(pkg => {
        if (pkg.classLinks.length === 0) return true

        const hasAccessibleTemplate = pkg.classLinks.some(link => {
            const tmpl = link.classTemplate
            if (!tmpl.isWhitelistEnabled) return true
            return tmpl.whitelist.length > 0 // User is in whitelist (filtered in query)
        })

        return hasAccessibleTemplate
    })

    const packages = visiblePackages.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price.toString(),
        classCount: p.classCount,
        validityDays: p.validityDays,
        isUniversal: p.classLinks.length === 0,
        linkedClassesCount: p.classLinks.length
    }))

    return { user, packages }
}

export default function DancerPackagesPage() {
    const { packages } = useLoaderData<typeof loader>()

    return (
        <div className="min-h-screen text-amber-50">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-12 flex flex-col items-center text-center">
                    <ShinyText as="h1" variant="title" className="mb-4 text-5xl font-serif text-amber-400">
                        Class Packages
                    </ShinyText>
                    <ShinyText variant="body" className="max-w-2xl text-xl opacity-80">
                        Choose the perfect package for your dance journey.
                        Valid for all your eligible classes.
                    </ShinyText>
                </div>

                {packages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <PackageIcon className="h-16 w-16 mb-4 text-gray-600" />
                        <p className="text-xl">No packages currently available for you.</p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {packages.map(pkg => (
                            <PackageCard key={pkg.id} pkg={pkg} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function PackageCard({ pkg }: { pkg: any }) {
    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-500/20 bg-gray-900/60 p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-900/20">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative z-10 flex flex-1 flex-col">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-serif text-2xl font-bold text-amber-100">{pkg.name}</h3>
                    {pkg.isUniversal && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                            <ShieldCheck className="h-3 w-3" /> Universal
                        </span>
                    )}
                </div>

                <div className="mb-6 flex items-baseline text-white">
                    <span className="text-4xl font-bold tracking-tight">${pkg.price}</span>
                    {/* <span className="ml-1 text-xl text-gray-400">/mo</span> */}
                </div>

                <p className="mb-8 flex-1 text-gray-400 leading-relaxed">
                    {pkg.description || `Includes ${pkg.classCount} classes valid for ${pkg.validityDays} days.`}
                </p>

                <ul className="mb-8 space-y-4 text-sm text-gray-300">
                    <li className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                            <Check className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-amber-100">{pkg.classCount} Classes</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                            <Check className="h-4 w-4" />
                        </div>
                        <span>Valid for {pkg.validityDays} days</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                            <Check className="h-4 w-4" />
                        </div>
                        <span>
                            {pkg.isUniversal
                                ? 'Access to all standard classes'
                                : `Valid for ${pkg.linkedClassesCount} specific class types`
                            }
                        </span>
                    </li>
                </ul>

                <MetallicButton className="w-full justify-center py-4 text-lg">
                    Purchase Package
                </MetallicButton>
            </div>
        </div>
    )
}
