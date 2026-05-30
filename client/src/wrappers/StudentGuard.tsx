import { Navigate, Outlet } from 'umi';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

export default function StudentGuard() {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (currentUser.role !== 'student') {
    return <Navigate to={ROUTES.adminRequests} replace />;
  }

  return <Outlet />;
}
