import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import type { UserRole } from '@/types/database'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <Spinner label="Verificando sessão" />
  }

  if (!user || !profile?.is_active) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}
