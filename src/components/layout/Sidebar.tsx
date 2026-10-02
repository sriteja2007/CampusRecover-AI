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
  PlusCircle,
  Layers,
  ChevronRight,
  MapPin,
} from "lucide-react"
import { LogoMark } from "../ui/Logo"
import { ROLES } from "../../config/constants"

interface SidebarProps {
  onCloseMobile?: () => void
}

interface NavLinkItem {
  label: string
  path: string
  icon: any
  accent?: string
  tag?: string
}

interface NavSection {
  title: string
  links: NavLinkItem[]
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const { user, customUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isAdmin =
    customUser?.role === ROLES.ADMIN ||
    customUser?.role === ROLES.SUPERADMIN ||
    user?.email?.toLowerCase() === "admin@gmail.com"

  const userSections: NavSection[] = [
    {
      title: "Core",
      links: [
        { label: "Dashboard", path: "/dashboard", icon: Home },
        { label: "Campus Map", path: "/dashboard/map", icon: MapPin, accent: "text-blue-400" },
        { label: "Search Directory", path: "/dashboard/search", icon: Search },
      ],
    },
    {
      title: "Recovery Actions",
      links: [
        {
          label: "Report Lost Item",
          path: "/dashboard/report-lost",
          icon: FileWarning,
          accent: "text-rose-500",
        },
        {
          label: "Report Found Item",
          path: "/dashboard/report-found",
          icon: CheckCircle2,
          accent: "text-teal-500",
        },
        { label: "My Reports", path: "/dashboard/my-reports", icon: Package },
      ],
    },
    {
      title: "Intelligence & Custody",
      links: [
        {
          label: "AI Matches",
          path: "/dashboard/ai-match",
          icon: Sparkles,
          accent: "text-purple-400",
          tag: "AI",
        },
        {
          label: "Handover Verification",
          path: "/dashboard/scan-qr",
          icon: KeyRound,
          accent: "text-indigo-400",
        },
      ],
    },
    {
      title: "Settings",
      links: [
        {
          label: "Notifications",
          path: "/dashboard/notifications",
          icon: Bell,
        },
        { label: "Account Profile", path: "/dashboard/profile", icon: User },
      ],
    },
  ]

  const adminSections: NavSection[] = [
    {
      title: "Operations Center",
      links: [
        { label: "Operations Dashboard", path: "/admin", icon: Home },
        { label: "Campus Recovery Map", path: "/dashboard/map", icon: MapPin, accent: "text-blue-400" },
        { label: "AI Review Queue", path: "/admin?tab=matches", icon: Sparkles, tag: "Queue" },
        { label: "Items Directory", path: "/admin?tab=items", icon: Package },
        { label: "Manual Matcher", path: "/admin?tab=manual_match", icon: PlusCircle },
        { label: "User Management", path: "/admin?tab=users", icon: Users },
      ],
    },
    {
      title: "Front Desk & Handovers",
      links: [
        { label: "Handover Desk", path: "/dashboard/scan-qr", icon: KeyRound },
        { label: "Switch to Student View", path: "/dashboard", icon: ExternalLink },
      ],
    },
  ]

  const sections = isAdmin ? adminSections : userSections

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile()
  }

  const userName = customUser?.name || user?.displayName || (isAdmin ? "Campus Admin" : "Student")
  const userEmail = customUser?.email || user?.email || ""

  return (
    <aside className="w-64 bg-[#0d1322] text-slate-100 flex flex-col h-full border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
        <Link
          to={isAdmin ? "/admin" : "/dashboard"}
          onClick={handleNavClick}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <LogoMark size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-sm text-white">
                CampusRecover
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">
              {isAdmin ? "Operations Console" : "Campus Recovery Portal"}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </h4>
            <div className="space-y-0.5 pt-1">
              {section.links.map((link) => {
                const isRoot = link.path === "/dashboard" || link.path === "/admin"
                const active =
                  location.pathname === link.path ||
                  (!isRoot && location.pathname.startsWith(link.path.split("?")[0]))
                const Icon = link.icon

                return (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={handleNavClick}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold group ${
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className={`transition-colors ${
                          active
                            ? "text-white"
                            : link.accent || "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span>{link.label}</span>
                    </div>

                    {link.tag && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}
                      >
                        {link.tag}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0a0f1d] shrink-0">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {userName}
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                {userEmail}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
export default Sidebar
