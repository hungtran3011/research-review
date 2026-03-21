import React from 'react';
import { Input, Button, Typography, Spin } from 'antd';
import { ArrowRightOutlined, MailOutlined } from '@ant-design/icons';
import { useSignUp } from '../../hooks/useAuth';
import { getApiErrorMessage, useBasicToast } from '../../hooks/useBasicToast';
import { useAuthStore } from '../../stores/authStore';
import { useDeviceFingerprint } from '../../hooks/useDeviceFingerprint';

const { Title, Text, Link } = Typography;

function SignUpMail() {
  const [email, setEmail] = React.useState('');
  const storedEmail = useAuthStore((state) => state.email);
  const { mutate: signUp, isPending, error } = useSignUp();
  const { error: showErrorToast } = useBasicToast();
  const { fingerprint, isLoading: isFingerprintLoading, error: fingerprintError } = useDeviceFingerprint();

  document.title = "Đăng ký tài khoản - Research Review";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && fingerprint) {
      signUp({ email, deviceFingerprint: fingerprint });
    } else if (email && fingerprintError) {
      // Graceful degradation: allow signup without fingerprint if generation failed
      console.warn('[SignUpMail] Proceeding without fingerprint due to error');
      signUp({ email, deviceFingerprint: undefined });
    }
  };

  React.useEffect(() => {
    if (error) {
      showErrorToast(getApiErrorMessage(error, 'Có lỗi xảy ra. Vui lòng thử lại.'));
    }
  }, [error, showErrorToast]);

  React.useEffect(() => {
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [storedEmail]);

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
        <Title level={1}>Đăng ký với email</Title>
        <Text>Nhập email để bắt đầu đăng ký thông tin nộp bài báo</Text>
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
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        <Text>Đã có tài khoản?</Text>
        <Link href="/signin">Đăng nhập ngay</Link>
      </div>
    </div>
  );
}

export default SignUpMail;