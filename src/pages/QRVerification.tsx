import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import {
  KeyRound,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  RefreshCcw,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Package,
  FileWarning,
  ExternalLink,
  Lock,
  MapPin,
  Shield,
  Building2,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleHandoverService } from "../services/simpleHandover.service"
import { CampusLocationService } from "../services/campusLocation.service"
import { MeetingLocation } from "../types/CampusLocation"
import { Handover } from "../types/Handover"
import { Badge } from "../components/ui/Badge"

export default function QRVerification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const matchId = searchParams.get("matchId") || ""
  const lostId = searchParams.get("lostId") || ""
  const foundId = searchParams.get("foundId") || ""
  const lostRef = searchParams.get("lostRef") || "CR-LST-ITEM"
  const foundRef = searchParams.get("foundRef") || "CR-FND-ITEM"

  const [activeTab, setActiveTab] = useState<"otp" | "qr">("otp")
  const [handover, setHandover] = useState<Handover | null>(null)
  const [loading, setLoading] = useState(true)

  // Meeting Location states (Prompt Section 28, 29, 32)
  const [meetingLocations, setMeetingLocations] = useState<MeetingLocation[]>([])
  const [selectedMeetingSpot, setSelectedMeetingSpot] = useState<string>("Security Post (Main Entrance Gate)")
  const [customMeetingSpot, setCustomMeetingSpot] = useState("")

  // Input states
  const [inputOtp, setInputOtp] = useState("")
  const [inputQrToken, setInputQrToken] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    initHandover()
    CampusLocationService.getMeetingLocations().then(setMeetingLocations)
  }, [matchId, lostId, foundId])

  const initHandover = async () => {
    setLoading(true)
    setError(null)
    try {
      const session = await SimpleHandoverService.getOrCreateHandover({
        matchId: matchId || "direct-handover",
        lostItemId: lostId,
        foundItemId: foundId,
        lostReference: lostRef,
        foundReference: foundRef,
        claimantId: user?.uid,
      })
      setHandover(session)
      if (
        session.status === "completed" ||
        session.otpVerified ||
        session.qrVerified
      ) {
        setSuccess("Handover is verified! Item status updated to RECOVERED.")
      }
    } catch (err: any) {
      console.error("Failed to initialize handover:", err)
      setError("Unable to start handover session.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!handover || !inputOtp.trim()) return

    setVerifying(true)
    setError(null)
    try {
      const res = await SimpleHandoverService.verifyOTP(
        handover.id,
        inputOtp.trim(),
      )
      if (res.success) {
        setSuccess(res.message)
        setHandover((prev) =>
          prev ? { ...prev, status: "completed", otpVerified: true } : null,
        )
      } else {
        setError(res.message)
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.")
    } finally {
      setVerifying(false)
    }
  }

  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!handover || !inputQrToken.trim()) return

    setVerifying(true)
    setError(null)
    try {
      const res = await SimpleHandoverService.verifyQR(
        handover.id,
        inputQrToken.trim(),
      )
      if (res.success) {
        setSuccess(res.message)
        setHandover((prev) =>
          prev ? { ...prev, status: "completed", qrVerified: true } : null,
        )
      } else {
        setError(res.message)
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify QR token.")
    } finally {
      setVerifying(false)
    }
  }

  const handleRefreshOtp = async () => {
    if (!handover) return
    try {
      const { otp } = await SimpleHandoverService.refreshOTP(handover.id)
      setHandover((prev) => (prev ? { ...prev, otp } : null))
      setInputOtp("")
      setError(null)
    } catch {
      setError("Failed to generate new OTP.")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p className="text-sm font-medium text-slate-500">
          Preparing secure custody exchange session...
        </p>
      </div>
    )
  }

  const isRecovered =
    handover?.status === "completed" ||
    handover?.otpVerified ||
    handover?.qrVerified

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-3 shadow-inner ring-8 ring-purple-50/50 dark:ring-purple-950/30">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Campus Custody Handover
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Complete physical item exchange at a campus safety location using cryptographic OTP or dynamic QR verification.
        </p>
      </div>

      {/* Paired Items Information Card */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 text-xs">
        <div>
          <span className="text-slate-400 block font-semibold">Lost Report Reference</span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
            {lostRef}
          </span>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
        <div className="text-right">
          <span className="text-slate-400 block font-semibold">Found Report Reference</span>
          <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
            {foundRef}
          </span>
        </div>
      </div>

      {/* Success Banner: Section 36 Celebration State */}
      {isRecovered ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-emerald-200 dark:border-emerald-800 shadow-xl shadow-emerald-500/10 text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
            <CheckCircle2 size={44} />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            Chain of Custody Resolved
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Handover Verified Successfully!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6 max-w-md mx-auto">
            The custody transfer has been verified and permanently registered. The item status is officially updated to <strong className="text-emerald-600">RECOVERED</strong>.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/dashboard/my-reports"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              View in My Reports
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Handover Location Confirmation (Prompt Section 28, 29, 32) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Shield size={14} className="text-indigo-600" />
                Where will you meet?
              </span>
              <Link
                to="/dashboard/map"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <MapPin size={11} /> View on Campus Map
              </Link>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Select Recommended Safe Handover Spot
              </label>
              <select
                value={selectedMeetingSpot}
                onChange={(e) => setSelectedMeetingSpot(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {meetingLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name} — {loc.address}
                  </option>
                ))}
                <option value="CUSTOM">Custom Campus Location...</option>
              </select>
            </div>

            {selectedMeetingSpot === "CUSTOM" && (
              <div>
                <input
                  type="text"
                  placeholder="Enter specific campus block or meeting spot (e.g. CSE Dept 2nd floor)..."
                  value={customMeetingSpot}
                  onChange={(e) => setCustomMeetingSpot(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            )}

            {/* Handover Safety Note (Prompt Section 28 & 29) */}
            <div className="text-[11px] text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2">
              <ShieldCheck size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Handover Safety Note:</strong> Always exchange items in well-lit, designated campus desks with staff present (such as the Main Gate Security Post or Admin Front Office). Thoroughly inspect the item before confirming with OTP/QR.
              </span>
            </div>
          </div>

          {/* Method Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("otp")}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "otp"
                  ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <KeyRound size={16} /> 6-Digit Safe OTP
            </button>
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "qr"
                  ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <QrCode size={16} /> Dynamic QR Token
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-bold">
              {error}
            </div>
          )}

          {/* TAB 1: OTP VERIFICATION */}
          {activeTab === "otp" && handover && (
            <div className="space-y-6">
              {/* Box 1: Show OTP with Segmented Display */}
              <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-3xl p-6 sm:p-8 text-center">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider block mb-1">
                  Your One-Time Handover Code
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  Read this 6-digit code to the other party when handing over the item physically.
                </p>

                {/* Segmented Digit Display */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
                  {(handover.otp || "123456").split("").map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-10 sm:w-12 h-14 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-mono text-2xl font-black flex items-center justify-center shadow-xs"
                    >
                      {digit}
                    </div>
                  ))}
                  <button
                    onClick={() => copyToClipboard(handover.otp)}
                    className="p-3 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                    title="Copy code"
                  >
                    {copied ? (
                      <Check size={20} className="text-emerald-600" />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> Valid for 15 minutes
                  </span>
                  <span>•</span>
                  <button
                    onClick={handleRefreshOtp}
                    className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCcw size={12} /> Regenerate
                  </button>
                </div>
              </div>

              {/* Box 2: Enter OTP Form */}
              <form
                onSubmit={handleVerifyOtp}
                className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3"
              >
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Receiving the item? Enter the 6-Digit OTP:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) =>
                      setInputOtp(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="e.g. 849201"
                    required
                    className="flex-1 px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-center text-xl font-black font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={verifying || inputOtp.length !== 6}
                    className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    <span>Verify Code</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: QR VERIFICATION */}
          {activeTab === "qr" && handover && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 text-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
                  Cryptographic QR Token
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  Display this token for scanning or share the token string.
                </p>

                {/* QR Code Visual Container */}
                <div className="inline-block p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md mb-4">
                  <div className="w-48 h-48 bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center text-white text-center">
                    <QrCode size={110} className="text-white mb-2" />
                    <span className="text-[10px] font-mono tracking-widest text-slate-400">
                      SECURE TOKEN
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-mono font-bold bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    {handover.qrToken}
                  </span>
                  <button
                    onClick={() => copyToClipboard(handover.qrToken)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {copied ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Enter QR Token Form */}
              <form
                onSubmit={handleVerifyQr}
                className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3"
              >
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Validate Counterpart Token Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputQrToken}
                    onChange={(e) =>
                      setInputQrToken(e.target.value.toUpperCase())
                    }
                    placeholder="CR-HANDOVER-XXXXXX"
                    required
                    className="flex-1 px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={verifying || !inputQrToken.trim()}
                    className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    <span>Validate</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
