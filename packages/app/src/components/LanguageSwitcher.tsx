import { Check, ChevronDown, Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type Language, useTranslation } from '../contexts/LanguageContext'

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'pl-PL', label: 'Polski', flag: '🇵🇱' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'uk-UA', label: 'Українська', flag: '🇺🇦' },
]

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (code: Language) => {
    setLanguage(code)
    setIsOpen(false)
  }

  const currentLang = languages.find((l) => l.code === language) || languages[0]

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-gray-900/50 px-3 py-1.5 font-medium text-amber-100 text-xs transition-all hover:bg-amber-500/10 active:scale-95"
        title="Switch Language"
      >
        <Globe className="h-3.5 w-3.5 text-amber-400" />
        <span className="uppercase">{currentLang.code.split('-')[0]}</span>
        <ChevronDown
          className={`h-3 w-3 text-amber-500/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fade-in zoom-in-95 absolute top-full right-0 z-[100] mt-2 w-40 origin-top-right animate-in overflow-hidden rounded-xl border border-amber-900/30 bg-gray-950/95 py-1 shadow-2xl ring-1 ring-black/5 backdrop-blur-md duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-amber-900/20 ${
                language === lang.code ? 'bg-amber-500/10 text-amber-400' : 'text-gray-300 hover:text-amber-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="opacity-80">{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
              {language === lang.code && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
