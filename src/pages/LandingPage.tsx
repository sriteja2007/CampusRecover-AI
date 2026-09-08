import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  Search,
  Sparkles,
  PlusCircle,
  Shield,
  Lock,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Brain,
  Star,
  TrendingUp,
  Package,
  Users,
  Zap,
  Eye,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Map,
  Clock,
  Camera,
  QrCode,
  ScanLine,
  Upload,
  Fingerprint,
  MessageSquare,
  RefreshCw,
  CircleCheck,
  Activity,
  Globe,
  BookOpen,
} from "lucide-react"

const STATS = [
  { value: "98.2%", label: "AI Match Accuracy", icon: Brain, color: "#2563eb" },
  {
    value: "14,830",
    label: "Items Recovered",
    icon: Package,
    color: "#14b8a6",
  },
  {
    value: "42",
    label: "Campus Partners",
    icon: GraduationCap,
    color: "#f59e0b",
  },
  { value: "<4 min", label: "Avg. Match Time", icon: Clock, color: "#2563eb" },
]

const FEATURES = [
  {
    icon: Camera,
    title: "Multimodal Vision AI",
    desc: "Neural image analysis with OCR 4.0 extracts text, logos, and unique markers from any photo — even low-resolution snapshots.",
    badge: "NEW",
    color: "#2563eb",
  },
  {
    icon: Brain,
    title: "Semantic Match Engine",
    desc: "Goes beyond pixel matching — understands context, brand markings, damage patterns, and serial numbers to surface the right item.",
    color: "#14b8a6",
  },
  {
    icon: Shield,
    title: "Zero-Fraud Verification",
    desc: "Multi-layer ownership verification: .edu SSO, QR custody chain, OTP handover, and AI trust scoring prevent false claims.",
    color: "#f59e0b",
  },
  {
    icon: MessageSquare,
    title: "Secure Messenger",
    desc: "End-to-end encrypted in-app chat between finder and owner, with admin oversight and automated escalation protocols.",
    color: "#2563eb",
  },
  {
    icon: Map,
    title: "Interactive Campus Map",
    desc: "Real-time heatmap of lost item clusters, campus office locations, and item custody handover points across all buildings.",
    color: "#14b8a6",
  },
  {
    icon: BarChart3,
    title: "Admin Analytics",
    desc: "Live dashboards for campus security teams: fraud detection logs, recovery rates, audit trails, and AI confidence reports.",
    color: "#f59e0b",
  },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Upload,
    title: "Submit a Report",
    desc: "Upload photos of your lost item. Our AI instantly analyzes brand, color, condition, and any text or serial numbers.",
  },
  {
    step: "02",
    icon: ScanLine,
    title: "AI Scans the Registry",
    desc: "The match engine compares your item against all found-item reports across campus in real time — sub-4-minute turnaround.",
  },
  {
    step: "03",
    icon: Fingerprint,
    title: "Verify Ownership",
    desc: "Matched? Confirm ownership through .edu SSO + AI trust score. Admins review flagged cases to prevent fraud.",
  },
  {
    step: "04",
    icon: QrCode,
    title: "Secure QR Handover",
    desc: "Generate a cryptographic QR code for physical pickup at your campus office. OTP confirmed. Custody chain logged.",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "I lost my laptop at the Quad during finals week. CampusRecover matched it to a found report in 2 minutes. The QR handover at the office was seamless.",
    name: "Aisha Mensah",
    role: "CS Junior, Stanford",
    avatar: "AM",
    color: "#2563eb",
    rating: 5,
  },
  {
    quote:
      "As a campus security officer, the Admin Portal gives us real-time visibility into every claim, AI confidence score, and fraud flag. It transformed our workflow.",
    name: "Officer James Reeves",
    role: "Campus Security, MIT",
    avatar: "JR",
    color: "#14b8a6",
    rating: 5,
  },
  {
    quote:
      "The trust score system is brilliant. We've had zero fraudulent claims this semester since deploying CampusRecover AI across all 12 of our buildings.",
    name: "Dr. Patricia Loh",
    role: "Dean of Student Affairs, UCLA",
    avatar: "PL",
    color: "#f59e0b",
    rating: 5,
  },
]

const AI_CAPABILITIES = [
  { label: "Image Similarity", value: 99.1, color: "#2563eb" },
  { label: "OCR Accuracy", value: 97.8, color: "#14b8a6" },
  { label: "Duplicate Detection", value: 98.4, color: "#f59e0b" },
  { label: "Fraud Prevention", value: 99.6, color: "#2563eb" },
]

