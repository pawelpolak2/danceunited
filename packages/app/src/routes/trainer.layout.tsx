import { BarChart3, Calendar, LayoutDashboard } from 'lucide-react'
import { Outlet, redirect } from 'react-router'
import { Footer } from '../components/Footer'
import { DashboardMobileNav } from '../components/dashboard/DashboardMobileNav'
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/trainer.layout'

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  if (user.role !== 'TRAINER') {
    return redirect('/')
  }

  return { user }
}

const TRAINER_MENU = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', path: '/trainer/dashboard', icon: LayoutDashboard },
      { label: 'Schedule', path: '/trainer/schedule', icon: Calendar },
      { label: 'Statistics', path: '/trainer/statistics', icon: BarChart3 },
    ],
  },
]

export default function TrainerLayout() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gray-950 text-amber-50 md:flex-row">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-gray-950 to-gray-950" />

      {/* Mobile Top Nav */}
      <DashboardMobileNav
        title="DU Trainer"
        renderSidebar={(onNavigate) => <DashboardSidebar groups={TRAINER_MENU} onNavigate={onNavigate} />}
      />

      {/* Desktop Sidebar */}
      <aside className="relative z-20 mt-4 mb-4 ml-4 hidden h-[calc(100%-2rem)] w-64 flex-shrink-0 flex-col md:flex">
        <DashboardSidebar groups={TRAINER_MENU} />
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="scrollbar-metallic flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 pt-4 md:p-8 md:pt-8">
            <Outlet />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  )
}
