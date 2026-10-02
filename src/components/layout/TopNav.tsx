import { useState, useEffect } from "react"
import { Search, Bell, Menu, LogOut, Command, Shield, Sparkles } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useLocation, useNavigate } from "react-router"
import { AuthService } from "../../services/auth.service"
import { ROUTES } from "../../config/constants"
import { ThemeToggle } from "../common/ThemeToggle"
import { ROLES } from "../../config/constants"

interface TopNavProps {
  onToggleMobileMenu?: () => void
}

export function TopNav({ onToggleMobileMenu }: TopNavProps) {
  const { user, customUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState("")

  const isAdmin =
    customUser?.role === ROLES.ADMIN ||
    customUser?.role === ROLES.SUPERADMIN ||
    user?.email?.toLowerCase() === "admin@gmail.com"

  // Compute clean breadcrumb
  const pathParts = location.pathname.split("/").filter(Boolean)
  const currentTitle = pathParts[pathParts.length - 1]
    ? pathParts[pathParts.length - 1].replace(/-/g, " ")
    : "Overview"

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchInput.trim())}`)
      setSearchInput("")
    }
  }

  // Handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        const inputEl = document.getElementById("top-search-input") as HTMLInputElement
        if (inputEl) inputEl.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 dark:text-slate-500">
            {isAdmin ? "Admin Operations" : "Campus"}
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-bold text-slate-900 dark:text-white capitalize">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Middle/Right: Global Search, Theme, Notifications, User */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Global Fast Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden md:flex items-center"
        >
          <Search
            size={15}
            className="absolute left-3.5 text-slate-400 pointer-events-none"
          />
          <input
            id="top-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search items, keywords, CR-..."
            className="w-64 lg:w-72 pl-9 pr-14 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
          />
          <div className="absolute right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-300 pointer-events-none shadow-2xs">
            <Command size={10} /> K
          </div>
        </form>

        <ThemeToggle />

        {/* Notifications Icon with Badge */}
        <button
          type="button"
          onClick={() => navigate("/dashboard/notifications")}
          className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </button>

        {/* Admin or Student Role Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
          {isAdmin ? (
            <>
              <Shield size={12} className="text-blue-600" />
              <span>Admin</span>
            </>
          ) : (
            <>
              <Sparkles size={12} className="text-purple-600" />
              <span>Student</span>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Logout Quick Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  )
}
export default TopNav
