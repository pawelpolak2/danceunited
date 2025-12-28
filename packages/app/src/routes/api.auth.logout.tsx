import { redirect } from 'react-router'
import { createLogoutCookie } from '../lib/auth.server'
import type { Route } from './+types/api.auth.logout'

// biome-ignore lint/correctness/noEmptyPattern: request parameter is not needed for logout
export function action({}: Route.ActionArgs) {
  const logoutCookie = createLogoutCookie()

  return redirect('/login', {
    headers: {
      'Set-Cookie': logoutCookie,
    },
  })
}
