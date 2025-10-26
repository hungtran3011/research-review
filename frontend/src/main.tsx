// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import { BrowserRouter, Route, Routes } from 'react-router'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <FluentProvider theme={webDarkTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  // </StrictMode>,
)
