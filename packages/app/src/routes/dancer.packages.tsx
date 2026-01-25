import { prisma } from 'db'
import { Package as PackageIcon } from 'lucide-react'
import { Form, Link, redirect, useLoaderData } from 'react-router'
import { MetallicButton, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dancer.packages'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'Packages - Dance United' }, { name: 'description', content: 'Purchase class packages' }]
}

// ... imports ...

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
// ... imports ...
import { useState } from 'react'
import { p24Service } from '../services/p24.server'

// ... meta ...

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'DANCER') return redirect('/')

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'purchase') {
    const packageId = formData.get('packageId') as string
    const autoSignIn = formData.get('autoSignIn') === 'true'

    if (!packageId) return { error: 'Package ID is required' }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } })
    if (!pkg) return { error: 'Package not found' }

    try {
      // Create Payment Record (Pending)
      const payment = await prisma.payment.create({
        data: {
          userId: user.userId,
          amount: pkg.price,
          paymentMethod: 'TRANSFER', // P24 creates transfer/card etc.
          paymentStatus: 'PENDING',
          metadata: {
            packageId: pkg.id,
            autoSignIn: autoSignIn,
          },
        },
      })

      // Register Transaction with P24
      // Amount must be in grosze
      const amountInGrosz = Number(pkg.price) * 100
      const sessionId = payment.id // Use payment UUID as session ID

      const returnUrl = `${process.env.APP_URL || 'http://localhost:5173'}/dancer/my-packages?payment=success`

      // We use p24Service from server
      const tokenUrl = await p24Service.registerTransaction({
        sessionId: sessionId,
        amount: amountInGrosz,
        currency: 'PLN',
        description: `Payment for package: ${pkg.name}`,
        email: user.email,
        urlReturn: returnUrl,
        urlStatus: `${process.env.APP_URL || 'http://localhost:5173'}/api/p24/notify`,
        client: `${user.firstName} ${user.lastName}`,
        waitForResult: true, // Wait for immediate result if possible
      })

      return redirect(tokenUrl)
    } catch (error) {
      console.error('Payment initiation failed', error)
      return { error: 'Payment initiation failed. Please try again.' }
    }
  }

  return null
}

export async function loader({ request }: Route.LoaderArgs) {
  // ... existing loader code ...
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
                where: { userId: user.userId },
              },
            },
          },
        },
      },
    },
    orderBy: { price: 'asc' },
  })

  // Filter packages logic (same as before)
  const visiblePackages = packagesRaw.filter((pkg) => {
    if (pkg.classLinks.length === 0) return true
    const hasAccessibleTemplate = pkg.classLinks.some((link) => {
      const tmpl = link.classTemplate
      if (!tmpl.isWhitelistEnabled) return true
      return tmpl.whitelist.length > 0
    })
    return hasAccessibleTemplate
  })

  const packages = visiblePackages.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price.toString(),
    classCount: p.classCount,
    validityDays: p.validityDays,
    category: p.category,
    isUniversal: p.classLinks.length === 0,
    linkedClassesCount: p.classLinks.length,
  }))

  return { user, packages }
}

// ... imports ...
import { useTranslation } from '../contexts/LanguageContext'

// ... meta/loader/action ...

