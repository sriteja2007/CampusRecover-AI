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
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleHandoverService } from "../services/simpleHandover.service"
import { Handover } from "../types/Handover"

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

  // Input states
  const [inputOtp, setInputOtp] = useState("")
  const [inputQrToken, setInputQrToken] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    initHandover()
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
      <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="animate-spin text-purple-600" size={32} />
        <p className="text-sm font-medium">
          Preparing handover verification desk...
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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-3 shadow-inner">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Secure Item Handover Verification
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Perform dual-party physical item handover at a campus safe spot using
          one-time OTP or QR Token.
        </p>
      </div>

      {/* Success Banner */}
      {isRecovered ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-emerald-200 dark:border-emerald-800 shadow-xl shadow-emerald-500/5 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Handover Verified Successfully!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 mb-6">
            The custody transfer is complete and the item status is officially
            marked as <strong>RECOVERED</strong> in the database.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/dashboard/my-reports"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              View in My Reports
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm">
          {/* Method Tabs */}
          <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("otp")}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "otp"
                  ? "bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm font-black"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <KeyRound size={16} /> 6-Digit OTP Verification
            </button>
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "qr"
                  ? "bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm font-black"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <QrCode size={16} /> Dynamic QR Token
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-bold">
              {error}
            </div>
          )}

          {/* TAB 1: OTP VERIFICATION */}
          {activeTab === "otp" && handover && (
            <div className="space-y-6">
              {/* Box 1: Show OTP */}
              <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 text-center">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider block mb-1">
                  Your One-Time Handover Code
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Share this 6-digit code with the other person when meeting on
                  campus.
                </p>

                <div className="inline-flex items-center justify-center gap-3 bg-white dark:bg-gray-800 px-6 py-3.5 rounded-2xl border border-purple-200 dark:border-purple-700 shadow-sm">
                  <span className="text-3xl font-black tracking-widest text-purple-700 dark:text-purple-300 font-mono">
                    {handover.otp}
                  </span>
                  <button
                    onClick={() => copyToClipboard(handover.otp)}
                    className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    title="Copy code"
                  >
                    {copied ? (
                      <Check size={18} className="text-emerald-600" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock size={13} />
                  <span>Valid for 15 minutes</span>
                  <span>·</span>
                  <button
                    onClick={handleRefreshOtp}
                    className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCcw size={11} /> Generate New
                  </button>
                </div>
              </div>

              {/* Box 2: Enter OTP Form */}
              <form
                onSubmit={handleVerifyOtp}
                className="pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
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
                    placeholder="Enter 6 digits..."
                    required
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-center text-lg font-black font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={verifying || inputOtp.length !== 6}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Verify OTP
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: QR VERIFICATION */}
          {activeTab === "qr" && handover && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider block mb-1">
                  Dynamic Handover QR Token
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Show this token to the counterpart or enter the token code.
                </p>

                {/* Simulated clean QR SVG */}
                <div className="inline-block p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-3">
                  <div className="w-40 h-40 bg-gray-900 rounded-xl p-3 flex flex-col items-center justify-center text-white text-center">
                    <QrCode size={90} className="text-white" />
                    <span className="text-[10px] font-mono tracking-wider mt-1 text-gray-300">
                      SCAN OR ENTER
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-mono font-bold bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    {handover.qrToken}
                  </span>
                  <button
                    onClick={() => copyToClipboard(handover.qrToken)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {copied ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Box 2: Enter QR Token Form */}
              <form
                onSubmit={handleVerifyQr}
                className="pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
                  Validate Scanned Token Code:
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
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={verifying || !inputQrToken.trim()}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Validate QR
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
