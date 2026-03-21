import React from 'react';
import { Input, Button, Typography, Spin } from 'antd';
import { ArrowRightOutlined, MailOutlined } from '@ant-design/icons';
import { useSignIn } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../hooks/useBasicToast';
import { useAuthStore } from '../../stores/authStore';
import { useDeviceFingerprint } from '../../hooks/useDeviceFingerprint';

const { Title, Text, Link } = Typography;

function SignInMail() {
  const [email, setEmail] = React.useState('');
  const storedEmail = useAuthStore((state) => state.email);
  const { mutate: signIn, isPending, error } = useSignIn();
  const { fingerprint, isLoading: isFingerprintLoading, error: fingerprintError } = useDeviceFingerprint();

  document.title = "Đăng nhập - Research Review";

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
      gap: '16px',
      height: '100%',
      flexGrow: 1,
      padding: '0 16px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '8px',
      }}>
        <MailOutlined style={{ fontSize: '48px' }} />
        <Title level={1}>Đăng nhập với email</Title>
        <Text>Nhập email để nhận liên kết đăng nhập</Text>
        {isFingerprintLoading && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <Spin size="small" style={{ marginRight: '8px' }} />
            Đang kiểm tra thiết bị...
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
          placeholder="Email của bạn"
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
        <Text style={{ color: '#ff4d4f' }}>
          {getApiErrorMessage(error, 'Có lỗi xảy ra. Vui lòng thử lại.')}
        </Text>
      )}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        <Text>Chưa có tài khoản?</Text>
        <Link href="/signup">Đăng ký ngay</Link>
      </div>
    </div>
  );
}

export default SignInMail;