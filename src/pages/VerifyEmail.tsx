import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { Mail, CheckCircle2, ArrowRight, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { AuthService } from "../services/auth.service"
import { LogoMark } from "../components/ui/Logo"
import { Button } from "../components/ui/Button"

export default function VerifyEmail() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [checking, setChecking] = useState(false)
  const [verified, setVerified] = useState(user?.emailVerified || false)

  useEffect(() => {
    let timer: any
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    setResendSuccess(false)
    try {
      await AuthService.sendVerificationEmail()
      setResendSuccess(true)
      setCooldown(60) // 60s cooldown
    } catch (err: any) {
      console.warn("Resend email notice:", err)
    } finally {
      setResending(false)
    }
  }

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      const isVerified = await AuthService.checkEmailVerified()
      if (isVerified) {
        setVerified(true)
        setTimeout(() => {
          navigate("/dashboard", { replace: true })
        }, 1500)
      }
    } catch (err) {
      console.warn("Check verification error:", err)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
        {/* Brand Header */}
        <div className="flex justify-center">
          <LogoMark className="h-12 w-12 text-blue-600" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 mx-auto flex items-center justify-center">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Verify your email address
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We sent a verification link to:
          </p>
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-sm text-slate-800 dark:text-slate-200">
            {user?.email || "your institutional email"}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Please check your inbox (and spam folder) and click the confirmation link to activate campus recovery privileges.
        </p>

        {/* Resend success notice */}
        {resendSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Verification link resent! Check your inbox.</span>
          </div>
        )}

        {/* Verified notice */}
        {verified && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">Email verified! Redirecting to dashboard...</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking status...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                I Have Verified (Continue)
              </>
            )}
          </Button>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm font-semibold transition-all disabled:opacity-50"
          >
            {resending
              ? "Sending..."
              : cooldown > 0
              ? `Resend available in ${cooldown}s`
              : "Resend Verification Email"}
          </button>
        </div>

        <div className="pt-2 text-center text-xs text-slate-500">
          Want to use a different account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
