import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ShinyText } from './ShinyText'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)

  const menuItems = [
    { label: 'About Us', href: '/about' },
    { label: 'Team', href: '/team' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Contact', href: '/contact' },
    { label: 'Gallery', href: '/gallery' },
  ]

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={toggle}
        className="relative z-50 rounded-full border border-amber-500/20 bg-gray-900/50 p-2 text-amber-400 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={toggle}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-64 transform border-amber-900/30 border-l bg-gray-950 px-6 py-20 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={toggle}>
              <ShinyText
                variant="body"
                className="block text-xl uppercase tracking-wider transition-colors hover:text-gold"
              >
                {item.label}
              </ShinyText>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
