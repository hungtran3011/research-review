import React from 'react'
import { CheckCircleOutlined } from '@ant-design/icons';
import { Typography, theme as antdTheme } from 'antd'
import { useLocation, Navigate, useNavigate } from 'react-router'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'

const { Text, Title } = Typography;

function VerifySuccess() {
  const { t } = useTranslation('common')
  const { token } = antdTheme.useToken()
  const location = useLocation();
  const navigate = useNavigate();
  const fromVerify = location.state?.fromVerify;
  const { isSignUp, inviteToken } = useAuthStore();

  document.title = isSignUp 
    ? `${t('verifySuccess.signUpTitle')} - Research Review`
    : `${t('verifySuccess.signInTitle')} - Research Review`

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
      minHeight: 'calc(100vh - 64px)',
      padding: '24px 16px',
      background: token.colorBgLayout,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '12px',
        padding: '28px 24px',
        borderRadius: '12px',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
      }}>
        <CheckCircleOutlined style={{ fontSize: '48px', color: token.colorSuccess }} />
        <Title level={2} style={{ margin: 0, color: token.colorText }}>
          {isSignUp ? t('verifySuccess.signUpTitle') : t('verifySuccess.signInTitle')}
        </Title>
        <Text style={{ color: token.colorTextSecondary }}>
          {isSignUp
            ? t('verifySuccess.signUpRedirect')
            : t('verifySuccess.signInRedirect')}
        </Text>
      </div>
    </div>
  )
}

export default VerifySuccess