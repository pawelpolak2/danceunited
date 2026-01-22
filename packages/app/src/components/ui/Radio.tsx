import { forwardRef } from 'react'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  className?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(({ label, className = '', ...props }, ref) => {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 ${props.disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          ref={ref}
          className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-amber-900/40 bg-gray-900/50 transition-all checked:border-amber-500 checked:bg-amber-500/10 hover:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:cursor-not-allowed"
          {...props}
        />
        <div className="pointer-events-none absolute h-2 w-2 scale-0 rounded-full bg-amber-500 transition-transform peer-checked:scale-100" />
      </div>
      {label && <span className="font-medium text-amber-100/80 text-sm">{label}</span>}
    </label>
  )
})

Radio.displayName = 'Radio'
