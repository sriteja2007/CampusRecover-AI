import { Outlet } from "react-router"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
export default PublicLayout
