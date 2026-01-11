import { useEffect, useState } from 'react'

type DayEffect = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN' | null

export function WeeklyEasterEggManager() {
  const [activeEffect, setActiveEffect] = useState<DayEffect>(null)
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
  }, [])

  useEffect(() => {
    const day = new Date().getDay() // 0 = Sun, 1 = Mon, ...
    
    // reset if active and keys released? or keep active until toggle?
    // Let's make it toggle on simultaneous press, auto-off after some time or toggle off.
    // For simplicity, let's toggle ON. User can reload to stop, or we add timeout.
    
    if (activeEffect) return 

    // Monday (1) -> M+O+N
    if (day === 1 && keys.has('m') && keys.has('o') && keys.has('n')) {
      activate('MON')
    }
    // Tuesday (2) -> T+U+E
    else if (day === 2 && keys.has('t') && keys.has('u') && keys.has('e')) {
      activate('TUE')
    }
    // Wednesday (3) -> W+E+D
    else if (day === 3 && keys.has('w') && keys.has('e') && keys.has('d')) {
      activate('WED')
    }
    // Thursday (4) -> T+H+U
    else if (day === 4 && keys.has('t') && keys.has('h') && keys.has('u')) {
      activate('THU')
    }
    // Friday (5) -> F+R+I
    else if (day === 5 && keys.has('f') && keys.has('r') && keys.has('i')) {
      activate('FRI')
    }
    // Saturday (6) -> S+A+T
    else if (day === 6 && keys.has('s') && keys.has('a') && keys.has('t')) {
      activate('SAT')
    }
    // Sunday (0) -> S+U+N
    else if (day === 0 && keys.has('s') && keys.has('u') && keys.has('n')) {
      activate('SUN')
    }

  }, [keys, activeEffect])

  const activate = (effect: DayEffect) => {
    setActiveEffect(effect)
    // Auto turn off after 15 seconds so they aren't stuck forever
    setTimeout(() => {
      setActiveEffect(null)
      setKeys(new Set())
    }, 15000)
  }

  if (!activeEffect) return null

  return (
    <>
      {activeEffect === 'MON' && <MonEffect />}
      {activeEffect === 'TUE' && <TueEffect />}
      {activeEffect === 'WED' && <WedEffect />}
      {activeEffect === 'THU' && <ThuEffect />}
      {activeEffect === 'FRI' && <FriEffect />}
      {activeEffect === 'SAT' && <SatEffect />}
      {activeEffect === 'SUN' && <SunEffect />}
    </>
  )
}

function MonEffect() {
  // THE BLUES: Monochromatic Blue Filter
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none mix-blend-color"
         style={{ backgroundColor: 'blue', opacity: 0.5 }}>
      <style>{`html { filter: grayscale(100%) brightness(0.8) sepia(1) hue-rotate(180deg) saturate(3); }`}</style>
      <div className="fixed top-10 left-0 w-full text-center text-4xl font-bold text-blue-200 animate-pulse">MONDAY BLUES 🎷</div>
    </div>
  )
}

function TueEffect() {
  // TACO RAIN
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="absolute text-4xl animate-fall"
             style={{
               left: `${Math.random() * 100}%`,
               top: `-50px`,
               animation: `fall ${2 + Math.random() * 3}s linear infinite`,
               animationDelay: `${Math.random() * 5}s`
             }}>
          🌮
        </div>
      ))}
      <style>{`
        @keyframes fall {
          to { transform: translateY(110vh) rotate(360deg); }
        }
      `}</style>
      <div className="fixed top-10 w-full text-center text-5xl font-black text-yellow-500 drop-shadow-lg">IT'S TACO TUESDAY!</div>
    </div>
  )
}

function WedEffect() {
  // WOBBLE
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <style>{`
        body { animation: wobble 2s ease-in-out infinite; }
        @keyframes wobble {
          0%, 100% { transform: skew(0deg); }
          25% { transform: skew(2deg) rotate(1deg); }
          75% { transform: skew(-2deg) rotate(-1deg); }
        }
      `}</style>
      <div className="fixed bottom-10 w-full text-center text-4xl text-emerald-400 font-bold">WOBBLY WEDNESDAY 〰️</div>
    </div>
  )
}

function ThuEffect() {
  // SEPIA / THROWBACK
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none bg-[#704214] mix-blend-overlay opacity-30">
      <style>{`html { filter: sepia(0.8) contrast(1.2) brightness(0.9); }`}</style>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl text-[#704214] opacity-20 font-serif rotate-[-15deg]">THROWBACK<br/>THURSDAY</div>
    </div>
  )
}

function FriEffect() {
  // CONFETTI
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {Array.from({ length: 100 }).map((_, i) => (
        <div key={i} className="absolute w-3 h-3"
             style={{
               backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)],
               left: `${Math.random() * 100}%`,
               top: `-10px`,
               animation: `confetti ${3 + Math.random() * 2}s ease-out infinite`,
               animationDelay: `${Math.random() * 5}s`
             }} />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed top-20 w-full text-center text-6xl font-black text-white mix-blend-difference animate-bounce">FRI-YAY! 🎉</div>
    </div>
  )
}

function SatEffect() {
  // INVERT / NIGHT MODE
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none mix-blend-difference bg-white">
      <style>{`html { filter: invert(1); }`}</style>
      <div className="fixed bottom-20 right-20 text-4xl font-mono text-white">SATURDAY NIGHT FEVER 🕺</div>
    </div>
  )
}

function SunEffect() {
  // FLARE
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none bg-yellow-100 mix-blend-hard-light opacity-50">
       <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-white rounded-full blur-[100px] opacity-80 animate-pulse"></div>
       <div className="absolute top-[20%] left-[20%] w-[10vw] h-[10vw] bg-yellow-300 rounded-full blur-[50px] opacity-60"></div>
       <div className="fixed top-10 left-10 text-6xl font-bold text-yellow-600 drop-shadow-xl">SUNDAY FUNDAY ☀️</div>
    </div>
  )
}
