import { PATHNAME } from '@src/constants/pathname'
import { useAuth } from '@src/contexts/auth-context'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import DashboardLoader from '../dashboard-loader'
import MainLayout from '../main-layout'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()
  console.log('🚀 ~ ProtectedRoute ~ isAuthenticated => ', isAuthenticated)
  const location = useLocation()

  if (loading) {
    return <DashboardLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHNAME.LOGIN} state={{ from: location }} replace />
  }

  return <MainLayout>{children}</MainLayout>
}

export default ProtectedRoute
