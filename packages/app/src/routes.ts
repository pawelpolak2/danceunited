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
    route('admin/configuration/pricing', 'routes/admin.configuration.pricing.tsx'),
    route('admin/configuration/gallery', 'routes/admin.configuration.gallery.tsx'),
    route('admin/configuration/styles', 'routes/admin.configuration.styles.tsx'),
    route('admin/configuration/templates', 'routes/admin.configuration.templates.tsx'),
  ]),

  // Trainer Routes
  layout('routes/trainer.layout.tsx', [
    route('trainer/dashboard', 'routes/trainer.dashboard.tsx'),
    route('trainer/schedule', 'routes/trainer.schedule.tsx'),
    route('trainer/statistics', 'routes/trainer.statistics.tsx'),
  ]),

  // Dancer Routes
  layout('routes/dancer.layout.tsx', [
    route('dancer/dashboard', 'routes/dancer.dashboard.tsx'),
    route('dancer/schedule', 'routes/dancer.schedule.tsx'),
    route('dancer/packages', 'routes/dancer.packages.tsx'),
    route('dancer/my-packages', 'routes/dancer.my-packages.tsx'),
  ]),

  // Resource Routes
  route('resources/gallery/:category/:filename', 'routes/resources.gallery.$category.$filename.ts'),

  route('about', 'routes/about.tsx'),
  route('team', 'routes/team.tsx'),
  route('pricing', 'routes/pricing.tsx'),
  route('schedule', 'routes/schedule.tsx'),
  route('contact', 'routes/contact.tsx'),
  route('gallery', 'routes/gallery.tsx'),
  route('terms', 'routes/terms.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('api/health', 'routes/api.health.tsx'),
  route('api/auth/login', 'routes/api.auth.login.tsx'),
  route('api/auth/register', 'routes/api.auth.register.tsx'),
  route('api/auth/logout', 'routes/api.auth.logout.tsx'),
] satisfies RouteConfig
