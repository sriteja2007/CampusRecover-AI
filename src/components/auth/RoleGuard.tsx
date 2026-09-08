import React from "react"
import { Navigate } from "react-router"
import { useAuth } from "../../context/AuthContext"
import { UserRole } from "../../types/User"
import { ROLES, ROUTES } from "../../config/constants"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, customUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-500">Loading...</div>
    )
  }

  if (!user || !customUser) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Admins and SuperAdmins have access to all routes automatically
  const hasAccess =
    allowedRoles.includes(customUser.role) ||
    customUser.role === ROLES.SUPERADMIN ||
    customUser.role === ROLES.ADMIN

  if (!hasAccess) {
    return <Navigate to={ROUTES.APP} replace />
  }

  return <>{children}</>
}
