import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import {
  FileWarning,
  CheckCircle2,
  Package,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  KeyRound,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { Item, ItemType } from "../types/Item"

export default function ReportHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<ItemType>("LOST")
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = SimpleItemService.subscribeItems(
      (newItems) => {
        setItems(newItems)
        setLoading(false)
      },
      {
        userId: user.uid,
        type: activeTab,
      },
    )
    return () => unsubscribe()
  }, [user?.uid, activeTab])

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to cancel and delete this report?"))
      return
    setDeletingId(itemId)
    try {
      await SimpleItemService.deleteItem(itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch (err) {
      console.error("Failed to delete report:", err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            My Campus Reports
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Track and manage your submitted lost and found item records.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/dashboard/report-lost"
            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200 dark:border-rose-800"
          >
            <Plus size={15} /> Report Lost
          </Link>
          <Link
            to="/dashboard/report-found"
            className="px-4 py-2.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-teal-200 dark:border-teal-800"
          >
            <Plus size={15} /> Report Found
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 max-w-sm border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("LOST")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "LOST"
              ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm font-black"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FileWarning size={14} /> My Lost Items
        </button>
        <button
          onClick={() => setActiveTab("FOUND")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "FOUND"
              ? "bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm font-black"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <CheckCircle2 size={14} /> My Found Items
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm font-medium">Loading your reports...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200/80 dark:border-gray-800 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No {activeTab.toLowerCase()} reports filed yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-6 max-w-sm mx-auto">
            When you report a {activeTab.toLowerCase()} item on campus, it will
            appear here with live AI matching and handover statuses.
          </p>
          <Link
            to={
              activeTab === "LOST"
                ? "/dashboard/report-lost"
                : "/dashboard/report-found"
            }
            className={`px-5 py-3 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === "LOST"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                : "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
            }`}
          >
            Create {activeTab === "LOST" ? "Lost" : "Found"} Report
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isLost = item.type === "LOST"
            const thumb = item.imageUrl || item.imageUrls?.[0]
            const isRecovered = item.status === "recovered"

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="text-gray-400" size={26} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                        {item.referenceNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          isRecovered
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : item.status === "possible_match"
                              ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5 mb-2">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {item.location}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {item.date} {item.time || ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <Link
                    to={`/dashboard/ai-match?ref=${item.referenceNumber}`}
                    className="px-3 py-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-purple-200 dark:border-purple-800"
                  >
                    <Sparkles size={14} /> AI Matches
                  </Link>

                  <Link
                    to={`/dashboard/scan-qr?lostRef=${item.referenceNumber}`}
                    className="px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                  >
                    <KeyRound size={14} /> Handover
                  </Link>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Delete report"
                  >
                    {deletingId === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
