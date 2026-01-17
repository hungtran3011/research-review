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
import ReviewerInvite from './components/auth/ReviewerInvite.tsx'
import { QueryProvider } from './providers/QueryProvider.tsx'
import Info from './components/user/Info.tsx'
import Profile from './components/user/Profile.tsx'
import Nav from './components/common/Nav.tsx'
import HelpCenter from './components/common/HelpCenter.tsx'
import { ThemeProvider } from './providers/ThemeProvider.tsx'
import AuthBootstrap from './providers/AuthBootstrap.tsx'
import SubmitArticle from './components/article/SubmitArticle.tsx'
import ArticleWorkspace from './components/article/ArticleWorkspace.tsx'
import ProtectedRoute from './components/common/ProtectedRoute.tsx'
import Unauthorized from './components/common/Unauthorized.tsx'
import UserManagement from './components/admin/UserManagement.tsx'
import TrackManagement from './components/admin/TrackManagement.tsx'
import InstitutionManagement from './components/admin/InstitutionManagement.tsx'
import AdminLayout from './components/admin/AdminLayout.tsx'
import PublicOnlyRoute from './components/common/PublicOnlyRoute.tsx'


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
          <Route path="/signup" element={<PublicOnlyRoute><SignUpMail /></PublicOnlyRoute>} />
          <Route path="/signin" element={<PublicOnlyRoute><SignInMail /></PublicOnlyRoute>} />
          <Route path="/reviewer-invite" element={<ReviewerInvite />} />
          <Route path="/needs-verify" element={<PublicOnlyRoute><NeedsVerify /></PublicOnlyRoute>} />
          <Route path="/verify" element={<PublicOnlyRoute><VerifyToken /></PublicOnlyRoute>} />
          <Route path="/verify-success" element={<PublicOnlyRoute><VerifySucess /></PublicOnlyRoute>} />
          <Route path="/verify-failed" element={<PublicOnlyRoute><VerifyFail /></PublicOnlyRoute>} />
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
              <ProtectedRoute allowedRoles={['RESEARCHER']}>
                <SubmitArticle />
              </ProtectedRoute>
            }
          />
          <Route
            path='/articles/:articleId'
            element={
              <ProtectedRoute>
                <ArticleWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path='/articles/:articleId/review'
            element={
              <ProtectedRoute>
                <ArticleWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path='/editor/articles/:articleId'
            element={
              <ProtectedRoute>
                <ArticleWorkspace />
              </ProtectedRoute>
            }
          />
          <Route path='/help' element={<HelpCenter />} />
          <Route
            path='/admin'
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path='users' element={<UserManagement />} />
            <Route path='tracks' element={<TrackManagement />} />
            <Route path='institutions' element={<InstitutionManagement />} />
          </Route>
          <Route path='/unauthorized' element={<Unauthorized />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </QueryProvider>
  // </StrictMode>,
)
