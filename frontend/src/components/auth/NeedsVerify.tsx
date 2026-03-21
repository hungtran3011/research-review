import React from 'react';
import { Button, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useResendMagicLink } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { useResendTimer } from '../../hooks/useResendTimer';

const { Title, Text, Link } = Typography;

function NeedsVerify() {
  const email = useAuthStore((state) => state.email);
  const isSignUp = useAuthStore((state) => state.isSignUp);
  const { mutate: resendMagicLink, isPending, isSuccess, isError } = useResendMagicLink();
  
  // Use new timer hook with 60-second cooldown and localStorage persistence
  const { canResend, secondsRemaining, markResent, formatTime } = useResendTimer({
     email: email || null,
    cooldownSeconds: 60,
  });

  document.title = "Xác thực email - Research Review";

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
        <Title level={1}>Kiểm tra email của bạn</Title>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        <Text>
          Chúng tôi đã gửi một liên kết xác thực đến <strong>{email}</strong>
        </Text>
        <Text type="secondary">
          Nhấp vào liên kết trong email để hoàn tất {isSignUp ? 'đăng ký' : 'đăng nhập'}
        </Text>
      </div>
      {isSuccess && (
        <Text style={{ color: '#52c41a' }}>
          ✓ Email xác thực mới đã được gửi thành công!
        </Text>
      )}
      {isError && (
        <Text style={{ color: '#ff4d4f' }}>
          ✗ Không thể gửi email. Vui lòng thử lại sau.
        </Text>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Text>Không nhận được email? </Text>
        {!canResend ? (
          <Text type="secondary">Gửi lại sau {formatTime(secondsRemaining)}</Text>
        ) : (
          <Button
            type="link"
            onClick={handleResend}
            loading={isPending}
            disabled={isPending}
            style={{ padding: 0, height: 'auto' }}
          >
            Gửi lại
          </Button>
        )}
      </div>
      <Link href={isSignUp ? "/signup" : "/signin"}>Quay lại</Link>
    </div>
  );
}

export default NeedsVerify;