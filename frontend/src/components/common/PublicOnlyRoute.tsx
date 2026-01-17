import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { Spinner, makeStyles } from '@fluentui/react-components';
import { useAuthStore } from '../../stores/authStore';

const useStyles = makeStyles({
  loadingWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px 16px',
  },
});

interface PublicOnlyRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Prevent authenticated users from visiting public auth pages.
 * While bootstrap is running, show a spinner to avoid flicker.
 */
const PublicOnlyRoute = ({ children, redirectTo = '/' }: PublicOnlyRouteProps) => {
  const classes = useStyles();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasBootstrapped = useAuthStore((s) => s.hasBootstrapped);

  // If authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If not authenticated and bootstrapping, show spinner
  // If not authenticated and already bootstrapped, show children (auth page)
  if (!hasBootstrapped) {
    return (
      <div className={classes.loadingWrapper}>
        <Spinner label="Đang khôi phục phiên đăng nhập..." />
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
