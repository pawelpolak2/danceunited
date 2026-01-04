import type { ReactNode } from 'react'

interface MetallicButtonProps {
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function MetallicButton({
  children,
  type = 'button',
  disabled = false,
  className = '',
  onClick,
}: MetallicButtonProps) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`metallic-button ${className}`}>
      <span>{children}</span>
    </button>
  )
}
