import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface MetallicLinkProps {
  to: string
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

export function MetallicLink({ to, children, className = '', variant = 'primary', onClick }: MetallicLinkProps) {
  const baseClasses =
    'metallic-button rounded-md px-4 py-2 font-semibold text-sm transition-all duration-300 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-gray-950'
  const variantClasses = variant === 'secondary' ? 'border border-gold' : ''

  return (
    <Link to={to} className={`${baseClasses} ${variantClasses} ${className}`} onClick={onClick}>
      <span>{children}</span>
    </Link>
  )
}
