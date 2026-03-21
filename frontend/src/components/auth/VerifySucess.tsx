import React from 'react'
import { CheckCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd'
import { useLocation, Navigate, useNavigate } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

const { Text, Title } = Typography;

function VerifySuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromVerify = location.state?.fromVerify;
  const { isSignUp, inviteToken } = useAuthStore();

  document.title = isSignUp 
    ? "Xác thực email thành công - Research Review"
    : "Đăng nhập thành công - Research Review"

  // Redirect to appropriate page after 5 seconds
  React.useEffect(() => {
    if (!fromVerify) return

    const timer = setTimeout(() => {
      if (isSignUp) {
        // Sign up flow: go to info page to complete profile
        navigate('/info')
      } else {
        // Sign in flow: if coming from reviewer invite, continue the flow
        if (inviteToken) {
          navigate(`/reviewer-invite?token=${encodeURIComponent(inviteToken)}`)
        } else {
          navigate('/')
        }
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate, fromVerify, isSignUp])

  // Redirect if not from verify flow
  if (!fromVerify) {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      height: '100%',
      flexGrow: 1,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '8px',
      }}>
        <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
        <Title level={2}>
          {isSignUp ? 'Xác thực email thành công' : 'Đăng nhập thành công'}
        </Title>
      </div>
      <Text>
        {isSignUp 
          ? 'Bạn sẽ tiếp tục đến với bước điền thông tin cá nhân sau 5 giây...'
          : 'Bạn sẽ được chuyển đến trang chủ sau 5 giây...'}
      </Text>
    </div>
  )
}

export default VerifySuccess