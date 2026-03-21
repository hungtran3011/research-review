import React from 'react';
import { useSearchParams, Navigate } from 'react-router';
import { Spin, Typography } from 'antd';
import { useVerifyToken } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { useDeviceFingerprint } from '../../hooks/useDeviceFingerprint';

const { Title } = Typography;

function VerifyToken() {
  const [searchParams] = useSearchParams();
  const email = useAuthStore((state) => state.email);
  const isSignUp = useAuthStore((state) => state.isSignUp);
  const { mutate: verifyToken } = useVerifyToken();
  const [hasVerified, setHasVerified] = React.useState(false);
  const { fingerprint, isLoading: isFingerprintLoading, error: fingerprintError } = useDeviceFingerprint();

  document.title = "Đang xác thực - Research Review";

  React.useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const isSignUpParam = searchParams.get('isSignUp') !== 'false';

    const emailToUse = emailParam || email;

    // Wait for fingerprint to be ready or failed before verifying
    if (token && emailToUse && !hasVerified && !isFingerprintLoading) {
      setHasVerified(true);
      
      if (fingerprint) {
        verifyToken({ 
          email: emailToUse, 
          token, 
          isSignUp: isSignUpParam || isSignUp,
          deviceFingerprint: fingerprint 
        });
      } else if (fingerprintError) {
        // Graceful degradation: proceed without fingerprint if generation failed
        console.warn('[VerifyToken] Proceeding without fingerprint due to error');
        verifyToken({ 
          email: emailToUse, 
          token, 
          isSignUp: isSignUpParam || isSignUp,
          deviceFingerprint: undefined 
        });
      }
    }
  }, [searchParams, email, isSignUp, verifyToken, hasVerified, fingerprint, isFingerprintLoading, fingerprintError]);

  // If no token in URL, redirect to auth
  if (!searchParams.get('token')) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      height: '100%',
      flexGrow: 1,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '4px',
      }}>
        <Spin size="large" />
        <Title level={2}>Đang xác thực email của bạn...</Title>
      </div>
    </div>
  );
}

export default VerifyToken;
