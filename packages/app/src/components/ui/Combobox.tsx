import { ChevronDown } from 'lucide-react'
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
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Find selected label for display
  const selectedOption = options.find((opt) => opt.value === value)

  // Sync input value with selected option when options or value change, OR when closing
  useEffect(() => {
    if (selectedOption && !isOpen) {
      setInputValue(selectedOption.label)
    } else if (!value && !isOpen) {
      setInputValue('')
    }
  }, [value, selectedOption, isOpen])

  // Filter options based on input value when open
  const filteredOptions = isOpen
    ? options.filter((opt) => opt.label.toLowerCase().includes(inputValue.toLowerCase()))
    : options

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        // Revert input to selected value on blur/close
        if (selectedOption) {
          setInputValue(selectedOption.label)
        } else {
          setInputValue('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedOption])

  // Handle Selection
  const handleSelect = (option: Option) => {
    onChange(option.value)
    setInputValue(option.label)
    setIsOpen(false)
    inputRef.current?.blur() // Blur input to remove focus/cursor as requested
  }

  // Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (!isOpen) setIsOpen(true)
  }

  // Handle Input Focus
  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true)
      setInputValue('') // Clear input for fresh search
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for Form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Main Display / Trigger */}
      <div
        className={`relative flex w-full items-center rounded border border-white/10 bg-black/40 text-white transition-colors hover:border-white/20 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${isOpen ? 'border-gold ring-1 ring-gold/20' : ''}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-transparent px-3 py-2 pr-8 text-sm outline-none placeholder:text-gray-500 ${
            disabled ? 'cursor-not-allowed' : ''
          }`}
          autoComplete="off"
        />
        <ChevronDown
          size={14}
          className={`pointer-events-none absolute right-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-white/10 bg-gray-900 shadow-xl">
          {/* Options List */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-center text-gray-500 text-sm">No results found.</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => {
                    // Use onMouseDown to prevent input blur before click fires
                    e.preventDefault()
                    handleSelect(option)
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
