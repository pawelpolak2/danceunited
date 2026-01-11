import { useEffect, useState } from 'react'
import { MetallicButton } from './MetallicButton'
import { ShinyText } from './ShinyText'

export function EasterEggGuide() {
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
          // Allow closing with Escape
          if (e.key === 'Escape') setActive(false)
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
    // E + A for "Easter Egg" or "All"
    if (keys.has('e') && keys.has('a')) {
       setActive(true)
       setKeys(new Set())
    }
  }, [keys])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-xl border border-amber-500/30 bg-gray-900 p-8 shadow-[0_0_50px_rgba(251,191,36,0.2)]">
        <button 
          onClick={() => setActive(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        <div className="mb-8 text-center">
          <ShinyText variant="title" className="text-4xl text-gold">Secrets Guide</ShinyText>
          <p className="mt-2 text-gray-400">You've found the master key. Here is what you can do:</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Effects */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Major Effects</h3>
            <div className="flex justify-between items-center group">
              <span className="text-gray-300">Shatter Existence</span>
              <kbd className="px-2 py-1 rounded bg-gray-800 text-gold font-mono text-sm border border-gray-700 group-hover:border-gold/50 transition-colors">E + X + P</kbd>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-gray-300">Moon Phase</span>
              <kbd className="px-2 py-1 rounded bg-gray-800 text-gold font-mono text-sm border border-gray-700 group-hover:border-gold/50 transition-colors">M + O</kbd>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-gray-300">Secrets Guide</span>
              <kbd className="px-2 py-1 rounded bg-gray-800 text-gold font-mono text-sm border border-gray-700 group-hover:border-gold/50 transition-colors">E + A</kbd>
            </div>
          </div>

          {/* Daily Specials */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Daily Specials</h3>
            <p className="text-xs text-gray-500 italic mb-2">Only works on the specific day!</p>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
               <div className="flex justify-between text-gray-400"><span>Monday</span> <code className="text-gold">M+O+N</code></div>
               <div className="flex justify-between text-gray-400"><span>Tuesday</span> <code className="text-gold">T+U+E</code></div>
               <div className="flex justify-between text-gray-400"><span>Wednesday</span> <code className="text-gold">W+E+D</code></div>
               <div className="flex justify-between text-gray-400"><span>Thursday</span> <code className="text-gold">T+H+U</code></div>
               <div className="flex justify-between text-gray-400"><span>Friday</span> <code className="text-gold">F+R+I</code></div>
               <div className="flex justify-between text-gray-400"><span>Saturday</span> <code className="text-gold">S+A+T</code></div>
               <div className="flex justify-between text-gray-400"><span>Sunday</span> <code className="text-gold">S+U+N</code></div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
            <MetallicButton onClick={() => setActive(false)} className="px-8 py-2">
              Close Access
            </MetallicButton>
        </div>
      </div>
    </div>
  )
}
