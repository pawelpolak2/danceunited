import type { ReactNode } from 'react'
import { ShinyText } from './ShinyText'

interface FormFieldProps {
  label: string
  name: string
  type?: string
  autoComplete?: string
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  children?: ReactNode
}

export function FormField({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  required = false,
  error,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="form-label">
        <ShinyText variant="body" className="text-sm">
          {label}
        </ShinyText>
      </label>
      {children || (
        <div className="relative inline-block w-full">
          <input
            id={name}
            name={name}
            type={type}
            autoComplete={autoComplete}
            required={required}
            className={`form-input ${error ? 'form-input-error' : 'form-input-normal'}`}
            placeholder={placeholder}
          />
          {/* Metallic gold focus border */}
          <div className="form-input-focus-border" />
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      {hint && !error && (
        <p className="mt-1 text-xs">
          <ShinyText variant="body" className="text-xs opacity-60">
            {hint}
          </ShinyText>
        </p>
      )}
    </div>
  )
}
