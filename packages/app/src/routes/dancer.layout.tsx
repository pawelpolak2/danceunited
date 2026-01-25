import { Calendar, LayoutDashboard, LogOut, Package, Settings } from 'lucide-react'
import { Form, Link, Outlet, redirect, useLocation } from 'react-router'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dancer.layout'

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  if (user.role !== 'DANCER') {
    return redirect('/')
  }

  return { user }
}

export default function DancerLayout() {
  const location = useLocation()

  const menuGroups = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/dancer/dashboard', icon: LayoutDashboard },
        { label: 'Schedule', path: '/dancer/schedule', icon: Calendar },
        { label: 'My packages', path: '/dancer/my-packages', icon: Package },
        { label: 'Buy packages', path: '/dancer/packages', icon: Package },
      ],
    },
  ]

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-gray-950 text-amber-50">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-gray-950 to-gray-950" />

      {/* Sidebar */}
      <aside className="relative z-20 mt-4 mb-4 ml-4 flex h-[calc(100%-2rem)] w-64 flex-shrink-0 flex-col">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-amber-900/30 bg-gray-900/40 shadow-2xl shadow-black/50 backdrop-blur-md">
          {/* Sidebar Header */}
          <div className="flex h-20 items-center justify-center border-amber-900/30 border-b bg-gray-900/50 px-6">
            <ShinyText
              as="span"
              variant="title"
              className="glow-sm font-bold text-amber-500 text-xl uppercase tracking-[0.2em]"
            >
              Dancer
            </ShinyText>
          </div>

          {/* Sidebar Navigation */}
          <nav className="scrollbar-thin scrollbar-thumb-amber-900/20 scrollbar-track-transparent flex-1 space-y-6 overflow-y-auto px-4 py-6">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-3 px-3 font-bold font-sans text-[10px] text-gray-500 uppercase tracking-widest opacity-70">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isActive = location.pathname.startsWith(item.path)
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 font-medium text-sm transition-all duration-300 ${
                          isActive
                            ? 'border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]'
                            : 'border border-transparent text-gray-400 hover:border-amber-500/10 hover:bg-white/5 hover:text-amber-200'
                        }
                                                `}
                      >
                        <Icon
                          className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110 text-amber-400' : 'text-gray-500 group-hover:scale-105 group-hover:text-amber-300'}`}
                        />
                        <span className="relative z-10">{item.label}</span>

                        {/* Sparkles - Visible on Active or Hover */}
                        <div
                          className={`pointer-events-none absolute inset-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-500`}
                        >
                          <div className="spark-particle spark-particle-1" />
                          <div className="spark-particle spark-particle-2" />
                          <div className="spark-particle spark-particle-3" />
                          <div className="spark-particle spark-particle-4" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-amber-900/30 border-t bg-gray-900/50 p-2">
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 font-medium text-gray-400 text-sm transition-colors hover:border-amber-500/10 hover:bg-white/5 hover:text-amber-100"
            >
              <Settings className="h-4 w-4 text-gray-500 group-hover:text-amber-300" />
              Profile Settings
            </Link>
            <Form method="post" action="/api/auth/logout">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 font-medium text-gray-400 text-sm transition-colors hover:border-red-500/10 hover:bg-red-500/5 hover:text-red-200"
              >
                <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-300" />
                Logout
              </button>
            </Form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="scrollbar-metallic flex-1 overflow-y-auto scroll-smooth p-4 pt-24 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
