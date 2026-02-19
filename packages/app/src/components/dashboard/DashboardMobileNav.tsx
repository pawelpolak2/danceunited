import { PanelLeft, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { ShinyText } from '../ui'

interface DashboardMobileNavProps {
  title: string
  renderSidebar: (onNavigate: () => void) => React.ReactNode
}

export function DashboardMobileNav({ title, renderSidebar }: DashboardMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex h-16 items-center justify-between border-amber-900/30 border-b bg-gray-900/80 px-4 backdrop-blur-md md:hidden">
      {/* Toggle Button (Left) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-400 transition-colors hover:bg-amber-500/20"
        aria-label="Open Sidebar"
      >
        <PanelLeft size={20} />
        <span className="font-medium text-xs uppercase tracking-wider">Menu</span>
      </button>

      {/* Mobile Logo (Right) */}
      <Link to="/" className="flex items-center gap-2">
        <ShinyText
          as="span"
          variant="title"
          className="glow-sm font-bold text-amber-500 text-lg uppercase tracking-widest"
        >
          {title}
        </ShinyText>
        <img src="/logos/logo-transparent.webp" alt="Dance United" className="h-8 w-auto" />
      </Link>

      {/* Drawer via Portal */}
      {mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
                isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              }`}
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-out Panel */}
            <div
              className={`fixed top-0 left-0 z-[101] h-full w-72 transform border-amber-900/30 border-r bg-gray-950 shadow-2xl transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="relative h-full">
                {/* Close Button inside Drawer */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 z-50 rounded-lg bg-gray-900/80 p-1 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>

                {renderSidebar(() => setIsOpen(false))}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  )
}
