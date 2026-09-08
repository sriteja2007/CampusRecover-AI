import { Search, Bell, Menu, LogOut, Command } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useLocation, useNavigate } from "react-router"
import { AuthService } from "../../services/auth.service"
import { ROUTES } from "../../config/constants"
import { ThemeToggle } from "../common/ThemeToggle"

export function TopNav() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const pathnames = location.pathname.split("/").filter((x) => x)
  const breadcrumb =
    pathnames[pathnames.length - 1]?.replace("-", " ") || "Dashboard"

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm transition-colors">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Toggle navigation menu"
          className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 capitalize">
          <span className="text-gray-400 dark:text-gray-500">Campus</span>
          <span>/</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {breadcrumb}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const target = e.currentTarget.elements.namedItem(
              "search",
            ) as HTMLInputElement
            if (target?.value?.trim()) {
              navigate(
                `/dashboard/lost?search=${encodeURIComponent(target.value.trim())}`,
              )
            }
          }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-400 w-64 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all cursor-text"
        >
          <Search size={16} aria-hidden="true" />
          <input
            name="search"
            type="text"
            placeholder="Search items..."
            aria-label="Search lost and found items"
            className="bg-transparent border-none outline-none flex-1 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
          />
          <div className="flex items-center gap-1 text-[10px] font-bold bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded shadow-sm text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-600">
            <Command size={10} /> K
          </div>
        </form>

        <ThemeToggle />

        <button
          type="button"
          onClick={() => navigate("/dashboard/notifications")}
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

        <button
          type="button"
          onClick={handleLogout}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors cursor-pointer"
          title="Logout"
          aria-label="Log out of account"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
