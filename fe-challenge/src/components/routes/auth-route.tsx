import { PATHNAME } from '@src/constants/pathname'
import { useAuth } from '@src/contexts/auth-context'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import DashboardLoader from '../dashboard-loader'

const AuthRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <DashboardLoader />
  }
  if (isAuthenticated) {
    return <Navigate to={PATHNAME.DASHBOARD} replace />
  }
  return <>{children}</>
}

export default AuthRoute
