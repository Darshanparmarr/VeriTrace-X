import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Spinner } from '@/components/ui/states'

/** Gate app routes behind authentication. */
export function ProtectedRoute({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Spinner className="size-6" />
      </div>
    )
  }
  if (status === 'guest') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}
