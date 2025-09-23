import { Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/auth-context'

function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export default App
