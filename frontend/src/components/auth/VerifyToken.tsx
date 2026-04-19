import React from 'react';
import { useSearchParams, Navigate } from 'react-router';
import { Spin, Typography, theme as antdTheme } from 'antd';
import { useVerifyToken } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { useDeviceFingerprint } from '../../hooks/useDeviceFingerprint';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

function VerifyToken() {
  const { t } = useTranslation('common')
  const { token } = antdTheme.useToken()
  const [searchParams] = useSearchParams();
  const email = useAuthStore((state) => state.email);
  const isSignUp = useAuthStore((state) => state.isSignUp);
  const setEmail = useAuthStore((state) => state.setEmail);
  const { mutate: verifyToken } = useVerifyToken();
  const [hasVerified, setHasVerified] = React.useState(false);
  const { fingerprint, isLoading: isFingerprintLoading, error: fingerprintError } = useDeviceFingerprint();

  document.title = `${t('verifyToken.pageTitle')} - Research Review`;

  React.useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const isSignUpParam = searchParams.get('isSignUp') !== 'false';

    const emailToUse = emailParam || email;

    if (emailParam && emailParam !== email) {
      setEmail(emailParam);
    }

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
  }, [searchParams, email, isSignUp, setEmail, verifyToken, hasVerified, fingerprint, isFingerprintLoading, fingerprintError]);

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
      minHeight: 'calc(100vh - 64px)',
      padding: '24px 16px',
      background: token.colorBgLayout,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '12px',
        padding: '28px 24px',
        borderRadius: '12px',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
      }}>
        <Spin size="large" />
        <Title level={2} style={{ margin: 0, color: token.colorText }}>{t('verifyToken.title')}</Title>
      </div>
    </div>
  );
}

export default VerifyToken;
