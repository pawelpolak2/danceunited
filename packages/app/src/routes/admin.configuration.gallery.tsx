import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Form, useLoaderData, useNavigation } from 'react-router'
import { MetallicButton } from '../components/ui/MetallicButton'
import { ShinyText } from '../components/ui/ShinyText'
import type { Route } from './+types/admin.configuration.gallery'

const GALLERY_CATEGORIES = ['camps', 'classes', 'tournaments', 'studio'] as const
type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]

export const loader = async () => {
  const fs = await import('fs')
  const path = await import('path')

  const galleryImages: Record<string, string[]> = {}

  for (const category of GALLERY_CATEGORIES) {
    const dir = path.join(process.cwd(), 'public', 'gallery', category)
    try {
      if (fs.existsSync(dir)) {
        galleryImages[category] = fs.readdirSync(dir).filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
      } else {
        galleryImages[category] = []
      }
    } catch (e) {
      console.error(`Error reading gallery ${category}`, e)
      galleryImages[category] = []
    }
  }
  return { galleryImages }
}

export const action = async ({ request }: Route.ActionArgs) => {
  const fs = await import('fs')
  const path = await import('path')

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'upload_image') {
    const category = formData.get('category') as string
    const file = formData.get('file') as File

    if (!file || file.size === 0) return { success: false, error: 'No file uploaded' }
    if (!GALLERY_CATEGORIES.includes(category as any)) return { success: false, error: 'Invalid category' }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const targetDir = path.join(process.cwd(), 'public', 'gallery', category)

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    fs.writeFileSync(path.join(targetDir, safeFilename), buffer)
  }

  if (intent === 'delete_image') {
    const category = formData.get('category') as string
    const filename = formData.get('filename') as string

    if (!GALLERY_CATEGORIES.includes(category as any)) return { success: false }

    // Basic sanitization to prevent directory traversal
    const safeFilename = path.basename(filename)
    const filePath = path.join(process.cwd(), 'public', 'gallery', category, safeFilename)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  return { success: true }
}

export default function GalleryConfiguration() {
  const { galleryImages: images } = useLoaderData<typeof loader>()
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('camps')
  const navigation = useNavigation()
  const isUploading = navigation.formData?.get('intent') === 'upload_image'

  const currentImages = images[selectedCategory] || []

  return (
    <div className="space-y-6">
      <div>
        <ShinyText as="h1" variant="title" className="mb-2 font-bold text-3xl text-white">
          Gallery Management
        </ShinyText>
        <p className="text-gray-400">Manage images for your gallery.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <h3 className="mb-6 font-bold text-gold text-xl">Gallery Images</h3>

        {/* Upload Form */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="mb-4 font-bold text-sm text-white uppercase tracking-wider">Upload New Image</h4>
          <Form method="post" encType="multipart/form-data" className="flex flex-col items-end gap-4 md:flex-row">
            <input type="hidden" name="intent" value="upload_image" />

            <div className="w-full flex-1 space-y-1">
              <label className="text-gray-400 text-xs">Category</label>
              <select
                name="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
              >
                {GALLERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full flex-[2] space-y-1">
              <label className="text-gray-400 text-xs">Image File</label>
              <input
                type="file"
                name="file"
                accept="image/*"
                required
                className="w-full text-gray-400 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-sm file:text-white hover:file:bg-primary/80"
              />
            </div>

            <MetallicButton
              type="submit"
              disabled={isUploading}
              className="w-full transform rounded-md border-none bg-amber-500 px-6 py-2 font-bold text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all hover:scale-105 hover:bg-amber-400 md:w-auto"
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </MetallicButton>
          </Form>
        </div>

        {/* Category Filter */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full border px-3 py-1 font-medium text-xs uppercase transition-colors ${
                selectedCategory === cat
                  ? 'border-gold bg-gold text-black'
                  : 'border-gray-700 text-gray-400 hover:border-gold hover:text-gold'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {currentImages.length === 0 ? (
            <div className="col-span-full rounded-lg border border-white/10 border-dashed py-8 text-center text-gray-500">
              No images in this category.
            </div>
          ) : (
            currentImages.map((img) => (
              <div
                key={img}
                className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black"
              >
                <img
                  src={`/resources/gallery/${selectedCategory}/${img}`}
                  alt={img}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Form method="post" onSubmit={(e) => !confirm('Delete this image?') && e.preventDefault()}>
                    <input type="hidden" name="intent" value="delete_image" />
                    <input type="hidden" name="category" value={selectedCategory} />
                    <input type="hidden" name="filename" value={img} />
                    <button
                      type="submit"
                      className="transform rounded-full bg-red-600/90 p-2 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Form>
                </div>
                <div className="absolute right-0 bottom-0 left-0 truncate bg-black/60 p-1 text-[10px] text-white">
                  {img}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
