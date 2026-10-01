import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  FileWarning,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Search,
  Plus,
  FileText,
  KeyRound,
  ArrowRight,
  Package,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { SimpleMatchingService } from "../services/simpleMatching.service"
import { Item } from "../types/Item"
import { Match } from "../types/Match"

export default function Dashboard() {
  const { user, customUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [lostCount, setLostCount] = useState(0)
  const [foundCount, setFoundCount] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const [recoveredCount, setRecoveredCount] = useState(0)
  const [recentReports, setRecentReports] = useState<Item[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])

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
      const [userItems, userMatches, allItems] = await Promise.all([
        SimpleItemService.getItemsByUser(user.uid),
        SimpleMatchingService.getUserMatches(user.uid),
        SimpleItemService.getItems(),
      ])

      const myLost = userItems.filter((i) => i.type === "LOST")
      const myFound = userItems.filter((i) => i.type === "FOUND")
      const recovered = userItems.filter((i) => i.status === "recovered")

      setLostCount(myLost.length)
      setFoundCount(myFound.length)
      setMatchCount(userMatches.length)
      setRecoveredCount(recovered.length)

      setRecentReports(allItems.slice(0, 5))
      setRecentMatches(userMatches.slice(0, 3))
    } catch (err) {
      console.error("Dashboard data load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const displayName = customUser?.name || user?.displayName || "Student"

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-sm font-medium">Loading your campus dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#131b2e] to-[#1e293b] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-400 block mb-1">
            Campus Lost & Found Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {displayName}!
          </h1>
          <p className="text-sm text-gray-300 mt-1 max-w-lg">
            Manage your reports, scan for AI-matched belongings, and securely
            verify recoveries across campus.
          </p>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <Link
            to="/dashboard/report-lost"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Report Lost Item
          </Link>
          <Link
            to="/dashboard/report-found"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} /> Report Found Item
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Lost */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              My Lost Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <FileWarning size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{lostCount}</div>
          <Link
            to="/dashboard/my-reports"
            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline mt-2 inline-block"
          >
            View Lost Items →
          </Link>
        </div>

        {/* Card 2: My Found */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              My Found Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{foundCount}</div>
          <Link
            to="/dashboard/my-reports"
            className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline mt-2 inline-block"
          >
            View Found Items →
          </Link>
        </div>

        {/* Card 3: AI Matches */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              AI Matches
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{matchCount}</div>
          <Link
            to="/dashboard/ai-match"
            className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline mt-2 inline-block"
          >
            View AI Matches →
          </Link>
        </div>

        {/* Card 4: Recovered */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Recoveries
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            {recoveredCount}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2 inline-block">
            Successfully verified
          </span>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div>
        <h2 className="text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            to="/dashboard/report-lost"
            className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-rose-400 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
              <FileWarning size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Report Lost
            </span>
          </Link>

          <Link
            to="/dashboard/report-found"
            className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-teal-400 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Report Found
            </span>
          </Link>

          <Link
            to="/dashboard/lost"
            className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-blue-400 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
              <Search size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Search Items
            </span>
          </Link>

          <Link
            to="/dashboard/ai-match"
            className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-purple-400 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              AI Matches
            </span>
          </Link>

          <Link
            to="/dashboard/my-reports"
            className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-indigo-400 hover:shadow-md transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              My Reports
            </span>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Reports & AI Match Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campus Reports (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 dark:text-white text-base">
              Recent Campus Reports
            </h3>
            <Link
              to="/dashboard/lost"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Browse All <ArrowRight size={13} />
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">
              No reports filed yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentReports.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.type === "LOST" ? "bg-rose-500" : "bg-teal-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.itemName}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {item.referenceNumber}
                        </span>
                        <span>·</span>
                        <span>{item.location}</span>
                        <span>·</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      item.status === "recovered"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Matches Feed (1 col) */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                Your AI Matches
              </h3>
              <Link
                to="/dashboard/ai-match"
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                View All
              </Link>
            </div>

            {recentMatches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No active matches for your items right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-purple-950 dark:text-purple-200 mb-1">
                      <span>{m.lostItemName}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                        {m.aiScore}% Match
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-[11px] line-clamp-2 mb-2 leading-relaxed">
                      "{m.aiReason}"
                    </p>
                    <Link
                      to={`/dashboard/ai-match?matchId=${m.id}`}
                      className="text-purple-700 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      View Details & Contact <ChevronRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
            <Link
              to="/dashboard/scan-qr"
              className="w-full py-2.5 bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center block transition-colors shadow-xs"
            >
              Verify Handover Code (OTP/QR)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
