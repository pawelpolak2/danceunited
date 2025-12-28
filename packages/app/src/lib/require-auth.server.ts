import { redirect } from 'react-router'
import { getCurrentUser } from './auth.server'

/**
 * Require authentication for a route
 * Redirects to login if not authenticated
 */
export async function requireAuth(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) {
    throw redirect('/login')
  }
  return user
}
