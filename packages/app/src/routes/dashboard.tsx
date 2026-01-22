import { redirect } from 'react-router'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dashboard'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Dashboard Redirect - Dance United' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  switch (user.role) {
    case 'TRAINER':
      return redirect('/trainer/dashboard')
    case 'MANAGER':
      return redirect('/admin/dashboard')
    case 'DANCER':
      return redirect('/dancer/dashboard')
    default:
      return redirect('/')
  }
}

export default function DashboardPage() {
  return null
}
