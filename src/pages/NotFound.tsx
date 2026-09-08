import { Link } from "react-router"
import { Home, Search, ArrowRight } from "lucide-react"
import { LogoMark } from "../components/ui/Logo"

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <LogoMark size={48} />
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#eaedff",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            marginBottom: 8,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#131b2e",
            letterSpacing: "-0.025em",
            margin: "0 0 12px",
          }}
        >
          This page got lost too
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#434655",
            lineHeight: 1.7,
            margin: "0 0 32px",
          }}
        >
          We couldn't find the page you're looking for. Unlike lost items, this
          one can't be matched by AI.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 12,
              background: "#2563eb",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <Home size={16} /> Back to Home
          </Link>
          <Link
            to="/dashboard/lost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 12,
              background: "#eaedff",
              color: "#2563eb",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <Search size={16} /> Browse Items <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
