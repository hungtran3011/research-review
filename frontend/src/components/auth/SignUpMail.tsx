import React from 'react';
import { 
  Input, Button, Text, Spinner, Link 
} from '@fluentui/react-components';
import { ArrowRightRegular, Mail16Regular, Mail48Color } from '@fluentui/react-icons';
import { makeStyles } from '@fluentui/react-components';
import { useSignUp } from '../../hooks/useAuth';
import { useBasicToast } from '../../hooks/useBasicToast';
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

  links: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  }
});

function SignUpMail() {
  const classes = useStyles();
  const [email, setEmail] = React.useState('');
  const { mutate: signUp, isPending, error } = useSignUp();
  const { error: showErrorToast } = useBasicToast();

  document.title = "Đăng ký tài khoản - Research Review";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      signUp(email);
    }
  };

  React.useEffect(() => {
    if (error) {
      const errorMessage = getErrorMessage(error as AxiosError);
      showErrorToast('Đăng ký thất bại', errorMessage);
    }
  }, [error, showErrorToast]);

  const getErrorMessage = (err: AxiosError | null) => {
    if (!err || !err.response?.data) return 'Có lỗi xảy ra. Vui lòng thử lại.';

    const { code, message } = err.response.data as { code?: number; message?: string };
    switch (code) {
      case AuthBusinessCode.USER_ALREADY_EXISTS:
        return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.';
      case AuthBusinessCode.EMAIL_VERIFIED:
        return 'Email này đã được xác thực. Vui lòng đăng nhập.';
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
        <Text as="h1" weight="bold" className={classes.h1Title}>Đăng ký với email</Text>
        <Text align="center">Nhập email để bắt đầu đăng ký thông tin nộp bài báo</Text>
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
      <div className={classes.links}>
        <Text size={300}>Đã có tài khoản?</Text>
        <Link href="/signin">Đăng nhập ngay</Link>
      </div>
    </div>
  );
}

export default SignUpMail;