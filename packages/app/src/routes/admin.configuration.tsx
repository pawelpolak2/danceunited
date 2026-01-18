import type { DanceStyle } from 'db'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Form, useLoaderData, useNavigation, useSearchParams } from 'react-router'
import { MetallicButton } from '../components/ui/MetallicButton'
import { ShinyText } from '../components/ui/ShinyText'
import type { Route } from './+types/admin.configuration'

// Helper might be needed for file stream? Or just Buffer.
// Actually standard formData.get('file') returns a File object in standard Request.
// We can use arrayBuffer().

const GALLERY_CATEGORIES = ['camps', 'classes', 'tournaments', 'studio'] as const
type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]

// Use a looser type for props since data over the wire (loader) serializes Decimal to string/number
function PricingTab({ packages }: { packages: any[] }) {
  const _navigation = useNavigation()
  // Simple "Add" state or "Edit" state.
  // For a real app, maybe a Modal is better, but inline row editing or a simple form at top works too.

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <h3 className="mb-6 font-bold text-gold text-xl">Current Packages</h3>

        {/* Create Package Form */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="mb-4 font-bold text-sm text-white uppercase tracking-wider">Create New Package</h4>
          <Form method="post" className="flex flex-col items-end gap-4 md:flex-row">
            <input type="hidden" name="intent" value="create_package" />

            <div className="w-full flex-[2] space-y-1">
              <label className="text-gray-400 text-xs">Package Name</label>
              <input
                name="name"
                required
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
                placeholder="e.g. 10 Class Pass"
              />
            </div>

            <div className="w-full flex-1 space-y-1">
              <label className="text-gray-400 text-xs">Price</label>
              <input
                name="price"
                type="number"
                step="0.01"
                required
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
                placeholder="0.00"
              />
            </div>

            <MetallicButton type="submit" className="w-full rounded-md border-2 border-gold/50 px-4 py-2 md:w-auto">
              Create
            </MetallicButton>
          </Form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-white/10 border-b text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500 italic">
                    No packages found.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="border-white/5 border-b transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{pkg.name}</td>
                    <td className="px-4 py-3 font-bold text-gold">{pkg.price.toFixed(2)} zł</td>
                    <td className="px-4 py-3">
                      {pkg.isActive ? (
                        <span className="rounded border border-green-800 bg-green-900/40 px-2 py-1 text-green-400 text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="rounded border border-red-800 bg-red-900/40 px-2 py-1 text-red-400 text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Form
                        method="post"
                        onSubmit={(e) => !confirm('Delete this package?') && e.preventDefault()}
                        style={{ display: 'inline-block' }}
                      >
                        <input type="hidden" name="intent" value="delete_package" />
                        <input type="hidden" name="id" value={pkg.id} />
                        <button type="submit" className="p-1 text-gray-400 transition-colors hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </Form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function GalleryTab({ images }: { images: Record<string, string[]> }) {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('camps')
  const navigation = useNavigation()
  const isUploading = navigation.formData?.get('intent') === 'upload_image'

  const currentImages = images[selectedCategory] || []

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <h3 className="mb-6 font-bold text-gold text-xl">Gallery Management</h3>

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
function StylesTab({ styles }: { styles: DanceStyle[] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <h3 className="mb-6 font-bold text-gold text-xl">Dance Styles</h3>

        {/* Create Style Form */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="mb-4 font-bold text-sm text-white uppercase tracking-wider">Add New Dance Style</h4>
          <Form method="post" className="flex flex-col items-end gap-4 md:flex-row">
            <input type="hidden" name="intent" value="create_style" />

            <div className="w-full flex-[2] space-y-1">
              <label className="text-gray-400 text-xs">Style Name</label>
              <input
                name="name"
                required
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
                placeholder="e.g. Hip Hop"
              />
            </div>
            <div className="w-full flex-[3] space-y-1">
              <label className="text-gray-400 text-xs">Description</label>
              <input
                name="description"
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
                placeholder="Short description..."
              />
            </div>

            <MetallicButton type="submit" className="w-full rounded-md border-2 border-gold/50 px-4 py-2 md:w-auto">
              Add Style
            </MetallicButton>
          </Form>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {styles.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500 italic">No dance styles defined.</div>
          ) : (
            styles.map((style) => (
              <div
                key={style.id}
                className="group flex items-start justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-gold/30"
              >
                <div>
                  <h4 className="font-bold text-lg text-white">{style.name}</h4>
                  {style.description && <p className="mt-1 text-gray-400 text-sm">{style.description}</p>}
                </div>
                <Form method="post" onSubmit={(e) => !confirm(`Delete ${style.name}?`) && e.preventDefault()}>
                  <input type="hidden" name="intent" value="delete_style" />
                  <input type="hidden" name="id" value={style.id} />
                  <button
                    type="submit"
                    className="text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </Form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// --- Data Loading ---

export const loader = async () => {
  const { prisma } = await import('db')
  const fs = await import('fs')
  const path = await import('path')

  const packages = await prisma.package.findMany({
    orderBy: { price: 'asc' },
    where: { isActive: true },
  })

  const danceStyles = await prisma.danceStyle.findMany({
    orderBy: { name: 'asc' },
  })

  // Read Gallery Images
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

  return { packages, galleryImages, danceStyles }
}

export const action = async ({ request }: Route.ActionArgs) => {
  const { prisma } = await import('db')
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

  if (intent === 'create_style') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    try {
      await prisma.danceStyle.create({
        data: { name, description },
      })
    } catch (_e) {
      // unique constraint violation likely
      return { success: false, error: 'Style already exists' }
    }
  }

  if (intent === 'delete_style') {
    const id = formData.get('id') as string
    try {
      await prisma.danceStyle.delete({ where: { id } })
    } catch (_e) {
      // likely fk constraint if used in templates
      // Should probably show error, but simple ignore for now
    }
  }

  if (intent === 'create_package') {
    const name = formData.get('name') as string
    const price = parseFloat(formData.get('price') as string)

    if (!name || Number.isNaN(price)) {
      // Handle error: missing name or invalid price
      return { success: false, error: 'Invalid package data' }
    }

    await prisma.package.create({
      data: { name, price, isActive: true, classCount: 1, validityDays: 30 },
    })
  }

  if (intent === 'delete_package') {
    const id = formData.get('id') as string
    // Soft delete by updating isActive, or hard delete? Schema says isActive default true.
    // Let's hard delete for now but maybe just set isActive=false in future.
    // Actually schema usually has Cascade delete or we need to be careful with existing UserPurchases.
    // Safe option: Set isActive = false
    await prisma.package.update({
      where: { id },
      data: { isActive: false },
    })
  }

  return { success: true }
}

export default function AdminConfiguration() {
  const { packages, galleryImages, danceStyles } = useLoaderData<typeof loader>()
  // Use search params for tab state persistence (optional but good practice)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'pricing'

  const setActiveTab = (tab: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.set('tab', tab)
      return newParams
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <ShinyText as="h1" variant="title" className="mb-2 font-bold text-3xl text-white">
            Studio Configuration
          </ShinyText>
          <p className="text-gray-400">Manage master settings for your studio.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-white/10 border-b pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`rounded-t-lg px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'pricing'
              ? 'border-gold border-b-2 bg-amber-900/20 text-gold'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Pricing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`rounded-t-lg px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'gallery'
              ? 'border-gold border-b-2 bg-amber-900/20 text-gold'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Gallery
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('styles')}
          className={`rounded-t-lg px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'styles'
              ? 'border-gold border-b-2 bg-amber-900/20 text-gold'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Dance Styles
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'pricing' && <PricingTab packages={packages} />}
        {activeTab === 'gallery' && <GalleryTab images={galleryImages} />}
        {activeTab === 'styles' && <StylesTab styles={danceStyles} />}
      </div>
    </div>
  )
}
