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
  ShieldCheck,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { Item, ItemType } from "../types/Item"
import { Badge } from "../components/ui/Badge"
import { StatusIndicator } from "../components/ui/StatusIndicator"

export default function ReportHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<ItemType>("LOST")
  const [items, setItems] = useState<Item[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      return
    }
    setLoading(true)

    // Subscribe to all reports for the user
    const unsubscribe = SimpleItemService.subscribeItems(
      (userReports) => {
        setAllItems(userReports)
        setItems(userReports.filter((it) => it.type === activeTab))
        setLoading(false)
      },
      {
        userId: user.uid,
      },
    )
    return () => unsubscribe()
  }, [user?.uid, activeTab])

  const lostCount = allItems.filter((it) => it.type === "LOST").length
  const foundCount = allItems.filter((it) => it.type === "FOUND").length
  const recoveredCount = allItems.filter((it) => it.status === "recovered").length

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to cancel and delete this report?"))
      return
    setDeletingId(itemId)
    try {
      await SimpleItemService.deleteItem(itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      setAllItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch (err) {
      console.error("Failed to delete report:", err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Package size={14} />
            <span>My Postings & Activity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Campus Reports
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your submitted lost or found possessions, view AI match suggestions, and execute safe handovers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/report-lost"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Report Lost
          </Link>
          <Link
            to="/dashboard/report-found"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Report Found
          </Link>
        </div>
      </div>

      {/* Metric Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Lost Reports</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {lostCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
            <FileWarning size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Found Reports</span>
            <span className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400">
              {foundCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Recovered</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {recoveredCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 max-w-sm border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("LOST")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "LOST"
              ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-black"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileWarning size={14} />
          <span>My Lost Items ({lostCount})</span>
        </button>
        <button
          onClick={() => setActiveTab("FOUND")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "FOUND"
              ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs font-black"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <CheckCircle2 size={14} />
          <span>My Found Items ({foundCount})</span>
        </button>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-sm font-medium text-slate-500">Loading your reports...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No {activeTab.toLowerCase()} reports filed yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-6 leading-relaxed">
            When you report a {activeTab.toLowerCase()} item on campus, it will appear here with live AI matching and recovery progress.
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
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex gap-4 items-start min-w-0">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="text-slate-400" size={26} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {item.referenceNumber}
                      </span>
                      <StatusIndicator status={item.status} size="sm" showLabel />
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 mb-2.5">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" /> {item.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" /> {item.date} {item.time || ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  <Link
                    to={`/dashboard/ai-match?ref=${item.referenceNumber}`}
                    className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-800/80"
                  >
                    <Sparkles size={14} /> AI Matches
                  </Link>

                  <Link
                    to={`/dashboard/scan-qr?${isLost ? "lostRef=" + item.referenceNumber : "foundRef=" + item.referenceNumber}`}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <KeyRound size={14} /> Handover
                  </Link>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
