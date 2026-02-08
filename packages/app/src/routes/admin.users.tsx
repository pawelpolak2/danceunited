import { prisma } from 'db'
import { Ban, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Form, Link, redirect, useActionData, useLoaderData, useSubmit } from 'react-router'
import { MetallicButton, Modal, ShinyText } from '../components/ui'
import { Checkbox } from '../components/ui/Checkbox'
import { ClientDate } from '../components/ui/ClientDate'
import { MetallicTooltip } from '../components/ui/MetallicTooltip'
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
    const terms = search.trim().split(/\s+/)
    where.AND = terms.map((term) => ({
      OR: [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    }))
  }

  // Role filter
  if (roleFilter !== 'ALL') {
    where.role = roleFilter
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      purchases: {
        where: { status: 'ACTIVE' },
        select: { id: true, classesRemaining: true, expiryDate: true, package: { select: { name: true } } },
      },
      _count: {
        select: {
          attendances: true,
          classTemplatesAsTrainer: true,
          classInstancesAsTrainer: true,
        },
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
    const isActive = formData.get('isActive') === 'on'
    const password = formData.get('password') as string

    if (!userId || !firstName || !lastName || !email || !role) {
      return { error: 'Missing required fields' }
    }

    const data: any = {
      firstName,
      lastName,
      email,
      role: role as any,
      isActive,
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

  if (intent === 'toggle-user-active') {
    const userId = formData.get('userId') as string
    const isActive = formData.get('isActive') === 'true'

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      })
      return { success: true }
    } catch (_e) {
      return { error: 'Failed to update user status' }
    }
  }

  if (intent === 'delete-user') {
    const userId = formData.get('userId') as string

    // Safety check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            classTemplatesAsTrainer: true,
            classInstancesAsTrainer: true,
          },
        },
      },
    })

    if (!user) return { error: 'User not found' }

    const usageCount = user._count.classTemplatesAsTrainer + user._count.classInstancesAsTrainer

    if (usageCount > 0) {
      return { error: 'Cannot delete user: assigned to classes or templates' }
    }

    try {
      await prisma.user.delete({
        where: { id: userId },
      })
      return { success: true }
    } catch (_e) {
      return { error: 'Failed to delete user' }
    }
  }

  return null
}

import { useTranslation } from '../contexts/LanguageContext'

// ... imports ...

