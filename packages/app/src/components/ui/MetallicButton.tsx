import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface MetallicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function MetallicButton({ children, className = '', ...props }: MetallicButtonProps) {
  return (
    <button className={`metallic-button ${className}`} {...props}>
      <span>{children}</span>
    </button>
  )
}
