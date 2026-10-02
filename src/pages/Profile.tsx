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
  User,
  GraduationCap,
  Building,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { UserService } from "../services/firebase/user.service"
import { CloudinaryService } from "../services/cloudinary/upload.service"
import { Badge } from "../components/ui/Badge"

const CLAIM_HISTORY = [
  {
    item: "Campus Student ID Card",
    date: "Sep 28, 2026",
    status: "recovered",
    match: 99.1,
  },
  {
    item: "Apple AirPods Pro (2nd Gen)",
    date: "Aug 14, 2026",
    status: "recovered",
    match: 97.3,
  },
  {
    item: "Scientific Calculator FX-991EX",
    date: "Jul 3, 2026",
    status: "recovered",
    match: 92.4,
  },
]

export default function Profile() {
  const { customUser, user } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editForm, setEditForm] = useState({
    phone: customUser?.phone || (customUser as any)?.mobile || "",
    department: customUser?.department || "Computer Science & Engineering",
    year: customUser?.year || "3rd Year",
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

  if (!customUser && !user) return null

  const displayName = customUser?.name || user?.displayName || "Campus Student"
  const displayEmail = customUser?.email || user?.email || "student@university.edu"
  const displayPhoto = customUser?.photoURL || user?.photoURL

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header Hero Card */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div
          className="relative cursor-pointer group shrink-0"
          onClick={() => fileInputRef.current?.click()}
          title="Click to update avatar"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-3xl font-black text-white overflow-hidden shadow-lg border-2 border-white/20">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 border-2 border-slate-900 flex items-center justify-center text-white">
            <CheckCircle2 size={14} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {displayName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider border border-teal-500/30">
              {customUser?.role || "Student"}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mb-4 flex flex-wrap items-center gap-x-2">
            <span>{displayEmail}</span>
            <span>•</span>
            <span>{customUser?.department || editForm.department}</span>
            <span>•</span>
            <span>{customUser?.college || "Main Campus"}</span>
          </p>

          {isEditing ? (
            <div className="flex flex-wrap gap-2.5 mb-4">
              <input
                type="text"
                placeholder="Mobile number"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Department"
                value={editForm.department}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Year"
                value={editForm.year}
                onChange={(e) =>
                  setEditForm({ ...editForm, year: e.target.value })
                }
                className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="text-xs text-slate-400 mb-4">
              Contact Phone:{" "}
              <strong className="text-white">
                {customUser?.phone || (customUser as any)?.mobile || "Not specified"}
              </strong>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-5 pt-3 border-t border-slate-800">
            {[
              { value: "100%", label: "Campus Trust" },
              { value: "3", label: "Recovered" },
              { value: "5", label: "Reports" },
              { value: "0", label: "Infractions" },
            ].map(({ value, label }) => (
              <div key={label} className="text-left">
                <div className="text-base sm:text-lg font-black text-white">
                  {value}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 self-start md:self-center">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Save size={14} /> {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Metrics */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Campus Intelligence Telemetry
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  icon: TrendingUp,
                  label: "Average AI Match Speed",
                  value: "2m 14s",
                  colorClass: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50",
                },
                {
                  icon: Star,
                  label: "Neural Confidence Average",
                  value: "96.4%",
                  colorClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
                },
                {
                  icon: Clock,
                  label: "Average Custody Duration",
                  value: "1d 4h",
                  colorClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
                },
                {
                  icon: Package,
                  label: "Handover Success Rate",
                  value: "100%",
                  colorClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50",
                },
              ].map(({ icon: Icon, label, value, colorClass }) => (
                <div
                  key={label}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${colorClass}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {label}
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Claims & Verifications */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Verified Recovery History
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {CLAIM_HISTORY.map((claim) => (
                <div
                  key={claim.item}
                  className="flex items-center gap-3.5 p-4 sm:px-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-800/50">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {claim.item}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {claim.date}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      Recovered ✓
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {claim.match}% AI match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Security, Trust & Controls */}
        <div className="space-y-6">
          {/* Institutional Trust Verification Box */}
          <div className="p-5 rounded-3xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Verified Campus Identity
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { text: "University Single Sign-On Verified", active: true },
                { text: "Campus ID on Record", active: true },
                { text: "Safe Handover Authorized", active: true },
                { text: "Zero Infraction Score", active: true },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account Settings Menu */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Account Preferences
            </h3>
            <div className="space-y-1">
              {[
                {
                  icon: Lock,
                  label: "Security & Authentication",
                  desc: "Credential access and sessions",
                },
                {
                  icon: Bell,
                  label: "Notification Dispatch",
                  desc: "Instant AI match alerts",
                },
                {
                  icon: Globe,
                  label: "Privacy & Contact Masking",
                  desc: "Campus visibility limits",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {label}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
