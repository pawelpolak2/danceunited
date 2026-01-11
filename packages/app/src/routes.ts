import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('register', 'routes/register.tsx'),
  route('dashboard', 'routes/dashboard.tsx'),
  route('trainer-dashboard', 'routes/trainer-dashboard.tsx'),
  route('about', 'routes/about.tsx'),
  route('team', 'routes/team.tsx'),
  route('pricing', 'routes/pricing.tsx'),
  route('schedule', 'routes/schedule.tsx'),
  route('contact', 'routes/contact.tsx'),
  route('gallery', 'routes/gallery.tsx'),
  route('api/health', 'routes/api.health.tsx'),
  route('api/auth/login', 'routes/api.auth.login.tsx'),
  route('api/auth/register', 'routes/api.auth.register.tsx'),
  route('api/auth/logout', 'routes/api.auth.logout.tsx'),
] satisfies RouteConfig
