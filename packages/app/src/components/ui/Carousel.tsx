import { useEffect, useState } from 'react'

interface CarouselProps {
  images: string[]
  className?: string
  autoPlayInterval?: number
}

export function Carousel({ images, className = '', autoPlayInterval = 5000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prev: number) => (prev + 1) % images.length)
    }, autoPlayInterval)

    return () => clearInterval(timer)
  }, [images.length, autoPlayInterval, isPaused])

  if (!images.length) return null

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Image Carousel"
    >
      {/* Images */}
      <div className="relative h-full w-full overflow-hidden">
        {images.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={src} alt={`Slide ${index + 1}`} className="h-full w-full object-cover" />
            {/* Overlay gradient for better text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/30" />
          </div>
        ))}
      </div>
    </div>
  )
}
