import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  // Handle click outside
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect()
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width

      if (!isInDialog) {
        onClose()
      }
    }

    dialog.addEventListener('click', handleClick)
    return () => dialog.removeEventListener('click', handleClick)
  }, [onClose])

  if (!isOpen) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      className="-translate-x-1/2 -translate-y-1/2 backdrop:fade-in zoom-in-95 pointer-events-auto fixed top-1/2 left-1/2 w-full max-w-lg rounded-xl border border-amber-900/40 bg-gray-950 p-0 text-gray-100 shadow-2xl shadow-black ring-1 ring-amber-500/20 backdrop:animate-in backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-amber-900/30 border-b bg-gray-900/50 px-6 py-4">
        <h2 className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text font-bold font-cinzel text-transparent text-xl">
          {title}
        </h2>
        <button
          onClick={onClose}
          type="button"
          className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="custom-scrollbar max-h-[80vh] overflow-y-auto p-6">{children}</div>
    </dialog>,
    document.body
  )
}
