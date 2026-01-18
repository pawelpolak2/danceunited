import { useEffect, useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { MetallicButton } from '../ui/MetallicButton'
import { Modal } from '../ui/Modal'
import { MultiCombobox } from '../ui/MultiCombobox'

interface Package {
  id: string
  name: string
  description?: string | null
  price: number
  classCount: number
  validityDays: number
  category: string
  isActive: boolean
  classLinks?: { classTemplateId: string }[]
}

interface ClassTemplate {
  id: string
  name: string
  style: { name: string }
}

interface EditPackageModalProps {
  isOpen: boolean
  onClose: () => void
  pkg: Package | null
  classTemplates: ClassTemplate[]
}

const CATEGORIES = ['YOUTH', 'KIDS', 'SPORT', 'ADULTS', 'UNIVERSAL']

export function EditPackageModal({ isOpen, onClose, pkg, classTemplates }: EditPackageModalProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [classCount, setClassCount] = useState(1)
  const [validityDays, setValidityDays] = useState(30)
  const [category, setCategory] = useState('UNIVERSAL')
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      if (pkg) {
        setName(pkg.name)
        setDescription(pkg.description || '')
        setPrice(Number(pkg.price))
        setClassCount(pkg.classCount)
        setValidityDays(pkg.validityDays)
        setCategory(pkg.category)
        setCategory(pkg.category)
        setSelectedTemplateIds(pkg.classLinks?.map((l) => l.classTemplateId) || [])
      } else {
        // Defaults
        setName('')
        setDescription('')
        setPrice(0)
        setClassCount(1)
        setValidityDays(30)
        setCategory('UNIVERSAL')
        setSelectedTemplateIds([])
      }
    }
  }, [isOpen, pkg])

  if (!isOpen) return null

  const isEdit = !!pkg

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Package' : 'Create Package'}>
      <Form
        method="post"
        className="space-y-4"
        onSubmit={(_e) => {
          setTimeout(onClose, 100)
        }}
      >
        <input type="hidden" name="intent" value={isEdit ? 'update_package' : 'create_package'} />
        {isEdit && <input type="hidden" name="id" value={pkg.id} />}

        {/* Pass selected templates as JSON */}
        <input type="hidden" name="classTemplateIds" value={JSON.stringify(selectedTemplateIds)} />

        {/* Name */}
        <div className="space-y-1">
          <label htmlFor="pkg-name" className="block font-medium text-gray-400 text-xs">
            Package Name
          </label>
          <input
            id="pkg-name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            placeholder="e.g. 10 Class Pass"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="pkg-desc" className="block font-medium text-gray-400 text-xs">
            Description
          </label>
          <textarea
            id="pkg-desc"
            name="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            placeholder="Optional description..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block font-medium text-gray-400 text-xs">Price</label>
            <input
              type="number"
              name="price"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-1">
            <label className="block font-medium text-gray-400 text-xs">Category</label>
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block font-medium text-gray-400 text-xs">Class Count</label>
            <input
              type="number"
              name="classCount"
              required
              min="1"
              value={classCount}
              onChange={(e) => setClassCount(parseInt(e.target.value))}
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            />
          </div>
          <div className="space-y-1">
            <label className="block font-medium text-gray-400 text-xs">Validity (Days)</label>
            <input
              type="number"
              name="validityDays"
              required
              min="1"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value))}
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Class Template Selection */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-400 text-xs">Classes:</label>
          <MultiCombobox
            options={classTemplates.map((t) => ({ value: t.id, label: `${t.name} (${t.style.name})` }))}
            value={selectedTemplateIds}
            onChange={setSelectedTemplateIds}
            placeholder="Select classes this package applies to..."
          />
          <p className="text-gray-500 text-xs">Leave empty to apply to all compatible classes.</p>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-400 text-sm transition-colors hover:text-white"
          >
            Cancel
          </button>
          <MetallicButton type="submit" disabled={isSubmitting} className="min-w-[100px] rounded-md border-2 px-4 py-2">
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </MetallicButton>
        </div>
      </Form>
    </Modal>
  )
}
