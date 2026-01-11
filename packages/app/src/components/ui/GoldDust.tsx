import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  fadeSpeed: number
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
    const particleCount = 100

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height, // Start above visible area
      size: Math.random() * 2 + 0.5, // 0.5 to 2.5px
      speedX: Math.random() * 0.5 - 0.25, // -0.25 to 0.25
      speedY: Math.random() * 1 + 0.5, // 0.5 to 1.5
      opacity: Math.random() * 0.5 + 0.1, // 0.1 to 0.6
      fadeSpeed: Math.random() * 0.005 + 0.002,
    })

    const init = () => {
      resizeCanvas()
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle())
        // Distribute initially
        particles[i].y = Math.random() * canvas.height
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, i) => {
        // Update
        p.y += p.speedY
        p.x += p.speedX
        p.opacity += Math.sin(Date.now() * 0.001 * p.fadeSpeed) * 0.01 // Subtle pulsing

        // Reset if out of bounds
        if (p.y > canvas.height) {
          particles[i] = createParticle()
          particles[i].y = -10 // Start just above
        }
        if (p.x > canvas.width) p.x = 0
        if (p.x < 0) p.x = canvas.width

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})` // Gold
        ctx.fill()
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
