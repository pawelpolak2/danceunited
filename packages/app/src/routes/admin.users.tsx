import { prisma } from 'db'
import { useEffect, useState } from 'react'
import { Form, Link, redirect, useActionData, useLoaderData, useSubmit } from 'react-router'
import { MetallicButton, Modal, ShinyText } from '../components/ui'
import { getCurrentUser, hashPassword } from '../lib/auth.server'
import type { Route } from './+types/admin.users'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'User Management - Dance United Admin' },
    { name: 'description', content: 'Manage users, roles and passes' },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'MANAGER') {
    return redirect('/')
  }

  const url = new URL(request.url)
  const search = url.searchParams.get('q') || ''
  const roleFilter = url.searchParams.get('role') || 'ALL'

  const where: any = {}

  // Search filter
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Role filter
  if (roleFilter !== 'ALL') {
    where.role = roleFilter
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      purchases: {
        where: { status: 'ACTIVE' },
        select: { id: true, classesRemaining: true, expiryDate: true, package: { select: { name: true } } },
      },
      _count: {
        select: { attendances: true },
      },
    },
    take: 50,
  })

  return { users, search, roleFilter }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'MANAGER') {
    return redirect('/')
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create-user') {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string

    if (!firstName || !lastName || !email || !password || !role) {
      return { error: 'All fields are required' }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { error: 'Email already exists' }
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        role: role as any,
        isActive: true,
      },
    })
    return { success: true }
  }

  if (intent === 'update-user') {
    const userId = formData.get('userId') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const role = formData.get('role') as string
    const password = formData.get('password') as string

    if (!userId || !firstName || !lastName || !email || !role) {
      return { error: 'Missing required fields' }
    }

    const data: any = {
      firstName,
      lastName,
      email,
      role: role as any,
    }

    if (password && password.trim() !== '') {
      data.passwordHash = await hashPassword(password)
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data,
      })
      return { success: true }
    } catch (_e) {
      return { error: 'Failed to update user' }
    }
  }

  return null
}

export default function AdminUsersPage() {
  const { users, search, roleFilter } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const _submit = useSubmit()

  // UI State
  const [query, setQuery] = useState(search)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  // Close modal on success
  useEffect(() => {
    if (actionData?.success) {
      setIsModalOpen(false)
      setEditingUser(null)
    }
  }, [actionData])

  const handleCreate = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  return (
    <div className="text-amber-50">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <ShinyText as="h1" variant="title" className="mb-1 font-serif text-3xl text-amber-400 tracking-wide">
            User Management
          </ShinyText>
          <p className="text-gray-400 text-sm">Manage dancers, trainers and staff members</p>
        </div>
        <MetallicButton
          className="group flex items-center gap-2 rounded-md border-2 px-4 py-2 text-sm"
          onClick={handleCreate}
        >
          <span className="transition-colors group-hover:text-amber-200">+</span> Add User
        </MetallicButton>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-amber-900/30 bg-gray-900/40 p-4 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Search */}
          <Form className="relative w-full max-w-md flex-1 md:w-auto">
            <input
              type="text"
              name="q"
              placeholder="Search by name or email..."
              className="w-full rounded border border-amber-900/50 bg-gray-950 px-4 py-2 text-amber-100 placeholder-gray-600 focus:border-amber-500/50 focus:outline-none"
              defaultValue={search}
              onChange={(e) => setQuery(e.target.value)}
            />
            {/* Hidden submit to enable Enter key */}
            <input type="hidden" name="role" value={roleFilter} />
          </Form>

          {/* Tabs */}
          <div className="flex gap-1 rounded border border-amber-900/30 bg-gray-950 p-1">
            {['ALL', 'DANCER', 'TRAINER', 'MANAGER'].map((role) => (
              <Link
                key={role}
                to={`?q=${query}&role=${role}`}
                className={`rounded px-4 py-1.5 font-medium text-xs transition-colors ${
                  roleFilter === role ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {role === 'ALL' ? 'All Users' : `${role.charAt(0) + role.slice(1).toLowerCase()}s`}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg border border-amber-900/30 bg-gray-900/20">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-amber-900/30 border-b bg-gray-900/80 text-amber-500/60 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">User Info</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Pass Status</th>
              <th className="px-6 py-4 font-semibold">Joined / Active</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                  No users found matching filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="group transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/20 bg-gradient-to-br from-gray-800 to-gray-900 font-serif text-amber-500">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-amber-50">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'DANCER' ? (
                      user.purchases.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {user.purchases.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center rounded border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-green-400 text-xs"
                            >
                              {p.package.name} ({p.classesRemaining} left)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs italic">No active pass</span>
                      )
                    ) : (
                      <span className="text-gray-700 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                    {/* Placeholder for last active */}
                    <div className="mt-0.5 text-gray-600 text-xs">Last active: Recently</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex w-full justify-end">
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-full p-2 text-gray-500 text-lg transition-colors hover:bg-amber-900/20 hover:text-amber-400"
                        title="Edit User"
                      >
                        •••
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between px-2 text-gray-500 text-xs">
        <div>Showing {users.length} users</div>
        {/* Pagination placeholder */}
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-amber-900/20 bg-gray-900 px-3 py-1 hover:bg-amber-900/10 disabled:opacity-50"
            disabled
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded border border-amber-900/20 bg-gray-900 px-3 py-1 hover:bg-amber-900/10 disabled:opacity-50"
            disabled
          >
            Next
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value={editingUser ? 'update-user' : 'create-user'} />
          {editingUser && <input type="hidden" name="userId" value={editingUser.id} />}

          {/* Error Message */}
          {actionData?.error && (
            <div className="rounded border border-red-900/30 bg-red-900/20 p-3 text-red-400 text-sm">
              {actionData.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-bold text-gray-500 text-xs uppercase">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                defaultValue={editingUser?.firstName}
                className="w-full rounded border border-amber-900/30 bg-black/40 px-3 py-2 text-amber-50 outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-gray-500 text-xs uppercase">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                defaultValue={editingUser?.lastName}
                className="w-full rounded border border-amber-900/30 bg-black/40 px-3 py-2 text-amber-50 outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-500 text-xs uppercase">Email</label>
            <input
              type="email"
              name="email"
              required
              defaultValue={editingUser?.email}
              className="w-full rounded border border-amber-900/30 bg-black/40 px-3 py-2 text-amber-50 outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-500 text-xs uppercase">Role</label>
            <select
              name="role"
              defaultValue={editingUser?.role || 'DANCER'}
              className="w-full appearance-none rounded border border-amber-900/30 bg-black/40 px-3 py-2 text-amber-50 outline-none focus:border-amber-500/50"
            >
              <option value="DANCER">Dancer</option>
              <option value="TRAINER">Trainer</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-gray-500 text-xs uppercase">
              {editingUser ? 'New Password (leave blank to keep)' : 'Password'}
            </label>
            <input
              type="password"
              name="password"
              required={!editingUser}
              className="w-full rounded border border-amber-900/30 bg-black/40 px-3 py-2 text-amber-50 outline-none focus:border-amber-500/50"
              placeholder={editingUser ? '••••••••' : 'Enter password'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-400 text-sm transition-colors hover:text-white"
            >
              Cancel
            </button>
            <MetallicButton
              type="submit"
              className="rounded border-2 px-6 py-2 font-bold text-amber-50 text-sm tracking-wide"
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </MetallicButton>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles = {
    MANAGER: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    TRAINER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DANCER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  const style = styles[role as keyof typeof styles] || styles['DANCER']

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium text-xs ${style}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  )
}
