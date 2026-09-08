import { Outlet, Navigate } from "react-router"
import { useAuth } from "../../context/AuthContext"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import { OfflineBanner } from "../common/OfflineBanner"
import { ErrorBoundary } from "../common/ErrorBoundary"

export function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:font-semibold focus:shadow-xl"
      >
        Skip to main content
      </a>

      <OfflineBanner />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <TopNav />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-6 lg:p-8 overflow-y-auto outline-none"
        >
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <ErrorBoundary name="MainAppContent">
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