export default function AdminUsersPage() {
  const { users, search, roleFilter } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const submit = useSubmit()
  const { t } = useTranslation()

  // UI State
  const [query, setQuery] = useState(search)
  // ... state ...
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [_deletingUserId, _setDeletingUserId] = useState<string | null>(null)

  // ... effects ...
  // Close modal on success
  useEffect(() => {
    if (actionData?.success) {
      setIsModalOpen(false)
      setEditingUser(null)
    }
  }, [actionData])

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only submit if query differs from search prop (prevent initial double load)
      if (query !== search) {
        submit({ q: query, role: roleFilter }, { method: 'get', replace: true })
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, search, roleFilter, submit])

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
            {t('ADMIN_USERS_TITLE')}
          </ShinyText>
          <p className="text-gray-400 text-sm">{t('ADMIN_USERS_SUBTITLE')}</p>
        </div>
        <MetallicButton
          className="group flex items-center gap-2 rounded-md border-2 px-4 py-2 text-sm"
          onClick={handleCreate}
        >
          <span className="transition-colors group-hover:text-amber-200">+</span> {t('ADMIN_BTN_ADD_USER')}
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
              placeholder={t('ADMIN_SEARCH_PLACEHOLDER')}
              className="w-full rounded border border-amber-900/50 bg-gray-950 px-4 py-2 text-amber-100 placeholder-gray-600 focus:border-amber-500/50 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {/* Hidden submit to enable Enter key */}
            <input type="hidden" name="role" value={roleFilter} />
          </Form>

          {/* Tabs */}
          <div className="flex gap-1 rounded border border-amber-900/30 bg-gray-950 p-1">
            {['ALL', 'DANCER', 'TRAINER', 'MANAGER'].map((role) => {
              let label = t('ADMIN_TAB_ALL')
              if (role === 'DANCER') label = t('ADMIN_TAB_DANCERS')
              if (role === 'TRAINER') label = t('ADMIN_TAB_TRAINERS')
              if (role === 'MANAGER') label = t('ADMIN_TAB_MANAGERS')

              return (
                <Link
                  key={role}
                  to={`?q=${query}&role=${role}`}
                  className={`rounded px-4 py-1.5 font-medium text-xs transition-colors ${
                    roleFilter === role ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg border border-amber-900/30 bg-gray-900/20">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-amber-900/30 border-b bg-gray-900/80 text-amber-500/60 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">{t('ADMIN_TABLE_USER_INFO')}</th>
              <th className="px-6 py-4 font-semibold">{t('ADMIN_TABLE_ROLE')}</th>
              <th className="px-6 py-4 font-semibold">{t('ADMIN_TABLE_PASS_STATUS')}</th>
              <th className="px-6 py-4 font-semibold">{t('ADMIN_TABLE_JOINED')}</th>
              <th className="px-6 py-4 text-right font-semibold">{t('ADMIN_TABLE_ACTIONS')}</th>
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
                <tr
                  key={user.id}
                  className="group cursor-pointer transition-colors hover:bg-white/5"
                  onClick={() => handleEdit(user)}
                >
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
                  <td className="hidden px-6 py-4 md:table-cell">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
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
                  <td className="hidden px-6 py-4 text-gray-400 text-sm md:table-cell">
                    <div>
                      <ClientDate date={user.createdAt} />
                    </div>
                    {/* Placeholder for last active */}
                    <div className="mt-0.5 text-gray-600 text-xs">Last active: Recently</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex w-full justify-end">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(user)
                          }}
                          className="p-1 text-amber-500/80 transition-colors hover:text-amber-500"
                          title="Edit User"
                        >
                          <Pencil size={16} />
                        </button>

                        <Form method="post" style={{ display: 'inline' }} onSubmit={(e) => e.stopPropagation()}>
                          <input type="hidden" name="intent" value="toggle-user-active" />
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="isActive" value={user.isActive ? 'false' : 'true'} />
                          <button
                            type="submit"
                            onClick={(e) => e.stopPropagation()}
                            className={`p-1 transition-colors ${user.isActive ? 'text-amber-600 hover:text-amber-500' : 'text-green-600 hover:text-green-500'}`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <Ban size={16} /> : <RefreshCw size={16} />}
                          </button>
                        </Form>

                        {(() => {
                          const usageCount =
                            (user._count?.classTemplatesAsTrainer || 0) + (user._count?.classInstancesAsTrainer || 0)
                          const canDelete = usageCount === 0

                          return (
                            <MetallicTooltip
                              content={`Cannot delete: Assigned to ${usageCount} classes/templates`}
                              shouldShow={!canDelete}
                              align="end"
                            >
                              <Form
                                method="post"
                                onSubmit={(e) => {
                                  e.stopPropagation()
                                  if (!confirm('Permanently delete this user?')) {
                                    e.preventDefault()
                                  }
                                }}
                                style={{ display: 'inline' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input type="hidden" name="intent" value="delete-user" />
                                <input type="hidden" name="userId" value={user.id} />
                                <button
                                  type="submit"
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={!canDelete}
                                  className={`p-1 transition-colors ${
                                    canDelete ? 'text-gray-400 hover:text-red-400' : 'cursor-not-allowed text-gray-600'
                                  }`}
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </Form>
                            </MetallicTooltip>
                          )
                        })()}
                      </div>
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
            <Checkbox
              name="isActive"
              defaultChecked={editingUser ? editingUser.isActive : true}
              label="User is Active"
            />
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

        {/* Extra Actions for Edit Mode */}
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
