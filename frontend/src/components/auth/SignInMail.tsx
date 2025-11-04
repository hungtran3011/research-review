import React from 'react';
import { Input, Button, Text, Spinner, Link } from '@fluentui/react-components';
import { ArrowRightRegular, Mail16Regular, Mail48Color } from '@fluentui/react-icons';
import { makeStyles } from '@fluentui/react-components';
import { useSignIn } from '../../hooks/useAuth';
import { AxiosError } from 'axios';
import { AuthBusinessCode, EmailBusinessCode } from '../../constants/business-code';

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
    padding: '0 16px',
  },

  inputBox: {
    display: 'flex',
    flexDirection: 'row',
    gap: '4px',
    width: '100%',
    maxWidth: '400px',
  },

  h1Title: {
    fontSize: '24px',
  },

  titleRegion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
  },

  errorText: {
    color: 'var(--colorPaletteRedForeground1)',
  },

  successText: {
    color: 'var(--colorPaletteGreenForeground1)',
  },

  links: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  }
});

function SignInMail() {
  const classes = useStyles();
  const [email, setEmail] = React.useState('');
  const { mutate: signIn, isPending, error } = useSignIn();

  document.title = "Đăng nhập - Research Review";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      signIn(email);
    }
  };

  const getErrorMessage = (err: AxiosError | null) => {
    if (!err || !err.response?.data) return 'Có lỗi xảy ra. Vui lòng thử lại.';

    const { code, message } = err.response.data as { code?: number; message?: string };
    switch (code) {
      case AuthBusinessCode.USER_NOT_FOUND:
        return 'Email chưa được đăng ký. Vui lòng đăng ký tài khoản mới.';
      case EmailBusinessCode.EMAIL_SENT_FAIL:
        return 'Không thể gửi email. Vui lòng thử lại sau.';
      default:
        return message || 'Có lỗi xảy ra. Vui lòng thử lại.';
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.titleRegion}>
        <Mail48Color />
        <Text as="h1" weight="bold" className={classes.h1Title}>Đăng nhập với email</Text>
        <Text align="center">Nhập email để nhận liên kết đăng nhập</Text>
      </div>
      <form className={classes.inputBox} onSubmit={handleSubmit}>
        <Input
          placeholder="Email của bạn"
          contentBefore={<Mail16Regular />}
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          required
          style={{ flex: 1 }}
        />
        <Button
          appearance='primary'
          icon={isPending ? <Spinner size="tiny" /> : <ArrowRightRegular />}
          type="submit"
          disabled={isPending}
        />
      </form>
      {error && (
        <Text className={classes.errorText}>
          {getErrorMessage(error as AxiosError)}
        </Text>
      )}
      <div className={classes.links}>
        <Text size={300}>Chưa có tài khoản?</Text>
        <Link href="/signup">Đăng ký ngay</Link>
      </div>
    </div>
  );
}

export default SignInMail;