import React from "react"
import { Navigate } from "react-router"
import { useAuth } from "../../context/AuthContext"
import { ROUTES } from "../../config/constants"

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { user, customUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (user) {
    if (customUser?.role === "admin" || customUser?.role === "superadmin") {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
