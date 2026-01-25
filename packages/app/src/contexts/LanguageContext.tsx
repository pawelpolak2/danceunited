import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'

// English (US)
import enShort from '../locales/en-US.json'
import enLong from '../locales/paragraphs/en-US.json'

import plLong from '../locales/paragraphs/pl-PL.json'
// Polish (PL)
import plShort from '../locales/pl-PL.json'

// German (DE)
import deShort from '../locales/de-DE.json'
import deLong from '../locales/paragraphs/de-DE.json'

import ukLong from '../locales/paragraphs/uk-UA.json'
// Ukrainian (UA)
import ukShort from '../locales/uk-UA.json'

export type Language = 'en-US' | 'pl-PL' | 'de-DE' | 'uk-UA'

const translations: Record<Language, Record<string, string>> = {
  'en-US': { ...enShort, ...enLong },
  'pl-PL': { ...plShort, ...plLong },
  'de-DE': { ...deShort, ...deLong },
  'uk-UA': { ...ukShort, ...ukLong },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, variables?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en-US')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_language') as Language
      if (saved && ['en-US', 'pl-PL', 'de-DE', 'uk-UA'].includes(saved)) {
        setLanguage(saved)
      } else if (saved === ('en-EN' as any)) {
        // Migration for old key
        setLanguage('en-US')
      }
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', lang)
    }
  }

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const langData = translations[language] || translations['en-US']
    let text = langData[key as keyof typeof langData] || key

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        text = text.split(`{{${key}}}`).join(String(value))
      }
    }
    return text
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
