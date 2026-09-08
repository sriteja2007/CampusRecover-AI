import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router"
import { Shield, ArrowLeft, RefreshCw, Mail } from "lucide-react"
import { LogoMark } from "../components/ui/Logo"
import { useAuth } from "../context/AuthContext"
import { AuthService } from "../services/auth.service"

export default function OTPVerification() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resendCount, setResendCount] = useState(60)
  const [verified, setVerified] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (resendCount <= 0) return
    const t = setTimeout(() => setResendCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCount])

  useEffect(() => {
    // Auto refresh every 5 seconds
    const interval = setInterval(async () => {
      if (user) {
        await user.reload()
        if (user.emailVerified) {
          setVerified(true)
          clearInterval(interval)
          setTimeout(() => navigate("/dashboard"), 1200)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [user, navigate])

  const handleResend = async () => {
    if (!user) return
    try {
      setLoading(true)
      await AuthService.sendVerification()
      setResendCount(60)
    } catch (error) {
      console.error("Failed to resend verification email", error)
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf8ff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: "rgba(20,184,166,0.1)",
              border: "2px solid #14b8a6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              animation: "fadeInUp 0.4s ease",
            }}
          >
            <Shield size={32} color="#14b8a6" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#131b2e" }}>
            Identity Verified!
          </div>
          <div style={{ fontSize: 14, color: "#434655", marginTop: 8 }}>
            Redirecting to your dashboard…
          </div>
        </div>
      </div>
    )
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
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 20,
          padding: 40,
          boxShadow: "0 8px 40px rgba(37,99,235,0.08)",
          border: "1px solid #e2e7ff",
        }}
      >
        <Link
          to="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#434655",
            textDecoration: "none",
            marginBottom: 32,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} /> Back to login
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <LogoMark size={44} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 999,
              background: "#eaedff",
              marginBottom: 16,
            }}
          >
            <Shield size={13} color="#2563eb" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>
              Email Verification
            </span>
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#131b2e",
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}
          >
            Verify your email
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#434655",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            We sent a verification link to
            <br />
            <strong style={{ color: "#131b2e" }}>
              {user?.email || "your email address"}
            </strong>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "16px",
            borderRadius: 12,
            background: "#faf8ff",
            border: "1px solid #e2e7ff",
            marginBottom: 28,
            fontSize: 13,
            color: "#2563eb",
            fontWeight: 600,
          }}
        >
          <RefreshCw
            size={16}
            style={{ animation: "spin 2s linear infinite" }}
          />{" "}
          Waiting for you to verify…
        </div>

        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px",
              borderRadius: 10,
              background: "#eaedff",
              marginBottom: 20,
              fontSize: 13,
              color: "#2563eb",
              fontWeight: 600,
            }}
          >
            <RefreshCw
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />{" "}
            Resending email…
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 13, color: "#434655" }}>
          {resendCount > 0 ? (
            <>
              Resend link in{" "}
              <strong
                style={{
                  color: "#131b2e",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                0:{String(resendCount).padStart(2, "0")}
              </strong>
            </>
          ) : (
            <button
              onClick={handleResend}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#2563eb",
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Mail size={14} /> Resend Email
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "center",
            marginTop: 24,
            fontSize: 11,
            color: "#737686",
          }}
        >
          <Shield size={12} color="#14b8a6" /> Encrypted · .edu SSO Bound ·
          Never stored
        </div>
      </div>
    </div>
  )
}
