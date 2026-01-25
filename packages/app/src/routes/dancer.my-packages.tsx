import { prisma } from 'db'
import { Package } from 'lucide-react'
import { Link, redirect, useLoaderData } from 'react-router'
import { MetallicButton, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dancer.my-packages'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'My Packages - Dance United' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'DANCER') return redirect('/')

  const purchases = await prisma.userPurchase.findMany({
    where: { userId: user.userId },
    include: { package: true },
    orderBy: { purchaseDate: 'desc' },
  })

  return { purchases }
}

export default function DancerMyPackagesPage() {
  const { purchases } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen text-amber-50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-1">
          <ShinyText as="h1" variant="title" className="font-serif text-4xl text-amber-400">
            My Packages
          </ShinyText>
          <ShinyText variant="body" className="text-lg opacity-80">
            Manage your active and past packages
          </ShinyText>
        </div>

        <div className="rounded-2xl border border-amber-900/30 bg-gray-900/40 p-6 shadow-xl backdrop-blur-md">
          {purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
              <Package className="mb-4 h-16 w-16 text-amber-500/30" />
              <p className="mb-6 text-amber-50/70 text-xl">You haven't purchased any packages yet.</p>
              <Link to="/dancer/packages">
                <MetallicButton>Browse Packages</MetallicButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="group flex flex-col gap-4 rounded-xl border border-amber-900/20 bg-black/20 p-6 transition-all hover:border-amber-500/30 hover:bg-black/30 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="font-bold font-serif text-2xl text-amber-200">{purchase.package.name}</h3>
                      <span
                        className={`rounded-full border px-3 py-0.5 font-bold text-xs uppercase tracking-wider ${
                          purchase.status === 'ACTIVE'
                            ? 'border-green-500/30 bg-green-900/20 text-green-400 shadow-[0_0_10px_-3px_rgba(74,222,128,0.2)]'
                            : 'border-gray-600/30 bg-gray-800/50 text-gray-500'
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm md:flex md:gap-6">
                      <div className="flex flex-col">
                        <span className="text-amber-50/40 text-xs uppercase tracking-wider">Purchased</span>
                        <span className="font-medium text-amber-50/80">
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-amber-50/40 text-xs uppercase tracking-wider">Expires</span>
                        <span
                          className={`font-medium ${purchase.expiryDate && new Date(purchase.expiryDate) < new Date() ? 'text-red-400' : 'text-amber-50/80'}`}
                        >
                          {purchase.expiryDate ? new Date(purchase.expiryDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end md:items-end">
                    <span className="text-amber-50/40 text-xs uppercase tracking-wider">Classes Remaining</span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-bold text-3xl ${purchase.classesRemaining > 0 ? 'text-amber-400' : 'text-gray-500'}`}
                      >
                        {purchase.classesRemaining}
                      </span>
                      <span className="font-medium text-amber-50/40 text-sm">/ {purchase.package.classCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
