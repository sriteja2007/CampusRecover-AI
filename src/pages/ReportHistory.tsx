import React, { useState, useEffect } from "react"
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
  Check,
  Lock,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { SimpleClaimService } from "../services/simpleClaim.service"
import { Item, ItemType } from "../types/Item"
import { Claim } from "../types/Claim"
import { Badge } from "../components/ui/Badge"
import { StatusIndicator } from "../components/ui/StatusIndicator"
import { Button } from "../components/ui/Button"

type HistoryTab = "ALL" | "LOST" | "FOUND" | "ACTIVE" | "RECOVERED" | "CLAIMS"

export default function ReportHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<HistoryTab>("ALL")
  const [allItems, setAllItems] = useState<Item[]>([])
  const [myClaims, setMyClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      return
    }
    setLoading(true)

    // Subscribe to all reports for the user
    const unsubscribeItems = SimpleItemService.subscribeItems(
      (userReports) => {
        setAllItems(userReports)
        setLoading(false)
      },
      {
        userId: user.uid,
      },
    )

    // Load user claims
    SimpleClaimService.getClaims({ claimantId: user.uid }).then((claims) => {
      setMyClaims(claims)
    })

    return () => {
      unsubscribeItems()
    }
  }, [user?.uid])

  const lostCount = allItems.filter((it) => it.type === "LOST").length
  const foundCount = allItems.filter((it) => it.type === "FOUND").length
  const activeCount = allItems.filter(
    (it) => it.status !== "recovered" && it.status !== "closed",
  ).length
  const recoveredCount = allItems.filter((it) => it.status === "recovered").length
  const claimsCount = myClaims.length

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to cancel and delete this report?"))
      return
    setDeletingId(itemId)
    try {
      await SimpleItemService.deleteItem(itemId)
      setAllItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch (err) {
      console.error("Failed to delete report:", err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkRecovered = async (itemId: string) => {
    if (!confirm("Confirm that this item has been safely recovered and custody returned?"))
      return
    setUpdatingId(itemId)
    try {
      await SimpleItemService.updateItem(itemId, { status: "recovered" })
      setAllItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: "recovered" } : i)),
      )
    } catch (err) {
      console.error("Failed to mark item recovered:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter items based on activeTab
  const filteredItems = allItems.filter((it) => {
    if (activeTab === "ALL") return true
    if (activeTab === "LOST") return it.type === "LOST"
    if (activeTab === "FOUND") return it.type === "FOUND"
    if (activeTab === "ACTIVE") return it.status !== "recovered" && it.status !== "closed"
    if (activeTab === "RECOVERED") return it.status === "recovered"
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Package size={14} />
            <span>My Postings &amp; Claims</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Campus Reports &amp; Claims
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your submitted lost or found possessions, view verification progress, and track ownership claims.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/dashboard/report-lost">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 shadow-xs">
              <Plus size={15} /> Report Lost
            </Button>
          </Link>
          <Link to="/dashboard/report-found">
            <Button size="sm" variant="outline" className="font-bold gap-1.5">
              <Plus size={15} /> Report Found
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Lost Reports</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {lostCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
            <FileWarning size={18} />
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
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">My Claims</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {claimsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <ShieldCheck size={18} />
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
            <Check size={18} />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: All, Lost, Found, Active, Recovered, My Claims */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 max-w-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
        {[
          { id: "ALL", label: `All Reports (${allItems.length})` },
          { id: "LOST", label: `Lost (${lostCount})` },
          { id: "FOUND", label: `Found (${foundCount})` },
          { id: "ACTIVE", label: `Active (${activeCount})` },
          { id: "RECOVERED", label: `Recovered (${recoveredCount})` },
          { id: "CLAIMS", label: `My Claims (${claimsCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as HistoryTab)}
            className={`px-3 py-2 rounded-xl transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-sm font-medium text-slate-500">Loading your history...</p>
        </div>
      ) : activeTab === "CLAIMS" ? (
        /* MY CLAIMS TAB VIEW */
        myClaims.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Claims Filed Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-6 leading-relaxed">
              When you identify an item in the Found directory and submit an ownership claim, it will be tracked here.
            </p>
            <Link to="/items?type=FOUND">
              <Button className="font-bold text-xs">Browse Found Items</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 text-xs bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-lg">
                      {claim.itemReference || "CR-ITEM"}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {claim.itemTitle}
                    </h3>
                  </div>

                  <Badge
                    variant={
                      claim.status === "approved"
                        ? "recovered"
                        : claim.status === "rejected"
                        ? "destructive"
                        : "purple"
                    }
                  >
                    {claim.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Your Stated Proof</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{claim.reason}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Identifying Marks</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                      {claim.uniqueCharacteristics || "None specified"}
                    </p>
                  </div>
                </div>

                {/* If approved, show the Handover OTP / QR code */}
                {claim.otpCode && (
                  <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                        🎉 Ownership Verified by Administration!
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Present this single-use 6-digit OTP code to the finder or at the campus security desk.
                      </span>
                    </div>

                    <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 font-mono font-black text-xl text-emerald-600 tracking-widest text-center shadow-xs">
                      {claim.otpCode}
                    </div>
                  </div>
                )}

                {claim.rejectionReason && (
                  <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                    <strong>Admin Notice:</strong> {claim.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* REPORTS LIST (Filtered Items) */
        filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching reports
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-6 leading-relaxed">
              You haven&apos;t filed any reports under this filter.
            </p>
            <Link to="/dashboard/report-lost">
              <Button className="font-bold text-xs">Create a New Report</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
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
                          <MapPin size={13} className="text-slate-400" />{" "}
                          {item.locationName || item.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" /> {item.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    <Link to={`/items/${item.id}`}>
                      <Button variant="outline" size="sm" className="font-bold text-xs gap-1">
                        <Eye size={13} /> View
                      </Button>
                    </Link>

                    {!isRecovered && (
                      <Button
                        size="sm"
                        disabled={updatingId === item.id}
                        onClick={() => handleMarkRecovered(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 shadow-xs"
                      >
                        <Check size={13} /> Mark Recovered
                      </Button>
                    )}

                    <button
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      title="Delete Report"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
