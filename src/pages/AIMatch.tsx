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
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleMatchingService } from "../services/simpleMatching.service"
import { SimpleItemService } from "../services/simpleItem.service"
import { Match } from "../types/Match"

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
      setActionSuccess("Contact information successfully unlocked!")
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
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="text-purple-600 dark:text-purple-400" size={28} />
          AI Matching Center
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Review potential matches identified by Gemini AI. Confirm pairings,
          securely exchange contact details, and coordinate handovers.
        </p>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 className="animate-spin text-purple-600" size={32} />
          <p className="text-sm font-medium">Scanning for AI item matches...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200/80 dark:border-gray-800 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No AI Matches Found Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-6">
            When someone reports an item that resembles your lost or found
            items, Gemini AI will evaluate similarities and display candidate
            matches here.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/dashboard/lost"
              className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800"
            >
              Browse Lost Items
            </Link>
            <Link
              to="/dashboard/found"
              className="px-4 py-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-bold hover:bg-teal-100 transition-colors border border-teal-200 dark:border-teal-800"
            >
              Browse Found Items
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map((m) => {
            const isLostOwner = m.lostUserId === user?.uid
            const counterpartRole = isLostOwner ? "Finder" : "Original Owner"
            const counterpartName = isLostOwner
              ? m.foundUserName
              : m.lostUserName
            const counterpartEmail = isLostOwner
              ? m.foundUserEmail
              : m.lostUserEmail
            const counterpartMobile = isLostOwner
              ? m.foundUserMobile
              : m.lostUserMobile

            const scoreColor =
              m.aiScore >= 80
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : m.aiScore >= 60
                  ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Match Score & Status */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${scoreColor}`}
                    >
                      <Sparkles size={13} />
                      {m.aiScore}% Match ·{" "}
                      {m.aiScore >= 80 ? "High Confidence" : "Possible Match"}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-700">
                      {m.source === "MANUAL" ? "Admin Matched" : "Gemini AI"}
                    </span>
                  </div>

                  {/* Paired Items Visual Card */}
                  <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50/80 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700">
                    {/* Lost Side */}
                    <div className="bg-white dark:bg-gray-800/90 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs">
                      <div className="flex items-center gap-1 text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                        <FileWarning size={11} /> Lost Item
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {m.lostItemName}
                      </h4>
                      <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                        {m.lostReference}
                      </p>
                    </div>

                    {/* Found Side */}
                    <div className="bg-white dark:bg-gray-800/90 p-3 rounded-xl border border-teal-200 dark:border-teal-900/60 shadow-xs">
                      <div className="flex items-center gap-1 text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                        <CheckCircle2 size={11} /> Found Item
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {m.foundItemName}
                      </h4>
                      <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                        {m.foundReference}
                      </p>
                    </div>
                  </div>

                  {/* AI Explanation Text */}
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                      AI Reasoning:
                    </span>
                    <p className="text-xs text-gray-800 dark:text-gray-200 bg-purple-50/70 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-200/80 dark:border-purple-800/50 leading-relaxed font-medium">
                      "{m.aiReason}"
                    </p>
                  </div>

                  {/* Contact Exchange Box */}
                  {m.contactShared ? (
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <ShieldCheck size={16} /> Contact Details Unlocked
                      </div>
                      <div className="text-xs text-gray-800 dark:text-gray-200 space-y-1 pt-1 font-medium">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-gray-400" />
                          <span>
                            <strong>{counterpartRole}:</strong>{" "}
                            {counterpartName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-gray-400" />
                          <span>
                            <strong>Email:</strong>{" "}
                            <a
                              href={`mailto:${counterpartEmail}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {counterpartEmail}
                            </a>
                          </span>
                        </div>
                        {counterpartMobile && (
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-gray-400" />
                            <span>
                              <strong>Mobile:</strong>{" "}
                              <a
                                href={`tel:${counterpartMobile}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {counterpartMobile}
                              </a>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-3.5 mb-4 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between gap-2">
                      <span>
                        🔒 Contact info is hidden until match is confirmed.
                      </span>
                      <button
                        onClick={() => handleShareContact(m)}
                        disabled={sharingContact}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                      >
                        {sharingContact ? "Unlocking..." : "Confirm & Reveal"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Handover Button */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                  <Link
                    to={`/dashboard/scan-qr?matchId=${m.id}&lostId=${m.lostItemId}&foundId=${m.foundItemId}&lostRef=${m.lostReference}&foundRef=${m.foundReference}`}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-center text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <KeyRound size={15} /> Verify Handover (OTP / QR)
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
