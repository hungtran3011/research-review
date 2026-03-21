import { CloseCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Text, Title, Link } = Typography;

function VerifyFailed() {
  document.title = "Xác thực email không thành công - Research Review";
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
        gap: '4px',
      }}>
        <CloseCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
        <Title level={2}>Xác thực email không thành công</Title>
      </div>
      <Text>Token xác thực đã hết hạn. Hãy thực hiện lại bước đăng ký tài khoản <Link href="/signup">tại đây</Link></Text>
    </div>
  );
}

export default VerifyFailed;