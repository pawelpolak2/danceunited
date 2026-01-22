import { redirect } from 'react-router'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/trainer-dashboard'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'Trainer Dashboard - Dance United' }, { name: 'description', content: 'Redirecting...' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  // Clean redirect to new structure
  if (user.role === 'TRAINER') {
    return redirect('/trainer/dashboard')
  }

  return redirect('/')
}

export default function TrainerDashboardRedirect() {
  return null
}
