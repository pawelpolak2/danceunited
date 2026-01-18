import { useEffect, useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { MetallicButton } from '../ui/MetallicButton'
import { Modal } from '../ui/Modal'

interface DanceStyle {
  id: string
  name: string
  description: string | null
}

interface EditStyleModalProps {
  isOpen: boolean
  onClose: () => void
  style: DanceStyle | null // null means "Create Mode"
}

export function EditStyleModal({ isOpen, onClose, style }: EditStyleModalProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(style?.name || '')
      setDescription(style?.description || '')
    }
  }, [isOpen, style])

  if (!isOpen) return null

  const isEdit = !!style

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Dance Style' : 'Add New Dance Style'}>
      <Form
        method="post"
        className="space-y-4"
        onSubmit={() => {
          setTimeout(onClose, 100)
        }}
      >
        <input type="hidden" name="intent" value={isEdit ? 'update_style' : 'create_style'} />
        {isEdit && <input type="hidden" name="id" value={style.id} />}

        <div className="space-y-1">
          <label htmlFor="style-name" className="block font-medium text-gray-400 text-xs">
            Style Name
          </label>
          <input
            id="style-name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            placeholder="e.g. Hip Hop"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="style-desc" className="block font-medium text-gray-400 text-xs">
            Description
          </label>
          <textarea
            id="style-desc"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            placeholder="Short description..."
          />
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
