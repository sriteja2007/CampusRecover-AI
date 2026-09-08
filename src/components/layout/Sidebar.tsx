import { Link, useLocation } from "react-router"
import { useAuth } from "../../context/AuthContext"
import {
  Home,
  Search,
  Package,
  CheckCircle2,
  MessageCircle,
  Bell,
  Building2,
  Map,
  User,
  Settings,
  BarChart3,
  FileWarning,
  KeyRound,
  ShieldAlert,
  FileSearch,
  ShieldCheck,
  Users,
  Globe2,
  ScanLine,
} from "lucide-react"
import { LogoMark } from "../ui/Logo"

export function Sidebar() {
  const { user, customUser } = useAuth()
  const location = useLocation()

  const getLinks = () => {
    switch (customUser?.role || "student") {
      case "student":
        return [
          { label: "Dashboard", path: "/dashboard", icon: Home },
          { label: "My Lost Items", path: "/dashboard/lost", icon: FileSearch },
          { label: "My Found Items", path: "/dashboard/found", icon: Package },
          {
            label: "Report Lost",
            path: "/dashboard/report-lost",
            icon: FileWarning,
          },
          {
            label: "Report Found",
            path: "/dashboard/report-found",
            icon: CheckCircle2,
          },
          { label: "AI Matches", path: "/dashboard/ai-match", icon: Search },
          {
            label: "Messages",
            path: "/dashboard/messages",
            icon: MessageCircle,
          },
          {
            label: "Secure Handover",
            path: "/dashboard/scan-qr",
            icon: ScanLine,
          },
          {
            label: "Notifications",
            path: "/dashboard/notifications",
            icon: Bell,
          },
          {
            label: "Campus Offices",
            path: "/dashboard/campus-office",
            icon: Building2,
          },
          { label: "Campus Map", path: "/dashboard/map", icon: Map },
          { label: "Profile", path: "/dashboard/profile", icon: User },
        ]
      case "faculty":
        return [
          { label: "Dashboard", path: "/dashboard", icon: Home },
          {
            label: "Department Items",
            path: "/dashboard/department-items",
            icon: Building2,
          },
          {
            label: "Student Reports",
            path: "/dashboard/student-reports",
            icon: FileSearch,
          },
          {
            label: "Secure Handover",
            path: "/dashboard/scan-qr",
            icon: ScanLine,
          },
          { label: "AI Matches", path: "/dashboard/ai-match", icon: Search },
          {
            label: "Messages",
            path: "/dashboard/messages",
            icon: MessageCircle,
          },
          {
            label: "Notifications",
            path: "/dashboard/notifications",
            icon: Bell,
          },
          { label: "Campus Map", path: "/dashboard/map", icon: Map },
          { label: "Profile", path: "/dashboard/profile", icon: User },
        ]
      case "security":
        return [
          { label: "Dashboard", path: "/dashboard", icon: Home },
          {
            label: "Campus Inventory",
            path: "/dashboard/inventory",
            icon: Package,
          },
          {
            label: "Verify Handover",
            path: "/dashboard/scan-qr",
            icon: ScanLine,
          },
          {
            label: "Generate OTP",
            path: "/dashboard/generate-otp",
            icon: KeyRound,
          },
          {
            label: "Student Reports",
            path: "/dashboard/student-reports",
            icon: FileSearch,
          },
          {
            label: "Messages",
            path: "/dashboard/messages",
            icon: MessageCircle,
          },
          {
            label: "Notifications",
            path: "/dashboard/notifications",
            icon: Bell,
          },
          { label: "Campus Map", path: "/dashboard/map", icon: Map },
          { label: "Profile", path: "/dashboard/profile", icon: User },
        ]
      case "admin":
      case "superadmin":
        return [
          { label: "Admin Console", path: "/admin", icon: Home },
          { label: "User Management", path: "/admin/users", icon: Users },
          { label: "Campus Offices", path: "/admin/campuses", icon: Building2 },
          {
            label: "Fraud Detection",
            path: "/admin/fraud-detection",
            icon: ShieldAlert,
          },
          { label: "Audit Logs", path: "/admin/audit-logs", icon: FileSearch },
          { label: "Hotspot Heatmaps", path: "/admin/heatmaps", icon: Globe2 },
          {
            label: "Handover Center",
            path: "/dashboard/scan-qr",
            icon: ScanLine,
          },
          {
            label: "Messages",
            path: "/dashboard/messages",
            icon: MessageCircle,
          },
          {
            label: "Notifications",
            path: "/dashboard/notifications",
            icon: Bell,
          },
          { label: "System Settings", path: "/admin/settings", icon: Settings },
        ]
      default:
        return []
    }
  }

  const links = getLinks()

  return (
    <aside className="w-64 bg-[#131b2e] text-white flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300">
      <div className="h-16 flex items-center px-6 gap-3 border-b border-white/10 shrink-0">
        <LogoMark />
        <span className="font-bold tracking-tight">CampusRecover</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
        <div className="space-y-1">
          {links.map((link) => {
            const isRoot = link.path === "/dashboard" || link.path === "/admin"
            const active =
              location.pathname === link.path ||
              (!isRoot && location.pathname.startsWith(link.path))
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon
                  size={18}
                  className={active ? "text-white" : "text-gray-400"}
                />
                <span className="text-sm">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 shrink-0">
        <Link
          to="/dashboard/profile"
          className="flex items-center gap-3 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer block"
        >
          <img
            src={
              customUser?.avatar ||
              user?.photoURL ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`
            }
            alt={customUser?.name || user?.displayName || "User"}
            className="w-9 h-9 rounded-full bg-gray-800 object-cover border border-white/10"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {customUser?.name || user?.displayName || "Campus User"}
            </p>
            <p className="text-xs text-blue-400 font-medium capitalize truncate">
              {customUser?.role || "Student"}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
