import {
  Building2,
  Package,
  Clock,
  MapPin,
  Phone,
  QrCode,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const OFFICES = [
  {
    name: "Engineering Library — Lost & Found",
    address: "550 Serra Mall, Building 550",
    phone: "650-723-1234",
    hours: { weekday: "8:00 AM – 8:00 PM", weekend: "10:00 AM – 6:00 PM" },
    items: 23,
    img: "https://images.unsplash.com/photo-1481487196290-c152efe083f5?w=400&h=200&fit=crop",
    featured: true,
    status: "open",
  },
  {
    name: "Student Union — Main Lost & Found",
    address: "Tresidder Union, Room 101",
    phone: "650-723-5678",
    hours: { weekday: "9:00 AM – 9:00 PM", weekend: "11:00 AM – 7:00 PM" },
    items: 41,
    img: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop",
    featured: false,
    status: "open",
  },
  {
    name: "Green Library — Circulation Desk",
    address: "Cecil H. Green Library, Floor 1",
    phone: "650-723-9012",
    hours: { weekday: "8:00 AM – 10:00 PM", weekend: "10:00 AM – 8:00 PM" },
    items: 18,
    img: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=200&fit=crop",
    featured: false,
    status: "open",
  },
]

const INVENTORY = [
  {
    id: "#FI-3821",
    name: "Apple AirPods Pro",
    category: "Electronics",
    since: "2h ago",
    match: 96.8,
    img: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=60&h=60&fit=crop",
  },
  {
    id: "#FI-3815",
    name: 'MacBook Air 15" M3',
    category: "Electronics",
    since: "6h ago",
    match: null,
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=60&h=60&fit=crop",
  },
  {
    id: "#FI-3809",
    name: "Stanford Student ID",
    category: "Documents",
    since: "1d ago",
    match: null,
    img: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=60&h=60&fit=crop",
  },
  {
    id: "#FI-3801",
    name: "Fjällräven Kånken Navy",
    category: "Bags",
    since: "2d ago",
    match: null,
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=60&h=60&fit=crop",
  },
]

export default function CampusOffice() {
  return (
    <div
      style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 64px" }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#131b2e",
            letterSpacing: "-0.025em",
            margin: "0 0 6px",
          }}
        >
          Campus Lost &amp; Found Offices
        </h1>
        <p style={{ fontSize: 14, color: "#434655", margin: 0 }}>
          All physical offices are integrated with CampusRecover AI. Items are
          logged digitally upon receipt.
        </p>
      </div>

      {/* Office cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 40,
        }}
        className="office-grid"
      >
        <style>{`@media(max-width:1000px){.office-grid{grid-template-columns:1fr 1fr!important;}}@media(max-width:640px){.office-grid{grid-template-columns:1fr!important;}}`}</style>
        {OFFICES.map((office) => (
          <div
            key={office.name}
            style={{
              borderRadius: 16,
              background: "white",
              border: `2px solid ${office.featured ? "#2563eb30" : "#e2e7ff"}`,
              overflow: "hidden",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 32px rgba(37,99,235,0.1)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
            }}
          >
            <div style={{ position: "relative" }}>
              <img
                src={office.img}
                alt={office.name}
                style={{ width: "100%", height: 140, objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(20,184,166,0.9)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                ● Open Now
              </div>
              {office.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "rgba(37,99,235,0.9)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  ★ Primary
                </div>
              )}
            </div>
            <div style={{ padding: 20 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#131b2e",
                  margin: "0 0 10px",
                  lineHeight: 1.3,
                }}
              >
                {office.name}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <MapPin size={13} color="#737686" />
                  <span style={{ fontSize: 12, color: "#737686" }}>
                    {office.address}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Clock size={13} color="#737686" />
                  <span style={{ fontSize: 12, color: "#737686" }}>
                    Mon–Fri: {office.hours.weekday}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Phone size={13} color="#737686" />
                  <span style={{ fontSize: 12, color: "#737686" }}>
                    {office.phone}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#eaedff",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Package size={14} color="#2563eb" />
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}
                  >
                    {office.items} items
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#434655" }}>
                  in custody
                </span>
              </div>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <QrCode size={14} /> Get Pickup QR Code
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Office inventory */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#131b2e",
              margin: 0,
            }}
          >
            Engineering Library — Current Inventory
          </h2>
          <span style={{ fontSize: 13, color: "#434655" }}>
            23 items in custody
          </span>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #e2e7ff",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 100px 90px 90px",
              gap: 16,
              padding: "10px 20px",
              background: "#faf8ff",
              fontSize: 11,
              fontWeight: 700,
              color: "#737686",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span>Item</span>
            <span>Category</span>
            <span>Logged</span>
            <span>AI Match</span>
            <span>Action</span>
          </div>
          {INVENTORY.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 100px 90px 90px",
                gap: 16,
                padding: "14px 20px",
                borderBottom: "1px solid #f2f3ff",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={item.img}
                  alt={item.name}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: "1px solid #e2e7ff",
                  }}
                />
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#131b2e" }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 11,
                      color: "#737686",
                    }}
                  >
                    {item.id}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#434655" }}>
                {item.category}
              </span>
              <span style={{ fontSize: 12, color: "#737686" }}>
                {item.since}
              </span>
              <span>
                {item.match ? (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgba(20,184,166,0.1)",
                      color: "#14b8a6",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {item.match}%
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: "#737686" }}>
                    Scanning…
                  </span>
                )}
              </span>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
                  borderRadius: 7,
                  background: "#eaedff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2563eb",
                }}
              >
                <CheckCircle2 size={12} /> Claim <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
