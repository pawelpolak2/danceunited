import { redirect } from 'react-router'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dashboard'

// biome-ignore lint/correctness/noEmptyPattern: this is boilerplate code!
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dashboard - Dance United' },
    { name: 'description', content: 'Your dance class dashboard and schedule' },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  // Only dancers can access this dashboard for now
  if (user.role !== 'DANCER') {
    return redirect('/')
  }

  // Fetch user's classes and available classes
  // This will be implemented in the next step
  return { user }
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <ShinyText as="h1" variant="title" className="mb-2 text-4xl">
            my dashboard
          </ShinyText>
          <ShinyText variant="body" className="text-lg opacity-80">
            view and manage your dance classes
          </ShinyText>
        </div>

        <div className="rounded-lg border border-amber-900/20 bg-gray-900/30 p-4">
          <DashboardCalendar />
        </div>
      </div>
    </div>
  )
}
