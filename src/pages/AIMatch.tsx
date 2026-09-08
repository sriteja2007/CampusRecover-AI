import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import {
  Brain,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Clock,
  Sparkles,
  Eye,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  RefreshCcw,
  Sliders,
  FileText,
  MessageSquare,
  Key,
  Check,
  ShieldCheck,
  History,
  Sparkle,
  Tag,
  Info,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  MatchingService,
  MatchResult,
  DEFAULT_CONFIDENCE_THRESHOLD,
  AIResultsService,
  AIAnalysisResult,
} from "../services/matching.service"
import {
  LostItemService,
  FoundItemService,
} from "../services/firebase/item.service"
import { RealtimeChatService } from "../services/firebase/chat.service"
import { QueueService, ProcessingJob } from "../services/queue.service"
import { GeminiService } from "../services/gemini.service"
import { LostItem } from "../types/LostItem"
import { FoundItem } from "../types/FoundItem"

const CONFIDENCE_BADGE = (score: number) => {
  if (score >= 85)
    return {
      bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
      bar: "bg-emerald-500",
      label: "High Confidence",
    }
  if (score >= 70)
    return {
      bg: "bg-purple-100 text-purple-800 border-purple-300",
      bar: "bg-purple-600",
      label: "Strong Match",
    }
  if (score >= 50)
    return {
      bg: "bg-amber-100 text-amber-800 border-amber-300",
      bar: "bg-amber-500",
      label: "Moderate Match",
    }
  return {
    bg: "bg-gray-100 text-gray-700 border-gray-300",
    bar: "bg-gray-400",
    label: "Low Confidence",
  }
}

