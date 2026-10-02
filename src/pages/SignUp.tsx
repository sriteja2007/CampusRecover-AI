import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { LogoMark } from "../components/ui/Logo"
import { Badge } from "../components/ui/Badge"

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    if (confirmPassword && password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.")
      return
    }

    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password, phone.trim())
      navigate("/dashboard", { replace: true })
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
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
        setError("Google sign-up was canceled.")
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "Current domain is not authorized in Firebase Console for Google Sign-In. Use email sign-up or demo accounts on login.",
        )
      } else {
        setError(err.message || "Failed to sign up with Google.")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* LEFT: Brand & Story (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0b101e] text-white flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

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
            <Badge variant="found" dot>
              University Network
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Create your CampusRecover account.
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Connect your campus profile to receive immediate automated notifications
              when an item you lost is matched, or help classmates recover what they
              misplaced.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-3 max-w-md pt-8">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-bold text-white">Verified Campus Community</p>
              <p className="text-slate-400 text-[11px]">
                Safe, authenticated environment for university members.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-slate-500 flex justify-between">
          <span>&copy; {new Date().getFullYear()} CampusRecover AI</span>
          <span>Security &amp; Privacy First</span>
        </div>
      </div>

      {/* RIGHT: Register Form Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Get Started with CampusRecover
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your student details to activate your recovery profile.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label
                htmlFor="reg-name"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="reg-email"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                University Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="reg-phone"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Mobile Phone (for Handover coordination)
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="reg-confirm"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="reg-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google Sign In */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-slate-50 dark:bg-slate-950 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
              or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            <span>Sign up with Google</span>
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
