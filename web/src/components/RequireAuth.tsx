import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import type { PropsWithChildren } from 'react'

export default function RequireAuth({ children }: PropsWithChildren) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!token || !user) {
    const from = location.pathname + location.search + location.hash
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />
  }

  return children
}

