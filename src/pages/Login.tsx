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
  KeyRound,
  CheckCircle2,
} from "lucide-react"
import { useAuth, DEMO_PRESET_USERS } from "../context/AuthContext"

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

  // Autofill form inputs only
  const handleAutofill = (key: "admin" | "student1" | "student2") => {
    const demo = DEMO_PRESET_USERS[key]
    setEmail(demo.email)
    setPassword(demo.pass)
    setError(null)
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-10 border border-gray-200 dark:border-gray-800 shadow-xl shadow-blue-500/5">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-4 shadow-inner border border-blue-100 dark:border-blue-900/50">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sign in to access your CampusRecover AI portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin text-blue-600 dark:text-blue-400" />
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
          <span>
            {googleLoading ? "Connecting Google..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          </div>
          <span className="relative bg-white dark:bg-gray-900 px-3 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold">
            Or continue with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Campus Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={18}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={18}
              />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading && !quickLoginRole ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* 3 Dedicated Demo Users with Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={14} className="text-blue-600 dark:text-blue-400" />
              Demo Test Accounts (3 Users)
            </span>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Ready for Demo
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
            Click <strong>Quick Login</strong> to sign in instantly, or click
            anywhere to autofill credentials.
          </p>

          <div className="space-y-2.5">
            {/* Student 1 */}
            <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div
                className="cursor-pointer flex-1"
                onClick={() => handleAutofill("student1")}
                title="Click to autofill"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Student 1 (Owner)
                  </span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-white/90 dark:bg-gray-800 font-medium px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    Reports Lost Item
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 font-mono flex flex-wrap gap-x-2">
                  <span>
                    email: <strong>student1@campus.edu</strong>
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>
                    pass: <strong>Student123</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAutofill("student1")}
                  className="px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold"
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("student1")}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {loading && quickLoginRole === "student1" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  Quick Login
                </button>
              </div>
            </div>

            {/* Student 2 */}
            <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div
                className="cursor-pointer flex-1"
                onClick={() => handleAutofill("student2")}
                title="Click to autofill"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                    Student 2 (Finder)
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-white/90 dark:bg-gray-800 font-medium px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                    Reports Found Item
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 font-mono flex flex-wrap gap-x-2">
                  <span>
                    email: <strong>student2@campus.edu</strong>
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>
                    pass: <strong>Student123</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAutofill("student2")}
                  className="px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold"
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("student2")}
                  disabled={loading}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {loading && quickLoginRole === "student2" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  Quick Login
                </button>
              </div>
            </div>

            {/* Admin */}
            <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div
                className="cursor-pointer flex-1"
                onClick={() => handleAutofill("admin")}
                title="Click to autofill"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Admin Account
                  </span>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-white/90 dark:bg-gray-800 font-medium px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    Security / Manager
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 font-mono flex flex-wrap gap-x-2">
                  <span>
                    email: <strong>admin@gmail.com</strong>
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>
                    pass: <strong>Admin123</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAutofill("admin")}
                  className="px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold"
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin")}
                  disabled={loading}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {loading && quickLoginRole === "admin" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Shield size={12} />
                  )}
                  Quick Login
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Register here
          </Link>
        </div>
      </div>
    </div>
  )
}
