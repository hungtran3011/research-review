import React from 'react';
import { Input, Button, Typography, Spin } from 'antd';
import { ArrowRightOutlined, MailOutlined } from '@ant-design/icons';
import { useSignIn } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../hooks/useBasicToast';
import { useAuthStore } from '../../stores/authStore';
import { useDeviceFingerprint } from '../../hooks/useDeviceFingerprint';
import { useTranslation } from 'react-i18next';
import { theme as antdTheme } from 'antd';

const { Title, Text, Link } = Typography;

function SignInMail() {
  const { t } = useTranslation('common');
  const { token } = antdTheme.useToken();
  const [email, setEmail] = React.useState('');
  const storedEmail = useAuthStore((state) => state.email);
  const { mutate: signIn, isPending, error } = useSignIn();
  const { fingerprint, isLoading: isFingerprintLoading, error: fingerprintError } = useDeviceFingerprint();

  document.title = `${t('signIn.title')} - Research Review`;

  React.useEffect(() => {
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [storedEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && fingerprint) {
      signIn({ email, deviceFingerprint: fingerprint });
    } else if (email && fingerprintError) {
      // Graceful degradation: allow signin without fingerprint if generation failed
      console.warn('[SignInMail] Proceeding without fingerprint due to error');
      signIn({ email, deviceFingerprint: undefined });
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
          <Title level={1} style={{ margin: 0, color: token.colorText }}>
            {t('signIn.title')}
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>{t('signIn.subtitle')}</Text>
          {isFingerprintLoading && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <Spin size="small" style={{ marginRight: '8px' }} />
              {t('signIn.checkingDevice')}
            </Text>
          )}
        </div>
        <form style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '4px',
          width: '100%',
          maxWidth: '400px',
        }} onSubmit={handleSubmit}>
          <Input
            placeholder={t('signIn.emailPlaceholder')}
            prefix={<MailOutlined />}
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            required
            style={{ flex: 1 }}
          />
          <Button
            type='primary'
            icon={<ArrowRightOutlined />}
            htmlType="submit"
            loading={isPending}
            disabled={isPending || isFingerprintLoading}
          />
        </form>
        {error && (
          <Text type='danger'>
            {getApiErrorMessage(error, t('signIn.genericError'))}
          </Text>
        )}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <Text style={{ color: token.colorTextSecondary }}>{t('signIn.noAccount')}</Text>
          <Link href="/signup">{t('signIn.signUpNow')}</Link>
        </div>
      </div>
    </div>
  );
}

export default SignInMail;