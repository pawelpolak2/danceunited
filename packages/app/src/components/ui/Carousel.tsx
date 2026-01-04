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
            setCurrentIndex((prev) => (prev + 1) % images.length)
        }, autoPlayInterval)

        return () => clearInterval(timer)
    }, [images.length, autoPlayInterval, isPaused])

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    const goToSlide = (index: number) => {
        setCurrentIndex(index)
    }

    if (!images.length) return null

    return (
        <div
            className={`relative overflow-hidden rounded-xl border border-amber-900/20 shadow-2xl ${className}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Images */}
            <div className="relative aspect-video w-full overflow-hidden sm:aspect-[21/9]">
                {images.map((src, index) => (
                    <div
                        key={src}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img
                            src={src}
                            alt={`Slide ${index + 1}`}
                            className="h-full w-full object-cover"
                        />
                        {/* Overlay gradient for better text readability if needed */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/30" />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                type="button"
                onClick={goToPrevious}
                className="-translate-y-1/2 absolute top-1/2 left-4 rounded-full bg-black/40 p-2 text-gold backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white"
                aria-label="Previous slide"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-6 w-6"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button
                type="button"
                onClick={goToNext}
                className="-translate-y-1/2 absolute top-1/2 right-4 rounded-full bg-black/40 p-2 text-gold backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white"
                aria-label="Next slide"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-6 w-6"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>

            {/* Dots Navigation */}
            <div className="-translate-x-1/2 absolute bottom-4 left-1/2 flex gap-2">
                {images.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'w-8 bg-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]'
                                : 'w-2.5 bg-gray-600 hover:bg-gray-400'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}
