import { Link, useLocation, useNavigate } from "react-router"
import { useAuth } from "../../context/AuthContext"
import {
  Home,
  Search,
  Package,
  CheckCircle2,
  Bell,
  User,
  FileWarning,
  Sparkles,
  KeyRound,
  Shield,
  Users,
  LogOut,
  ExternalLink,
  Plus,
} from "lucide-react"
import { LogoMark } from "../ui/Logo"
import { ROLES } from "../../config/constants"

export function Sidebar() {
  const { user, customUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isAdmin =
    customUser?.role === ROLES.ADMIN ||
    customUser?.role === ROLES.SUPERADMIN ||
    user?.email?.toLowerCase() === "admin@gmail.com"

  const userLinks = [
    { label: "Dashboard", path: "/dashboard", icon: Home },
    { label: "Report Lost", path: "/dashboard/report-lost", icon: FileWarning },
    {
      label: "Report Found",
      path: "/dashboard/report-found",
      icon: CheckCircle2,
    },
    { label: "Search Items", path: "/dashboard/lost", icon: Search },
    { label: "My Reports", path: "/dashboard/my-reports", icon: Package },
    { label: "AI Matches", path: "/dashboard/ai-match", icon: Sparkles },
    {
      label: "Handover Verification",
      path: "/dashboard/scan-qr",
      icon: KeyRound,
    },
    { label: "Notifications", path: "/dashboard/notifications", icon: Bell },
    { label: "Profile", path: "/dashboard/profile", icon: User },
  ]

  const adminLinks = [
    { label: "Admin Dashboard", path: "/admin", icon: Home },
    { label: "Items Management", path: "/admin?tab=items", icon: Package },
    { label: "AI Matches", path: "/admin?tab=matches", icon: Sparkles },
    { label: "Manual Matching", path: "/admin?tab=manual_match", icon: Plus },
    { label: "Users Management", path: "/admin?tab=users", icon: Users },
    { label: "Handover Desk", path: "/dashboard/scan-qr", icon: KeyRound },
    { label: "Student Portal View", path: "/dashboard", icon: ExternalLink },
  ]

  const links = isAdmin ? adminLinks : userLinks

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <aside className="w-64 bg-[#131b2e] text-white flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-white/10 shrink-0">
        <LogoMark />
        <div>
          <span className="font-bold tracking-tight block text-sm">
            CampusRecover
          </span>
          <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
            {isAdmin ? "Admin Console" : "Student Portal"}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
        <div className="space-y-1">
          {links.map((link) => {
            const isRoot = link.path === "/dashboard" || link.path === "/admin"
            const active =
              location.pathname === link.path ||
              (!isRoot && location.pathname.startsWith(link.path.split("?")[0]))
            const Icon = link.icon
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-bold ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon
                  size={16}
                  className={active ? "text-white" : "text-gray-400"}
                />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Profile & Logout */}
      <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              {(customUser?.name || user?.displayName || user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-gray-200 block truncate">
                {customUser?.name || user?.displayName || "Student"}
              </span>
              <span className="text-[10px] text-gray-400 block truncate">
                {user?.email || "student@university.edu"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