function LogoMark() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="24" fill="#2563EB" />
      <path
        d="M50 20C33.4315 20 20 33.4315 20 50C20 66.5685 33.4315 80 50 80C66.5685 80 80 66.5685 80 50"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="14" fill="#14B8A6" />
      <path
        d="M43 50L48 55L58 44"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M72 28L80 20M80 20H72M80 20V28"
        stroke="#F59E0B"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Hero() {
  const [scanProgress, setScanProgress] = useState(0)
  const [matchFound, setMatchFound] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setScanProgress((p) => {
          if (p >= 100) {
            clearInterval(interval)
            setMatchFound(true)
            return 100
          }
          return p + 2
        })
      }, 50)
      return () => clearInterval(interval)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "80px 24px 96px",
        paddingTop: 96,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 400,
          background:
            "radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, rgba(20,184,166,0.08) 40%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 48,
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
        className="lg:grid-cols-hero"
      >
        <style>{`.lg\\:grid-cols-hero { grid-template-columns: 7fr 5fr; }`}</style>

        {/* Left: copy */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Badge */}
          <div
            className="animate-fade-in-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(218,226,253,0.7)",
              backdropFilter: "blur(8px)",
              width: "fit-content",
            }}
          >
            <span style={{ display: "flex", alignItems: "center" }}>
              <span style={{ position: "relative", display: "inline-flex" }}>
                <span
                  className="animate-ping"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: "#14b8a6",
                    opacity: 0.4,
                  }}
                ></span>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "#14b8a6",
                    display: "block",
                    position: "relative",
                  }}
                ></span>
              </span>
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "#434655",
                textTransform: "uppercase",
              }}
            >
              ✨ Powered by Multimodal Vision &amp; OCR 4.0 · 42 University
              Campuses
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-in-up delay-100"
            style={{
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: "#131b2e",
              margin: 0,
            }}
          >
            Recover Lost Items
            <br />
            <span className="gradient-text">
              with Verified AI Intelligence.
            </span>
          </h1>

          {/* Body */}
          <p
            className="animate-fade-in-up delay-200"
            style={{
              fontSize: 16,
              color: "#434655",
              lineHeight: 1.7,
              maxWidth: 520,
              margin: 0,
            }}
          >
            An AI-powered secure community platform that helps students,
            faculty, and campus staff recover belongings safely — instant image
            matching, ownership verification, and zero-fraud physical handover
            protocols.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-in-up delay-300"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Link
              to="/dashboard/report-lost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 24px",
                borderRadius: 12,
                background: "#2563eb",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
                transition: "all 0.2s",
              }}
            >
              <Sparkles size={16} />
              Report Lost Item
            </Link>
            <Link
              to="/dashboard/report-found"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 24px",
                borderRadius: 12,
                background: "#71f8e4",
                color: "#006b5f",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <PlusCircle size={16} />
              Report Found Item
            </Link>
            <button
              className="hidden sm:flex"
              style={{
                alignItems: "center",
                gap: 8,
                padding: "13px 18px",
                borderRadius: 12,
                background: "#eaedff",
                color: "#434655",
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Search size={15} />
              Search Registry
              <kbd
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "#dae2fd",
                  fontSize: 11,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Trust strip */}
          <div
            className="animate-fade-in-up delay-400"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              alignItems: "center",
              paddingTop: 8,
            }}
          >
            {[
              {
                icon: Shield,
                label: "Official Institutional Partner",
                color: "#14b8a6",
              },
              {
                icon: Lock,
                label: "Encrypted Custody Chain",
                color: "#2563eb",
              },
              {
                icon: GraduationCap,
                label: ".edu SSO Verified Only",
                color: "#14b8a6",
              },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#434655",
                  fontWeight: 500,
                }}
              >
                <Icon size={16} color={color} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI scan preview card */}
        <div
          className="animate-fade-in-up delay-200"
          style={{ position: "relative" }}
        >
          {/* Glow behind card */}
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: 24,
              background:
                "radial-gradient(ellipse, rgba(37,99,235,0.15), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              borderRadius: 20,
              background: "white",
              padding: 24,
              boxShadow:
                "0 8px 48px rgba(37,99,235,0.12), 0 1px 0 rgba(195,198,215,0.5)",
              border: "1px solid rgba(195,198,215,0.4)",
              position: "relative",
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "#ba1a1a",
                    display: "block",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: "#131b2e",
                    textTransform: "uppercase",
                  }}
                >
                  Neural Vision Processor v4.0
                </span>
              </div>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(20,184,166,0.1)",
                  color: "#14b8a6",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Active Scan
              </span>
            </div>

            {/* Image with scan overlay */}
            <div
              style={{
                position: "relative",
                borderRadius: 12,
                overflow: "hidden",
                aspectRatio: "16/10",
                background: "#eaedff",
                marginBottom: 16,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&h=375&fit=crop&auto=format"
                alt="AirPods Pro on desk — AI scan target"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {/* Scan line */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  overflow: "hidden",
                }}
              >
                <div
                  className="animate-scan"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 2,
                    background:
                      "linear-gradient(90deg, transparent, rgba(20,184,166,0.8), transparent)",
                  }}
                />
              </div>
              {/* HUD corners */}
              {[
                {
                  top: 12,
                  left: 12,
                  borderTop: "2px solid #14b8a6",
                  borderLeft: "2px solid #14b8a6",
                },
                {
                  top: 12,
                  right: 12,
                  borderTop: "2px solid #14b8a6",
                  borderRight: "2px solid #14b8a6",
                },
                {
                  bottom: 12,
                  left: 12,
                  borderBottom: "2px solid #14b8a6",
                  borderLeft: "2px solid #14b8a6",
                },
                {
                  bottom: 12,
                  right: 12,
                  borderBottom: "2px solid #14b8a6",
                  borderRight: "2px solid #14b8a6",
                },
              ].map((style, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 16,
                    height: 16,
                    ...style,
                  }}
                />
              ))}
              {/* Labels */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "rgba(19,27,46,0.85)",
                  color: "white",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                ID: #SCAN-9042
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#71f8e4",
                  color: "#006b5f",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                100% OCR VALID
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{ fontSize: 12, color: "#434655", fontWeight: 500 }}
                >
                  Scanning registry…
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {scanProgress}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: "#eaedff",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #2563eb, #14b8a6)",
                    width: `${scanProgress}%`,
                    transition: "width 0.1s linear",
                  }}
                />
              </div>
            </div>

            {/* Match result */}
            {matchFound ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(20,184,166,0.08)",
                  border: "1px solid rgba(20,184,166,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  animation: "fadeInUp 0.4s ease",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: "#14b8a6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={18} color="white" />
                </div>
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: "#006b5f" }}
                  >
                    Match Found — 96.8% confidence
                  </div>
                  <div style={{ fontSize: 11, color: "#434655" }}>
                    AirPods Pro · Submitted 2h ago · Engineering Library
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "#eaedff",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <RefreshCw
                  size={16}
                  color="#2563eb"
                  style={{ animation: "spin 1.5s linear infinite" }}
                />
                <span style={{ fontSize: 12, color: "#434655" }}>
                  Comparing against 14,830 registry entries…
                </span>
              </div>
            )}
          </div>

          {/* Floating chips */}
          <div
            style={{
              position: "absolute",
              top: -16,
              right: -16,
              padding: "8px 14px",
              borderRadius: 12,
              background: "white",
              boxShadow: "0 4px 20px rgba(37,99,235,0.15)",
              border: "1px solid rgba(195,198,215,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#131b2e",
            }}
          >
            <TrendingUp size={14} color="#14b8a6" /> 98.2% match rate
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -14,
              left: -16,
              padding: "8px 14px",
              borderRadius: 12,
              background: "white",
              boxShadow: "0 4px 20px rgba(37,99,235,0.12)",
              border: "1px solid rgba(195,198,215,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#131b2e",
            }}
          >
            <Shield size={14} color="#2563eb" /> Zero fraud claims this week
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsBar() {
  return (
    <section
      style={{
        background: "white",
        borderTop: "1px solid #e2e7ff",
        borderBottom: "1px solid #e2e7ff",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        {STATS.map(({ value, label, icon: Icon, color }, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "24px 0",
              borderRight: i < STATS.length - 1 ? "1px solid #e2e7ff" : "none",
              paddingRight: i < STATS.length - 1 ? 24 : 0,
              paddingLeft: i > 0 ? 24 : 0,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${color}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#131b2e",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#434655",
                  fontWeight: 500,
                  marginTop: 3,
                }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 999,
            background: "#eaedff",
            marginBottom: 16,
          }}
        >
          <Zap size={13} color="#2563eb" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#2563eb",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            AI-Powered Features
          </span>
        </div>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 800,
            color: "#131b2e",
            letterSpacing: "-0.025em",
            margin: "0 0 16px",
          }}
        >
          Built for campus-scale recovery
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "#434655",
            lineHeight: 1.7,
            maxWidth: 580,
            margin: "0 auto",
          }}
        >
          Every feature is designed around the real workflow of students,
          finders, and campus administrators — not a generic lost & found form.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
        className="features-grid"
      >
        <style>{`@media(max-width:1000px){.features-grid{grid-template-columns:1fr 1fr!important;}}@media(max-width:640px){.features-grid{grid-template-columns:1fr!important;}}`}</style>
        {FEATURES.map(({ icon: Icon, title, desc, badge, color }) => (
          <div
            key={title}
            style={{
              padding: 24,
              borderRadius: 16,
              background: "white",
              border: "1px solid #e2e7ff",
              transition: "all 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 32px rgba(37,99,235,0.1)"
              ;(e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)"
              ;(e.currentTarget as HTMLElement).style.borderColor = `${color}40`
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
              ;(e.currentTarget as HTMLElement).style.transform = "none"
              ;(e.currentTarget as HTMLElement).style.borderColor = "#e2e7ff"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${color}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color={color} />
              </div>
              {badge && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#71f8e4",
                    color: "#006b5f",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#131b2e",
                margin: "0 0 8px",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#434655",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section style={{ background: "#131b2e", padding: "96px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 999,
              background: "rgba(37,99,235,0.2)",
              marginBottom: 16,
            }}
          >
            <Activity size={13} color="#71f8e4" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#71f8e4",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              How It Works
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-0.025em",
              margin: "0 0 16px",
            }}
          >
            From lost to returned in minutes
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.7,
              maxWidth: 540,
              margin: "0 auto",
            }}
          >
            A cryptographically secured workflow that keeps every step of the
            recovery process verifiable, auditable, and fraud-proof.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 16,
            overflow: "hidden",
          }}
          className="hiw-grid"
        >
          <style>{`@media(max-width:1000px){.hiw-grid{grid-template-columns:1fr 1fr!important;}}@media(max-width:640px){.hiw-grid{grid-template-columns:1fr!important;}}`}</style>
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
            <div
              key={step}
              style={{
                padding: 32,
                background: "#131b2e",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "relative",
              }}
            >
              {i < HOW_IT_WORKS.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: 40,
                    right: -12,
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                  className="hidden lg:flex"
                >
                  <ArrowRight size={16} color="rgba(255,255,255,0.2)" />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(37,99,235,0.2)",
                    border: "1px solid rgba(37,99,235,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color="#71f8e4" />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "JetBrains Mono, monospace",
                    letterSpacing: "0.02em",
                  }}
                >
                  {step}
                </span>
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "white",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AICapabilities() {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
        className="ai-grid"
      >
        <style>{`@media(max-width:1000px){.ai-grid{grid-template-columns:1fr!important;}}`}</style>

        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 999,
              background: "#eaedff",
              marginBottom: 20,
            }}
          >
            <Eye size={13} color="#2563eb" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#2563eb",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              AI Accuracy Benchmarks
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 38px)",
              fontWeight: 800,
              color: "#131b2e",
              letterSpacing: "-0.025em",
              margin: "0 0 16px",
            }}
          >
            Accuracy that earns institutional trust
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#434655",
              lineHeight: 1.7,
              margin: "0 0 40px",
            }}
          >
            Every model is validated against real campus datasets. No
            cherry-picked benchmarks — these are live platform numbers from 42
            partner institutions.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {AI_CAPABILITIES.map(({ label, value, color }) => (
              <div key={label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#131b2e" }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color,
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {value}%
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "#eaedff",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${color}, ${color}99)`,
                      width: `${value}%`,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 36 }}>
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                background: "#eaedff",
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#2563eb",
                  letterSpacing: "-0.02em",
                }}
              >
                4.2s
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#434655",
                  fontWeight: 500,
                  marginTop: 3,
                }}
              >
                Avg. image analysis time
              </div>
            </div>
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                background: "#eaedff",
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#14b8a6",
                  letterSpacing: "-0.02em",
                }}
              >
                0
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#434655",
                  fontWeight: 500,
                  marginTop: 3,
                }}
              >
                Fraudulent claims this semester
              </div>
            </div>
          </div>
        </div>

        {/* Fraud detection panel mock */}
        <div
          style={{
            borderRadius: 20,
            background: "white",
            border: "1px solid #e2e7ff",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(37,99,235,0.08)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e2e7ff",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <AlertTriangle size={16} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#131b2e" }}>
              Fraud Detection Log
            </span>
            <span
              style={{
                marginLeft: "auto",
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(20,184,166,0.1)",
                color: "#14b8a6",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Live
            </span>
          </div>

          {[
            {
              id: "#CLM-0091",
              label: "AirPods Pro — Claim",
              score: 99.4,
              status: "Verified",
              color: "#14b8a6",
            },
            {
              id: "#CLM-0088",
              label: "MacBook Air — Claim",
              score: 94.1,
              status: "Under Review",
              color: "#f59e0b",
            },
            {
              id: "#CLM-0085",
              label: "Fjällräven Bag",
              score: 99.8,
              status: "Verified",
              color: "#14b8a6",
            },
            {
              id: "#CLM-0082",
              label: "Galaxy S24 — Claim",
              score: 41.2,
              status: "Flagged",
              color: "#ba1a1a",
            },
            {
              id: "#CLM-0079",
              label: "Kindle Paperwhite",
              score: 97.3,
              status: "Verified",
              color: "#14b8a6",
            },
          ].map(({ id, label, score, status, color }) => (
            <div
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                borderBottom: "1px solid #e2e7ff",
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                  color: "#434655",
                  minWidth: 80,
                }}
              >
                {id}
              </div>
              <div
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#131b2e",
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color:
                    score > 90 ? "#14b8a6" : score > 60 ? "#f59e0b" : "#ba1a1a",
                }}
              >
                {score}%
              </div>
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: `${color}14`,
                  color,
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 90,
                  textAlign: "center",
                }}
              >
                {status}
              </div>
            </div>
          ))}

          <div
            style={{
              padding: "14px 20px",
              background: "#faf8ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: "#434655" }}>
              Showing 5 of 1,247 entries
            </span>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: "#2563eb",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              View All Logs <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section style={{ background: "#f2f3ff", padding: "96px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 999,
              background: "rgba(37,99,235,0.1)",
              marginBottom: 16,
            }}
          >
            <Star size={13} color="#2563eb" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#2563eb",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Trusted Across Campuses
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "#131b2e",
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            What the campus community says
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
          className="testimonial-grid"
        >
          <style>{`@media(max-width:1000px){.testimonial-grid{grid-template-columns:1fr 1fr!important;}}@media(max-width:640px){.testimonial-grid{grid-template-columns:1fr!important;}}`}</style>
          {TESTIMONIALS.map(({ quote, name, role, avatar, color, rating }) => (
            <div
              key={name}
              style={{
                padding: 28,
                borderRadius: 16,
                background: "white",
                border: "1px solid #e2e7ff",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />
                ))}
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#434655",
                  lineHeight: 1.7,
                  margin: 0,
                  flex: 1,
                }}
              >
                "{quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: `${color}1a`,
                    border: `2px solid ${color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color,
                  }}
                >
                  {avatar}
                </div>
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: "#131b2e" }}
                  >
                    {name}
                  </div>
                  <div style={{ fontSize: 11, color: "#434655" }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px" }}>
      <div
        style={{
          borderRadius: 24,
          background:
            "linear-gradient(135deg, #131b2e 0%, #1e2d50 50%, #0e2440 100%)",
          padding: "64px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glows */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "30%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(37,99,235,0.3), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: "20%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(20,184,166,0.2), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(113,248,228,0.15)",
              border: "1px solid rgba(113,248,228,0.25)",
              marginBottom: 24,
            }}
          >
            <Globe size={13} color="#71f8e4" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#71f8e4",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Available at 42 institutions worldwide
            </span>
          </div>

          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 48px)",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.03em",
              margin: "0 0 20px",
              lineHeight: 1.1,
            }}
          >
            Ready to deploy
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #71f8e4, #4fdbc8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              on your campus?
            </span>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              maxWidth: 480,
              margin: "0 auto 40px",
            }}
          >
            CampusRecover AI integrates with your existing .edu SSO in under 48
            hours. No infrastructure changes required.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 12,
                background: "#2563eb",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(37,99,235,0.4)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = "#1d4ed8"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = "#2563eb"
              }}
            >
              <BookOpen size={16} /> Request Institution Demo
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Users size={16} /> Student Sign Up Free
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 24,
              justifyContent: "center",
              marginTop: 36,
              flexWrap: "wrap",
            }}
          >
            {[
              "No setup fee",
              "FERPA compliant",
              "SOC 2 Type II",
              "99.9% SLA uptime",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 500,
                }}
              >
                <CircleCheck size={14} color="#4fdbc8" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <AICapabilities />
      <Testimonials />
      <CTA />
    </div>
  )
}
