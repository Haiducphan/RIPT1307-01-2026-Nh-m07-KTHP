import { Navigate } from '@umijs/max';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!currentUser) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to={ROUTES.studentDevices} replace />;
  }

  return <>{children}</>;
}
