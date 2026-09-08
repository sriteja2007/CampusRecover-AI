import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Loader2,
} from "lucide-react"
import { LogoMark } from "../components/ui/Logo"
import { AuthService } from "../services/auth.service"
import { UserService } from "../services/user.service"
import { UserRole } from "../types/User"

export default function SignUp() {
  const [showPass, setShowPass] = useState(false)
  const [role, setRole] = useState<UserRole>("student")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleProfileSync = async (
    uid: string,
    userEmail: string | null,
    userName?: string,
  ) => {
    const existingProfile = await UserService.getUserProfile(uid)
    if (!existingProfile) {
      await UserService.createUserProfile({
        uid,
        email: userEmail || email || "",
        displayName: userName || name || userEmail?.split("@")[0] || "User",
        phone: null,
        role: role,
        university: "Stanford University",
        department: null,
        year: null,
        photoURL: null,
        status: "active",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await AuthService.register(name, email, password)
      await handleProfileSync(user.uid, user.email, name)
      navigate("/otp", { replace: true })
    } catch (err: any) {
      setError(err.message || "Failed to create account.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const user = await AuthService.googleLogin()
      await handleProfileSync(
        user.uid,
        user.email,
        user.displayName || undefined,
      )
      navigate("/otp", { replace: true })
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf8ff",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              marginBottom: 24,
            }}
          >
            <LogoMark size={36} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#131b2e" }}>
              CampusRecover <span style={{ color: "#2563eb" }}>AI</span>
            </span>
          </Link>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#131b2e",
              letterSpacing: "-0.025em",
              margin: "0 0 6px",
            }}
          >
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: "#434655", margin: 0 }}>
            Join 42,000+ campus community members
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 8px 40px rgba(37,99,235,0.08)",
            border: "1px solid #e2e7ff",
          }}
        >
          {/* Role */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {(["student", "faculty", "security"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                style={{
                  padding: "10px",
                  borderRadius: 10,
                  border: `2px solid ${role === r ? "#2563eb" : "#e2e7ff"}`,
                  background: role === r ? "#dbe1ff" : "white",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: role === r ? "#004ac6" : "#434655",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {r === "student" ? "🎓" : r === "faculty" ? "📚" : "🛡️"}{" "}
                {r.charAt(0).toUpperCase() + r.slice(1)}
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
              Sign up with Google (.edu)
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e7ff" }} />
              <span style={{ fontSize: 12, color: "#737686" }}>
                or with email
              </span>
              <div style={{ flex: 1, height: 1, background: "#e2e7ff" }} />
            </div>

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
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User
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
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Chen"
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
                  placeholder="yourname@stanford.edu"
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
                Password
              </label>
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
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
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

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  color: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

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
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 13,
            color: "#434655",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "center",
            marginTop: 12,
            fontSize: 11,
            color: "#737686",
          }}
        >
          <Shield size={12} color="#14b8a6" /> FERPA Compliant · .edu required ·
          End-to-end encrypted
        </div>
      </div>
    </div>
  )
}
