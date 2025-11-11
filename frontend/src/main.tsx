// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import SignUpMail from './components/auth/SignUpMail.tsx'
import SignInMail from './components/auth/SignInMail.tsx'
import NeedsVerify from './components/auth/NeedsVerify.tsx'
import VerifySucess from './components/auth/VerifySucess.tsx'
import VerifyFail from './components/auth/VerifyFailed.tsx'
import VerifyToken from './components/auth/VerifyToken.tsx'
import { QueryProvider } from './providers/QueryProvider.tsx'
import Info from './components/user/Info.tsx'
import Profile from './components/user/Profile.tsx'
import Nav from './components/common/Nav.tsx'
import { ThemeProvider } from './providers/ThemeProvider.tsx'


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <QueryProvider>
    <ThemeProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/signup" element={<SignUpMail />} />
          <Route path="/signin" element={<SignInMail />} />
          <Route path="/needs-verify" element={<NeedsVerify />} />
          <Route path="/verify" element={<VerifyToken />} />
          <Route path="/verify-success" element={<VerifySucess />} />
          <Route path="/verify-failed" element={<VerifyFail />} />
          <Route path='/info' element={<Info />} />
          <Route path='/profile' element={<Profile />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </QueryProvider>
  // </StrictMode>,
)
