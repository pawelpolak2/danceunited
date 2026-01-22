import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface MetallicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export function MetallicButton({ children, className = '', ...props }: MetallicButtonProps) {
  return (
    <button
      className={`
        metallic-button px-6 py-2.5 font-bold rounded-lg
        hover:scale-[1.02] hover:shadow-amber-500/20 active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 drop-shadow-md">{children}</span>
    </button>
  )
}
