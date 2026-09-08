import { useState, useRef } from "react"
import {
  Shield,
  Edit3,
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  Star,
  Lock,
  Bell,
  Globe,
  Camera,
  Save,
  X,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { UserService } from "../services/firebase/user.service"
import { CloudinaryService } from "../services/cloudinary/upload.service"

const CLAIM_HISTORY = [
  {
    item: "Stanford Student ID",
    date: "Aug 28, 2026",
    status: "returned",
    match: 99.1,
  },
  {
    item: "Kindle Paperwhite 11th Gen",
    date: "Jul 14, 2026",
    status: "returned",
    match: 97.3,
  },
  {
    item: "Nike Dri-FIT Hoodie",
    date: "May 3, 2026",
    status: "returned",
    match: 88.4,
  },
]

export default function Profile() {
  const { customUser } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editForm, setEditForm] = useState({
    phone: customUser?.phone || "",
    department: customUser?.department || "",
    year: customUser?.year || "",
  })

  const handleSave = async () => {
    if (!customUser) return
    setIsSaving(true)
    try {
      await UserService.updateUser(customUser.uid, {
        phone: editForm.phone || null,
        department: editForm.department || null,
        year: editForm.year || null,
      })
      window.location.reload()
    } catch (err) {
      console.error("Failed to update profile", err)
      setIsSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !customUser) return

    setIsUploading(true)
    try {
      const result = await CloudinaryService.uploadImage(file)
      await UserService.updateUser(customUser.uid, {
        photoURL: result.secure_url,
      })
      window.location.reload()
    } catch (err) {
      console.error("Failed to upload photo", err)
    } finally {
      setIsUploading(false)
    }
  }

  if (!customUser) return null

  return (
    <div
      style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 64px" }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Profile header */}
      <div
        style={{
          background: "linear-gradient(135deg, #131b2e, #1e2d50)",
          borderRadius: 20,
          padding: "32px",
          marginBottom: 28,
          display: "flex",
          alignItems: "flex-start",
          gap: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(rgba(37,99,235,0.25), transparent)",
          }}
        />

        <div
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: "linear-gradient(135deg, #2563eb, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "white",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {customUser.photoURL ? (
              <img
                src={customUser.photoURL}
                alt={customUser.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              customUser.name.charAt(0).toUpperCase()
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isUploading ? 1 : 0,
                transition: "opacity 0.2s",
              }}
              className="hover:opacity-100"
            >
              <Camera size={20} color="white" />
            </div>
          </div>
          {customUser.verified && (
            <div
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 22,
                height: 22,
                borderRadius: 999,
                background: "#14b8a6",
                border: "3px solid #131b2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={12} color="white" />
            </div>
          )}
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "white",
                margin: 0,
              }}
            >
              {customUser.name}
            </h1>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(113,248,228,0.2)",
                color: "#71f8e4",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {customUser.role}
            </span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 16,
            }}
          >
            {customUser.email} · {customUser.department || "No Department"}{" "}
            {customUser.year ? `(${customUser.year})` : ""} ·{" "}
            {customUser.college || "No College"}
          </div>

          {isEditing ? (
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
              <input
                type="text"
                placeholder="Department"
                value={editForm.department}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
              <input
                type="text"
                placeholder="Year"
                value={editForm.year}
                onChange={(e) =>
                  setEditForm({ ...editForm, year: e.target.value })
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  width: 80,
                }}
              />
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 16,
              }}
            >
              Phone: {customUser.phone || "Not provided"}
            </div>
          )}

          <div style={{ display: "flex", gap: 20 }}>
            {[
              {
                value: customUser.verified ? "100" : "50",
                label: "Trust Score",
              },
              { value: "3", label: "Items Returned" },
              { value: "5", label: "Reports Filed" },
              { value: "0", label: "Fraud Flags" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "white",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.45)",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 10,
                background: "#2563eb",
                border: "none",
                color: "white",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Save size={13} /> {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Edit3 size={13} /> Edit Profile
          </button>
        )}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}
        className="profile-grid"
      >
        <style>{`@media(max-width:900px){.profile-grid{grid-template-columns:1fr!important;}}`}</style>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* AI Stats */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #e2e7ff",
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#131b2e",
                margin: "0 0 20px",
              }}
            >
              Recovery Statistics
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {[
                {
                  icon: TrendingUp,
                  label: "Avg. Match Speed",
                  value: "3m 41s",
                  color: "#14b8a6",
                },
                {
                  icon: Star,
                  label: "Avg. Match Confidence",
                  value: "95.6%",
                  color: "#2563eb",
                },
                {
                  icon: Clock,
                  label: "Longest Search",
                  value: "2d 4h",
                  color: "#f59e0b",
                },
                {
                  icon: Package,
                  label: "Total Items Value",
                  value: "~$820",
                  color: "#2563eb",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: "#faf8ff",
                    border: "1px solid #e2e7ff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Icon size={15} color={color} />
                    <span
                      style={{
                        fontSize: 11,
                        color: "#737686",
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#131b2e",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claim history */}
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
                padding: "16px 20px",
                borderBottom: "1px solid #e2e7ff",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "#131b2e" }}>
                Claim History
              </span>
            </div>
            {CLAIM_HISTORY.map((claim) => (
              <div
                key={claim.item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 20px",
                  borderBottom: "1px solid #f2f3ff",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(20,184,166,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={18} color="#14b8a6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#131b2e" }}
                  >
                    {claim.item}
                  </div>
                  <div style={{ fontSize: 11, color: "#737686" }}>
                    {claim.date}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: "#14b8a6" }}
                  >
                    Returned ✓
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "JetBrains Mono, monospace",
                      color: "#737686",
                    }}
                  >
                    {claim.match}% match
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #e2e7ff",
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#131b2e",
                marginBottom: 14,
              }}
            >
              Account Settings
            </div>
            {[
              {
                icon: Lock,
                label: "Security Settings",
                desc: "Password, 2FA, devices",
              },
              {
                icon: Bell,
                label: "Notifications",
                desc: "Match alerts, messages",
              },
              {
                icon: Globe,
                label: "Privacy",
                desc: "Visibility, data controls",
              },
              {
                icon: Shield,
                label: "Trust & Verification",
                desc: "Score history, .edu SSO",
              },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid #f2f3ff",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#eaedff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} color="#2563eb" />
                </div>
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#131b2e" }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: "#737686" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: "rgba(37,99,235,0.04)",
              border: "1px solid rgba(37,99,235,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Shield
                size={16}
                color={customUser.verified ? "#2563eb" : "#737686"}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#131b2e" }}>
                {customUser.verified
                  ? "Verified Account"
                  : "Unverified Account"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { text: ".edu SSO verified", active: customUser.verified },
                { text: "Government ID on file", active: false },
                { text: "Face-scan enrolled", active: false },
                { text: "Zero fraud history", active: true },
              ].map((item) => (
                <div
                  key={item.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12,
                    color: item.active ? "#434655" : "#a1a1aa",
                  }}
                >
                  <CheckCircle2
                    size={13}
                    color={item.active ? "#14b8a6" : "#e4e4e7"}
                  />{" "}
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
