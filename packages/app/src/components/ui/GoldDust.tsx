import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  baseSize: number
  maxSize: number
  speedX: number
  speedY: number
  baseOpacity: number
  phase: number
  // flashSpeed acts as a multiplier for the cycle duration
  flashSpeed: number
}

export function GoldDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const particles: Particle[] = []
    const particleCount = 150 // Refined count for elegance

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      baseSize: Math.random() * 1.5 + 0.5, // Varied sizes
      maxSize: Math.random() * 2.5 + 1.5, // Bloom size when sparking
      speedX: Math.random() * 0.3 - 0.15, // Gentle drift
      speedY: Math.random() * 0.5 + 0.2, // Gentle fall
      baseOpacity: Math.random() * 0.4 + 0.2, // Increased visibility (0.2 - 0.6)
      phase: Math.random() * Math.PI * 2,
      flashSpeed: Math.random() * 0.5 + 0.5, // 0.5 - 1.0 multiplier
    })

    const init = () => {
      resizeCanvas()
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle())
        particles[i].y = Math.random() * canvas.height
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const time = Date.now()
      // Global slow time for the cycle
      const globalTime = time * 0.0008

      particles.forEach((p, i) => {
        p.y += p.speedY
        p.x += p.speedX

        if (p.y > canvas.height) {
          particles[i] = createParticle()
          particles[i].y = -10
        }
        if (p.x > canvas.width) p.x = 0
        if (p.x < 0) p.x = canvas.width

        // "Spark" logic:
        // Use a slowly rotating phase. When sin(t) is near 1.0, we spark.
        // Threshold 0.985 means "on" for a brief moment in the cycle.
        const cycle = Math.sin(globalTime * p.flashSpeed + p.phase)
        let sparkle = 0
        const threshold = 0.985

        if (cycle > threshold) {
          sparkle = (cycle - threshold) / (1 - threshold)
        }

        const currentOpacity = p.baseOpacity + sparkle * (1 - p.baseOpacity)
        // Add size pulse proportional to sparkle
        const currentSize = p.baseSize + sparkle * (p.maxSize - p.baseSize)

        // Color modulation
        // Stay warm/golden even at peak brightness.
        // Base Gold: 255, 215, 0
        // Target Pale Gold: 255, 245, 150 (Previous was 255, 255, 255)
        const r = 255
        // Green: 215 -> 245 (Add 30)
        const g = Math.floor(215 + (30 * sparkle))
        // Blue: 0 -> 150 (Add 150) - Keeps it warm/yellowish
        const b = Math.floor(150 * sparkle)

        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentOpacity})`

        // Glow only when sparking
        if (sparkle > 0.1) {
          ctx.shadowBlur = 8 * sparkle
          ctx.shadowColor = `rgba(255, 215, 0, ${sparkle * 0.8})`
        } else {
          ctx.shadowBlur = 0
        }

        ctx.fill()
        ctx.shadowBlur = 0
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resizeCanvas)
    init()
    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
