import React from 'react';
import { useSearchParams, Navigate } from 'react-router';
import { Spinner, Text, makeStyles } from '@fluentui/react-components';
import { useVerifyToken } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap: '16px',
    height: '100%',
    flexGrow: 1,
  },

  titleRegion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '4px',
  }
});

function VerifyToken() {
  const classes = useStyles();
  const [searchParams] = useSearchParams();
  const email = useAuthStore((state) => state.email);
  const isSignUp = useAuthStore((state) => state.isSignUp);
  const { mutate: verifyToken } = useVerifyToken();
  const [hasVerified, setHasVerified] = React.useState(false);

  document.title = "Đang xác thực - Research Review";

  React.useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const isSignUpParam = searchParams.get('isSignUp') !== 'false';

    const emailToUse = emailParam || email;

    if (token && emailToUse && !hasVerified) {
      setHasVerified(true);
      verifyToken({ email: emailToUse, token, isSignUp: isSignUpParam || isSignUp });
    }
  }, [searchParams, email, isSignUp, verifyToken, hasVerified]);

  // If no token in URL, redirect to auth
  if (!searchParams.get('token')) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className={classes.root}>
      <div className={classes.titleRegion}>
        <Spinner size="large" />
        <Text>Đang xác thực email của bạn...</Text>
      </div>
    </div>
  );
}

export default VerifyToken;
