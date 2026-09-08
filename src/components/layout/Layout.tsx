import { Outlet } from "react-router"
import { Navbar } from "./Navbar"

export function Layout() {
  return (
    <div style={{ minHeight: "100%", background: "#faf8ff" }}>
      <Navbar />
      <main style={{ paddingTop: 96 }}>
        <Outlet />
      </main>
      <footer
        style={{ background: "#131b2e", padding: "32px 24px", marginTop: 0 }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            © 2026 CampusRecover AI. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms of Service", "FERPA Notice"].map(
              (link) => (
                <a
                  key={link}
                  href="#"
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                    textDecoration: "none",
                  }}
                >
                  {link}
                </a>
              ),
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

export function AuthLayout() {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "#faf8ff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Outlet />
    </div>
  )
}
