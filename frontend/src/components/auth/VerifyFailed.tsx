import React from 'react'
import {DismissCircle48Color} from '@fluentui/react-icons'
import { Link, makeStyles, Text } from '@fluentui/react-components'

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
  },

  titleRegion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '4px',
  }
})

function VerifyFail() {
  const classes = useStyles()
  document.title = "Xác thực email không thành công - Research Review"
  return (
    <div className={classes.root}>
      <div className={classes.titleRegion}>
        <DismissCircle48Color />
        <Text as="h1" weight="bold" size={500} align="center">Xác thực email không thành công</Text>
      </div>
      <Text size={400} align="center">Token xác thực đã hết hạn. Hãy thực hiện lại bước đăng ký tài khoản <Link href="/signup">tại đây</Link></Text>
    </div>
  )
}

export default VerifyFail