import { useEffect, useState } from 'react'

interface ClientDateProps {
  date: string | Date | null | undefined
  options?: Intl.DateTimeFormatOptions
  fallback?: string
}

export function ClientDate({ date, options, fallback = '...' }: ClientDateProps) {
  const [formatted, setFormatted] = useState<string | null>(null)

  useEffect(() => {
    if (!date) {
      setFormatted('')
      return
    }

    try {
      const d = new Date(date)
      // Check for invalid date
      if (Number.isNaN(d.getTime())) {
        setFormatted(fallback)
        return
      }
      setFormatted(d.toLocaleDateString([], options))
    } catch (_e) {
      setFormatted(fallback)
    }
  }, [date, options, fallback])

  // Return fallback (or invisible space) during SSR to match hydration?
  // Actually, if we return `null` or a specific string on server, and `null` on client first render, it matches.
  // Then useEffect updates it.

  if (formatted === null) {
    // Better to render a skeleton or the fallback to avoid layout shift?
    // Or just render nothing to be safe?
    // If we render `fallback` on server, and `fallback` on client initial, it matches.
    return <>{fallback}</>
  }

  return <>{formatted}</>
}
