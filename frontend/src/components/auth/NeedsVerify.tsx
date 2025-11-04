import React from 'react';
import { Text, Button, Spinner, Link } from '@fluentui/react-components';
import { Mail48Color } from '@fluentui/react-icons';
import { makeStyles } from '@fluentui/react-components';
import { useResendMagicLink } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { EmailBusinessCode } from '../../constants/business-code';

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
    alignSelf: 'center',
    padding: '0 16px',
  },

  titleRegion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
  },

  mainText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },

  successText: {
    color: 'var(--colorPaletteGreenForeground1)',
  },

  errorText: {
    color: 'var(--colorPaletteRedForeground1)',
  }
});

function NeedsVerify() {
  const classes = useStyles();
  const [timer, setTimer] = React.useState(30);
  const email = useAuthStore((state) => state.email);
  const isSignUp = useAuthStore((state) => state.isSignUp);
  const { mutate: resendMagicLink, isPending, data, error } = useResendMagicLink();

  document.title = "Xác thực email - Research Review";

  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  React.useEffect(() => {
    if (data?.code === EmailBusinessCode.EMAIL_SENT_SUCCESSFULLY) {
      setTimer(30);
    }
  }, [data]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (email && !isPending && timer === 0) {
      resendMagicLink({ email, isSignUp });
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.titleRegion}>
        <Mail48Color />
        <Text as="h1" weight="bold" size={500}>Kiểm tra email của bạn</Text>
      </div>
      <div className={classes.mainText}>
        <Text size={400} align="center">
          Chúng tôi đã gửi một liên kết xác thực đến <strong>{email}</strong>
        </Text>
        <Text size={300} align="center">
          Nhấp vào liên kết trong email để hoàn tất {isSignUp ? 'đăng ký' : 'đăng nhập'}
        </Text>
      </div>
      {data?.code === EmailBusinessCode.EMAIL_SENT_SUCCESSFULLY && (
        <Text className={classes.successText} size={300}>
          Email xác thực mới đã được gửi thành công!
        </Text>
      )}
      {error && (
        <Text className={classes.errorText} size={300}>
          Không thể gửi email. Vui lòng thử lại sau.
        </Text>
      )}
      <div>
        <Text size={300}>Không nhận được email? </Text>
        {timer > 0 ? (
          <Text size={300}>Gửi lại sau {formatTime(timer)}</Text>
        ) : (
          <Button
            appearance="transparent"
            onClick={handleResend}
            disabled={isPending || timer > 0}
          >
            {isPending ? <Spinner size="tiny" /> : 'Gửi lại'}
          </Button>
        )}
      </div>
      <Link href={isSignUp ? "/signup" : "/signin"}>Quay lại</Link>
    </div>
  );
}

export default NeedsVerify;