import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router"
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { AuthService } from "../services/auth.service"
import { LogoMark } from "../components/ui/Logo"
import { Button } from "../components/ui/Button"

export default function ResetPassword() {
  const { token: routeToken } = useParams()
  const [searchParams] = useSearchParams()
  const token = routeToken || searchParams.get("oobCode") || searchParams.get("token") || ""

  const navigate = useNavigate()

  const [verifyingToken, setVerifyingToken] = useState(true)
  const [tokenEmail, setTokenEmail] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setTokenError("Missing password reset token. Please request a new recovery link.")
      setVerifyingToken(false)
      return
    }

    // Verify token validity with Firebase Auth
    AuthService.verifyResetToken(token)
      .then((email) => {
        setTokenEmail(email)
        setVerifyingToken(false)
      })
      .catch((err) => {
        setTokenError(err.message || "This password reset token has expired or is invalid.")
        setVerifyingToken(false)
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match. Please verify and re-enter.")
      return
    }

    setSubmitting(true)
    try {
      await AuthService.confirmResetPassword(token, password)
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { replace: true, state: { resetSuccess: true } })
      }, 2500)
    } catch (err: any) {
      setSubmitError(err.message || "Failed to update password. The link may have expired.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <LogoMark className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Set New Password
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {tokenEmail ? `Updating password for ${tokenEmail}` : "Enter your new account password"}
          </p>
        </div>

        {/* Token Verification Loading */}
        {verifyingToken && (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Validating security token...
            </p>
          </div>
        )}

        {/* Token Error */}
        {!verifyingToken && tokenError && (
          <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-red-900 dark:text-red-200">
                Invalid or Expired Link
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{tokenError}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
              >
                Request a new password reset link
              </Link>
            </div>
          </div>
        )}

        {/* Success confirmation */}
        {success && (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
              Password Reset Complete!
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Your password has been securely updated. Redirecting you to sign in...
            </p>
          </div>
        )}

        {/* Reset Form */}
        {!verifyingToken && !tokenError && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                {submitError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPass ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                <>
                  Save New Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
