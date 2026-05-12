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
    path: '/student',
    component: '@/layouts/AppLayout',
    wrappers: ['@/wrappers/StudentGuard'],
    routes: [
      { path: '/student', redirect: '/student/devices' },
      { path: '/student/devices', component: '@/pages/student/devices' },
      { path: '/student/borrow', component: '@/pages/student/borrow' },
      { path: '/student/requests', component: '@/pages/student/requests' }
    ]
  },
  {
    path: '/admin',
    component: '@/layouts/AppLayout',
    wrappers: ['@/wrappers/AdminGuard'],
    routes: [
      { path: '/admin', redirect: '/admin/requests' },
      { path: '/admin/requests', component: '@/pages/admin/requests' },
      { path: '/admin/devices', component: '@/pages/admin/devices' },
      { path: '/admin/returns', component: '@/pages/admin/returns' },
      { path: '/admin/statistics', component: '@/pages/admin/statistics' }
    ]
  },
  {
    path: '*',
    component: '@/pages/404'
  }
];

export default routes;
