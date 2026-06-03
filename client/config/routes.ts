const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: '@/pages/login'
  },
  {
    path: '/register',
    component: '@/pages/register'
  },
  {
    path: '/forgot-password',
    component: '@/pages/forgot-password'
  },
  {
    path: '/reset-password',
    component: '@/pages/reset-password'
  },
  {
    path: '/student',
    component: '@/layouts/AppLayout',
    wrappers: ['@/wrappers/StudentGuard'],
    routes: [
      { path: '', redirect: 'devices' },
      { path: 'devices', component: '@/pages/student/devices' },
      { path: 'borrow', component: '@/pages/student/borrow' },
      { path: 'notifications', component: '@/pages/student/notifications' },
      { path: 'profile', component: '@/pages/student/profile' },
      { path: 'requests', component: '@/pages/student/requests' },
      { path: 'trust-rules', component: '@/pages/student/trust-rules' }
    ]
  },
  {
    path: '/admin',
    component: '@/layouts/AppLayout',
    wrappers: ['@/wrappers/AdminGuard'],
    routes: [
      { path: '', redirect: 'dashboard' },
      { path: 'dashboard', component: '@/pages/admin/dashboard' },
      { path: 'requests', component: '@/pages/admin/requests' },
      { path: 'devices', component: '@/pages/admin/devices' },
      { path: 'categories', component: '@/pages/admin/categories' },
      { path: 'students', component: '@/pages/admin/students' },
      { path: 'returns', component: '@/pages/admin/returns' },
      { path: 'statistics', component: '@/pages/admin/statistics' },
      { path: 'alerts', component: '@/pages/admin/alerts' },
      { path: 'trust-rules', component: '@/pages/admin/trust-rules' }
    ]
  },
  {
    path: '*',
    component: '@/pages/404'
  }
];

export default routes;
