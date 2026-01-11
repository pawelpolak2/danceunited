import fs from 'fs'
import path from 'path'
import { useState } from 'react'
import { useLoaderData } from 'react-router'
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
      return fs
        .readdirSync(dir)
        .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
        .map((file) => ({
          src: `/gallery/${category}/${file}`,
          alt: `${category} photo`,
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
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)

  const currentImages = images[activeTab as keyof typeof images] || []

  return (
    <div className="container mx-auto px-4 pt-2 pb-16 text-center">
      <div className="mb-12 flex flex-col items-center">
        <ShinyText
          as="h1"
          variant="title"
          className="mb-4 block w-full font-bold font-cinzel text-4xl text-gold md:text-5xl"
        >
          Gallery
        </ShinyText>
        <ShinyText as="p" variant="body" className="block w-full text-gray-300 text-xl">
          Capturing the magic of dance, one moment at a time.
        </ShinyText>
      </div>

      {/* Tabs */}
      <div className="mb-12 flex flex-wrap justify-center gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveTab(cat.id)}
            className={`rounded-full border px-6 py-2 font-medium text-lg transition-all duration-300 ${
              activeTab === cat.id
                ? 'border-gold bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                : 'border-gray-600 bg-transparent text-gray-400 hover:border-gold hover:text-gold'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {currentImages.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {currentImages.map((img, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(img)}
              className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-gray-800 shadow-2xl"
            >
              <div className="absolute inset-0 z-10 bg-black/20 transition-colors duration-500 group-hover:bg-black/0" />
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute right-0 bottom-0 left-0 z-20 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
                <p className="pointer-events-none font-medium text-lg text-white">Click to expand</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-700 border-dashed bg-white/5 py-12">
          <ShinyText as="p" variant="body" className="text-gray-400 text-lg">
            No photos in this category yet. Coming soon!
          </ShinyText>
        </div>
      )}

      {/* Empty State / Call to Action */}
      <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <ShinyText as="h3" variant="title" className="mb-2 text-2xl text-gold">
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
          <div className="relative flex max-h-[90vh] w-full max-w-7xl flex-col items-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="-top-12 absolute right-0 p-2 text-white transition-colors hover:text-gold"
              aria-label="Close gallery"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-h-[85vh] max-w-full rounded-lg border border-white/10 object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedImage.alt && <p className="mt-4 font-medium text-lg text-white/90">{selectedImage.alt}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
