import bcrypt from 'bcryptjs'
import { prisma } from 'db'
import { Check, Lock, Package, User, X } from 'lucide-react'
import { useState } from 'react'
import { Form, Link, redirect, useActionData, useLoaderData } from 'react-router'
import { MetallicButton } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/profile'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'My Profile - Dance United' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)
  if (!user) return redirect('/login')

  const purchases = await prisma.userPurchase.findMany({
    where: { userId: user.userId },
    include: { package: true },
    orderBy: { purchaseDate: 'desc' },
  })

  return { user, purchases }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser(request)
  if (!user) return redirect('/login')

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'updateDetails') {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    if (!firstName || !lastName) return { error: 'Name is required' }

    await prisma.user.update({
      where: { id: user.userId },
      data: { firstName, lastName },
    })
    return { success: 'Details updated successfully' }
  }

  if (intent === 'changePassword') {
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!currentPassword || !newPassword || !confirmPassword) return { error: 'All fields are required' }
    if (newPassword !== confirmPassword) return { error: 'New passwords do not match' }

    // Verify current password - we need to fetch the password hash which is not in the session user
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } })
    if (!dbUser) return redirect('/login')

    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
    if (!isValid) return { error: 'Incorrect current password' }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash: hashedPassword },
    })

    return { success: 'Password changed successfully' }
  }

  return null
}

export default function ProfilePage() {
  const { user, purchases } = useLoaderData<typeof loader>()
  const actionData = useActionData<{ error?: string; success?: string }>()
  const [activeTab, setActiveTab] = useState<'details' | 'security' | 'packages'>('details')

  return (
    <div className="flex min-h-screen flex-col bg-gray-950/95 font-sans text-amber-50 selection:bg-amber-500/30">
      <div className="mx-auto mt-20 w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/20">
            <User className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text font-bold text-3xl text-transparent">
              My Profile
            </h1>
            <p className="mt-1 text-amber-50/60">{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-amber-900/30 border-b pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 transition-colors ${
              activeTab === 'details'
                ? 'border-amber-500 border-b-2 bg-amber-500/20 text-amber-300'
                : 'text-amber-50/70 hover:bg-amber-900/10 hover:text-amber-100'
            }`}
          >
            <User className="h-4 w-4" /> Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 transition-colors ${
              activeTab === 'security'
                ? 'border-amber-500 border-b-2 bg-amber-500/20 text-amber-300'
                : 'text-amber-50/70 hover:bg-amber-900/10 hover:text-amber-100'
            }`}
          >
            <Lock className="h-4 w-4" /> Security
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 transition-colors ${
              activeTab === 'packages'
                ? 'border-amber-500 border-b-2 bg-amber-500/20 text-amber-300'
                : 'text-amber-50/70 hover:bg-amber-900/10 hover:text-amber-100'
            }`}
          >
            <Package className="h-4 w-4" /> My Packages
          </button>
        </div>

        {/* Messages */}
        {actionData?.error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-red-200">
            <X className="h-5 w-5" /> {actionData.error}
          </div>
        )}
        {actionData?.success && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-900/20 p-4 text-green-200">
            <Check className="h-5 w-5" /> {actionData.success}
          </div>
        )}

        {/* Content */}
        <div className="rounded-2xl border border-amber-900/30 bg-gray-900/40 p-6 shadow-xl backdrop-blur-md">
          {activeTab === 'details' && (
            <Form method="post" className="max-w-lg space-y-6">
              <input type="hidden" name="intent" value="updateDetails" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-medium text-amber-50/70 text-sm">First Name</label>
                  <input
                    name="firstName"
                    defaultValue={user.firstName}
                    className="w-full rounded-lg border border-amber-900/30 bg-black/40 px-4 py-2 text-amber-50 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-amber-50/70 text-sm">Last Name</label>
                  <input
                    name="lastName"
                    defaultValue={user.lastName}
                    className="w-full rounded-lg border border-amber-900/30 bg-black/40 px-4 py-2 text-amber-50 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-amber-50/70 text-sm">Email</label>
                <input
                  value={user.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-amber-900/10 bg-black/20 px-4 py-2 text-amber-50/50"
                />
                <p className="mt-1 text-amber-50/30 text-xs">Email cannot be changed.</p>
              </div>
              <div className="pt-4">
                <MetallicButton type="submit" className="w-full sm:w-auto">
                  Save Changes
                </MetallicButton>
              </div>
            </Form>
          )}

          {activeTab === 'security' && (
            <Form method="post" className="max-w-lg space-y-6">
              <input type="hidden" name="intent" value="changePassword" />
              <div>
                <label className="mb-1 block font-medium text-amber-50/70 text-sm">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  className="w-full rounded-lg border border-amber-900/30 bg-black/40 px-4 py-2 text-amber-50 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-amber-50/70 text-sm">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  className="w-full rounded-lg border border-amber-900/30 bg-black/40 px-4 py-2 text-amber-50 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-amber-50/70 text-sm">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="w-full rounded-lg border border-amber-900/30 bg-black/40 px-4 py-2 text-amber-50 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
              <div className="pt-4">
                <MetallicButton type="submit" className="w-full sm:w-auto">
                  Update Password
                </MetallicButton>
              </div>
            </Form>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-4">
              {purchases.length === 0 ? (
                <p className="text-amber-50/50 italic">No packages purchased yet.</p>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="group flex items-center justify-between rounded-lg border border-amber-900/20 bg-black/20 p-4 transition-colors hover:border-amber-500/30"
                    >
                      <div>
                        <h3 className="font-semibold text-amber-200 text-lg">{purchase.package.name}</h3>
                        <p className="text-amber-50/60 text-sm">
                          Purchased: {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </p>
                        {purchase.expiryDate && (
                          <p className="text-amber-50/40 text-xs">
                            Expires: {new Date(purchase.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`rounded-full border px-3 py-1 font-bold text-xs ${
                            purchase.status === 'ACTIVE'
                              ? 'border-green-500/30 bg-green-900/20 text-green-400'
                              : 'border-gray-600/30 bg-gray-800/50 text-gray-400'
                          }`}
                        >
                          {purchase.status}
                        </span>
                        <p className="mt-2 text-amber-50/80 text-sm">
                          Sessions: {purchase.classesRemaining} / {purchase.package.classCount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 border-amber-900/20 border-t pt-4">
                <Link to="/pricing">
                  <MetallicButton className="w-full sm:w-auto">Browse Packages</MetallicButton>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
