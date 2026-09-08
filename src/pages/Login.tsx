import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { LogoMark } from "../components/ui/Logo"
import { AuthService } from "../services/auth.service"
import { UserService } from "../services/user.service"
import { UserRole } from "../types/User"

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const [role, setRole] = useState<UserRole>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleProfileSync = async (
    uid: string,
    userEmail: string | null,
    userName?: string,
  ) => {
    let existingProfile = await UserService.getUserProfile(uid)
    if (!existingProfile) {
      await UserService.createUserProfile({
        uid,
        email: userEmail || email || "",
        displayName: userName || userEmail?.split("@")[0] || "User",
        phone: null,
        role: role,
        university: "Stanford University",
        department: null,
        year: null,
        photoURL: null,
        status: "active",
      })
      existingProfile = await UserService.getUserProfile(uid)
    }
    return existingProfile
  }

  const handleRedirect = (profileRole?: string) => {
    if (profileRole === "admin" || profileRole === "superadmin") {
      navigate("/admin", { replace: true })
    } else {
      navigate("/dashboard", { replace: true })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setToast(null)

    // Form Validation
    if (!email.trim() || !password.trim()) {
      setToast({ message: "Email and password are required.", type: "error" })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({
        message: "Please enter a valid email address.",
        type: "error",
      })
      return
    }

    setLoading(true)
    try {
      const user = await AuthService.login(email, password)
      const profile = await handleProfileSync(user.uid, user.email)
      setToast({ message: "Successfully logged in!", type: "success" })
      setTimeout(() => {
        handleRedirect(profile?.role)
      }, 500)
    } catch (err: any) {
      setToast({
        message:
          err.message || "Failed to sign in. Please check your credentials.",
        type: "error",
      })
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setToast(null)
    setLoading(true)
    try {
      const user = await AuthService.googleLogin()
      const profile = await handleProfileSync(
        user.uid,
        user.email,
        user.displayName || undefined,
      )
      setToast({
        message: "Successfully logged in with Google!",
        type: "success",
      })
      setTimeout(() => {
        handleRedirect(profile?.role)
      }, 500)
    } catch (err: any) {
      setToast({
        message: err.message || "Failed to sign in with Google.",
        type: "error",
      })
      setLoading(false)
    }
  }

  const roles = [
    { id: "student", label: "Student", icon: "🎓" },
    { id: "faculty", label: "Faculty", icon: "📚" },
    { id: "security", label: "Security", icon: "🛡️" },
    { id: "admin", label: "Admin", icon: "⚙️" },
  ] as const

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#faf8ff",
        position: "relative",
      }}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            zIndex: 50,
            background: toast.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${
              toast.type === "success" ? "#10b981" : "#ef4444"
            }`,
            color: toast.type === "success" ? "#065f46" : "#991b1b",
            padding: "12px 16px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            animation: "slideIn 0.2s ease-out forwards",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <XCircle size={18} color="#ef4444" />
          )}
          <span style={{ fontSize: 14, fontWeight: 500 }}>{toast.message}</span>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
      )}

      {/* Left panel */}
      <div
        style={{
          flex: "0 0 480px",
          padding: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 480,
        }}
        className="hidden lg:flex"
      >
        <div style={{ marginBottom: 48 }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              marginBottom: 48,
            }}
          >
            <LogoMark size={36} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{ fontSize: 17, fontWeight: 700, color: "#131b2e" }}
                >
                  CampusRecover
                </span>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: "#71f8e4",
                    color: "#006b5f",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  AI
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#434655", marginTop: 2 }}>
                Powered by Vision AI 4.0
              </div>
            </div>
          </Link>

          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#131b2e",
              letterSpacing: "-0.025em",
              margin: "0 0 12px",
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#434655",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Sign in to your CampusRecover account to manage lost items, track AI
            matches, and connect with campus offices.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              icon: "🎯",
              value: "98.2%",
              label: "AI match accuracy across 42 campuses",
            },
            {
              icon: "⚡",
              value: "<4 min",
              label: "Average time from report to match",
            },
            {
              icon: "🛡️",
              value: "0 fraud",
              label: "Claims verified this semester",
            },
          ].map(({ icon, value, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 16,
                borderRadius: 12,
                background: "white",
                border: "1px solid #e2e7ff",
              }}
            >
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#2563eb",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 12, color: "#434655" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div
            className="lg:hidden"
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <LogoMark size={32} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#131b2e" }}>
                CampusRecover <span style={{ color: "#2563eb" }}>AI</span>
              </span>
            </Link>
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#131b2e",
              letterSpacing: "-0.025em",
              margin: "0 0 6px",
            }}
          >
            Sign in
          </h1>
          <p style={{ fontSize: 14, color: "#434655", margin: "0 0 28px" }}>
            Use your institutional .edu account
          </p>

          {/* Role selector */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {roles.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setRole(id as UserRole)}
                style={{
                  padding: "10px 8px",
                  borderRadius: 10,
                  border: `2px solid ${role === id ? "#2563eb" : "#e2e7ff"}`,
                  background: role === id ? "#dbe1ff" : "white",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: role === id ? "#004ac6" : "#434655",
                  }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Google SSO */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid #e2e7ff",
                background: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "#131b2e",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLElement).style.background = "#f5f7ff"
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLElement).style.background = "white"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
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
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google (.edu)
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e7ff" }} />
              <span style={{ fontSize: 12, color: "#737686" }}>
                or sign in with email
              </span>
              <div style={{ flex: 1, height: 1, background: "#e2e7ff" }} />
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#131b2e",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Institutional Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={15}
                  color="#737686"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 12px 11px 36px",
                    borderRadius: 10,
                    border: "1px solid #c3c6d7",
                    background: "white",
                    fontSize: 14,
                    color: "#131b2e",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb"
                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#c3c6d7"
                    e.target.style.boxShadow = "none"
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label
                  style={{ fontSize: 12, fontWeight: 600, color: "#131b2e" }}
                >
                  Password
                </label>
                <Link
                  to="/login"
                  style={{
                    fontSize: 12,
                    color: "#2563eb",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <Lock
                  size={15}
                  color="#737686"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 36px",
                    borderRadius: 10,
                    border: "1px solid #c3c6d7",
                    background: "white",
                    fontSize: 14,
                    color: "#131b2e",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb"
                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#c3c6d7"
                    e.target.style.boxShadow = "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#737686",
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "13px",
                borderRadius: 10,
                background: loading ? "#93a5d1" : "#2563eb",
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 13,
              color: "#434655",
            }}
          >
            New to CampusRecover?{" "}
            <Link
              to="/signup"
              style={{
                color: "#2563eb",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create account
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "center",
              marginTop: 20,
              fontSize: 11,
              color: "#737686",
            }}
          >
            <Shield size={12} color="#14b8a6" /> FERPA Compliant · SOC 2 Type II
            · .edu SSO only
          </div>
        </div>
      </div>
    </div>
  )
}
