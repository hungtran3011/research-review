import React from 'react'
import {CheckmarkCircle48Color} from '@fluentui/react-icons'
import { makeStyles, Text } from '@fluentui/react-components'
import { useLocation, Navigate, useNavigate } from 'react-router'
import { useAuthStore } from '../../stores/authStore'

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
  },

  inputBox: {
    display: 'flex',
    flexDirection: 'row',
    gap: '4px',
  },

  titleRegion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
  }
})

function VerifySucess() {
  const classes = useStyles()
  const location = useLocation()
  const navigate = useNavigate()
  const fromVerify = location.state?.fromVerify
  const { isSignUp } = useAuthStore()

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
        // Sign in flow: go to home page
        navigate('/')
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate, fromVerify, isSignUp])

  // Redirect if not from verify flow
  if (!fromVerify) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={classes.root}>
      <div className={classes.titleRegion}>
        <CheckmarkCircle48Color />
        <Text as="h1" weight="bold" size={500}>
          {isSignUp ? 'Xác thực email thành công' : 'Đăng nhập thành công'}
        </Text>
      </div>
      <Text size={400}>
        {isSignUp 
          ? 'Bạn sẽ tiếp tục đến với bước điền thông tin cá nhân sau 5 giây...'
          : 'Bạn sẽ được chuyển đến trang chủ sau 5 giây...'}
      </Text>
    </div>
  )
}

export default VerifySucess