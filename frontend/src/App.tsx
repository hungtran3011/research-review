import './App.css'
import { Button } from '@fluentui/react-components'
import { makeStyles } from '@fluentui/react-components'

const buttonStyles = makeStyles({
  button: {
    height: '40px',
  }
})

function App() {
  const classes = buttonStyles()
  return (
    <div className='wrapper'>
      <Button appearance="primary" className={classes.button}>Hello</Button>
    </div>
  )
}

export default App
