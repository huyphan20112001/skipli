import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.tsx'
import AuthRoute from './components/routes/auth-route.tsx'
import ProtectedRoute from './components/routes/protected-route.tsx'
import { STORAGE_KEY_THEME } from './constants/common.ts'
import { PATHNAME } from './constants/pathname.ts'
import { ThemeProvider } from './contexts/theme-provider.tsx'
import './index.css'
import { queryClient } from './lib/query-client.ts'
import AccountSetup from './pages/account-setup.tsx'
import EmailLogin from './pages/email-login.tsx'
import EmailVerification from './pages/email-verification.tsx'
import LoginPage from './pages/login.tsx'
import ManageEmployees from './pages/manage-employees.tsx'
import ManageTasks from './pages/manage-tasks.tsx'
import Messages from './pages/messages.tsx'
import NotFoundPage from './pages/notfound.tsx'
import { PhoneVerification } from './pages/phone-verification.tsx'

const router = createBrowserRouter([
  {
    element: (
      <ThemeProvider defaultTheme="dark" storageKey={STORAGE_KEY_THEME}>
        <Toaster richColors dir="ltr" position="top-right" />
        <App />
      </ThemeProvider>
    ),
    children: [
      // auth route
      {
        path: PATHNAME.LOGIN,
        element: (
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        ),
      },
      {
        path: PATHNAME.PHONE_VERIFICATION,
        element: (
          <AuthRoute>
            <PhoneVerification />
          </AuthRoute>
        ),
      },
      {
        path: PATHNAME.ACCOUNT_SETUP,
        element: (
          <AuthRoute>
            <AccountSetup />
          </AuthRoute>
        ),
      },
      {
        path: PATHNAME.EMAIL_LOGIN,
        element: (
          <AuthRoute>
            <EmailLogin />
          </AuthRoute>
        ),
      },
      {
        path: PATHNAME.EMAIL_VERIFICATION,
        element: (
          <AuthRoute>
            <EmailVerification />
          </AuthRoute>
        ),
      },
      // protected route
      {
        path: PATHNAME.DASHBOARD,
        element: (
          <ProtectedRoute>
            <Navigate to={PATHNAME.MANAGE_EMPLOYEES} replace />
          </ProtectedRoute>
        ),
      },
      {
        path: PATHNAME.MANAGE_EMPLOYEES,
        element: (
          <ProtectedRoute>
            <ManageEmployees />
          </ProtectedRoute>
        ),
      },
      {
        path: PATHNAME.MANAGE_TASKS,
        element: (
          <ProtectedRoute>
            <ManageTasks />
          </ProtectedRoute>
        ),
      },
      {
        path: PATHNAME.MESSAGES,
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      {
        path: PATHNAME.HOME,
        element: <Navigate to={PATHNAME.DASHBOARD} replace />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
