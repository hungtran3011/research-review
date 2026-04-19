import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { Spin, theme as antdTheme } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useCurrentUser } from '../../hooks/useUser';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({ allowedRoles = [], children, redirectTo = '/signin' }: ProtectedRouteProps) => {
  const { t } = useTranslation('common');
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, isError } = useCurrentUser(isAuthenticated);
  const { token } = antdTheme.useToken();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '48px 16px', 
        minHeight: '100vh',
        background: token.colorBgLayout, 
      }}>
        <Spin tip={t('route.checkingAccess')} />
      </div>
    );
  }

  if (isError) {
    return <Navigate to={redirectTo} replace />;
  }

  const currentRoles = data?.data?.globalRole ? [data.data.globalRole] : [];
  if (allowedRoles.length > 0 && !allowedRoles.some((r) => currentRoles.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
