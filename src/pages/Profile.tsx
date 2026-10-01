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
    item: "Campus Student ID Card",
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
    item: "Nike Dri-FIT Tech Fleece Hoodie",
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header Hero Card */}
      <div className="bg-[#131b2e] dark:bg-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/5 dark:border-gray-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div
          className="relative cursor-pointer group flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          title="Click to update avatar"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-3xl font-black text-white overflow-hidden shadow-lg border-2 border-white/20">
            {customUser.photoURL ? (
              <img
                src={customUser.photoURL}
                alt={customUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              customUser.name?.charAt(0).toUpperCase() || "U"
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
          </div>
          {customUser.verified && (
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-teal-500 border-2 border-[#131b2e] flex items-center justify-center text-white">
              <CheckCircle2 size={14} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {customUser.name}
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider border border-teal-500/30">
              {customUser.role || "Student"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 mb-4 flex flex-wrap items-center gap-x-2">
            <span>{customUser.email}</span>
            <span>·</span>
            <span>{customUser.department || "General Campus"}</span>
            {customUser.year ? <span>({customUser.year})</span> : null}
            <span>·</span>
            <span>{customUser.college || "University Campus"}</span>
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
                className="px-3 py-2 bg-white/10 dark:bg-gray-800 border border-white/20 dark:border-gray-700 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Department"
                value={editForm.department}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
                className="px-3 py-2 bg-white/10 dark:bg-gray-800 border border-white/20 dark:border-gray-700 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Year"
                value={editForm.year}
                onChange={(e) =>
                  setEditForm({ ...editForm, year: e.target.value })
                }
                className="w-20 px-3 py-2 bg-white/10 dark:bg-gray-800 border border-white/20 dark:border-gray-700 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="text-xs text-gray-400 mb-4">
              Contact Phone:{" "}
              <strong className="text-white">
                {customUser.phone || "Not provided"}
              </strong>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-4 sm:gap-6 pt-3 border-t border-white/10">
            {[
              {
                value: customUser.verified ? "100%" : "60%",
                label: "Trust Score",
              },
              { value: "3", label: "Items Returned" },
              { value: "5", label: "Reports Filed" },
              { value: "0", label: "Fraud Flags" },
            ].map(({ value, label }) => (
              <div key={label} className="text-left">
                <div className="text-lg sm:text-xl font-black text-white">
                  {value}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 self-start md:self-center">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Save size={14} /> {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-2 border border-white/15"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recovery Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Recovery Statistics & Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  icon: TrendingUp,
                  label: "Avg. Match Speed",
                  value: "3m 41s",
                  colorClass: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50",
                },
                {
                  icon: Star,
                  label: "Avg. Match Confidence",
                  value: "95.6%",
                  colorClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
                },
                {
                  icon: Clock,
                  label: "Longest Search",
                  value: "2d 4h",
                  colorClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
                },
                {
                  icon: Package,
                  label: "Total Items Value",
                  value: "~$820",
                  colorClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50",
                },
              ].map(({ icon: Icon, label, value, colorClass }) => (
                <div
                  key={label}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${colorClass}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {label}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claim History */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-base font-bold text-gray-900 dark:text-white">
                Claim & Verification History
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {CLAIM_HISTORY.map((claim) => (
                <div
                  key={claim.item}
                  className="flex items-center gap-3.5 p-4 sm:px-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-200/50 dark:border-teal-800/50">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                      {claim.item}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      {claim.date}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      Returned ✓
                    </div>
                    <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      {claim.match}% match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              Account Controls
            </h3>
            <div className="space-y-1">
              {[
                {
                  icon: Lock,
                  label: "Security Settings",
                  desc: "Password, 2FA, authorized devices",
                },
                {
                  icon: Bell,
                  label: "Notification Delivery",
                  desc: "Instant match alerts, in-app badges",
                },
                {
                  icon: Globe,
                  label: "Privacy & Data Controls",
                  desc: "Campus visibility, contact permissions",
                },
                {
                  icon: Shield,
                  label: "Campus SSO Trust",
                  desc: "Verified institutional identity",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                      {label}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Badge Box */}
          <div className="p-5 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Shield
                size={18}
                className={
                  customUser.verified
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400"
                }
              />
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {customUser.verified ? "Verified Campus Member" : "Standard Student Profile"}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { text: ".edu SSO verified", active: customUser.verified },
                { text: "Campus ID on file", active: true },
                { text: "Zero fraud history", active: true },
                { text: "Direct Handover authorized", active: true },
              ].map((item) => (
                <div
                  key={item.text}
                  className={`flex items-center gap-2 font-medium ${
                    item.active
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <CheckCircle2
                    size={14}
                    className={
                      item.active
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-gray-300 dark:text-gray-600"
                    }
                  />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