export default function AIMatch() {
  const { user, customUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get("id")

  const [matches, setMatches] = useState<MatchResult[]>([])
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [selectedLostItem, setSelectedLostItem] = useState<LostItem | null>(
    null,
  )
  const [selectedItemAnalysis, setSelectedItemAnalysis] =
    useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [confidenceThreshold, setConfidenceThreshold] = useState(
    DEFAULT_CONFIDENCE_THRESHOLD,
  )
  const [activeTab, setActiveTab] =
    useState<"matches" | "history" | "engine_settings">("matches")
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)
  const [queueJobs, setQueueJobs] = useState<ProcessingJob[]>([])
  const [geminiKeyInput, setGeminiKeyInput] = useState(
    GeminiService.getApiKey(),
  )
  const [savedKeySuccess, setSavedKeySuccess] = useState(false)
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message })
      setTimeout(() => setToast(null), 4500)
    },
    [],
  )

  // Listen to background queue
  useEffect(() => {
    const unsubQueue = QueueService.subscribe((jobs) => {
      setQueueJobs(jobs)
    })
    return unsubQueue
  }, [])

  // Load user data
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        const [userMatches, userLost] = await Promise.all([
          MatchingService.getMatchesForUser(user.uid),
          LostItemService.getByUser(user.uid),
        ])
        setMatches(userMatches)
        setLostItems(userLost)

        if (userLost.length > 0) {
          setSelectedLostItem(userLost[0])
          AIResultsService.getAnalysis(userLost[0].id).then(
            setSelectedItemAnalysis,
          )
        }

        if (preselectedId) {
          setExpandedMatch(preselectedId)
        }
      } catch (err) {
        console.error("Failed to load matching data:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, preselectedId])

  // When selected lost item changes, fetch its AI analysis
  useEffect(() => {
    if (selectedLostItem) {
      AIResultsService.getAnalysis(selectedLostItem.id).then(
        setSelectedItemAnalysis,
      )
    }
  }, [selectedLostItem])

  const runScan = async () => {
    if (!selectedLostItem) {
      showToast("error", "Please select a reported item first.")
      return
    }

    setScanning(true)
    try {
      // Enqueue job or run interactive scan
      const results = await MatchingService.findMatchesForLostItem(
        selectedLostItem,
        confidenceThreshold,
      )
      setMatches(results)

      // Re-fetch analysis
      const analysis = await AIResultsService.getAnalysis(selectedLostItem.id)
      setSelectedItemAnalysis(analysis)

      if (results.length > 0) {
        showToast(
          "success",
          `AI found ${results.length} item match${
            results.length > 1 ? "es" : ""
          } with confidence $\\ge$ ${confidenceThreshold}%!`,
        )
      } else {
        showToast(
          "info",
          `No matches found above ${confidenceThreshold}%. Try lowering the threshold slider.`,
        )
      }
    } catch (err: any) {
      showToast("error", err.message || "AI scan encountered an issue.")
    } finally {
      setScanning(false)
    }
  }

  const handleConfirm = async (matchId: string) => {
    try {
      await MatchingService.confirmMatch(matchId)
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, status: "confirmed", confirmedByUser: true }
            : m,
        ),
      )
      showToast(
        "success",
        "Match confirmed! Admin has been notified for handover verification.",
      )
    } catch {
      showToast("error", "Failed to confirm match.")
    }
  }

  const handleReject = async (matchId: string) => {
    try {
      await MatchingService.rejectMatch(matchId)
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "rejected" } : m)),
      )
      showToast("info", "Match dismissed.")
    } catch {
      showToast("error", "Failed to dismiss match.")
    }
  }

  const startChatWithFinder = async (match: MatchResult) => {
    if (!user || !customUser) return
    try {
      const roomId = await RealtimeChatService.getOrCreateRoom({
        currentUserId: user.uid,
        otherUserId: match.foundUserId,
        currentUserName: customUser.name || "Student",
        otherUserName: "Finder / Campus Officer",
        currentUserPhoto: customUser.photoURL || "",
        otherUserPhoto: match.foundItemImage || "",
        matchId: match.id || "",
        itemTitle: match.foundItemTitle,
      })
      navigate(`/dashboard/messages?room=${roomId}`)
    } catch (err) {
      console.error("Failed to start chat:", err)
      showToast("error", "Could not start chat room.")
    }
  }

  const saveGeminiKey = () => {
    GeminiService.setApiKey(geminiKeyInput)
    setSavedKeySuccess(true)
    setTimeout(() => setSavedKeySuccess(false), 3000)
    showToast("success", "Gemini API configuration updated!")
  }

  const filteredMatches = matches.filter(
    (m) =>
      m.confidenceScore >= confidenceThreshold &&
      (m.status === "pending" ||
        m.status === "confirmed" ||
        m.status === "admin_approved"),
  )

  const historyMatches = matches.filter(
    (m) =>
      m.status === "rejected" ||
      m.status === "expired" ||
      m.status === "admin_approved",
  )

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Toast Alert */}
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link
            to="/dashboard"
            className="hover:text-purple-600 transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">AI Matching Engine</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Brain size={26} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] tracking-tight">
                AI Matching Engine
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Multi-modal visual embeddings, OCR text correlation, and Gemini
                AI lost-found pairing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Background queue status indicator */}
            {queueJobs.some((j) => j.status === "processing") && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-700">
                <Loader2 size={13} className="animate-spin text-purple-600" />
                Background AI Worker Active
              </div>
            )}

            <button
              onClick={runScan}
              disabled={scanning || !selectedLostItem}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-sm hover:opacity-95 transition-all shadow-md disabled:opacity-50"
            >
              {scanning ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCcw size={16} />
              )}
              {scanning ? "AI Scanning..." : "Run AI Scan"}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Threshold Control */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "matches"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Sparkle size={15} /> Active Matches ({filteredMatches.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "history"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <History size={15} /> Match History ({historyMatches.length})
          </button>
          <button
            onClick={() => setActiveTab("engine_settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "engine_settings"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Sliders size={15} /> AI Settings
          </button>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          <Sliders size={15} className="text-purple-600 flex-shrink-0" />
          <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
            Threshold:
          </span>
          <input
            type="range"
            min="40"
            max="90"
            step="5"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            className="w-28 accent-purple-600 cursor-pointer"
          />
          <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
            {confidenceThreshold}%
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin text-purple-600 mb-4" />
          <p className="text-sm font-semibold text-gray-500">
            Loading AI matching data...
          </p>
        </div>
      ) : activeTab === "engine_settings" ? (
        /* AI Engine Configuration Tab */
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#131b2e] flex items-center gap-2">
              <Brain className="text-purple-600" size={22} /> Gemini AI & Engine
              Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure Google Gemini API keys, OCR sensitivity, and embedding
              tolerances.
            </p>
          </div>

          <div className="p-5 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-3">
            <label className="block text-sm font-bold text-purple-900">
              Google Gemini API Key
            </label>
            <p className="text-xs text-purple-700">
              Used for vision analysis, OCR text extraction, explanation
              synthesis, and anomaly risk scoring. If omitted, the engine
              smoothly falls back to local computer vision feature embeddings.
            </p>
            <div className="flex gap-3">
              <input
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={saveGeminiKey}
                className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                {savedKeySuccess ? <Check size={16} /> : <Key size={16} />}
                {savedKeySuccess ? "Saved" : "Save Key"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Visual Embeddings
              </div>
              <div className="text-sm font-bold text-[#131b2e]">
                128-D Perceptual Vector
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Color distribution, luminance quadrants, frequency edge
                gradients.
              </div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                OCR Engine
              </div>
              <div className="text-sm font-bold text-[#131b2e]">
                Regex + Gemini Multimodal
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Student IDs, hardware serial numbers, cardholder names.
              </div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Fraud Detection
              </div>
              <div className="text-sm font-bold text-[#131b2e]">
                Multi-Signal Risk Evaluator
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Timeline paradox, self-matching, reward flags, velocity checks.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Source Item Selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#131b2e]">
                Your Reported Items
              </h2>
              <span className="text-xs text-gray-500 font-semibold">
                {lostItems.length} items
              </span>
            </div>

            {lostItems.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center shadow-sm">
                <p className="text-sm text-gray-500 mb-3">
                  No lost items reported yet.
                </p>
                <Link
                  to="/dashboard/report-lost"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
                >
                  Report a Lost Item
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {lostItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedLostItem(item)}
                    className={`w-full text-left bg-white p-4 rounded-2xl border shadow-sm transition-all ${
                      selectedLostItem?.id === item.id
                        ? "border-purple-500 ring-2 ring-purple-100"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex gap-3">
                      {item.imageUrls?.[0] ? (
                        <img
                          src={item.imageUrls[0]}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                          <Sparkles size={20} className="text-purple-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#131b2e] text-sm truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {item.locationLost} · {item.dateLost}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 capitalize">
                            {item.category}
                          </span>
                          {item.serialNumber && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-600 truncate max-w-[100px]">
                              SN: {item.serialNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* AI Extracted OCR & Features Inspector for Selected Item */}
            {selectedLostItem && selectedItemAnalysis && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <FileText size={14} className="text-purple-600" /> AI OCR &
                    Feature Card
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Analyzed
                  </span>
                </div>

                {selectedItemAnalysis.ocrText && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      OCR Extracted Text
                    </span>
                    <div className="p-2.5 bg-gray-50 rounded-xl text-xs font-mono text-gray-700 border border-gray-200">
                      {selectedItemAnalysis.ocrText}
                    </div>
                  </div>
                )}

                {selectedItemAnalysis.serialNumberDetected && (
                  <div className="flex items-center justify-between text-xs bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                    <span className="font-bold text-purple-900">
                      Serial / ID:
                    </span>
                    <span className="font-mono font-bold text-purple-700">
                      {selectedItemAnalysis.serialNumberDetected}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Visual Object Labels
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItemAnalysis.objectLabels
                      .slice(0, 5)
                      .map((label) => (
                        <span
                          key={label}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium"
                        >
                          {label}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Matches Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#131b2e]">
                {activeTab === "matches"
                  ? "Potential Matches"
                  : "Match History"}
              </h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                {activeTab === "matches"
                  ? filteredMatches.length
                  : historyMatches.length}{" "}
                Records
              </span>
            </div>

            {scanning && (
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-6 text-center shadow-sm">
                <Loader2
                  size={32}
                  className="animate-spin text-purple-600 mx-auto mb-3"
                />
                <p className="text-base font-bold text-purple-900">
                  Running Multi-Modal AI Engine...
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Computing 128-D image embedding cosine similarity, extracting
                  OCR text, checking duplicate signals, and querying Gemini.
                </p>
              </div>
            )}

            {!scanning &&
              (activeTab === "matches" ? filteredMatches : historyMatches)
                .length === 0 && (
                <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center shadow-sm">
                  <Brain size={42} className="text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-[#131b2e] text-base mb-1">
                    {activeTab === "matches"
                      ? "No Matches Found"
                      : "No Match History"}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {activeTab === "matches"
                      ? `No found items currently match this report with $\\ge$ ${confidenceThreshold}% confidence. Try lowering the threshold or click "Run AI Scan".`
                      : "Dismissed, approved, or expired matches will appear here."}
                  </p>
                </div>
              )}

            {/* Match Cards */}
            {(activeTab === "matches" ? filteredMatches : historyMatches).map(
              (match) => {
                const badge = CONFIDENCE_BADGE(match.confidenceScore)
                const isExpanded = expandedMatch === match.id

                return (
                  <div
                    key={match.id}
                    className={`bg-white p-5 rounded-2xl border-2 transition-all shadow-sm relative overflow-hidden ${
                      match.confidenceScore >= 85
                        ? "border-emerald-300"
                        : "border-purple-200"
                    }`}
                  >
                    {/* Confidence Badge */}
                    <div
                      className={`absolute top-0 right-0 ${badge.bar} text-white text-xs font-black px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5 shadow-sm`}
                    >
                      <Sparkles size={13} />
                      {match.confidenceScore}% Match
                    </div>

                    {/* Fraud Warning Banner */}
                    {match.fraudScore >= 40 && (
                      <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                        <ShieldAlert
                          size={16}
                          className="text-red-600 flex-shrink-0"
                        />
                        <span>
                          Fraud Risk Warning ({match.fraudScore}%):{" "}
                          {match.fraudSignals?.[0] ||
                            "Potential anomaly detected."}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-5 pr-14">
                      {/* Found Item Photo */}
                      {match.foundItemImage ? (
                        <img
                          src={match.foundItemImage}
                          alt={match.foundItemTitle}
                          className="w-full md:w-36 h-36 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full md:w-36 h-36 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Sparkles size={32} className="text-gray-300" />
                        </div>
                      )}

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                            {match.embeddingSimilarity > 0 && (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                Embedding: {match.embeddingSimilarity}%
                              </span>
                            )}
                            {match.ocrSimilarity > 0 && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                OCR Match: {match.ocrSimilarity}%
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-[#131b2e] text-lg mt-1 truncate">
                            {match.foundItemTitle}
                          </h3>

                          {/* AI Explanation preview */}
                          <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                            {match.aiExplanation}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2.5 mt-4">
                          {match.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  match.id && handleConfirm(match.id)
                                }
                                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-xs shadow-sm"
                              >
                                <ThumbsUp size={14} /> Yes, this is mine
                              </button>
                              <button
                                onClick={() =>
                                  match.id && handleReject(match.id)
                                }
                                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl transition-colors text-xs"
                              >
                                <ThumbsDown size={14} /> Dismiss
                              </button>
                            </>
                          )}

                          {match.status === "confirmed" && (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                              <CheckCircle2 size={15} /> Confirmed by You —
                              Pending Admin Verification
                            </div>
                          )}

                          {match.status === "admin_approved" && (
                            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                              <ShieldCheck size={15} /> Verified by Admin —
                              Ready for Handover
                            </div>
                          )}

                          <button
                            onClick={() => startChatWithFinder(match)}
                            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 px-3.5 rounded-xl transition-colors text-xs border border-indigo-200 ml-auto"
                          >
                            <MessageSquare size={14} /> Message Finder
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expand / Details Toggle */}
                    <button
                      onClick={() =>
                        setExpandedMatch(isExpanded ? null : match.id || null)
                      }
                      className="mt-4 text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
                    >
                      <BarChart3 size={13} />{" "}
                      {isExpanded
                        ? "Hide detailed breakdown"
                        : "Show AI match breakdown & reasons"}
                    </button>

                    {/* Detailed Analysis Dropdown */}
                    {isExpanded && (
                      <div className="mt-3 p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
                        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                          Feature Similarity Breakdown
                        </div>

                        <div className="space-y-2">
                          {match.matchReasons?.map((reason, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-gray-700 w-36 truncate">
                                {reason.field}
                              </span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    reason.similarity >= 75
                                      ? "bg-emerald-500"
                                      : reason.similarity >= 50
                                        ? "bg-purple-500"
                                        : "bg-amber-500"
                                  }`}
                                  style={{ width: `${reason.similarity}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-800 w-12 text-right">
                                {reason.similarity}%
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-gray-200 text-xs text-gray-700 leading-relaxed">
                          <strong className="text-[#131b2e]">
                            Full AI Reasoning:
                          </strong>{" "}
                          {match.aiExplanation}
                        </div>

                        {match.adminNotes && (
                          <div className="p-2.5 bg-purple-50 rounded-lg text-xs text-purple-800 border border-purple-100">
                            <strong>Admin Review Notes:</strong>{" "}
                            {match.adminNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              },
            )}
          </div>
        </div>
      )}
    </div>
  )
}
