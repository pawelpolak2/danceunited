import { useEffect, useState } from 'react'

export function MoonPhaseManager() {
  const [active, setActive] = useState(false)
  const [keys, setKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const newKeys = new Set(prev)
        newKeys.add(e.key.toLowerCase())
        return newKeys
      })
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const newKeys = new Set(prev)
        if (active) {
          // If active, 'm' or 'o' release might toggle it off if we wanted momentary
          // But usually toggle is persistent until toggled again or timeout
        }
        newKeys.delete(e.key.toLowerCase())
        return newKeys
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [active])

  useEffect(() => {
    if (keys.has('m') && keys.has('o')) {
       // Toggle active state
       setActive(prev => !prev)
       // Clear keys to prevent rapid toggling
       setKeys(new Set()) 
    }
  }, [keys])

  if (!active) return null

  // Calculate Moon Phase
    const getMoonPhaseEmoji = (date: Date) => {
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    const day = date.getDate()
    
    // Simple moon phase calculation (conway's algorithm derivative or similar approximation)
    let c = 0
    let e = 0
    let jd = 0
    let b = 0

    if (month < 3) {
      year--
      month += 12
    }

    ++month
    c = 365.25 * year
    e = 30.6 * month
    jd = c + e + day - 694039.09 // jd is total days elapsed
    jd /= 29.5305882 // divide by the moon cycle
    b = parseInt(jd.toString()) // int(jd) -> b, take integer part of jd
    jd -= b // subtract integer part to leave fractional part of original jd
    b = Math.round(jd * 8) // scale fraction from 0-8 and round

    if (b >= 8 ) b = 0 // 0 and 8 are the same so turn 8 into 0
    
    // 0 => New Moon
    // 1 => Waxing Crescent
    // 2 => First Quarter
    // 3 => Waxing Gibbous
    // 4 => Full Moon
    // 5 => Waning Gibbous
    // 6 => Last Quarter
    // 7 => Waning Crescent

    switch (b) {
      case 0: return '🌑'
      case 1: return '🌒'
      case 2: return '🌓'
      case 3: return '🌔'
      case 4: return '🌕'
      case 5: return '🌖'
      case 6: return '🌗'
      case 7: return '🌘'
      default: return '🌕'
    }
  }

  const moonEmoji = getMoonPhaseEmoji(new Date())

  // We need to render this in the Navbar.
  // Since Navbar is in root.tsx and structured there, we can use a React Portal 
  // to a known ID if we add one to the Navbar, or just fixed positioning near it.
  // Given user asked "on the navbar", let's put it fixed at top right or try to portal.
  // For simplicity and effect, let's just render it fixed z-index on top of navbar
  // or use a portal if we modify root.tsx to have a slot.
  
  // Actually, simplest is to just render here with fixed position that aligns with navbar actions.
  
  return (
    <div 
      className="fixed top-4 right-4 z-[100] cursor-pointer text-2xl animate-pulse"
      title="Current Moon Phase"
      style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 200, 0.5))' }}
      onClick={() => setActive(false)}
    >
      {moonEmoji}
    </div>
  )
}