export default function DancerPackagesPage() {
  const { packages } = useLoaderData<typeof loader>()
  const { t } = useTranslation()
  const [selectedPackage, setSelectedPackage] = useState<(typeof packages)[0] | null>(null)

  // ... grouping logic ...
  const groupedHelper = packages.reduce(
    (acc, pkg) => {
      const cat = pkg.category || 'OTHER'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(pkg)
      return acc
    },
    {} as Record<string, typeof packages>
  )

  const categoryOrder = ['UNIVERSAL', 'ADULTS', 'YOUTH', 'KIDS', 'SPORT']
  const sortedCategories = Object.keys(groupedHelper).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a)
    const idxB = categoryOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen text-amber-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <ShinyText as="h1" variant="title" className="mb-4 font-serif text-5xl text-amber-400">
            {t('PACKAGES_PAGE_TITLE')}
          </ShinyText>
          <ShinyText variant="body" className="max-w-2xl text-xl opacity-80">
            {t('PACKAGES_PAGE_SUBTITLE')}
          </ShinyText>
        </div>

        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <PackageIcon className="mb-4 h-16 w-16 text-gray-600" />
            <p className="text-xl">{t('PACKAGES_NO_PACKAGES')}</p>
          </div>
        ) : (
          <div className="space-y-16">
            {sortedCategories.map((category) => (
              <div key={category} className="space-y-6">
                {/* Category Header */}
                <div className="relative border-amber-500/20 border-b pb-2">
                  <h2 className="font-serif text-3xl text-amber-400/90 tracking-wider">{category}</h2>
                  <div className="-bottom-px absolute left-0 h-px w-24 bg-amber-400" />
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-white/5 bg-gray-900/40 backdrop-blur-md">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-white/10 border-b text-gray-400 text-sm uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">{t('PACKAGES_TABLE_NAME')}</th>
                        <th className="px-6 py-4 text-center font-medium">{t('PACKAGES_TABLE_CLASSES')}</th>
                        <th className="px-6 py-4 text-center font-medium">{t('PACKAGES_TABLE_VALIDITY')}</th>
                        <th className="px-6 py-4 text-right font-medium">{t('PACKAGES_TABLE_PRICE')}</th>
                        <th className="px-6 py-4 text-right font-medium">{t('PACKAGES_TABLE_ACTION')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {groupedHelper[category].map((pkg) => (
                        <tr key={pkg.id} className="group transition-colors hover:bg-white/5">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-amber-100 text-lg transition-colors group-hover:text-amber-400">
                                {pkg.name}
                              </span>
                              {pkg.description && (
                                <span className="line-clamp-1 text-gray-500 text-sm">{pkg.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-gray-300 text-sm">
                              <span>{pkg.classCount}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-gray-400 text-sm">{pkg.validityDays} days</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-white text-xl">{pkg.price} zł</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPackage(pkg)}
                              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-medium text-amber-400 text-sm transition-all hover:border-amber-500/60 hover:bg-amber-500/20 active:scale-95"
                            >
                              {t('PACKAGES_BTN_PURCHASE')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPackage && <PurchaseModal pkg={selectedPackage} onClose={() => setSelectedPackage(null)} />}
      </AnimatePresence>
    </div>
  )
}

function PurchaseModal({ pkg, onClose }: { pkg: any; onClose: () => void }) {
  const [autoSignIn, setAutoSignIn] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-gray-900 p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 font-serif text-3xl text-amber-400">{t('MODAL_CONFIRM_TITLE')}</h2>

        <div className="mb-8 space-y-4">
          <div className="flex justify-between border-white/10 border-b pb-4">
            <span className="text-gray-400">{t('MODAL_LABEL_PACKAGE')}</span>
            <span className="font-bold text-white">{pkg.name}</span>
          </div>
          <div className="flex justify-between border-white/10 border-b pb-4">
            <span className="text-gray-400">{t('MODAL_LABEL_PRICE')}</span>
            <span className="font-bold text-amber-400 text-xl">{pkg.price} zł</span>
          </div>
          <div className="flex justify-between border-white/10 border-b pb-4">
            <span className="text-gray-400">{t('MODAL_LABEL_CLASSES')}</span>
            <span className="text-white">{pkg.classCount}</span>
          </div>
        </div>

        <Form method="post">
          <input type="hidden" name="packageId" value={pkg.id} />
          <input type="hidden" name="intent" value="purchase" />

          <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex h-6 items-center">
              <input
                id="autoSignIn"
                name="autoSignIn"
                type="checkbox"
                value="true"
                checked={autoSignIn}
                onChange={(e) => setAutoSignIn(e.target.checked)}
                className="h-5 w-5 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
              />
            </div>
            <div className="text-sm">
              <label htmlFor="autoSignIn" className="font-medium text-amber-200">
                {t('MODAL_AUTO_SIGNIN_LABEL')}
              </label>
              <p className="mt-1 text-gray-400">{t('MODAL_AUTO_SIGNIN_DESC')}</p>
            </div>
          </div>

          <div className="mb-6 flex items-start gap-3">
            <input
              id="termsAccept"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
            />
            <label htmlFor="termsAccept" className="text-gray-400 text-sm">
              {t('LEGAL_CONSENT_PREFIX')}
              <Link to="/terms" target="_blank" className="text-amber-400 hover:underline">
                {t('LEGAL_TERMS_LINK')}
              </Link>{' '}
              &amp;{' '}
              <Link to="/privacy" target="_blank" className="text-amber-400 hover:underline">
                {t('LEGAL_PRIVACY_LINK')}
              </Link>
              {t('MODAL_PURCHASE_TERMS_SUFFIX')}
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <MetallicButton type="submit" className="w-full justify-center py-4 text-lg">
              {t('MODAL_PAY_BTN')}
            </MetallicButton>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-white/10 py-3 font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {t('MODAL_CANCEL_BTN')}
            </button>
          </div>
        </Form>
      </motion.div>
    </div>
  )
}
