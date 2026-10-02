import { useState } from "react"
import { Outlet, Navigate, Link, useLocation } from "react-router"
import { useAuth } from "../../context/AuthContext"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import { OfflineBanner } from "../common/OfflineBanner"
import { ErrorBoundary } from "../common/ErrorBoundary"
import { Home, Search, PlusCircle, Sparkles, Package, X } from "lucide-react"

export function AppLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const bottomNavItems = [
    { label: "Dashboard", path: "/dashboard", icon: Home },
    { label: "Search", path: "/dashboard/search", icon: Search },
    { label: "Report", path: "/dashboard/report-lost", icon: PlusCircle, isAction: true },
    { label: "Matches", path: "/dashboard/ai-match", icon: Sparkles },
    { label: "Reports", path: "/dashboard/my-reports", icon: Package },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:font-semibold focus:shadow-xl"
      >
        Skip to main content
      </a>

      <OfflineBanner />

      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-[-44px] p-2 rounded-xl bg-slate-900 text-white shadow-lg cursor-pointer"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 pb-16 lg:pb-0">
        <TopNav onToggleMobileMenu={() => setMobileMenuOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto outline-none"
        >
          <div className="max-w-6xl mx-auto w-full">
            <ErrorBoundary name="MainAppContent">
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around"
      >
        {bottomNavItems.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon

          if (item.isAction) {
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Icon size={22} />
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                active
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
export default AppLayout
