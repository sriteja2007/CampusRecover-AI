import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router"
import { Menu, X, PlusCircle, Search, ShieldCheck } from "lucide-react"
import { Logo } from "../ui/Logo"
import { Button } from "../ui/Button"
import { ThemeToggle } from "../common/ThemeToggle"
import { useAuth } from "../../context/AuthContext"

const NAV_LINKS = [
  { label: "Browse Items", path: "/items", icon: Search },
  { label: "How It Works", path: "/how-it-works", icon: null },
  { label: "Safety", path: "/safety", icon: ShieldCheck },
]

export function Navbar() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 dark:border-slate-800"
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Wordmark */}
        <Link to="/" className="flex items-center gap-2 group">
          <Logo size={34} />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              location.pathname === link.path ||
              (link.path === "/items" && location.pathname.startsWith("/items"))
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link to="/report/lost">
                <Button size="sm" className="gap-1.5 shadow-xs">
                  <PlusCircle size={15} />
                  Report Lost Item
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/login?redirect=/report/lost">
                <Button size="sm" className="gap-1.5 shadow-xs">
                  <PlusCircle size={15} />
                  Report Lost Item
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="md:hidden flex items-center gap-1.5">
          <ThemeToggle />
          <button
            className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-5 shadow-xl absolute w-full left-0">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to="/report/lost" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full gap-2">
                    <PlusCircle size={16} />
                    Report Lost Item
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login?redirect=/report/lost" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full gap-2">
                    <PlusCircle size={16} />
                    Report Lost Item
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
