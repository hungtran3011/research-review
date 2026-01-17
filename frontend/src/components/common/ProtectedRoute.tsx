import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { Spinner, makeStyles } from '@fluentui/react-components';
import { useAuthStore } from '../../stores/authStore';
import { useCurrentUser } from '../../hooks/useUser';

const useStyles = makeStyles({
  loadingWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px 16px',
  },
});

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({ allowedRoles = [], children, redirectTo = '/signin' }: ProtectedRouteProps) => {
  const classes = useStyles();
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, isError } = useCurrentUser(isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (isLoading) {
    return (
      <div className={classes.loadingWrapper}>
        <Spinner label="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  if (isError) {
    return <Navigate to={redirectTo} replace />;
  }

  const currentRoles = data?.data?.roles?.length
    ? data.data.roles
    : data?.data?.role
      ? [data.data.role]
      : [];
  if (allowedRoles.length > 0 && !allowedRoles.some((r) => currentRoles.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
