import React from 'react'
import {CheckmarkCircle48Color} from '@fluentui/react-icons'
import { makeStyles, Text } from '@fluentui/react-components'
import { useLocation, Navigate, useNavigate } from 'react-router'

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

  document.title = "Xác thực email thành công - Research Review"

  // Redirect to info page after 5 seconds
  React.useEffect(() => {
    if (!fromVerify) return

    const timer = setTimeout(() => {
      navigate('/info')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate, fromVerify])

  // Redirect if not from verify flow
  if (!fromVerify) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={classes.root}>
      <div className={classes.titleRegion}>
        <CheckmarkCircle48Color />
        <Text as="h1" weight="bold" size={500}>Xác thực email thành công</Text>
      </div>
      <Text size={400}>Bạn sẽ tiếp tục đến với bước điền thông tin cá nhân sau 5 giây...</Text>
    </div>
  )
}

export default VerifySucess