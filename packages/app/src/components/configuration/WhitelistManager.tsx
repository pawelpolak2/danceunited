import { Trash2, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface WhitelistManagerProps {
  templateId?: string
  initialWhitelist: { user: User }[]
  allUsers: User[]
  mode?: 'live' | 'local'
  onUpdate?: (users: User[]) => void
}

export function WhitelistManager({
  templateId,
  initialWhitelist,
  allUsers,
  mode = 'live',
  onUpdate,
}: WhitelistManagerProps) {
  const [query, setQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [localWhitelist, setLocalWhitelist] = useState<{ user: User }[]>(initialWhitelist)
  const actionFetcher = useFetcher()

  // Sync initialWhitelist to localWhitelist when it changes (for live mode updates or prop updates)
  useEffect(() => {
    setLocalWhitelist(initialWhitelist)
  }, [initialWhitelist])

  // Handle Add User
  const handleAddUser = (user: User) => {
    if (mode === 'local') {
      const updated = [...localWhitelist, { user }]
      setLocalWhitelist(updated)
      onUpdate?.(updated.map((u) => u.user))
    } else {
      if (!templateId) return
      actionFetcher.submit({ intent: 'add_whitelist_user', templateId, userId: user.id }, { method: 'post' })
    }
    setQuery('')
  }

  // Handle Remove User
  const handleRemoveUser = (userId: string) => {
    if (mode === 'local') {
      const updated = localWhitelist.filter((u) => u.user.id !== userId)
      setLocalWhitelist(updated)
      onUpdate?.(updated.map((u) => u.user))
    } else {
      if (!templateId) return
      actionFetcher.submit({ intent: 'remove_whitelist_user', templateId, userId }, { method: 'post' })
    }
  }

  // Local state for optimistic updates could be complex, relying on loader revalidation for now or simple local sync based on action success
  // Actually, since we are inside a Modal that might not revalidate the parent loader easily without closing/reopening,
  // we might want to maintain local state.
  // HOWEVER, actions in Remix/React Router usually revalidate loaders.
  // Let's rely on standard flow: Action -> Revalidation -> Updated Props.

  // Note: Parent needs to pass updated 'initialWhitelist' when loader data changes.
  // If the Modal is controlled by parent state that comes from loader, it should work.

  // Local Search effect
  useEffect(() => {
    if (query.length > 1) {
      const lowerQ = query.toLowerCase()
      const results = allUsers
        .filter(
          (u) =>
            u.firstName.toLowerCase().includes(lowerQ) ||
            u.lastName.toLowerCase().includes(lowerQ) ||
            u.email.toLowerCase().includes(lowerQ)
        )
        .slice(0, 10) // Limit to 10
      setFilteredUsers(results)
    } else {
      setFilteredUsers([])
    }
  }, [query, allUsers])

  const searchResults = filteredUsers

  return (
    <div className="space-y-4 rounded-md border border-white/10 bg-black/20 p-4">
      <h3 className="font-bold text-gold text-sm">Manage Whitelist</h3>

      {/* Add User */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user by name or email..."
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-white/10 bg-gray-900 shadow-xl">
            {searchResults.map((user) => {
              const currentList = mode === 'local' ? localWhitelist : initialWhitelist
              const isAlreadyAdded = currentList.some((w) => w.user.id === user.id)
              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => handleAddUser(user)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 disabled:opacity-50"
                >
                  <span className="text-gray-200">
                    {user.firstName} {user.lastName} ({user.email})
                  </span>
                  {isAlreadyAdded ? (
                    <span className="text-green-500 text-xs">Added</span>
                  ) : (
                    <UserPlus size={14} className="text-gold" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Current Whitelist */}
      <div className="space-y-2">
        {initialWhitelist.length === 0 ? (
          <p className="text-gray-500 text-xs italic">No users in whitelist.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {initialWhitelist.map(({ user }) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded border border-white/5 bg-white/5 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-200 text-sm">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-gray-500 text-xs">{user.email}</span>
                </div>
                <button
                  type="button"
                  className="text-gray-500 hover:text-red-400"
                  title="Remove"
                  onClick={() => handleRemoveUser(user.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
