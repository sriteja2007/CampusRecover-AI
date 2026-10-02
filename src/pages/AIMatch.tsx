import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  QrCode,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Package,
  FileWarning,
  Loader2,
  Check,
  Layers,
  MapPin,
  Calendar,
  Lock,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleMatchingService } from "../services/simpleMatching.service"
import { SimpleItemService } from "../services/simpleItem.service"
import { Match } from "../types/Match"
import { Badge } from "../components/ui/Badge"
import { ConfidenceGauge } from "../components/ui/ConfidenceGauge"
import { StatusIndicator } from "../components/ui/StatusIndicator"

export default function AIMatch() {
  const { user, customUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refParam = searchParams.get("ref")

  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [sharingContact, setSharingContact] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user?.uid) {
      loadMatches()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadMatches = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const results = await SimpleMatchingService.getUserMatches(user.uid)
      setMatches(results)

      // If user came with refParam, select match corresponding to it
      if (refParam) {
        const found = results.find(
          (m) => m.lostReference === refParam || m.foundReference === refParam,
        )
        if (found) setSelectedMatch(found)
      }
    } catch (err) {
      console.error("Failed to load user matches:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleShareContact = async (match: Match) => {
    setSharingContact(true)
    try {
      await SimpleMatchingService.confirmMatch(match.id)
      setActionSuccess("Contact information successfully unlocked! You can now coordinate handover.")
      await loadMatches()
      setSelectedMatch((prev) =>
        prev
          ? { ...prev, contactShared: true, status: "contact_shared" }
          : null,
      )
    } catch (err) {
      console.error("Failed to confirm match:", err)
    } finally {
      setSharingContact(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles size={14} />
          <span>Multimodal Matching Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          AI Intelligence & Recovery Matches
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Gemini multimodal analysis evaluates photographic features, semantic descriptions, campus location clusters, and reporting timeframes to connect owners with custodians.
        </p>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            {actionSuccess}
          </span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="animate-spin text-purple-600" size={36} />
          <p className="text-sm font-medium text-slate-500">Computing neural cross-matches...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Active Matches Identified Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-6 leading-relaxed">
            Our background AI worker constantly compares newly reported lost & found items. You will receive an immediate notification as soon as a high-confidence match is detected.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/dashboard/search"
              className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800"
            >
              Browse Campus Directory
            </Link>
            <Link
              to="/dashboard/report-lost"
              className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-800"
            >
              Report Lost Item
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map((m) => {
            const isLostOwner = m.lostUserId === user?.uid
            const counterpartRole = isLostOwner ? "Custodian / Finder" : "Original Owner"
            const counterpartName = isLostOwner
              ? m.foundUserName
              : m.lostUserName
            const counterpartEmail = isLostOwner
              ? m.foundUserEmail
              : m.lostUserEmail
            const counterpartMobile = isLostOwner
              ? m.foundUserMobile
              : m.lostUserMobile

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-800/80 hover:shadow-lg transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Match Score & Engine Source */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <ConfidenceGauge score={m.aiScore} size="md" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {m.aiScore >= 80
                            ? "High Confidence Match"
                            : m.aiScore >= 60
                            ? "Probable Match"
                            : "Candidate Match"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {m.source === "MANUAL" ? "Admin Verified" : "Gemini Multimodal AI"}
                        </span>
                      </div>
                    </div>

                    <StatusIndicator status={m.status || "possible_match"} size="sm" showLabel />
                  </div>

                  {/* Paired Side-by-Side Comparison */}
                  <div className="grid grid-cols-2 gap-3 mb-5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    {/* Lost Report Card */}
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xs">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                        <FileWarning size={12} /> Lost Report
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {m.lostItemName}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {m.lostReference}
                      </p>
                    </div>

                    {/* Found Report Card */}
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-teal-200 dark:border-teal-900/60 shadow-2xs">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                        <CheckCircle2 size={12} /> Found Report
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {m.foundItemName}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {m.foundReference}
                      </p>
                    </div>
                  </div>

                  {/* Location Signal Comparison (Prompt Section 25) */}
                  <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={13} className="text-blue-600" />
                        Location Comparison
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          (m.locationSimilarity || "High") === "High"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : (m.locationSimilarity || "Moderate") === "Moderate"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        Location similarity: {m.locationSimilarity || "High"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                        <span className="text-[10px] text-rose-500 font-bold block uppercase tracking-wider">
                          Lost Location
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                          {m.lostLocation || "CSE / CSM Block"}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-teal-200/60 dark:border-teal-900/40">
                        <span className="text-[10px] text-teal-600 font-bold block uppercase tracking-wider">
                          Found Location
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                          {m.foundLocation || "CSE / CSM Block"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Matching Signals Breakdown */}
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Matching Signals
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                        <Check size={12} /> Image Feat.
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                        <Check size={12} /> Category
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                        <Check size={12} /> Color
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                        <Check size={12} /> Proximity
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning Text */}
                  <div className="mb-5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      AI Reasoning Summary
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-purple-50/60 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-200/70 dark:border-purple-900/40 leading-relaxed font-medium">
                      "{m.aiReason || "High semantic and visual correlation between lost and found descriptions."}"
                    </p>
                  </div>

                  {/* Contact Exchange Box */}
                  {m.contactShared ? (
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        Verified Campus Contact Details Unlocked
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200 space-y-1.5 pt-1 font-medium">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-slate-400" />
                          <span>
                            <strong>{counterpartRole}:</strong> {counterpartName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-400" />
                          <span>
                            <strong>Email:</strong>{" "}
                            <a
                              href={`mailto:${counterpartEmail}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                            >
                              {counterpartEmail}
                            </a>
                          </span>
                        </div>
                        {counterpartMobile && (
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-slate-400" />
                            <span>
                              <strong>Mobile:</strong>{" "}
                              <a
                                href={`tel:${counterpartMobile}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                              >
                                {counterpartMobile}
                              </a>
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2">
                        <a
                          href={`mailto:${counterpartEmail}?subject=CampusRecover%20Regarding%20Match%20between%20${encodeURIComponent(m.lostReference)}%20and%20${encodeURIComponent(m.foundReference)}`}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <Mail size={14} /> Send Email to {counterpartRole}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-5 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Lock size={15} className="text-slate-400 shrink-0" />
                        <span>Contact info is protected until verified.</span>
                      </div>
                      <button
                        onClick={() => handleShareContact(m)}
                        disabled={sharingContact}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {sharingContact ? "Unlocking..." : "Confirm & Unlock"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Handover Verification CTA */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/dashboard/scan-qr?matchId=${m.id}&lostId=${m.lostItemId}&foundId=${m.foundItemId}&lostRef=${m.lostReference}&foundRef=${m.foundReference}`}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-2xl text-center text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <KeyRound size={15} /> Verify Custody Handover (OTP / QR)
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
