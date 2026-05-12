import { Navigate } from '@umijs/max';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

interface StudentGuardProps {
  children: ReactNode;
}

export default function StudentGuard({ children }: StudentGuardProps) {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (currentUser.role !== 'student') {
    return <Navigate to={ROUTES.adminRequests} replace />;
  }

  return <>{children}</>;
}
