import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  FileWarning,
  CheckCircle2,
  Sparkles,
  Search,
  KeyRound,
  ArrowRight,
  Package,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  UserCheck,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService, LocationAnalytics } from "../services/simpleItem.service"
import { SimpleMatchingService } from "../services/simpleMatching.service"
import { SimpleClaimService } from "../services/simpleClaim.service"
import { Item } from "../types/Item"
import { Match } from "../types/Match"
import { Claim } from "../types/Claim"
import { Badge } from "../components/ui/Badge"
import { StatusIndicator } from "../components/ui/StatusIndicator"
import { ConfidenceGauge } from "../components/ui/ConfidenceGauge"
import CampusMap from "../components/map/CampusMap"

export default function Dashboard() {
  const { user, customUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [activeReportsCount, setActiveReportsCount] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const [claimsCount, setClaimsCount] = useState(0)
  const [recoveredCount, setRecoveredCount] = useState(0)
  const [userReports, setUserReports] = useState<Item[]>([])
  const [userClaims, setUserClaims] = useState<Claim[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [recentCampusItems, setRecentCampusItems] = useState<Item[]>([])
  const [locationStats, setLocationStats] = useState<LocationAnalytics[]>([])

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const [userItems, userMatches, allCampusItems, analyticsResult, userClaimsData] =
        await Promise.all([
          SimpleItemService.getItemsByUser(user.uid),
          SimpleMatchingService.getUserMatches(user.uid),
          SimpleItemService.getItems(),
          SimpleItemService.getLocationAnalytics(),
          SimpleClaimService.getClaims({ claimantId: user.uid }),
        ])

      const active = userItems.filter(
        (i) => i.status !== "recovered" && i.status !== "closed",
      )
      const recovered = userItems.filter((i) => i.status === "recovered")
      const pendingClaims = userClaimsData.filter(
        (c) => c.status === "pending" || c.status === "under_review" || c.status === "approved",
      )

      setActiveReportsCount(active.length)
      setMatchCount(userMatches.length)
      setClaimsCount(pendingClaims.length)
      setRecoveredCount(recovered.length)

      setUserReports(userItems.slice(0, 5))
      setUserClaims(userClaimsData.slice(0, 3))
      setRecentMatches(userMatches.slice(0, 3))
      setRecentCampusItems(allCampusItems.slice(0, 20))
      setLocationStats(analyticsResult.analytics)
    } catch (err) {
      console.error("Dashboard data load error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const displayName = customUser?.name || user?.displayName?.split(" ")[0] || "Student"

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-sm font-medium">Loading your recovery activity...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {displayName}.
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here&apos;s your active recovery activity across MVGR College of Engineering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/items"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs"
          >
            <Search size={14} className="text-slate-400" />
            <span>Search Directory</span>
          </Link>
          <Link
            to="/dashboard/scan-qr"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors shadow-2xs"
          >
            <KeyRound size={14} />
            <span>Verify Handover</span>
          </Link>
        </div>
      </div>

      {/* 2. Four Exact Specification Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Active Reports */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Reports
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileWarning size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {activeReportsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Under search on campus</p>
          </div>
        </div>

        {/* Metric 2: Possible Matches */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Possible Matches
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {matchCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Potential pairings detected</p>
          </div>
        </div>

        {/* Metric 3: In-Progress Claims */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              In-Progress Claims
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {claimsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Ownership verifications</p>
          </div>
        </div>

        {/* Metric 4: Items Recovered */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Items Recovered
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {recoveredCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Reunited successfully</p>
          </div>
        </div>
      </div>

      {/* In-Progress Claims Section if User has filed claims */}
      {userClaims.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" />
              My Ownership Claims Status
            </h3>
            <Link
              to="/dashboard/my-reports"
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              View All Claims →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {userClaims.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-600 text-[11px]">
                    {c.itemReference || "CR-ITEM"}
                  </span>
                  <Badge
                    variant={
                      c.status === "approved"
                        ? "recovered"
                        : c.status === "rejected"
                        ? "destructive"
                        : "purple"
                    }
                  >
                    {c.status.replace("_", " ")}
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white truncate">
                  {c.itemTitle || "Campus Item"}
                </h4>
                {c.otpCode && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-center border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
                      VERIFIED HANDOVER OTP
                    </span>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {c.otpCode}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Dashboard Hero Actions: Two Distinct Major Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Action 1: I Lost Something */}
        <div className="bg-gradient-to-br from-rose-50/70 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-6 sm:p-7 border border-rose-200/80 dark:border-rose-900/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/50 dark:border-rose-800/40">
              <FileWarning size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                I Lost Something
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Report a lost personal item. Gemini AI will scan all active found
                records on campus and alert you the second a match is discovered.
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-rose-100 dark:border-rose-950/50">
            <Link
              to="/dashboard/report-lost"
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Submit Lost Report</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Action 2: I Found Something */}
        <div className="bg-gradient-to-br from-teal-50/70 via-white to-white dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-6 sm:p-7 border border-teal-200/80 dark:border-teal-900/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                I Found Something
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Found an item in class, library, or dorms? Log the location and
                description so our AI can reunite it with its rightful owner.
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-teal-100 dark:border-teal-950/50">
            <Link
              to="/dashboard/report-found"
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Submit Found Report</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Campus Activity & Real-Time Hotspot Summary (Prompt Section 21 & 22) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Widget (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                Campus Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time activity of recent lost &amp; found belongings across MVGR College of Engineering.
              </p>
            </div>

            <Link
              to="/dashboard/map"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <span>Explore Campus Map</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="pt-1">
            <CampusMap
              items={recentCampusItems}
              height="300px"
              showControls={false}
              showFilters={false}
              showLegend={true}
            />
          </div>
        </div>

        {/* Most Active Locations Real Database Summary (1 Column) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Incident Aggregations
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white mb-4">
              Most active locations
            </h4>

            {locationStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <MapPin size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p>No campus location reports logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {locationStats.slice(0, 5).map((stat) => (
                  <div
                    key={stat.location}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {stat.location}
                      </span>
                    </div>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono shrink-0 ml-2">
                      {stat.totalCount} {stat.totalCount === 1 ? "report" : "reports"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px]">Real database counts</span>
            <Link
              to="/dashboard/search"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Potential AI Matches Requiring Attention */}
      {recentMatches.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-purple-200 dark:border-purple-900/50 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Potential Matches Requiring Attention
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gemini AI identified connections for your reported items.
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/ai-match"
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              View all ({recentMatches.length}) <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {match.lostReference} ↔ {match.foundReference}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {match.aiScore}% Match
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {match.lostItemName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {match.aiReason}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <StatusIndicator status={match.status} size="sm" />
                  <Link
                    to={`/dashboard/ai-match?matchId=${match.id}`}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Review Pair &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recovery Progress Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recovery Lifecycle
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Standard path from item report to verified physical reunion.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
              Step 1
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
              Reported
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Logged in database
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
              Step 2
            </span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
              Matched
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              AI compares reports
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
              Step 3
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
              Confirmed
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Admin verifies pair
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
              Step 4
            </span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block mt-0.5">
              Contacted
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Students coordinate
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-800/60">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block font-mono">
              Step 5
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block mt-0.5">
              Recovered
            </span>
            <span className="text-[10px] text-emerald-600/80 block mt-1">
              OTP verified handover
            </span>
          </div>
        </div>
      </div>

      {/* 6. Recent User Activity */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Your Recent Reports
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest items submitted under your student account.
            </p>
          </div>

          <Link
            to="/dashboard/my-reports"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all ({userReports.length}) <ChevronRight size={14} />
          </Link>
        </div>

        {userReports.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              You haven&apos;t reported any items yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Use the buttons above to log a lost or found belonging.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {userReports.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === "LOST"
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                        : "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400"
                    }`}
                  >
                    {item.type === "LOST" ? (
                      <FileWarning size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.itemName}
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {item.referenceNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{item.location}</span>
                      <span>·</span>
                      <span>{item.date}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <StatusIndicator status={item.status} size="sm" />
                  <Link
                    to={`/dashboard/ai-match?ref=${item.referenceNumber}`}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    title="Check AI matches"
                  >
                    <Sparkles size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
