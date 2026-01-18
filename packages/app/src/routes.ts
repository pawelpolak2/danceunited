import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('register', 'routes/register.tsx'),
  route('dashboard', 'routes/dashboard.tsx'),
  route('trainer-dashboard', 'routes/trainer-dashboard.tsx'),
  route('profile', 'routes/profile.tsx'),

  // Admin Routes
  layout('routes/admin.layout.tsx', [
    route('admin/dashboard', 'routes/manager-dashboard.tsx', { id: 'admin-dashboard' }), // Reuse existing dashboard
    route('admin/users', 'routes/admin.users.tsx'),
    route('admin/schedule', 'routes/admin.schedule.tsx'),
    route('admin/analytics', 'routes/admin.analytics.tsx'),
    route('/admin/configuration', 'routes/admin.configuration.tsx'),
  ]),

  // Resource Routes
  route('resources/gallery/:category/:filename', 'routes/resources.gallery.$category.$filename.ts'),

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
