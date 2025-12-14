import { makeStyles, Button, Text } from '@fluentui/react-components';
import { useNavigate } from 'react-router';

const useStyles = makeStyles({
  root: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    padding: '32px',
    textAlign: 'center',
  },
});

const Unauthorized = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  return (
    <div className={classes.root}>
      <Text size={600} weight="semibold">
        Bạn không có quyền truy cập trang này
      </Text>
      <Text size={400}>
        Vui lòng liên hệ quản trị viên nếu bạn nghĩ rằng đây là nhầm lẫn.
      </Text>
      <Button appearance="primary" onClick={() => navigate('/')}>Quay lại trang chủ</Button>
    </div>
  );
};

export default Unauthorized;
