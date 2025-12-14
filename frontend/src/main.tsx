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
import HelpCenter from './components/common/HelpCenter.tsx'
import { ThemeProvider } from './providers/ThemeProvider.tsx'
import AuthBootstrap from './providers/AuthBootstrap.tsx'
import SubmitArticle from './components/article/SubmitArticle.tsx'
import ReviewArticle from './components/article/ReviewArticle.tsx'
import EditorInitialReview from './components/article/EditorInitialReview.tsx'
import ProtectedRoute from './components/common/ProtectedRoute.tsx'
import Unauthorized from './components/common/Unauthorized.tsx'
import UserManagement from './components/admin/UserManagement.tsx'


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <QueryProvider>
    <ThemeProvider>
      <AuthBootstrap />
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/articles" element={<App />} />
          <Route path="/signup" element={<SignUpMail />} />
          <Route path="/signin" element={<SignInMail />} />
          <Route path="/needs-verify" element={<NeedsVerify />} />
          <Route path="/verify" element={<VerifyToken />} />
          <Route path="/verify-success" element={<VerifySucess />} />
          <Route path="/verify-failed" element={<VerifyFail />} />
          <Route path='/info' element={<Info />} />
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/articles/submit'
            element={
              <ProtectedRoute>
                <SubmitArticle />
              </ProtectedRoute>
            }
          />
          <Route
            path='/articles/:articleId'
            element={
              <ProtectedRoute>
                <ReviewArticle />
              </ProtectedRoute>
            }
          />
          <Route
            path='/editor/articles/:articleId'
            element={
              <ProtectedRoute allowedRoles={['EDITOR']}>
                <EditorInitialReview />
              </ProtectedRoute>
            }
          />
          <Route path='/help' element={<HelpCenter />} />
          <Route
            path='/admin/users'
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route path='/unauthorized' element={<Unauthorized />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </QueryProvider>
  // </StrictMode>,
)
