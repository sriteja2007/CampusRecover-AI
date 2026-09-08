import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  Clock,
  ChevronRight,
  Package,
  FileQuestion,
  Loader2,
  Trash2,
  Edit3,
  MapPin,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  LostItemService,
  FoundItemService,
} from "../services/firebase/item.service"
import { LostItem } from "../types/LostItem"
import { FoundItem } from "../types/FoundItem"
import { CATEGORY_OPTIONS } from "../schemas/reportSchemas"

const STATUS_CONFIG: Record<string, {
  icon: any
  color: string
  bg: string
  label: string
}> = {
  pending: {
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    label: "Pending",
  },
  matched: {
    icon: CheckCircle2,
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.1)",
    label: "Matched",
  },
  claimed: {
    icon: Eye,
    color: "#2563eb",
    bg: "rgba(37,99,235,0.1)",
    label: "Claimed",
  },
  resolved: {
    icon: CheckCircle2,
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    label: "Resolved",
  },
  rejected: {
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    label: "Rejected",
  },
}

function formatDate(timestamp: any): string {
  if (!timestamp?.toDate) return "—"
  return timestamp.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function ReportHistory() {
  const { user } = useAuth()
  const [tab, setTab] = useState<"lost" | "found">("lost")
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [foundItems, setFoundItems] = useState<FoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        const [lost, found] = await Promise.all([
          LostItemService.getByUser(user.uid),
          FoundItemService.getByUser(user.uid),
        ])
        setLostItems(lost)
        setFoundItems(found)
      } catch (err) {
        console.error("Failed to load reports:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (id: string, type: "lost" | "found") => {
    if (!confirm("Are you sure you want to delete this report?")) return
    try {
      if (type === "lost") {
        await LostItemService.delete(id)
        setLostItems((prev) => prev.filter((i) => i.id !== id))
      } else {
        await FoundItemService.delete(id)
        setFoundItems((prev) => prev.filter((i) => i.id !== id))
      }
      showToast("success", "Report deleted.")
    } catch {
      showToast("error", "Failed to delete report.")
    }
  }

  const activeItems = tab === "lost" ? lostItems : foundItems

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">My Reports</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">
          My Reports
        </h1>
        <p className="text-gray-500 mt-1">
          Track the status of your lost and found item reports.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 max-w-xs">
        <button
          onClick={() => setTab("lost")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
            tab === "lost"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileQuestion size={15} /> Lost ({lostItems.length})
        </button>
        <button
          onClick={() => setTab("found")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
            tab === "found"
              ? "bg-white text-teal-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Package size={15} /> Found ({foundItems.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-gray-500">Loading your reports...</p>
        </div>
      ) : activeItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            {tab === "lost" ? (
              <FileQuestion size={28} className="text-gray-300" />
            ) : (
              <Package size={28} className="text-gray-300" />
            )}
          </div>
          <h3 className="text-lg font-bold text-[#131b2e] mb-1">
            No {tab} reports yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {tab === "lost"
              ? "Report a lost item to get started."
              : "Report a found item to help someone."}
          </p>
          <Link
            to={
              tab === "lost"
                ? "/dashboard/report-lost"
                : "/dashboard/report-found"
            }
            className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors ${
              tab === "lost"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-teal-500 hover:bg-teal-600"
            }`}
          >
            Report {tab === "lost" ? "Lost" : "Found"} Item
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {activeItems.map((item) => {
            const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
            const StatusIcon = st.icon
            const thumb = item.imageUrls?.[0]
            const catLabel =
              CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label ||
              item.category

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex gap-4 p-5">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 border border-gray-200 overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {tab === "lost" ? (
                          <FileQuestion size={20} className="text-gray-300" />
                        ) : (
                          <Package size={20} className="text-gray-300" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-[#131b2e] text-sm line-clamp-1">
                        {item.title}
                      </h3>
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                        style={{ background: st.bg, color: st.color }}
                      >
                        <StatusIcon size={12} /> {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={11} />
                        {"locationLost" in item
                          ? (item as LostItem).locationLost
                          : (item as FoundItem).locationFound}
                      </div>
                      <span className="text-xs text-gray-400">{catLabel}</span>
                      <span className="text-xs text-gray-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline bar */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {["pending", "matched", "claimed", "resolved"].map(
                      (s, i) => {
                        const stepOrder = [
                          "pending",
                          "matched",
                          "claimed",
                          "resolved",
                        ]
                        const currentIdx = stepOrder.indexOf(item.status)
                        const isActive = i <= currentIdx
                        return (
                          <div key={s} className="flex items-center gap-1.5">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isActive ? "bg-teal-500" : "bg-gray-200"
                              }`}
                            />
                            <span
                              className={`text-[10px] font-semibold ${
                                isActive ? "text-teal-600" : "text-gray-400"
                              }`}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </span>
                            {i < 3 && (
                              <div
                                className={`w-6 h-0.5 ${
                                  isActive && i < currentIdx
                                    ? "bg-teal-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            )}
                          </div>
                        )
                      },
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(item.id, tab)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
