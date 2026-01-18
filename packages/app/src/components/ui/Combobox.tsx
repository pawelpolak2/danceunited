import { ChevronDown, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Option {
  value: string
  label: string
}

interface ComboboxProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  name?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  name,
  className = '',
  disabled = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Find selected label for display
  const selectedOption = options.find((opt) => opt.value === value)

  // Filter options based on search
  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('') // Reset search on close
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle Selection
  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for Form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Main Display / Trigger */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            // Focus search input when opening?
            // Ideally yes, but we render it conditionally.
          }
        }}
        className={`flex w-full cursor-pointer items-center justify-between rounded border border-white/10 bg-black/40 px-3 py-2 text-white transition-colors hover:border-white/20 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${isOpen ? 'border-gold ring-1 ring-gold/20' : ''}`}
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-white/10 bg-gray-900 shadow-xl">
          {/* Search Input */}
          <div className="border-white/10 border-b p-2">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-white/5 bg-black/40 py-1.5 pr-2 pl-8 text-sm text-white outline-none focus:border-gold/50"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-center text-gray-500 text-sm">No results found.</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(option.value)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                    option.value === value ? 'bg-gold/10 text-gold' : 'text-gray-300'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.value === value && <span className="ml-2 text-xs">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
