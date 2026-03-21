import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="403"
        title="Bạn không có quyền truy cập"
        subTitle="Vui lòng liên hệ quản trị viên nếu bạn nghĩ rằng đây là nhầm lẫn."
        extra={<Button type="primary" onClick={() => navigate('/')}>Quay lại trang chủ</Button>}
      />
    </div>
  );
};

export default Unauthorized;
