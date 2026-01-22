import { MetallicButton } from './MetallicButton'
import { Modal } from './Modal'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {description && <p className="text-base text-gray-300 leading-relaxed">{description}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-400 text-sm transition-colors hover:text-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <MetallicButton
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`min-w-[100px] rounded-md border-2 px-4 py-2 ${
              isDestructive ? 'border-red-900/50 bg-red-900/20 text-red-100 hover:bg-red-900/40 hover:text-white' : ''
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </MetallicButton>
        </div>
      </div>
    </Modal>
  )
}
