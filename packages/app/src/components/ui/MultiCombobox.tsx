import { Check, ChevronDown, X } from 'lucide-react'
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
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOptions = options.filter((opt) => value.includes(opt.value))

  // Filter options: match input
  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(inputValue.toLowerCase()))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      // Check if click is outside AND if target is still in the document
      // (Handles case where clicking an option removes it from DOM, preventing false positive "outside" click)
      if (containerRef.current && !containerRef.current.contains(target) && document.body.contains(target)) {
        setIsOpen(false)
        setInputValue('')
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
    setInputValue('')
    // Keep open after selection for multi-select convenience?
    // Or close? Usually better to keep open or focus input.
    inputRef.current?.focus()
  }

  const removeOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last item
      const lastValue = value[value.length - 1]
      removeOption(lastValue)
    }
  }

  // Handle click on container to focus input
  const handleContainerClick = () => {
    if (!disabled) {
      setIsOpen(true)
      inputRef.current?.focus()
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={handleContainerClick}
        className={`flex min-h-[42px] w-full cursor-text flex-wrap items-center gap-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-white transition-colors hover:border-white/20 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${isOpen ? 'border-gold ring-1 ring-gold/20' : ''}`}
      >
        {selectedOptions.map((option) => (
          <span
            key={option.value}
            className="flex items-center gap-1 rounded bg-gold/20 px-2 py-0.5 text-gold text-xs"
            onClick={(e) => e.stopPropagation()} // Prevent triggering container focus (though harmless)
          >
            {option.label}
            <button
              type="button"
              onClick={() => removeOption(option.value)}
              disabled={disabled}
              className="hover:text-white"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Inline Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="min-w-[60px] flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500"
        />

        <div className="pointer-events-none ml-auto">
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-white/10 bg-gray-900 shadow-xl">
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
                    onMouseDown={(e) => {
                      e.preventDefault() // Prevent input blur
                      toggleOption(option.value)
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                      isSelected ? 'text-gold' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <div
                      className={`relative flex h-4 w-4 items-center justify-center rounded border transition-all ${
                        isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-amber-900/40 bg-gray-900/50'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} className="text-amber-500" />}
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
