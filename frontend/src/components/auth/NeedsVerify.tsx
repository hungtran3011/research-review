import React from 'react';
import { Button, Typography, theme as antdTheme } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useResendMagicLink } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { useResendTimer } from '../../hooks/useResendTimer';
import { useTranslation } from 'react-i18next';

const { Title, Text, Link } = Typography;

function NeedsVerify() {
  const { t } = useTranslation('common');
  const { token } = antdTheme.useToken();
  const email = useAuthStore((state) => state.email);
  const isSignUp = useAuthStore((state) => state.isSignUp);
  const { mutate: resendMagicLink, isPending, isSuccess, isError } = useResendMagicLink();
  
  // Use new timer hook with 60-second cooldown and localStorage persistence
  const { canResend, secondsRemaining, markResent, formatTime } = useResendTimer({
     email: email || null,
    cooldownSeconds: 60,
  });

  document.title = `${t('needsVerify.pageTitle')} - Research Review`;

  // Start timer after successful resend
  React.useEffect(() => {
    if (isSuccess) {
      markResent();
    }
  }, [isSuccess, markResent]);

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (email && !isPending && canResend) {
      resendMagicLink({ email, isSignUp });
    }
  };

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
        gap: '16px',
        padding: '28px 24px',
        borderRadius: '12px',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '8px',
        }}>
          <MailOutlined style={{ fontSize: '48px', color: token.colorPrimary }} />
          <Title level={1} style={{ margin: 0, color: token.colorText }}>{t('needsVerify.title')}</Title>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'center',
        }}>
          <Text style={{ color: token.colorText }}>
            {t('needsVerify.sentTo')} <strong>{email}</strong>
          </Text>
          <Text type="secondary">
            {t('needsVerify.instruction', { action: isSignUp ? t('needsVerify.signUpAction') : t('needsVerify.signInAction') })}
          </Text>
        </div>
        {isSuccess && (
          <Text type='success'>
            {t('needsVerify.resendSuccess')}
          </Text>
        )}
        {isError && (
          <Text type='danger'>
            {t('needsVerify.resendFailed')}
          </Text>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Text style={{ color: token.colorTextSecondary }}>{t('needsVerify.notReceived')}</Text>
          {!canResend ? (
            <Text type="secondary">{t('needsVerify.resendAfter', { time: formatTime(secondsRemaining) })}</Text>
          ) : (
            <Button
              type="link"
              onClick={handleResend}
              loading={isPending}
              disabled={isPending}
              style={{ padding: 0, height: 'auto' }}
            >
              {t('needsVerify.resend')}
            </Button>
          )}
        </div>
        <Link href={isSignUp ? "/signup" : "/signin"}>{t('needsVerify.back')}</Link>
      </div>
    </div>
  );
}

export default NeedsVerify;