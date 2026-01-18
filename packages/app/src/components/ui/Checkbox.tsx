import { Check } from 'lucide-react'
import { forwardRef } from 'react'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  className?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ label, className = '', ...props }, ref) => {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 ${props.disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <div className="relative flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-amber-900/40 bg-gray-900/50 transition-all checked:border-amber-500 checked:bg-amber-500/10 hover:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:cursor-not-allowed"
          {...props}
        />
        <Check
          size={12}
          strokeWidth={3}
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 text-amber-500 opacity-0 transition-opacity peer-checked:opacity-100"
        />
      </div>
      {label && <span className="font-medium text-amber-100/80 text-sm">{label}</span>}
    </label>
  )
})

Checkbox.displayName = 'Checkbox'
