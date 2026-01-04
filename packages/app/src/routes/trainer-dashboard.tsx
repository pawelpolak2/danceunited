import { redirect } from 'react-router'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/trainer-dashboard'

// biome-ignore lint/correctness/noEmptyPattern: this is boilerplate code!
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Trainer Dashboard - Dance United' },
    { name: 'description', content: 'Trainer dashboard and class management' },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  // Only trainers can access this dashboard
  if (user.role !== 'TRAINER') {
    return redirect('/')
  }

  // Fetch trainer's classes and schedule
  // This will be implemented in the next step
  return { user }
}

export default function TrainerDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <ShinyText as="h1" variant="title" className="mb-2 text-4xl">
            trainer dashboard
          </ShinyText>
          <ShinyText variant="body" className="text-lg opacity-80">
            manage your classes and schedule
          </ShinyText>
        </div>

        <div className="rounded-lg border border-amber-900/20 bg-gray-900/30 p-4">
          <DashboardCalendar />
        </div>
      </div>
    </div>
  )
}
