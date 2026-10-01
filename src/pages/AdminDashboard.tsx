import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import {
  Shield,
  Users,
  Package,
  FileWarning,
  CheckCircle2,
  Sparkles,
  Search,
  Check,
  X,
  Plus,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  UserX,
  Clock,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { SimpleMatchingService } from "../services/simpleMatching.service"
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS, ROLES } from "../config/constants"
import { Item } from "../types/Item"
import { Match } from "../types/Match"

type AdminTab = "overview" | "items" | "matches" | "manual_match" | "users"

export default function AdminDashboard() {
  const { user, customUser, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [loading, setLoading] = useState(true)

  // Data states
  const [items, setItems] = useState<Item[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Manual match states
  const [manualLostRef, setManualLostRef] = useState("")
  const [manualFoundRef, setManualFoundRef] = useState("")
  const [manualCreating, setManualCreating] = useState(false)
  const [manualSuccess, setManualSuccess] = useState<string | null>(null)
  const [manualError, setManualError] = useState<string | null>(null)

  // Items tab sub-filter
  const [itemTypeFilter, setItemTypeFilter] =
    useState<"ALL" | "LOST" | "FOUND">("ALL")

  useEffect(() => {
    loadAllAdminData()
  }, [])

  const loadAllAdminData = async () => {
    setLoading(true)
    try {
      const [allItems, allMatches, usersSnap] = await Promise.all([
        SimpleItemService.getItems(),
        SimpleMatchingService.getAllMatches(),
        getDocs(collection(db, COLLECTIONS.USERS)).catch(() => ({ docs: [], forEach: () => {} })),
      ])

      setItems(allItems)
      setMatches(allMatches)

      const fetchedUsers: any[] = []
      if ((usersSnap as any)?.forEach) {
        (usersSnap as any).forEach((d: any) => fetchedUsers.push({ id: d.id, ...d.data() }))
      }
      setUsersList(fetchedUsers)
    } catch (err) {
      console.error("Failed to load admin data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Handle Manual Match Creation
  const handleCreateManualMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setManualError(null)
    setManualSuccess(null)

    if (!manualLostRef.trim() || !manualFoundRef.trim()) {
      setManualError(
        "Please specify both a Lost Item Reference and a Found Item Reference.",
      )
      return
    }

    let lostItem = items.find(
      (it) =>
        it.type === "LOST" &&
        it.referenceNumber?.toLowerCase() === manualLostRef.trim().toLowerCase(),
    )
    if (!lostItem) {
      lostItem = (await SimpleItemService.getItemByReference(manualLostRef)) || undefined
    }

    let foundItem = items.find(
      (it) =>
        it.type === "FOUND" &&
        it.referenceNumber?.toLowerCase() ===
          manualFoundRef.trim().toLowerCase(),
    )
    if (!foundItem) {
      foundItem = (await SimpleItemService.getItemByReference(manualFoundRef)) || undefined
    }

    if (!lostItem) {
      setManualError(
        `Lost item with reference "${manualLostRef}" was not found in database.`,
      )
      return
    }
    if (!foundItem) {
      setManualError(
        `Found item with reference "${manualFoundRef}" was not found in database.`,
      )
      return
    }

    setManualCreating(true)
    try {
      const created = await SimpleMatchingService.createManualMatch(
        lostItem,
        foundItem,
      )
      setManualSuccess(
        `Match created successfully between ${lostItem.referenceNumber} and ${foundItem.referenceNumber}! Users have been notified and contact details exchanged.`,
      )
      setMatches((prev) => [created, ...prev])
      setManualLostRef("")
      setManualFoundRef("")
    } catch (err: any) {
      setManualError(err.message || "Failed to create manual match.")
    } finally {
      setManualCreating(false)
    }
  }

  // Handle Match Status update
  const handleUpdateMatchStatus = async (
    matchId: string,
    status: "confirmed" | "rejected",
  ) => {
    try {
      await SimpleMatchingService.updateMatchStatus(matchId, status)
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, status, contactShared: status === "confirmed" }
            : m,
        ),
      )
    } catch (err) {
      console.error("Failed to update match:", err)
    }
  }

  // Mark Item as Recovered directly
  const handleMarkItemRecovered = async (itemId: string) => {
    try {
      await SimpleItemService.updateItem(itemId, { status: "recovered" })
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: "recovered" } : i)),
      )
    } catch (err) {
      console.error("Failed to mark recovered:", err)
    }
  }

  // Delete / Remove Item
  const handleDeleteItem = async (itemId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this item report from the database?",
      )
    )
      return
    try {
      await SimpleItemService.deleteItem(itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch (err) {
      console.error("Failed to delete item:", err)
    }
  }

  // Toggle User Status
  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled"
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        status: newStatus,
        isBanned: newStatus === "disabled",
      })
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: newStatus, isBanned: newStatus === "disabled" }
            : u,
        ),
      )
    } catch (err) {
      console.error("Failed to update user status:", err)
    }
  }

  // Role verification (Admin only)
  const isAdmin =
    customUser?.role === ROLES.ADMIN ||
    customUser?.role === ROLES.SUPERADMIN ||
    user?.email?.toLowerCase() === "admin@gmail.com"

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-red-200 dark:border-red-900/50 shadow-xl max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/40">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Portal Restricted
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This command center is reserved for campus administrators. Please
            sign in with authorized admin credentials.
          </p>
          <Link
            to="/login"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold block transition-colors shadow-md shadow-blue-500/20"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    )
  }

  // Filtered Items for search
  const filteredItems = items.filter((it) => {
    const matchesType = itemTypeFilter === "ALL" || it.type === itemTypeFilter
    if (!matchesType) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      it.referenceNumber?.toLowerCase().includes(q) ||
      it.itemName?.toLowerCase().includes(q) ||
      it.userName?.toLowerCase().includes(q) ||
      it.userEmail?.toLowerCase().includes(q) ||
      it.category?.toLowerCase().includes(q) ||
      it.location?.toLowerCase().includes(q)
    )
  })

  // Statistics
  const totalLost = items.filter((i) => i.type === "LOST").length
  const totalFound = items.filter((i) => i.type === "FOUND").length
  const totalRecovered = items.filter((i) => i.status === "recovered").length
  const pendingMatchesCount = matches.filter(
    (m) => m.status === "pending",
  ).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Admin Top Header */}
      <div className="bg-[#131b2e] dark:bg-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/5 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-500/30">
              Admin Command Center
            </span>
            <span className="text-xs text-gray-400">admin@gmail.com</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            CampusRecover Administration
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadAllAdminData}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
          <button
            onClick={() => {
              logout()
              navigate("/login")
            }}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "items"
              ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          Items Management ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("matches")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "matches"
              ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
          }`}
        >
          AI Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab("manual_match")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "manual_match"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/50 dark:border-purple-800/50"
          }`}
        >
          <Plus size={14} /> Manual Match
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "users"
              ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Users ({usersList.length})
        </button>
      </div>

      {/* Global Admin Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Admin search by Item Reference (e.g. CR-LST-1001), Item Name, User Name, Email, Category..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium shadow-xs"
        />
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-3">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
          <p className="text-sm font-medium">Loading administrative data...</p>
        </div>
      ) : (
        <>
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Statistics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    Total Users
                  </span>
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    {usersList.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider block mb-1">
                    Lost Reports
                  </span>
                  <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                    {totalLost}
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-teal-500 dark:text-teal-400 uppercase tracking-wider block mb-1">
                    Found Reports
                  </span>
                  <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                    {totalFound}
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider block mb-1">
                    AI Matches
                  </span>
                  <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                    {matches.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                    Recovered Items
                  </span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {totalRecovered}
                  </span>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4">
                  Quick Admin Tasks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab("manual_match")}
                    className="p-4 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-2xl text-left font-bold text-xs transition-colors flex items-center justify-between border border-purple-200/50 dark:border-purple-800/50"
                  >
                    <span>Connect Lost & Found Items</span>
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => setActiveTab("matches")}
                    className="p-4 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-2xl text-left font-bold text-xs transition-colors flex items-center justify-between border border-blue-200/50 dark:border-blue-800/50"
                  >
                    <span>
                      Review Pending AI Pairings ({pendingMatchesCount})
                    </span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl text-left font-bold text-xs transition-colors flex items-center justify-between border border-gray-200 dark:border-gray-700"
                  >
                    <span>Manage User Accounts ({usersList.length})</span>
                    <Users size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ITEMS MANAGEMENT */}
          {activeTab === "items" && (
            <div className="space-y-4">
              {/* Type Switcher */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setItemTypeFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    itemTypeFilter === "ALL"
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  onClick={() => setItemTypeFilter("LOST")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    itemTypeFilter === "LOST"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50"
                  }`}
                >
                  Lost Items ({totalLost})
                </button>
                <button
                  onClick={() => setItemTypeFilter("FOUND")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    itemTypeFilter === "FOUND"
                      ? "bg-teal-600 text-white"
                      : "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/50"
                  }`}
                >
                  Found Items ({totalFound})
                </button>
              </div>

              {/* Items Table */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="py-3.5 px-4">Reference</th>
                        <th className="py-3.5 px-4">Item Details</th>
                        <th className="py-3.5 px-4">Campus Location & Date</th>
                        <th className="py-3.5 px-4">User Contact</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                      {filteredItems.map((it) => (
                        <tr
                          key={it.id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                                it.type === "LOST"
                                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60"
                                  : "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/60"
                              }`}
                            >
                              {it.referenceNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {it.itemName}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">
                              {it.category} {it.color ? `· ${it.color}` : ""}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-gray-800 dark:text-gray-200">{it.location}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {it.date}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {it.userName}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {it.userEmail}
                            </div>
                            {it.userMobile && (
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                {it.userMobile}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                it.status === "recovered"
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                                  : it.status === "possible_match"
                                    ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                              }`}
                            >
                              {it.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1">
                            {it.status !== "recovered" && (
                              <button
                                onClick={() => handleMarkItemRecovered(it.id)}
                                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold transition-colors border border-emerald-200/50 dark:border-emerald-800/50"
                              >
                                Mark Recovered
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteItem(it.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              title="Delete report"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI MATCHES */}
          {activeTab === "matches" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="py-3.5 px-4">Lost Item</th>
                        <th className="py-3.5 px-4">Found Item</th>
                        <th className="py-3.5 px-4">Confidence</th>
                        <th className="py-3.5 px-4">AI Reason</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">
                          Admin Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                      {matches.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {m.lostItemName}
                            </div>
                            <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                              {m.lostReference}
                            </span>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {m.lostUserName} ({m.lostUserEmail})
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {m.foundItemName}
                            </div>
                            <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                              {m.foundReference}
                            </span>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {m.foundUserName} ({m.foundUserEmail})
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                              {m.aiScore}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                            {m.aiReason}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                              {m.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1">
                            {m.status !== "confirmed" && (
                              <button
                                onClick={() =>
                                  handleUpdateMatchStatus(m.id, "confirmed")
                                }
                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold transition-colors border border-emerald-200/50 dark:border-emerald-800/50"
                              >
                                Approve
                              </button>
                            )}
                            {m.status !== "rejected" && (
                              <button
                                onClick={() =>
                                  handleUpdateMatchStatus(m.id, "rejected")
                                }
                                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-[11px] font-bold transition-colors border border-rose-200/50 dark:border-rose-900/50"
                              >
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MANUAL MATCHING (SECTION 27 REQUIREMENT) */}
          {activeTab === "manual_match" && (
            <div className="max-w-2xl bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Plus className="text-purple-600 dark:text-purple-400" size={22} />
                  Admin Manual Item Matching
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Connect a reported Lost Item to a Found Item using their
                  reference numbers. This creates an immediate confirmed match,
                  unlocks mutual contact details, and notifies both parties.
                </p>
              </div>

              {manualSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
                  {manualSuccess}
                </div>
              )}
              {manualError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-bold">
                  {manualError}
                </div>
              )}

              <form onSubmit={handleCreateManualMatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
                    Lost Item Reference *
                  </label>
                  <input
                    type="text"
                    value={manualLostRef}
                    onChange={(e) =>
                      setManualLostRef(e.target.value.toUpperCase())
                    }
                    placeholder="e.g. CR-LST-1001"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                    Available Lost references:{" "}
                    {items
                      .filter((i) => i.type === "LOST")
                      .map((i) => i.referenceNumber)
                      .slice(0, 5)
                      .join(", ") || "None"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
                    Found Item Reference *
                  </label>
                  <input
                    type="text"
                    value={manualFoundRef}
                    onChange={(e) =>
                      setManualFoundRef(e.target.value.toUpperCase())
                    }
                    placeholder="e.g. CR-FND-1054"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                    Available Found references:{" "}
                    {items
                      .filter((i) => i.type === "FOUND")
                      .map((i) => i.referenceNumber)
                      .slice(0, 5)
                      .join(", ") || "None"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={manualCreating}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {manualCreating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Create Match & Notify Users
                </button>
              </form>
            </div>
          )}

          {/* TAB: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Mobile</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Reports</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                    {usersList.map((u) => {
                      const userLostCount = items.filter(
                        (i) => i.userId === u.id && i.type === "LOST",
                      ).length
                      const userFoundCount = items.filter(
                        (i) => i.userId === u.id && i.type === "FOUND",
                      ).length
                      const isDisabled = u.status === "disabled" || u.isBanned

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                            {u.name || "Student"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">{u.email}</td>
                          <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">
                            {u.phone || u.mobile || "—"}
                          </td>
                          <td className="py-3.5 px-4 capitalize font-mono text-[11px] text-blue-600 dark:text-blue-400">
                            {u.role || "student"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                            {userLostCount} Lost / {userFoundCount} Found
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                isDisabled
                                  ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800"
                                  : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              }`}
                            >
                              {isDisabled ? "Disabled" : "Active"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() =>
                                handleToggleUserStatus(u.id, u.status)
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                                isDisabled
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800"
                              }`}
                            >
                              {isDisabled ? "Enable User" : "Disable User"}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
