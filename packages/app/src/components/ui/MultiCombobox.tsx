import { ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Option {
  value: string
  label: string
}

interface MultiComboboxProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiCombobox({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  className = '',
  disabled = false,
}: MultiComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOptions = options.filter((opt) => value.includes(opt.value))
  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionValue))
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex min-h-[42px] w-full cursor-pointer flex-wrap items-center gap-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-white transition-colors hover:border-white/20 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${isOpen ? 'border-gold ring-1 ring-gold/20' : ''}`}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <span
              key={option.value}
              className="flex items-center gap-1 rounded bg-gold/20 px-2 py-0.5 text-gold text-xs"
            >
              {option.label}
              <button type="button" onClick={(e) => removeOption(option.value, e)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <div className="ml-auto">
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-white/10 bg-gray-900 shadow-xl">
          <div className="border-white/10 border-b p-2">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-white/5 bg-black/40 py-1.5 pr-2 pl-8 text-sm text-white outline-none focus:border-gold/50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-center text-gray-500 text-sm">No results found.</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOption(option.value)
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                      isSelected ? 'text-gold' : 'text-gray-300'
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        isSelected ? 'border-gold bg-gold/20' : 'border-gray-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <span className="text-[10px]">✓</span>}
                    </div>
                    <span>{option.label}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
