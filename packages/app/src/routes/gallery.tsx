import { useLoaderData } from 'react-router'
import { useState } from 'react'
import fs from 'fs'
import path from 'path'
import { ShinyText } from '../components/ui'

const categories = [
  { id: 'camps', label: 'Camps & Courses' },
  { id: 'classes', label: 'Classes' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'studio', label: 'Dance Hall' },
]

export const loader = async () => {
  const getImages = (category: string) => {
    const dir = path.join(process.cwd(), 'public', 'gallery', category)
    try {
      if (!fs.existsSync(dir)) return []
      return fs.readdirSync(dir)
        .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
        .map(file => ({
          src: `/gallery/${category}/${file}`,
          alt: `${category} photo`
        }))
    } catch (error) {
      console.error(`Error reading gallery directory for ${category}:`, error)
      return []
    }
  }

  return {
    camps: getImages('camps'),
    classes: getImages('classes'),
    tournaments: getImages('tournaments'),
    studio: getImages('studio'),
  }
}

export default function Gallery() {
  const images = useLoaderData<typeof loader>()
  const [activeTab, setActiveTab] = useState('camps')
  const [selectedImage, setSelectedImage] = useState<{ src: string, alt: string } | null>(null)

  const currentImages = images[activeTab as keyof typeof images] || []

  return (
    <div className="container mx-auto px-4 pt-2 pb-16 text-center">
      <div className="flex flex-col items-center mb-12">
        <ShinyText as="h1" variant="title" className="mb-4 text-4xl md:text-5xl font-cinzel font-bold text-gold block w-full">
          Gallery
        </ShinyText>
        <ShinyText as="p" variant="body" className="text-xl text-gray-300 block w-full">
          Capturing the magic of dance, one moment at a time.
        </ShinyText>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-6 py-2 rounded-full border transition-all duration-300 text-lg font-medium ${activeTab === cat.id
              ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]'
              : 'bg-transparent text-gray-400 border-gray-600 hover:border-gold hover:text-gold'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {currentImages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentImages.map((img, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(img)}
              className="group relative overflow-hidden rounded-xl border border-gray-800 shadow-2xl aspect-[4/3] cursor-pointer"
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500 z-10" />
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                <p className="text-white font-medium text-lg pointer-events-none">Click to expand</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 border border-dashed border-gray-700 rounded-xl bg-white/5">
          <ShinyText as="p" variant="body" className="text-gray-400 text-lg">
            No photos in this category yet. Coming soon!
          </ShinyText>
        </div>
      )}

      {/* Empty State / Call to Action */}
      <div className="mt-16 p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
        <ShinyText as="h3" variant="title" className="text-2xl text-gold mb-2">
          Want to see more?
        </ShinyText>
        <p className="text-gray-400">
          Follow us on Instagram <span className="text-gold">@danceunitedgdansk</span> for daily updates and stories!
        </p>
      </div>

      {/* Lightbox / Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gold transition-colors p-2"
              aria-label="Close gallery"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-h-[85vh] max-w-full rounded-lg shadow-2xl border border-white/10 object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedImage.alt && (
              <p className="mt-4 text-white/90 text-lg font-medium">{selectedImage.alt}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
