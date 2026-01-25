import { useRef } from 'react'
import { Outlet, redirect } from 'react-router'
import { Footer } from '../components/Footer'
import { AdminMobileNav } from '../components/dashboard/AdminMobileNav'
import { AdminSidebar } from '../components/dashboard/AdminSidebar'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/admin.layout'

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  if (user.role !== 'MANAGER') {
    return redirect('/')
  }

  return { user }
}

export default function AdminLayout() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gray-950 text-amber-50 md:flex-row">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-gray-950 to-gray-950" />

      {/* Mobile Top Bar */}
      <AdminMobileNav />

      {/* Desktop Sidebar */}
      <aside className="hidden h-full w-64 flex-shrink-0 p-4 md:flex">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="scrollbar-metallic flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 pt-4 md:pt-8 md:p-8">
            <Outlet />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  )
}
