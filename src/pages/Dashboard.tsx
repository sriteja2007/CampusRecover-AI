import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  Sparkles,
  Package,
  Search,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  QrCode,
  ShieldCheck,
  Building2,
  Users,
  FileSearch,
  KeyRound,
  ShieldAlert,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Calendar,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  LostItemService,
  FoundItemService,
} from "../services/firebase/item.service"
import { MatchingService, MatchResult } from "../services/matching.service"
import { HandoverService } from "../services/handover.service"
import { LostItem } from "../types/LostItem"
import { FoundItem } from "../types/FoundItem"
import { Claim } from "../types/Claim"
import { RealtimeChatService, ChatRoom } from "../services/firebase/chat.service"
import { MeetingService, Meeting } from "../services/firebase/meeting.service"
import { SkeletonDashboard } from "../components/common/Skeleton"
import { EmptyState } from "../components/common/EmptyState"
import { SEO } from "../components/common/SEO"

export default function Dashboard() {
  const { user, customUser, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [userLost, setUserLost] = useState<LostItem[]>([])
  const [userFound, setUserFound] = useState<FoundItem[]>([])
  const [userMatches, setUserMatches] = useState<MatchResult[]>([])
  const [userClaims, setUserClaims] = useState<Claim[]>([])
  const [userChats, setUserChats] = useState<ChatRoom[]>([])
  const [userMeetings, setUserMeetings] = useState<Meeting[]>([])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadUserData = async () => {
      setLoading(true)
      try {
        const [lostRes, foundRes, matchesRes, claimsRes, roomsRes, meetingsRes] = await Promise.all([
          LostItemService.getByUser(user.uid),
          FoundItemService.getByUser(user.uid),
          MatchingService.getUserMatches(user.uid),
          HandoverService.getClaimsForUser(user.uid),
          RealtimeChatService.getUserRooms(user.uid),
          MeetingService.getUserMeetings(user.uid),
        ])

        setUserLost(lostRes)
        setUserFound(foundRes)
        setUserMatches(matchesRes)
        setUserClaims(claimsRes)
        setUserChats(roomsRes)
        setUserMeetings(meetingsRes)
      } catch (err) {
        console.error("Dashboard data load error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

  if (authLoading || loading) {
    return <SkeletonDashboard />
  }

  const role = customUser?.role || "student"
  const displayName = customUser?.name || user?.displayName || "Campus Member"
  const firstName = displayName.split(" ")[0]
  const university = customUser?.university || "CampusRecover Network"
  const department = customUser?.department ? ` · ${customUser.department}` : ""
  const trustScore = customUser?.trustScore
    ? customUser.trustScore.toFixed(1)
    : "100.0"
  const initial = displayName.charAt(0).toUpperCase()

  // Metrics
  const activeReportsCount = userLost.length + userFound.length
  const matchCount = userMatches.length
  const matchRate =
    activeReportsCount > 0
      ? Math.round((matchCount / activeReportsCount) * 100)
      : 0
  const activeClaims = userClaims.filter(
    (c) => c.status !== "resolved" && c.status !== "rejected",
  )
  const completedClaims = userClaims.filter((c) => c.status === "resolved")

  // Combined recent items
  const recentItems = [...userLost, ...userFound]
    .sort((a, b) => {
      const timeA = (a.createdAt as any)?.seconds || 0
      const timeB = (b.createdAt as any)?.seconds || 0
      return timeB - timeA
    })
    .slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO
        title={`${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`}
        description="Unified Lost & Found campus command center powered by CampusRecover AI."
      />

      {/* Role-Specific Banner Alert for Active Claims */}
      {activeClaims.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-indigo-500/10 border border-teal-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                You have {activeClaims.length} active item handover in progress
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                OTP verification and dynamic QR transfer ready for custody
                confirmation.
              </p>
            </div>
          </div>
          <Link
            to={`/dashboard/scan-qr?claimId=${activeClaims[0].id}`}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors shrink-0"
          >
            Open Handover Verification →
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3.5">
          {customUser?.avatar || user?.photoURL ? (
            <img
              src={customUser?.avatar || user?.photoURL || ""}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-600 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {initial}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Good day, {firstName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>
                {university}
                {department}
              </span>
              <span>•</span>
              <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">
                {role}
              </span>
              <span>•</span>
              <span>
                Trust Score{" "}
                <strong className="text-teal-600 dark:text-teal-400 font-bold">
                  {trustScore}
                </strong>
              </span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/report-lost"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <Sparkles size={15} /> Report Lost
          </Link>
          <Link
            to="/dashboard/report-found"
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl shadow-sm shadow-teal-500/20 transition-all"
          >
            <Package size={15} /> Report Found
          </Link>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {role === "security"
                ? "Custody Items"
                : role === "faculty"
                  ? "Dept Reports"
                  : "My Reports"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {activeReportsCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {userLost.length} lost • {userFound.length} found
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              AI Matches
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {matchCount}
          </div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-semibold">
            {matchRate}% pairing rate
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Claims
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {activeClaims.length}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Awaiting OTP / QR Handover
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Resolved Items
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {completedClaims.length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            Successfully recovered
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Recent Campus Activity
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Items you have recently logged or verified
              </p>
            </div>
            <Link
              to="/dashboard/my-reports"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all reports <ArrowRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentItems.length === 0 ? (
              <EmptyState
                title="No reports filed yet"
                description="You haven't posted any lost or found items. Report an item or browse campus registry."
                actionLabel="Report Lost Item"
                actionHref="/dashboard/report-lost"
                secondaryLabel="Browse Lost Feed"
                secondaryHref="/dashboard/lost"
              />
            ) : (
              recentItems.map((item) => {
                const isLost = "locationLost" in item
                const loc = isLost
                  ? (item as LostItem).locationLost
                  : (item as FoundItem).locationFound
                const thumb = item.imageUrls?.[0]

                return (
                  <div
                    key={item.id}
                    className="p-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isLost
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                              : "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400"
                          }`}
                        >
                          {isLost ? "Lost" : "Found"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin size={12} />
                        <span className="truncate">
                          {loc || "Campus grounds"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">
                        {item.status}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Dashboard Widgets: Recent Chats & Meetings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Recent Chats */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#131b2e] dark:text-white flex items-center gap-2 text-sm">
                <MessageSquare className="text-emerald-500" size={18} /> Recent Chats
              </h3>
              <Link to="/dashboard/messages" className="text-xs text-emerald-600 font-bold hover:underline">
                View All
              </Link>
            </div>
            <div className="flex-1 space-y-3">
              {userChats.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  No recent conversations.
                </div>
              ) : (
                userChats.slice(0, 3).map((chat) => {
                  const otherUser = chat.participants.find((p) => p !== user?.uid) || ""
                  const otherName = chat.participantNames[otherUser] || "User"
                  return (
                    <Link
                      key={chat.id}
                      to={`/dashboard/chat?room=${chat.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 dark:bg-gray-800 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{otherName}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{chat.lastMessage || chat.itemTitle}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-400" />
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Pending Meetings */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#131b2e] dark:text-white flex items-center gap-2 text-sm">
                <Calendar className="text-blue-500" size={18} /> Pending Meetings
              </h3>
            </div>
            <div className="flex-1 space-y-3">
              {userMeetings.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  No scheduled meetings.
                </div>
              ) : (
                userMeetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-gray-800 dark:border-gray-700"
                  >
                    <div>
                      <p className="font-bold text-xs text-blue-900 dark:text-blue-100">{meeting.officeName}</p>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300">
                        {meeting.date} at {meeting.time}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white text-blue-600 capitalize shadow-xs border border-blue-50">
                      {meeting.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Role Quick Actions & Trust Score Card */}
        <div className="space-y-6">
          {/* Quick Actions Panel tailored per role */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {role === "admin"
                ? "Admin Navigation"
                : role === "security"
                  ? "Security Protocol Actions"
                  : role === "faculty"
                    ? "Department Actions"
                    : "Student Quick Actions"}
            </h3>

            <div className="space-y-2">
              {role === "admin" && (
                <Link
                  to="/admin"
                  className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert size={16} /> Open Admin Command Center
                  </span>
                  <ArrowRight size={13} />
                </Link>
              )}

              {role === "security" && (
                <>
                  <Link
                    to="/dashboard/scan-qr"
                    className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold text-xs hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <QrCode size={16} /> Scan Handover QR Token
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                  <Link
                    to="/dashboard/generate-otp"
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound size={16} /> Generate Handover OTP
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                </>
              )}

              {role === "faculty" && (
                <>
                  <Link
                    to="/dashboard/department-items"
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 size={16} /> Department Item Intake
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                  <Link
                    to="/dashboard/student-reports"
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={16} /> Review Student Claims
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                </>
              )}

              {/* Common Actions */}
              <Link
                to="/dashboard/ai-match"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-500" /> Automated AI
                  Matches
                </span>
                <ArrowRight size={13} />
              </Link>

              <Link
                to="/dashboard/scan-qr"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <QrCode size={16} className="text-blue-500" /> Verify Handover
                  (QR / OTP)
                </span>
                <ArrowRight size={13} />
              </Link>

              <Link
                to="/dashboard/map"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-500" /> Campus
                  Hotspots Map
                </span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* User Trust & Verification Card */}
          <div className="p-6 bg-gradient-to-br from-[#131b2e] to-[#1e293b] text-white rounded-3xl shadow-md space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-white/50 uppercase tracking-widest">
              <span>Campus Trust Score</span>
              <ShieldCheck size={16} className="text-teal-400" />
            </div>

            <div className="text-4xl font-black tracking-tight">
              {trustScore}
            </div>
            <p className="text-xs text-white/60">
              Verified campus account in good standing. Handover completion
              grants +1.0 trust bonus.
            </p>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
                style={{ width: `${Math.min(100, parseFloat(trustScore))}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 bg-white/5 rounded-xl">
                <div className="font-bold text-white">{activeReportsCount}</div>
                <div className="text-[10px] text-white/40">Reports</div>
              </div>
              <div className="p-2 bg-white/5 rounded-xl">
                <div className="font-bold text-white">{userClaims.length}</div>
                <div className="text-[10px] text-white/40">Claims</div>
              </div>
              <div className="p-2 bg-white/5 rounded-xl">
                <div className="font-bold text-white">100%</div>
                <div className="text-[10px] text-white/40">Reliability</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
