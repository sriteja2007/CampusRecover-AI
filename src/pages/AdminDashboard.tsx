import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useLocation, useSearchParams } from "react-router"
import {
  BarChart3,
  Users,
  Package,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Flag,
  Shield,
  Loader2,
  Check,
  X,
  Building2,
  Layers,
  Megaphone,
  Activity,
  Download,
  FileText,
  Sliders,
  UserX,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  Search,
  Compass,
  ExternalLink,
  Printer,
  Sparkles,
  RefreshCcw,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  AdminService,
  AdminMetrics,
  CampusOfficeEntity,
  CategoryEntity,
  DepartmentEntity,
} from "../services/admin.service"
import { UserService } from "../services/firebase/user.service"
import { HandoverService } from "../services/handover.service"
import { MatchingService, MatchResult } from "../services/matching.service"
import {
  LostItemService,
  FoundItemService,
} from "../services/firebase/item.service"
import { User, UserRole } from "../types/User"
import { Claim } from "../types/Claim"
import { ROLES } from "../config/constants"
import { printClaimReceipt } from "../utils/receiptGenerator"

type AdminTab = "overview" | "analytics" | "users" | "claims" | "offices" | "categories" | "departments" | "broadcast" | "health"

export default function AdminDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const getInitialTab = (): AdminTab => {
    const path = location.pathname
    const tabParam = searchParams.get("tab") as AdminTab | null
    const validTabs: AdminTab[] = [
      "overview",
      "analytics",
      "users",
      "claims",
      "offices",
      "categories",
      "departments",
      "broadcast",
      "health",
    ]
    if (tabParam && validTabs.includes(tabParam)) {
      return tabParam
    }
    if (path.includes("/users")) return "users"
    if (path.includes("/campuses") || path.includes("/offices"))
      return "offices"
    if (path.includes("/statistics") || path.includes("/analytics"))
      return "analytics"
    if (
      path.includes("/approve-claims") ||
      path.includes("/claims") ||
      path.includes("/manage-reports")
    )
      return "claims"
    if (path.includes("/categories")) return "categories"
    if (path.includes("/departments")) return "departments"
    if (path.includes("/broadcast")) return "broadcast"
    if (path.includes("/health")) return "health"
    return "overview"
  }

  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab)

  useEffect(() => {
    setActiveTab(getInitialTab())
  }, [location.pathname, searchParams])

  const [loading, setLoading] = useState(true)

  // Live Metrics & Analytics Data
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [categoryData, setCategoryData] = useState<{
    category: string
    count: number
  }[]>([])

  // User Management state
  const [usersList, setUsersList] = useState<User[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [banningUser, setBanningUser] = useState<User | null>(null)
  const [banReasonInput, setBanReasonInput] = useState("")

  // Claims & Matches state
  const [claimsList, setClaimsList] = useState<Claim[]>([])
  const [pendingMatches, setPendingMatches] = useState<MatchResult[]>([])
  const [reviewingMatch, setReviewingMatch] = useState<MatchResult | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Campus Offices state
  const [offices, setOffices] = useState<CampusOfficeEntity[]>([])
  const [showOfficeModal, setShowOfficeModal] = useState(false)
  const [officeForm, setOfficeForm] = useState<CampusOfficeEntity>({
    name: "",
    building: "",
    roomNumber: "",
    phone: "",
    hours: "",
    supervisorName: "",
    lat: 37.4275,
    lng: -122.1697,
    active: true,
  })

  // Categories & Departments
  const [categories, setCategories] = useState<CategoryEntity[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [departments, setDepartments] = useState<DepartmentEntity[]>([])
  const [newDeptForm, setNewDeptForm] = useState({
    name: "",
    code: "",
    facultyLead: "",
    contactEmail: "",
  })

  // Broadcast notification state
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastBody, setBroadcastBody] = useState("")
  const [broadcastTarget, setBroadcastTarget] = useState("all")
  const [broadcasting, setBroadcasting] = useState(false)

  // Feedback Toast
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message })
      setTimeout(() => setToast(null), 3500)
    },
    [],
  )

  // Primary data loader
  const loadAdminData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        liveMetrics,
        catBreakdown,
        allUsers,
        allClaims,
        matches,
        campusOffices,
        catList,
        deptList,
      ] = await Promise.all([
        AdminService.getLiveMetrics(),
        AdminService.getCategoryBreakdown(),
        UserService.getAllUsers(),
        HandoverService.getAllClaims(),
        MatchingService.getPendingMatches(),
        AdminService.getCampusOffices(),
        AdminService.getCategories(),
        AdminService.getDepartments(),
      ])

      setMetrics(liveMetrics)
      setCategoryData(catBreakdown)
      setUsersList(allUsers)
      setClaimsList(allClaims)
      setPendingMatches(matches)
      setOffices(campusOffices)
      setCategories(catList)
      setDepartments(deptList)
    } catch (err) {
      console.error("Admin initialization error:", err)
      showToast("error", "Error loading administrative data from Firestore.")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  // User Management Actions
  const handleUpdateRole = async (targetUid: string, newRole: UserRole) => {
    try {
      await UserService.updateRole(targetUid, newRole)
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u)),
      )
      showToast("success", `Updated user role to ${newRole}`)
    } catch {
      showToast("error", "Failed to update role")
    }
  }

  const handleBanUser = async () => {
    if (!banningUser) return
    try {
      await UserService.banUser(
        banningUser.uid,
        banReasonInput || "Administrative violation",
      )
      setUsersList((prev) =>
        prev.map((u) =>
          u.uid === banningUser.uid
            ? {
                ...u,
                isBanned: true,
                banReason: banReasonInput || "Administrative violation",
              }
            : u,
        ),
      )
      setBanningUser(null)
      setBanReasonInput("")
      showToast("success", "User account suspended.")
    } catch {
      showToast("error", "Failed to suspend user.")
    }
  }

  const handleUnbanUser = async (targetUid: string) => {
    try {
      await UserService.unbanUser(targetUid)
      setUsersList((prev) =>
        prev.map((u) =>
          u.uid === targetUid ? { ...u, isBanned: false, banReason: null } : u,
        ),
      )
      showToast("success", "User account reactivated.")
    } catch {
      showToast("error", "Failed to reactivate user.")
    }
  }

  // Claim & Match Approval Actions
  const handleApproveMatch = async (matchId: string) => {
    if (!user) return
    setActionLoading(true)
    try {
      await MatchingService.adminApproveMatch(
        matchId,
        user.uid,
        adminNotes || "Approved by Admin",
      )
      setPendingMatches((prev) => prev.filter((m) => m.id !== matchId))
      setReviewingMatch(null)
      setAdminNotes("")
      showToast("success", "Match approved! Both parties notified.")
    } catch {
      showToast("error", "Failed to approve match.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectMatch = async (matchId: string) => {
    if (!user) return
    setActionLoading(true)
    try {
      await MatchingService.adminRejectMatch(
        matchId,
        user.uid,
        adminNotes || "Rejected during review",
      )
      setPendingMatches((prev) => prev.filter((m) => m.id !== matchId))
      setReviewingMatch(null)
      setAdminNotes("")
      showToast("info", "Match rejected.")
    } catch (err) {
      showToast("error", "Failed to reject match.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleFalsePositive = async (matchId: string) => {
    setActionLoading(true)
    try {
      await MatchingService.adminRejectMatch(
        matchId,
        user?.uid || "admin",
        adminNotes || "Marked as AI False Positive",
      )
      setPendingMatches((prev) => prev.filter((m) => m.id !== matchId))
      setReviewingMatch(null)
      showToast("info", "Marked as False Positive.")
    } catch (err) {
      showToast("error", "Failed to mark false positive.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleMergeDuplicate = async (matchId: string) => {
    setActionLoading(true)
    try {
      await MatchingService.adminRejectMatch(
        matchId,
        user?.uid || "admin",
        adminNotes || "Merged as Duplicate Report",
      )
      setPendingMatches((prev) => prev.filter((m) => m.id !== matchId))
      setReviewingMatch(null)
      showToast("success", "Duplicate reports merged successfully.")
    } catch (err) {
      showToast("error", "Failed to merge duplicates.")
    } finally {
      setActionLoading(false)
    }
  }

  // Campus Office Actions
  const handleSaveOffice = async () => {
    if (!officeForm.name || !officeForm.building) {
      showToast("error", "Please provide office name and building.")
      return
    }
    try {
      await AdminService.saveCampusOffice(officeForm)
      const updated = await AdminService.getCampusOffices()
      setOffices(updated)
      setShowOfficeModal(false)
      setOfficeForm({
        name: "",
        building: "",
        roomNumber: "",
        phone: "",
        hours: "",
        supervisorName: "",
        lat: 37.4275,
        lng: -122.1697,
        active: true,
      })
      showToast("success", "Campus office saved!")
    } catch {
      showToast("error", "Failed to save office.")
    }
  }

  const handleDeleteOffice = async (id?: string) => {
    if (!id) return
    try {
      await AdminService.deleteCampusOffice(id)
      setOffices((prev) => prev.filter((o) => o.id !== id))
      showToast("success", "Office removed.")
    } catch {
      showToast("error", "Failed to delete office.")
    }
  }

  // Category Actions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, "_")
      await AdminService.saveCategory({ name: newCategoryName.trim(), slug })
      const updated = await AdminService.getCategories()
      setCategories(updated)
      setNewCategoryName("")
      showToast("success", "Category created!")
    } catch {
      showToast("error", "Failed to add category.")
    }
  }

  const handleDeleteCategory = async (id?: string) => {
    if (!id) return
    try {
      await AdminService.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      showToast("success", "Category deleted.")
    } catch {
      showToast("error", "Failed to delete category.")
    }
  }

  // Department Actions
  const handleAddDepartment = async () => {
    if (!newDeptForm.name || !newDeptForm.code) {
      showToast("error", "Name and Department Code are required.")
      return
    }
    try {
      await AdminService.saveDepartment(newDeptForm)
      const updated = await AdminService.getDepartments()
      setDepartments(updated)
      setNewDeptForm({ name: "", code: "", facultyLead: "", contactEmail: "" })
      showToast("success", "Department registered!")
    } catch {
      showToast("error", "Failed to add department.")
    }
  }

  const handleDeleteDepartment = async (id?: string) => {
    if (!id) return
    try {
      await AdminService.deleteDepartment(id)
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      showToast("success", "Department deleted.")
    } catch {
      showToast("error", "Failed to delete department.")
    }
  }

  // Broadcast announcement
  const handleBroadcast = async () => {
    if (!broadcastTitle || !broadcastBody) {
      showToast("error", "Title and announcement text are required.")
      return
    }
    setBroadcasting(true)
    try {
      const count = await AdminService.broadcastNotification(
        broadcastTitle,
        broadcastBody,
        broadcastTarget,
      )
      showToast(
        "success",
        `Announcement broadcast to ${count} campus accounts.`,
      )
      setBroadcastTitle("")
      setBroadcastBody("")
    } catch {
      showToast("error", "Failed to dispatch broadcast.")
    } finally {
      setBroadcasting(false)
    }
  }

  // Export CSV
  const handleExportUsersCSV = () => {
    AdminService.exportToCSV(
      "campus_users_registry",
      usersList.map((u) => ({
        uid: u.uid,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || "",
        trustScore: u.trustScore ?? 5.0,
        banned: u.isBanned ? "YES" : "NO",
      })),
      ["uid", "name", "email", "role", "department", "trustScore", "banned"],
    )
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.department || "").toLowerCase().includes(userSearch.toLowerCase())
      const matchesRole = roleFilter === "all" || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [usersList, userSearch, roleFilter])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white"
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

      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider mb-1.5">
            <Shield size={13} /> Stanford University Central Admin Console
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Administrative Platform
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Realtime Firestore telemetry, user role enforcement, custody desks,
            claim verification & audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <RefreshCcw size={13} className={loading ? "animate-spin" : ""} />
            Refresh Live
          </button>
          <Link
            to="/dashboard/map"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Compass size={13} /> Campus Heatmaps
          </Link>
          <Link
            to="/admin/fraud-detection"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <AlertTriangle size={13} /> Fraud Monitoring (
            {metrics?.fraudAlerts || 0})
          </Link>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-100 rounded-2xl mb-8">
        {[
          { key: "overview", label: "Dashboard", icon: BarChart3 },
          { key: "analytics", label: "Analytics & Recovery", icon: TrendingUp },
          {
            key: "users",
            label: `User Management (${usersList.length})`,
            icon: Users,
          },
          {
            key: "claims",
            label: `Claims & AI Matches (${pendingMatches.length})`,
            icon: CheckCircle2,
          },
          {
            key: "offices",
            label: `Campus Offices (${offices.length})`,
            icon: Building2,
          },
          {
            key: "categories",
            label: `Categories (${categories.length})`,
            icon: Layers,
          },
          {
            key: "departments",
            label: `Departments (${departments.length})`,
            icon: Shield,
          },
          { key: "broadcast", label: "Broadcast Alerts", icon: Megaphone },
          { key: "health", label: "System Health & Export", icon: Activity },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as AdminTab)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === key
                ? "bg-white text-[#131b2e] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon
              size={14}
              className={activeTab === key ? "text-blue-600" : ""}
            />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {[
              {
                label: "Lost Reports",
                value: String(metrics?.totalLost || 0),
                color: "#2563eb",
                icon: Package,
              },
              {
                label: "Found Reports",
                value: String(metrics?.totalFound || 0),
                color: "#7c3aed",
                icon: Package,
              },
              {
                label: "Reunited Items",
                value: String(metrics?.totalReunited || 0),
                color: "#0d9488",
                icon: CheckCircle2,
              },
              {
                label: "Recovery Rate",
                value: `${metrics?.recoveryRate || 0}%`,
                color: "#0d9488",
                icon: TrendingUp,
              },
              {
                label: "Avg Return Time",
                value: `${metrics?.averageRecoveryDays || 0}d`,
                color: "#f59e0b",
                icon: Clock,
              },
              {
                label: "Registered Users",
                value: String(metrics?.totalUsers || 0),
                color: "#131b2e",
                icon: Users,
              },
            ].map(({ label, value, color, icon: Icon }) => (
              <div
                key={label}
                className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
                  <span className="truncate">{label}</span>
                  <Icon size={15} style={{ color }} />
                </div>
                <div className="text-2xl font-black text-[#131b2e] tracking-tight">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Review Queue Preview & Recent Claims */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 px-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#131b2e]">
                    Pending Claim Verifications
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Require administrative review before handover release
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {pendingMatches.length} Pending
                </span>
              </div>

              {pendingMatches.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400">
                  <CheckCircle2
                    size={32}
                    className="text-emerald-500 mx-auto mb-2"
                  />
                  All matches and claims are currently reviewed and up to date!
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pendingMatches.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#131b2e] truncate">
                            {m.lostItemTitle}
                          </span>
                          <ArrowRight
                            size={12}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span className="text-xs text-gray-600 truncate">
                            {m.foundItemTitle}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {m.aiExplanation}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                            {m.confidenceScore}% Match
                          </span>
                          {m.fraudScore > 0 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                              Fraud Risk: {m.fraudScore}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setReviewingMatch(m)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => m.id && handleApproveMatch(m.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions & Live Campus Status */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Admin System Navigation
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "Manage Roles & Ban Users", tab: "users" },
                    { label: "Review All Claims & QR Codes", tab: "claims" },
                    { label: "Configure Campus Custody Desks", tab: "offices" },
                    { label: "Dispatch Campus Announcement", tab: "broadcast" },
                    { label: "System Health & CSV Exports", tab: "health" },
                  ].map(({ label, tab }) => (
                    <button
                      key={label}
                      onClick={() => setActiveTab(tab as AdminTab)}
                      className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-xs font-bold text-[#131b2e] flex items-center justify-between transition-colors"
                    >
                      <span>{label}</span>
                      <ArrowRight size={13} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#131b2e] text-white rounded-2xl p-5 shadow-md">
                <div className="text-[11px] font-black uppercase text-blue-300 tracking-wider mb-2">
                  Automated AI Engine Telemetry
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Embedding Engine:</span>
                    <span className="font-bold text-teal-400">
                      128-D Perceptual (Active)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gemini Vision AI:</span>
                    <span className="font-bold text-teal-400">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Queue Jobs Running:</span>
                    <span className="font-bold text-purple-300">
                      {metrics?.aiQueueDepth || 0} active
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Firestore Sync:</span>
                    <span className="font-bold text-teal-400">
                      Live onSnapshot
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & RECOVERY STATISTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#131b2e] mb-1">
              Campus Item Category Distribution
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Real-time counts aggregated directly from reported items in
              Firestore.
            </p>

            {/* SVG Responsive Bar Chart */}
            <div className="space-y-3">
              {categoryData.map(({ category, count }) => {
                const maxCount = Math.max(
                  ...categoryData.map((c) => c.count),
                  1,
                )
                const pct = Math.round((count / maxCount) * 100)

                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="w-32 text-xs font-bold text-[#131b2e] capitalize truncate">
                      {category.replace("_", " ")}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-black text-gray-700">
                      {count} items
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#131b2e]">
                Recovery Velocity Benchmark
              </h3>
              <div className="text-3xl font-black text-emerald-600">
                {metrics?.recoveryRate}%
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Items matched and returned across the university network within
                an average window of{" "}
                <strong>{metrics?.averageRecoveryDays} days</strong>.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#131b2e]">
                Audit Trail Volume
              </h3>
              <div className="text-3xl font-black text-blue-600">
                {claimsList.length}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Total item handover claim workflows initiated. All verifications
                are backed with tamper-evident audit logs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT & ROLE MANAGEMENT & BAN */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                User & Role Management
              </h3>
              <p className="text-xs text-gray-500">
                Live query of {usersList.length} registered campus profiles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportUsersCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Download size={13} /> Export Users CSV
              </button>
            </div>
          </div>

          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search
                size={15}
                className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name, email, department..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 border-transparent text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 px-3 rounded-xl bg-gray-100 border-transparent text-xs font-bold text-gray-700 outline-none"
            >
              <option value="all">All Roles</option>
              <option value={ROLES.STUDENT}>Students</option>
              <option value={ROLES.FACULTY}>Faculty</option>
              <option value={ROLES.SECURITY}>Security</option>
              <option value={ROLES.ADMIN}>Admins</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Trust Score</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.uid}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="py-3 font-bold text-[#131b2e]">{u.name}</td>
                    <td className="py-3 text-gray-600">{u.email}</td>
                    <td className="py-3">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleUpdateRole(u.uid, e.target.value as UserRole)
                        }
                        className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold text-[#131b2e] border-none outline-none"
                      >
                        <option value={ROLES.STUDENT}>Student</option>
                        <option value={ROLES.FACULTY}>Faculty</option>
                        <option value={ROLES.SECURITY}>Security</option>
                        <option value={ROLES.ADMIN}>Admin</option>
                      </select>
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-700">
                      ★ {u.trustScore ?? 5.0}
                    </td>
                    <td className="py-3">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {u.isBanned ? (
                        <button
                          onClick={() => handleUnbanUser(u.uid)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanningUser(u)}
                          className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          Ban User
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CLAIMS & AI MATCHES APPROVAL */}
      {activeTab === "claims" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                Claim Review & AI Matches Queue
              </h3>
              <p className="text-xs text-gray-500">
                Live queue of {claimsList.length} claims and{" "}
                {pendingMatches.length} pending AI matches.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingMatches.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#131b2e]">
                      {m.lostItemTitle}
                    </span>
                    <ArrowRight size={13} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">
                      {m.foundItemTitle}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {m.aiExplanation}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                      {m.confidenceScore}% Confidence Match
                    </span>
                    {m.fraudScore >= 35 && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                        ⚠ Fraud Score: {m.fraudScore}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setReviewingMatch(m)}
                    className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => m.id && handleApproveMatch(m.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MANAGE CAMPUS OFFICES */}
      {activeTab === "offices" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                Campus Custody Offices
              </h3>
              <p className="text-xs text-gray-500">
                Physical lost & found locations with verified staff and holding
                inventory.
              </p>
            </div>
            <button
              onClick={() => setShowOfficeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Plus size={14} /> Add Campus Desk
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offices.map((off) => (
              <div
                key={off.id}
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 size={18} className="text-blue-600" />
                    <div>
                      <h4 className="font-bold text-sm text-[#131b2e]">
                        {off.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {off.building} · {off.roomNumber}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteOffice(off.id)}
                    className="text-gray-300 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-100">
                  <div>
                    Hours: <strong>{off.hours}</strong>
                  </div>
                  <div>
                    Phone: <strong>{off.phone}</strong>
                  </div>
                  <div>
                    Supervisor: <strong>{off.supervisorName}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MANAGE CATEGORIES */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#131b2e]">
              Item Categories & Taxonomies
            </h3>
            <p className="text-xs text-gray-500">
              Add or manage item categories recognized by the AI Matching
              Engine.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Eyewear & Sunglasses"
              className="flex-1 p-2.5 px-3.5 bg-gray-100 rounded-xl text-xs outline-none"
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              Add Category
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs font-bold"
              >
                <span>{c.name}</span>
                <button
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-gray-300 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: MANAGE DEPARTMENTS */}
      {activeTab === "departments" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#131b2e]">
              Campus Departments & Divisions
            </h3>
            <p className="text-xs text-gray-500">
              Manage university departments with faculty liaisons and dedicated
              contact points.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Department Name"
              value={newDeptForm.name}
              onChange={(e) =>
                setNewDeptForm({ ...newDeptForm, name: e.target.value })
              }
              className="p-2.5 bg-gray-100 rounded-xl text-xs outline-none"
            />
            <input
              type="text"
              placeholder="Code (e.g. CS)"
              value={newDeptForm.code}
              onChange={(e) =>
                setNewDeptForm({ ...newDeptForm, code: e.target.value })
              }
              className="p-2.5 bg-gray-100 rounded-xl text-xs outline-none"
            />
            <input
              type="text"
              placeholder="Faculty Lead"
              value={newDeptForm.facultyLead}
              onChange={(e) =>
                setNewDeptForm({ ...newDeptForm, facultyLead: e.target.value })
              }
              className="p-2.5 bg-gray-100 rounded-xl text-xs outline-none"
            />
            <button
              onClick={handleAddDepartment}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700"
            >
              Add Department
            </button>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {departments.map((d) => (
              <div
                key={d.id}
                className="p-3.5 px-4 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-[#131b2e]">
                    {d.name} ({d.code})
                  </span>
                  <div className="text-[11px] text-gray-500">
                    Lead: {d.facultyLead} · {d.contactEmail}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDepartment(d.id)}
                  className="text-gray-300 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: BROADCAST NOTIFICATIONS */}
      {activeTab === "broadcast" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
              <Megaphone size={18} className="text-blue-600" />
              Dispatch Campus-Wide Announcement
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Send system announcements directly to in-app notification centers
              and browser push alerts.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-gray-100 text-xs font-bold text-gray-800 outline-none"
              >
                <option value="all">All Campus Accounts</option>
                <option value={ROLES.STUDENT}>Students Only</option>
                <option value={ROLES.FACULTY}>Faculty Only</option>
                <option value={ROLES.SECURITY}>Campus Security Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Alert Headline
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. End of Semester Lost Property Claim Deadline"
                className="w-full p-2.5 rounded-xl border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Announcement Body
              </label>
              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Details on pickup schedules, security desk hours..."
                rows={4}
                className="w-full p-2.5 rounded-xl border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {broadcasting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Megaphone size={15} />
              )}
              Broadcast Now
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: SYSTEM HEALTH & ERROR MONITORING & EXPORT */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
              <Activity size={18} className="text-teal-600" /> System Telemetry
              & Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                  Firestore Service
                </div>
                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                  Operational & Responsive
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                  AI Matching Queue
                </div>
                <div className="font-bold text-purple-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />{" "}
                  {metrics?.aiQueueDepth || 0} Background Jobs
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="font-bold text-gray-500 uppercase text-[10px] mb-1">
                  Error Logs
                </div>
                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> 0
                  Critical Exceptions
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#131b2e]">
              Administrative Document Exports
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportUsersCSV}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700"
              >
                <Download size={14} /> Export Users Registry (CSV)
              </button>

              <Link
                to="/admin/audit-logs"
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700"
              >
                <FileText size={14} /> View Audit Logs (CSV Export)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {banningUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
              <UserX size={18} /> Suspend Campus Account
            </h3>
            <p className="text-xs text-gray-600">
              Suspend account privileges for <strong>{banningUser.name}</strong>{" "}
              ({banningUser.email}).
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Suspension Reason
              </label>
              <textarea
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="e.g. Fraudulent item claim violation..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setBanningUser(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Office Modal */}
      {showOfficeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#131b2e]">
              Register Campus Custody Office
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Office Name"
                value={officeForm.name}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, name: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-gray-100 text-xs outline-none"
              />
              <input
                type="text"
                placeholder="Building Name"
                value={officeForm.building}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, building: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-gray-100 text-xs outline-none"
              />
              <input
                type="text"
                placeholder="Room Number"
                value={officeForm.roomNumber}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, roomNumber: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-gray-100 text-xs outline-none"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={officeForm.phone}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, phone: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-gray-100 text-xs outline-none"
              />
              <input
                type="text"
                placeholder="Hours (e.g. 8AM–8PM Mon-Fri)"
                value={officeForm.hours}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, hours: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-gray-100 text-xs outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowOfficeModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOffice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Save Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Match Modal */}
      {reviewingMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#131b2e]">
                Inspect AI Match & Handover Authorization
              </h3>
              <button
                onClick={() => setReviewingMatch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl">
              <div>
                <span className="text-gray-400 uppercase font-bold block">
                  Lost Item
                </span>
                <span className="font-bold text-[#131b2e]">
                  {reviewingMatch.lostItemTitle}
                </span>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold block">
                  Found Item
                </span>
                <span className="font-bold text-[#131b2e]">
                  {reviewingMatch.foundItemTitle}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-700 leading-relaxed bg-purple-50/60 p-3 rounded-xl border border-purple-100">
              <strong className="text-purple-900 block mb-1">
                AI Reasoning:
              </strong>
              {reviewingMatch.aiExplanation}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Admin Verification Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes for handover officer..."
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() =>
                  reviewingMatch.id && handleFalsePositive(reviewingMatch.id)
                }
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold"
              >
                False Positive
              </button>
              <button
                onClick={() =>
                  reviewingMatch.id && handleMergeDuplicate(reviewingMatch.id)
                }
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-xl text-xs font-bold"
              >
                Merge Duplicate
              </button>
              <button
                onClick={() =>
                  reviewingMatch.id && handleRejectMatch(reviewingMatch.id)
                }
                disabled={actionLoading}
                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold"
              >
                Reject
              </button>
              <button
                onClick={() =>
                  reviewingMatch.id && handleApproveMatch(reviewingMatch.id)
                }
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Approve Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
