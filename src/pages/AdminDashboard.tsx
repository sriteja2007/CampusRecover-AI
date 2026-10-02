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
  SlidersHorizontal,
  ChevronRight,
  Building2,
  MapPin,
  Compass,
  Map as MapIcon,
  TrendingUp,
  Edit,
  Power,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService, LocationAnalytics } from "../services/simpleItem.service"
import { SimpleMatchingService } from "../services/simpleMatching.service"
import { CampusLocationService } from "../services/campusLocation.service"
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
import {
  CampusLocation,
  MeetingLocation,
  MVGR_CAMPUS_CENTER,
} from "../types/CampusLocation"
import { Badge } from "../components/ui/Badge"
import { StatusIndicator } from "../components/ui/StatusIndicator"
import { ConfidenceGauge } from "../components/ui/ConfidenceGauge"
import CampusMap from "../components/map/CampusMap"

type AdminTab =
  | "overview"
  | "items"
  | "matches"
  | "manual_match"
  | "users"
  | "map"
  | "locations"
  | "meeting_points"
  | "hotspots"

export default function AdminDashboard() {
  const { user, customUser, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [loading, setLoading] = useState(true)

  // Data states
  const [items, setItems] = useState<Item[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [campusLocations, setCampusLocations] = useState<CampusLocation[]>([])
  const [meetingLocations, setMeetingLocations] = useState<MeetingLocation[]>([])
  const [locationAnalytics, setLocationAnalytics] = useState<LocationAnalytics[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Manual match states
  const [manualLostRef, setManualLostRef] = useState("")
  const [manualFoundRef, setManualFoundRef] = useState("")
  const [manualCreating, setManualCreating] = useState(false)
  const [manualSuccess, setManualSuccess] = useState<string | null>(null)
  const [manualError, setManualError] = useState<string | null>(null)

  // Items tab sub-filter
  const [itemTypeFilter, setItemTypeFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL")
  const [adminMapFilter, setAdminMapFilter] = useState<"ALL" | "LOST" | "FOUND" | "RECOVERED">("ALL")

  // Campus Location Form Modal states
  const [editingLocation, setEditingLocation] = useState<CampusLocation | null>(null)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [locFormName, setLocFormName] = useState("")
  const [locFormType, setLocFormType] = useState<CampusLocation["type"]>("ACADEMIC")
  const [locFormLat, setLocFormLat] = useState<number>(MVGR_CAMPUS_CENTER.latitude)
  const [locFormLng, setLocFormLng] = useState<number>(MVGR_CAMPUS_CENTER.longitude)
  const [locFormDesc, setLocFormDesc] = useState("")
  const [locFormAddress, setLocFormAddress] = useState("")
  const [locFormActive, setLocFormActive] = useState(true)
  const [locSaving, setLocSaving] = useState(false)

  // Meeting Location Form Modal states
  const [editingMeeting, setEditingMeeting] = useState<MeetingLocation | null>(null)
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false)
  const [meetFormName, setMeetFormName] = useState("")
  const [meetFormAddress, setMeetFormAddress] = useState("")
  const [meetFormLat, setMeetFormLat] = useState<number>(MVGR_CAMPUS_CENTER.latitude)
  const [meetFormLng, setMeetFormLng] = useState<number>(MVGR_CAMPUS_CENTER.longitude)
  const [meetFormDesc, setMeetFormDesc] = useState("")
  const [meetFormActive, setMeetFormActive] = useState(true)
  const [meetSaving, setMeetSaving] = useState(false)

  useEffect(() => {
    loadAllAdminData()
  }, [])

  const loadAllAdminData = async () => {
    setLoading(true)
    try {
      const [allItems, allMatches, usersSnap, locs, meetings, analytics] =
        await Promise.all([
          SimpleItemService.getItems(),
          SimpleMatchingService.getAllMatches(),
          getDocs(collection(db, COLLECTIONS.USERS)).catch(() => ({
            docs: [],
            forEach: () => {},
          })),
          CampusLocationService.getLocations(true),
          CampusLocationService.getMeetingLocations(true),
          SimpleItemService.getLocationAnalytics(),
        ])

      setItems(allItems)
      setMatches(allMatches)
      setCampusLocations(locs)
      setMeetingLocations(meetings)
      setLocationAnalytics(analytics.analytics)

      const fetchedUsers: any[] = []
      if ((usersSnap as any)?.forEach) {
        ;(usersSnap as any).forEach((d: any) =>
          fetchedUsers.push({ id: d.id, ...d.data() }),
        )
      }
      setUsersList(fetchedUsers)
    } catch (err) {
      console.error("Failed to load admin data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Location Handlers
  const handleOpenCreateLocation = () => {
    setEditingLocation(null)
    setLocFormName("")
    setLocFormType("ACADEMIC")
    setLocFormLat(MVGR_CAMPUS_CENTER.latitude)
    setLocFormLng(MVGR_CAMPUS_CENTER.longitude)
    setLocFormDesc("")
    setLocFormAddress("MVGR College Campus")
    setLocFormActive(true)
    setIsLocationModalOpen(true)
  }

  const handleOpenEditLocation = (loc: CampusLocation) => {
    setEditingLocation(loc)
    setLocFormName(loc.name)
    setLocFormType(loc.type)
    setLocFormLat(loc.latitude)
    setLocFormLng(loc.longitude)
    setLocFormDesc(loc.description || "")
    setLocFormAddress(loc.address || "")
    setLocFormActive(loc.active !== false)
    setIsLocationModalOpen(true)
  }

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locFormName.trim()) return
    setLocSaving(true)
    try {
      if (editingLocation) {
        await CampusLocationService.updateLocation(editingLocation.id, {
          name: locFormName.trim(),
          type: locFormType,
          latitude: Number(locFormLat),
          longitude: Number(locFormLng),
          description: locFormDesc.trim(),
          address: locFormAddress.trim(),
          active: locFormActive,
        })
      } else {
        await CampusLocationService.createLocation({
          name: locFormName.trim(),
          type: locFormType,
          latitude: Number(locFormLat),
          longitude: Number(locFormLng),
          description: locFormDesc.trim(),
          address: locFormAddress.trim(),
          active: locFormActive,
        })
      }
      setIsLocationModalOpen(false)
      const updated = await CampusLocationService.getLocations(true)
      setCampusLocations(updated)
    } catch (err) {
      console.error("Failed to save location:", err)
    } finally {
      setLocSaving(false)
    }
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to remove this campus location?")) return
    try {
      await CampusLocationService.deleteLocation(id)
      setCampusLocations((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      console.error("Failed to delete location:", err)
    }
  }

  const handleToggleLocationActive = async (loc: CampusLocation) => {
    try {
      const nextActive = !loc.active
      await CampusLocationService.updateLocation(loc.id, { active: nextActive })
      setCampusLocations((prev) =>
        prev.map((l) => (l.id === loc.id ? { ...l, active: nextActive } : l)),
      )
    } catch (err) {
      console.error("Failed to toggle location:", err)
    }
  }

  // Meeting Points Handlers
  const handleOpenCreateMeeting = () => {
    setEditingMeeting(null)
    setMeetFormName("")
    setMeetFormAddress("MVGR Campus Reception")
    setMeetFormLat(MVGR_CAMPUS_CENTER.latitude)
    setMeetFormLng(MVGR_CAMPUS_CENTER.longitude)
    setMeetFormDesc("")
    setMeetFormActive(true)
    setIsMeetingModalOpen(true)
  }

  const handleOpenEditMeeting = (m: MeetingLocation) => {
    setEditingMeeting(m)
    setMeetFormName(m.name)
    setMeetFormAddress(m.address || "")
    setMeetFormLat(m.latitude)
    setMeetFormLng(m.longitude)
    setMeetFormDesc(m.description || "")
    setMeetFormActive(m.active !== false)
    setIsMeetingModalOpen(true)
  }

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetFormName.trim()) return
    setMeetSaving(true)
    try {
      if (editingMeeting) {
        await CampusLocationService.updateMeetingLocation(editingMeeting.id, {
          name: meetFormName.trim(),
          address: meetFormAddress.trim(),
          latitude: Number(meetFormLat),
          longitude: Number(meetFormLng),
          description: meetFormDesc.trim(),
          active: meetFormActive,
        })
      } else {
        await CampusLocationService.createMeetingLocation({
          name: meetFormName.trim(),
          address: meetFormAddress.trim(),
          latitude: Number(meetFormLat),
          longitude: Number(meetFormLng),
          description: meetFormDesc.trim(),
          active: meetFormActive,
        })
      }
      setIsMeetingModalOpen(false)
      const updated = await CampusLocationService.getMeetingLocations(true)
      setMeetingLocations(updated)
    } catch (err) {
      console.error("Failed to save meeting point:", err)
    } finally {
      setMeetSaving(false)
    }
  }

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to remove this meeting location?")) return
    try {
      await CampusLocationService.deleteMeetingLocation(id)
      setMeetingLocations((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error("Failed to delete meeting location:", err)
    }
  }

  const handleToggleMeetingActive = async (m: MeetingLocation) => {
    try {
      const nextActive = !m.active
      await CampusLocationService.updateMeetingLocation(m.id, { active: nextActive })
      setMeetingLocations((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, active: nextActive } : item)),
      )
    } catch (err) {
      console.error("Failed to toggle meeting location:", err)
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
      lostItem =
        (await SimpleItemService.getItemByReference(manualLostRef)) || undefined
    }

    let foundItem = items.find(
      (it) =>
        it.type === "FOUND" &&
        it.referenceNumber?.toLowerCase() ===
          manualFoundRef.trim().toLowerCase(),
    )
    if (!foundItem) {
      foundItem =
        (await SimpleItemService.getItemByReference(manualFoundRef)) || undefined
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
        `Match successfully linked between ${lostItem.referenceNumber} and ${foundItem.referenceNumber}! Users have been notified and mutual contact revealed.`,
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-rose-200 dark:border-rose-900/50 shadow-xl max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/40">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Administrator Access Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            This operations center is reserved for authenticated campus staff and administrators. Please log in with admin privileges to proceed.
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
      it.location?.toLowerCase().includes(q) ||
      it.locationName?.toLowerCase().includes(q)
    )
  })

  // Statistics
  const totalLost = items.filter((i) => i.type === "LOST").length
  const totalFound = items.filter((i) => i.type === "FOUND").length
  const totalRecovered = items.filter((i) => i.status === "recovered").length
  const pendingMatchesCount = matches.filter((m) => m.status === "pending").length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Admin Top Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-500/30">
              Campus Operations Center
            </span>
            <span className="text-xs text-slate-400">{user?.email || "admin@gmail.com"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Administrative Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervise database reports, review AI matches, monitor campus recovery map, configure campus blocks & safe meeting points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAdminData}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
          <button
            onClick={() => {
              logout()
              navigate("/login")
            }}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
        {[
          { id: "overview", label: "Overview" },
          { id: "map", label: "Campus Recovery Map", icon: MapIcon },
          { id: "items", label: `Items Directory (${items.length})` },
          { id: "matches", label: `AI Match Queue (${matches.length})` },
          { id: "locations", label: `Campus Locations (${campusLocations.length})`, icon: Building2 },
          { id: "meeting_points", label: `Safe Meeting Points (${meetingLocations.length})`, icon: Shield },
          { id: "hotspots", label: "Recovery Hotspots", icon: TrendingUp },
          { id: "manual_match", label: "+ Manual Matcher" },
          { id: "users", label: `Users (${usersList.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as AdminTab)}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === t.id
                ? "bg-blue-600 text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t.icon && <t.icon size={13} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Global Admin Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Admin search by Item Reference (e.g. CR-LST-1001), Title, Student Name, Campus Email, Category, Building..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium shadow-xs"
        />
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-sm font-medium text-slate-500">Loading administrative datasets...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Operational Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Total Users
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {usersList.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block mb-1">
                    Lost Reports
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                    {totalLost}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-teal-500 uppercase tracking-wider block mb-1">
                    Found Reports
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                    {totalFound}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider block mb-1">
                    AI Pairings
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                    {matches.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block mb-1">
                    Recovered
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {totalRecovered}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block mb-1">
                    Campus Blocks
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                    {campusLocations.length}
                  </span>
                </div>
              </div>

              {/* Action Quick Launchers */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
                  Administrative Workflow Shortcuts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab("map")}
                    className="p-4 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-2xl text-left font-bold text-xs transition-colors flex items-center justify-between border border-blue-200/60 dark:border-blue-800/60"
                  >
                    <div>
                      <span className="text-sm block text-blue-900 dark:text-blue-200">
                        Campus Recovery Map
                      </span>
                      <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-normal">
                        Inspect spatial clustering & items
                      </span>
                    </div>
                    <MapIcon size={18} />
                  </button>

                  <button
                    onClick={() => setActiveTab("matches")}
                    className="p-4 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-2xl text-left font-bold text-xs transition-colors flex items-center justify-between border border-purple-200/60 dark:border-purple-800/60"
                  >
                    <div>
                      <span className="text-sm block text-purple-900 dark:text-purple-200">
                        Review AI Pairings
                      </span>
                      <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80 font-normal">
                        {pendingMatchesCount} proposals awaiting decision
                      </span>
                    </div>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={() => setActiveTab("locations")}
                    className="p-4 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-2xl text-left font-bold text-xs transition-colors flex items-center justify-between border border-emerald-200/60 dark:border-emerald-800/60"
                  >
                    <div>
                      <span className="text-sm block text-emerald-900 dark:text-emerald-200">
                        Campus Blocks
                      </span>
                      <span className="text-[11px] text-emerald-600/80 font-normal">
                        Manage {campusLocations.length} college buildings
                      </span>
                    </div>
                    <Building2 size={18} />
                  </button>

                  <button
                    onClick={() => setActiveTab("hotspots")}
                    className="p-4 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-2xl text-left font-bold text-xs transition-colors flex items-center justify-between border border-amber-200/60 dark:border-amber-800/60"
                  >
                    <div>
                      <span className="text-sm block text-amber-900 dark:text-amber-200">
                        Recovery Hotspots
                      </span>
                      <span className="text-[11px] text-amber-700/80 font-normal">
                        Top locations & resolution rates
                      </span>
                    </div>
                    <TrendingUp size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CAMPUS RECOVERY MAP (Section 26 & 27) */}
          {activeTab === "map" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapIcon size={20} className="text-blue-600" />
                    Campus Recovery Map
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Spatial overview of reported lost items, found inventory, potential matches, and recovered items on MVGR campus.
                  </p>
                </div>

                {/* Filters: Lost, Found, Matched, Recovered */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(
                    [
                      { key: "ALL", label: "All Items" },
                      { key: "LOST", label: "Lost" },
                      { key: "FOUND", label: "Found" },
                      { key: "RECOVERED", label: "Recovered" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setAdminMapFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        adminMapFilter === key
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Leaflet CampusMap with admin popups */}
              <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white">
                <CampusMap
                  items={items}
                  initialFilter={adminMapFilter}
                  adminMode={true}
                  height="650px"
                  showControls={true}
                  showLegend={true}
                  showCampusBlocks={true}
                  showMeetingPoints={true}
                />
              </div>
            </div>
          )}

          {/* TAB: CAMPUS LOCATIONS MANAGEMENT (Section 8) */}
          {activeTab === "locations" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 size={20} className="text-blue-600" />
                    Campus Locations & Blocks
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure official MVGR College blocks, departments, zones, and building coordinates.
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateLocation}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>+ Add Campus Location</span>
                </button>
              </div>

              {/* Campus Locations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campusLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Building2 size={18} />
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            loc.active !== false
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {loc.active !== false ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {loc.name}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {loc.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {loc.description || "No description provided."}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                        <div><strong>Address:</strong> {loc.address || "MVGR Campus"}</div>
                        <div className="font-mono text-[10px] mt-0.5 text-blue-600 dark:text-blue-400">
                          {loc.latitude.toFixed(4)}° N, {loc.longitude.toFixed(4)}° E
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleLocationActive(loc)}
                        className={`text-xs font-semibold ${
                          loc.active !== false ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {loc.active !== false ? "Deactivate" : "Activate"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditLocation(loc)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SAFE MEETING POINTS MANAGEMENT (Section 38) */}
          {activeTab === "meeting_points" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield size={20} className="text-indigo-600" />
                    Campus Handover Desks & Safe Meeting Locations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage supervised, CCTV-monitored campus spots for safe in-person exchanges.
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateMeeting}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>+ Add Safe Meeting Spot</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetingLocations.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <Shield size={20} />
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            m.active !== false
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {m.active !== false ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {m.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {m.address}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {m.description}
                        </p>
                      </div>

                      <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        {m.latitude.toFixed(4)}° N, {m.longitude.toFixed(4)}° E
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleMeetingActive(m)}
                        className={`text-xs font-semibold ${
                          m.active !== false ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {m.active !== false ? "Deactivate" : "Activate"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditMeeting(m)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(m.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Meeting Spot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: RECOVERY HOTSPOTS (Section 43) */}
          {activeTab === "hotspots" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={20} className="text-teal-600" />
                      Recovery Hotspots
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Campus block metrics computed dynamically from real database item records.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                    {locationAnalytics.length} Analyzed Campus Zones
                  </div>
                </div>

                {locationAnalytics.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No location reports available yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4">Location</th>
                          <th className="py-3.5 px-4 text-rose-600">Lost</th>
                          <th className="py-3.5 px-4 text-teal-600">Found</th>
                          <th className="py-3.5 px-4 text-indigo-600">Recovered</th>
                          <th className="py-3.5 px-4">Recovery Rate %</th>
                          <th className="py-3.5 px-4 text-right">Map Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {locationAnalytics.map((stat) => (
                          <tr
                            key={stat.location}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <MapPin size={14} className="text-blue-600" />
                              {stat.location}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-rose-600">
                              {stat.lostCount}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-teal-600">
                              {stat.foundCount}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-indigo-600">
                              {stat.recoveredCount}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  stat.recoveryRate >= 70
                                    ? "bg-emerald-100 text-emerald-800"
                                    : stat.recoveryRate > 0
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {stat.recoveryRate}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setActiveTab("map")}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800"
                              >
                                View on Map →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ITEMS DIRECTORY */}
          {activeTab === "items" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setItemTypeFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    itemTypeFilter === "ALL"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All Items ({items.length})
                </button>
                <button
                  onClick={() => setItemTypeFilter("LOST")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    itemTypeFilter === "LOST"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Lost Only ({items.filter((i) => i.type === "LOST").length})
                </button>
                <button
                  onClick={() => setItemTypeFilter("FOUND")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    itemTypeFilter === "FOUND"
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Found Only ({items.filter((i) => i.type === "FOUND").length})
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Ref Number</th>
                        <th className="py-3.5 px-4">Item Name</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Location</th>
                        <th className="py-3.5 px-4">Reported By</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredItems.map((it) => (
                        <tr
                          key={it.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {it.referenceNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {it.itemName || it.title}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                it.type === "LOST"
                                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                                  : "bg-teal-50 text-teal-600 border border-teal-200"
                              }`}
                            >
                              {it.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {it.locationName || it.location || "Campus"}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {it.userName || "Student User"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {it.userEmail}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                it.status === "recovered"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {it.status || "reported"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <Link
                              to={`/dashboard/item/${it.type.toLowerCase()}/${it.id}`}
                              className="text-blue-600 hover:text-blue-800 font-bold"
                            >
                              View
                            </Link>
                            {it.status !== "recovered" && (
                              <button
                                onClick={() => handleMarkItemRecovered(it.id)}
                                className="text-emerald-600 hover:text-emerald-800 font-bold"
                              >
                                Recovered
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteItem(it.id)}
                              className="text-rose-500 hover:text-rose-700 font-bold"
                            >
                              Delete
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

          {/* TAB 3: MATCHES QUEUE */}
          {activeTab === "matches" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Lost Item</th>
                        <th className="py-3.5 px-4">Found Item</th>
                        <th className="py-3.5 px-4">Location Signal</th>
                        <th className="py-3.5 px-4">AI Score</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {matches.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {m.lostItemName}
                            </div>
                            <div className="font-mono text-[11px] text-rose-600">
                              {m.lostReference}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {m.foundItemName}
                            </div>
                            <div className="font-mono text-[11px] text-teal-600">
                              {m.foundReference}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[11px] text-slate-800 dark:text-slate-200">
                              <strong>Lost:</strong> {m.lostLocation || "CSE Block"}
                            </div>
                            <div className="text-[11px] text-slate-800 dark:text-slate-200">
                              <strong>Found:</strong> {m.foundLocation || "CSE Block"}
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                (m.locationSimilarity || "High") === "High"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              Similarity: {m.locationSimilarity || "High"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-purple-600">
                            {m.aiScore}%
                          </td>
                          <td className="py-3.5 px-4 capitalize font-semibold">
                            {m.status || "pending"}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {m.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleUpdateMatchStatus(m.id, "confirmed")}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateMatchStatus(m.id, "rejected")}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 capitalize">
                                {m.status}
                              </span>
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

          {/* TAB 4: MANUAL MATCHER */}
          {activeTab === "manual_match" && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  Manual Match Connector
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Directly pair a lost item report with a found report using their official reference numbers.
                </p>
              </div>

              {manualSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold border border-emerald-200">
                  {manualSuccess}
                </div>
              )}
              {manualError && (
                <div className="p-4 bg-rose-50 text-rose-800 text-xs rounded-xl font-bold border border-rose-200">
                  {manualError}
                </div>
              )}

              <form onSubmit={handleCreateManualMatch} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Lost Item Reference
                  </label>
                  <input
                    type="text"
                    value={manualLostRef}
                    onChange={(e) => setManualLostRef(e.target.value)}
                    placeholder="e.g. CR-LST-1001"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Found Item Reference
                  </label>
                  <input
                    type="text"
                    value={manualFoundRef}
                    onChange={(e) => setManualFoundRef(e.target.value)}
                    placeholder="e.g. CR-FND-1002"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={manualCreating}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  {manualCreating ? "Creating Pair..." : "Create Pair & Notify Parties"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: USERS DIRECTORY */}
          {activeTab === "users" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Campus Email</th>
                      <th className="py-3.5 px-4">Phone</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {usersList.map((u) => {
                      const isDisabled = u.status === "disabled" || u.isBanned
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {u.name || "Student User"}
                          </td>
                          <td className="py-3.5 px-4">{u.email}</td>
                          <td className="py-3.5 px-4">{u.phone || u.mobile || "—"}</td>
                          <td className="py-3.5 px-4 capitalize font-mono text-[11px] text-blue-600">
                            {u.role || "student"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                isDisabled
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {isDisabled ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold ${
                                isDisabled
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {isDisabled ? "Restore" : "Suspend"}
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

      {/* Campus Location Add/Edit Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingLocation ? "Edit Campus Location" : "Add Campus Location"}
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Block / Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={locFormName}
                  onChange={(e) => setLocFormName(e.target.value)}
                  placeholder="e.g. CSE / CSM Block, Central Library"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Location Type
                  </label>
                  <select
                    value={locFormType}
                    onChange={(e) => setLocFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="LIBRARY">LIBRARY</option>
                    <option value="CAFETERIA">CAFETERIA</option>
                    <option value="GATE">GATE</option>
                    <option value="SPORTS">SPORTS</option>
                    <option value="HOSTEL">HOSTEL</option>
                    <option value="PARKING">PARKING</option>
                    <option value="FACILITY">FACILITY</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="locActive"
                    checked={locFormActive}
                    onChange={(e) => setLocFormActive(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="locActive" className="font-bold text-slate-700 dark:text-slate-300">
                    Active for item reporting
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={locFormLat}
                    onChange={(e) => setLocFormLat(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={locFormLng}
                    onChange={(e) => setLocFormLng(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Address / Campus Area
                </label>
                <input
                  type="text"
                  value={locFormAddress}
                  onChange={(e) => setLocFormAddress(e.target.value)}
                  placeholder="e.g. Department of CSE, MVGR College"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={locFormDesc}
                  onChange={(e) => setLocFormDesc(e.target.value)}
                  placeholder="e.g. Computer Science labs and seminar halls"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={locSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  {locSaving ? "Saving..." : "Save Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Location Add/Edit Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingMeeting ? "Edit Safe Meeting Point" : "Add Safe Meeting Point"}
              </h3>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Meeting Point Name *
                </label>
                <input
                  type="text"
                  required
                  value={meetFormName}
                  onChange={(e) => setMeetFormName(e.target.value)}
                  placeholder="e.g. Security Post (Main Gate), Admin Front Office"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Address / Specific Spot
                </label>
                <input
                  type="text"
                  value={meetFormAddress}
                  onChange={(e) => setMeetFormAddress(e.target.value)}
                  placeholder="e.g. Ground Floor Reception, Main Gate Cabin"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={meetFormLat}
                    onChange={(e) => setMeetFormLat(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={meetFormLng}
                    onChange={(e) => setMeetFormLng(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description & Safety Notes
                </label>
                <textarea
                  rows={2}
                  value={meetFormDesc}
                  onChange={(e) => setMeetFormDesc(e.target.value)}
                  placeholder="e.g. 24/7 Security cabin with staff presence and CCTV coverage"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="meetActive"
                  checked={meetFormActive}
                  onChange={(e) => setMeetFormActive(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="meetActive" className="font-bold text-slate-700 dark:text-slate-300">
                  Active for recommended safe handover
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={meetSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  {meetSaving ? "Saving..." : "Save Meeting Spot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
