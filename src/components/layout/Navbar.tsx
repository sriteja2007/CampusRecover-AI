import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router"
import { Menu, X } from "lucide-react"
import { LogoMark } from "../ui/Logo"
import { Button } from "../ui/Button"
import { ThemeToggle } from "../common/ThemeToggle"

import { useAuth } from "../../context/AuthContext"

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "How It Works", path: "/how-it-works" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
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
          ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur-md shadow-xs border-b border-gray-100 dark:border-gray-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
              CampusRecover
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#71f8e4] text-[#006b5f] text-[10px] font-bold">
              AI
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                location.pathname === link.path
                  ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/50"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link to="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 shadow-lg absolute w-full">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">
                Log in
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Sign up</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
