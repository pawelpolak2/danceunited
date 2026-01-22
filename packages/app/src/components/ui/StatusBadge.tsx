interface StatusBadgeProps {
  isActive: boolean
  activeLabel?: string // Optional custom labels (e.g. "Verified" instead of "Active")
  inactiveLabel?: string
  className?: string
}

export function StatusBadge({
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  className = '',
}: StatusBadgeProps) {
  if (isActive) {
    return (
      <span
        className={`inline-flex items-center rounded border border-green-800 bg-green-900/40 px-2 py-0.5 font-medium text-green-400 text-xs ${className}`}
      >
        {activeLabel}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded border border-red-800 bg-red-900/40 px-2 py-0.5 font-medium text-red-400 text-xs ${className}`}
    >
      {inactiveLabel}
    </span>
  )
}
