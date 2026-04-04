import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { Spin, theme as antdTheme } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';

interface PublicOnlyRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Prevent authenticated users from visiting public auth pages.
 * While bootstrap is running, show a spinner to avoid flicker.
 */
const PublicOnlyRoute = ({ children, redirectTo = '/' }: PublicOnlyRouteProps) => {
  const { t } = useTranslation('common');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasBootstrapped = useAuthStore((s) => s.hasBootstrapped);
  const { token } = antdTheme.useToken();

  // If authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If not authenticated and bootstrapping, show spinner
  // If not authenticated and already bootstrapped, show children (auth page)
  if (!hasBootstrapped) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', alignItems: 'center', 
        padding: '48px 16px', minHeight: '50vh',
        background: token.colorBgLayout, 
      }}>
        <Spin tip={t('route.restoringSession')} />
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
