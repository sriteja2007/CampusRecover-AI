import { Outlet } from "react-router"
import { Navbar } from "./Navbar"

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <footer className="bg-[#131b2e] dark:bg-gray-900 py-8 px-6 text-white/60 dark:text-gray-400 text-sm mt-auto border-t border-white/5 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>© 2026 CampusRecover AI. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
