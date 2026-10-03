import React from "react"
import { Navigate, useLocation } from "react-router"
import { useAuth } from "../../context/AuthContext"
import { ROUTES } from "../../config/constants"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Account Status Guard: Block suspended users
  if (customUser && (customUser.status === "SUSPENDED" || customUser.status === "suspended" || (customUser as any).isBanned === true)) {
    return <Navigate to={ROUTES.LOGIN} state={{ suspended: true }} replace />
  }

  return <>{children}</>
}
