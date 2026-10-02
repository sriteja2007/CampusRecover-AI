import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Shield,
  Sparkles,
  UserCheck,
  CheckCircle2,
} from "lucide-react"
import { useAuth, DEMO_PRESET_USERS } from "../context/AuthContext"
import { LogoMark } from "../components/ui/Logo"
import { Badge } from "../components/ui/Badge"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quickLoginRole, setQuickLoginRole] = useState<string | null>(null)

  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.")
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      if (email.trim().toLowerCase() === "admin@gmail.com") {
        navigate("/admin", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(
        err.message || "Failed to sign in. Please verify your credentials.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      const user = await loginWithGoogle()
      if (user?.email?.toLowerCase() === "admin@gmail.com") {
        navigate("/admin", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err)
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was canceled.")
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "Current domain is not authorized in Firebase Console for Google Sign-In. Use the demo accounts or email sign-in.",
        )
      } else {
        setError(err.message || "Failed to sign in with Google.")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  // 1-Click Instant Login for Demo Accounts
  const handleQuickLogin = async (key: "admin" | "student1" | "student2") => {
    const demo = DEMO_PRESET_USERS[key]
    setEmail(demo.email)
    setPassword(demo.pass)
    setError(null)
    setQuickLoginRole(key)
    setLoading(true)
    try {
      await login(demo.email, demo.pass)
      if (demo.role === "admin") {
        navigate("/admin", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    } catch (err: any) {
      console.error("Quick login error:", err)
      setError(err.message || `Failed to sign in as ${demo.name}`)
    } finally {
      setLoading(false)
      setQuickLoginRole(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* LEFT: Brand & Product Story (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0b101e] text-white flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LogoMark size={24} />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              CampusRecover <span className="text-blue-400 font-mono text-sm">AI</span>
            </span>
          </Link>

          <div className="pt-16 space-y-4 max-w-lg">
            <Badge variant="purple" dot>
              Campus Intelligence
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Reconnecting students with what matters.
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Every day, dozens of essential belongings are misplaced across campus.
              CampusRecover AI unites vision models, verified student identity, and
              zero-fraud handovers.
            </p>
          </div>
        </div>

        {/* Feature Highlights on Left Panel */}
        <div className="relative z-10 space-y-3 max-w-md pt-8">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="font-bold text-white">Automated AI Pairings</p>
              <p className="text-slate-400 text-[11px]">
                Instant similarity matches between lost &amp; found reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="font-bold text-white">Verified 6-Digit Handover</p>
              <p className="text-slate-400 text-[11px]">
                Encrypted one-time codes protect rightful owners.
              </p>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-slate-500 flex justify-between">
          <span>&copy; {new Date().getFullYear()} CampusRecover AI</span>
          <span>Official University Platform</span>
        </div>
      </div>

      {/* RIGHT: Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <LogoMark size={28} />
              <span className="text-lg font-black text-slate-900 dark:text-white">
                CampusRecover AI
              </span>
            </Link>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Access your lost reports, view AI matches, and coordinate handovers.
            </p>
          </div>

          {/* Quick 1-Click Demo Accounts */}
          <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Quick Demo Accounts</span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase">
                1-Click Sign In
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("student1")}
                disabled={loading}
                className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs transition-all text-center cursor-pointer disabled:opacity-50"
              >
                {quickLoginRole === "student1" ? (
                  <Loader2 size={13} className="animate-spin mx-auto text-blue-600" />
                ) : (
                  <>
                    <span className="block text-[10px] text-slate-400">Lost User</span>
                    <span>Student 1</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("student2")}
                disabled={loading}
                className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs transition-all text-center cursor-pointer disabled:opacity-50"
              >
                {quickLoginRole === "student2" ? (
                  <Loader2 size={13} className="animate-spin mx-auto text-teal-600" />
                ) : (
                  <>
                    <span className="block text-[10px] text-slate-400">Finder</span>
                    <span>Student 2</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin")}
                disabled={loading}
                className="py-2 px-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 text-xs font-bold shadow-2xs transition-all text-center cursor-pointer disabled:opacity-50"
              >
                {quickLoginRole === "admin" ? (
                  <Loader2 size={13} className="animate-spin mx-auto text-blue-600" />
                ) : (
                  <>
                    <span className="block text-[10px] text-blue-500">Security</span>
                    <span>Admin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Campus Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="w-full pl-10 pr-3.5 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault()
                    alert("For demo accounts, use password prefilled or contact support.")
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google Sign In */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-slate-50 dark:bg-slate-950 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
              or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={14} className="animate-spin text-slate-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Bottom link to Register */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link
              to="/signup"
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Create student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
