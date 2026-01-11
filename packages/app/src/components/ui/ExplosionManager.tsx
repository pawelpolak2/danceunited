import { useEffect, useState } from 'react'

export function ExplosionManager() {
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
          // If active, we might want to keep them or clear them. 
          // Let's clear on key up to allow stopping? 
          // Or maybe just let the timer stop it.
          // Let's standardly remove them.
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
    if (keys.has('e') && keys.has('x') && keys.has('p')) {
      setActive(true)
      // Auto reset after 5 seconds
      const timer = setTimeout(() => {
        setActive(false)
        setKeys(new Set()) // Reset keys to prevent immediate re-trigger
      }, 20000)
      return () => clearTimeout(timer)
    }
  }, [keys])

  useEffect(() => {
    if (active) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.transformStyle = 'preserve-3d'
      document.body.style.perspective = '1000px'
      
      const allElements = document.body.querySelectorAll('*')
      const targetElements: HTMLElement[] = []
      
      // Select more elements but filter out huge containers

      
      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
           // Skip if it contains too many elements (is a major container)
           if (el.querySelectorAll('*').length > 50) return
           
           // Skip full screen containers
           const rect = el.getBoundingClientRect()
           if (rect.width >= window.innerWidth && rect.height >= window.innerHeight) return
           if (rect.width === 0 || rect.height === 0) return

           // Skip hidden/system tags
           if (['SCRIPT', 'STYLE', 'META', 'HEAD', 'LINK', 'NOSCRIPT'].includes(el.tagName)) return

           // Higher probability for leaf nodes
           const isLeaf = el.children.length === 0
           const chance = isLeaf ? 0.8 : 0.4
           
           if (Math.random() < chance) {
             targetElements.push(el)
           }
        }
      })

      targetElements.forEach(el => {
        // Physics
        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        
        const screenCenterX = window.innerWidth / 2
        const screenCenterY = window.innerHeight / 2
        
        const dirX = centerX - screenCenterX
        const dirY = centerY - screenCenterY
        
        const len = Math.sqrt(dirX*dirX + dirY*dirY) || 1
        const force = 500 + Math.random() * 1000 // Slightly reduced force for better visibility
        
        const moveX = (dirX / len) * force
        const moveY = (dirY / len) * force + 800 // Stronger gravity
        const moveZ = 100 + Math.random() * 500 // Moderate Z depth
        
        const rotX = Math.random() * 1080 - 540 // More rotation
        const rotY = Math.random() * 1080 - 540
        const rotZ = Math.random() * 1080 - 540
        
        // Ultra slow motion matrix feel with scale to creating gaps (shards)
        el.style.transition = `transform ${15 + Math.random() * 10}s cubic-bezier(0.1, 0.9, 0.2, 1)`
        el.style.transform = `translate3d(${moveX}px, ${moveY}px, ${moveZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${0.5 + Math.random() * 0.5})`
        el.style.pointerEvents = 'none'
      })

      return () => {
        document.documentElement.style.overflow = ''
        document.body.style.transformStyle = ''
        document.body.style.perspective = ''
        targetElements.forEach(el => {
          el.style.transition = ''
          el.style.transform = ''
          el.style.pointerEvents = ''
        })
      }
    }
  }, [active])

  if (!active) return null

  return (
    <>
      <style>{`
        @keyframes jump-squeeze {
          0%, 100% { transform: scale(1, 1) translateY(0); }
          10% { transform: scale(1.1, 0.9) translateY(0); }
          30% { transform: scale(0.9, 1.1) translateY(-50px); }
          50% { transform: scale(1.05, 0.95) translateY(0); }
          57% { transform: scale(1, 1) translateY(-7px); }
          64% { transform: scale(1, 1) translateY(0); }
        }
      `}</style>
      <div 
        className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center font-black text-9xl text-yellow-300 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]"
        style={{ 
          fontFamily: 'fantasy',
          animation: 'jump-squeeze 1s ease-in-out infinite'
        }}
      >
        KABOOM!
      </div>
    </>
  )
}
