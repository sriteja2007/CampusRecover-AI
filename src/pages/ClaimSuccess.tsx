import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router"
import {
  CheckCircle2,
  ChevronRight,
  Home,
  Printer,
  Shield,
  Package,
  ArrowRight,
  Award,
  Loader2,
} from "lucide-react"
import { HandoverService } from "../services/handover.service"
import { Claim } from "../types/Claim"
import { printClaimReceipt } from "../utils/receiptGenerator"

export default function ClaimSuccess() {
  const [searchParams] = useSearchParams()
  const claimId = searchParams.get("claimId")

  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!claimId) {
      setLoading(false)
      return
    }
    HandoverService.getClaim(claimId)
      .then(setClaim)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [claimId])

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-20 flex flex-col items-center">
      {/* Breadcrumb */}
      <div className="w-full mb-8 self-start">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/dashboard" className="hover:text-teal-600">
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Handover Completed</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 md:p-12 w-full text-center relative overflow-hidden">
        <div className="mx-auto w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white ring-1 ring-teal-50 text-teal-600">
          <CheckCircle2 size={42} />
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] mb-2 tracking-tight">
          Item Successfully Recovered & Reunited!
        </h1>
        <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
          Physical custody transfer was authenticated, verified, and logged in
          the immutable campus ledger.
        </p>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 size={24} className="animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-6 mb-8 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                Handover Verification Summary
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-full">
                Resolved & Verified
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Item:</span>
                <span className="font-bold text-[#131b2e]">
                  {claim?.foundItemTitle ||
                    claim?.lostItemTitle ||
                    "Campus Item"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Claimant:</span>
                <span className="font-semibold text-[#131b2e]">
                  {claim?.claimerName || "Verified Student"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Finder / Returner:</span>
                <span className="font-semibold text-[#131b2e]">
                  {claim?.finderName || "Campus Returner"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Handover Location:</span>
                <span className="font-semibold text-[#131b2e]">
                  {claim?.meetingLocation || "Campus Office Desk"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-500">Authentication Methods:</span>
                <span className="font-bold text-emerald-700">
                  {(claim?.verifiedMethods || ["OTP", "QR"])
                    .join(", ")
                    .toUpperCase()}
                </span>
              </div>
            </div>

            {/* Trust Score Reward Banner */}
            <div className="p-3 bg-emerald-100/60 rounded-xl border border-emerald-200 flex items-center gap-3">
              <Award size={20} className="text-emerald-700 flex-shrink-0" />
              <div className="text-xs text-emerald-900">
                <strong>+1.0 Campus Trust Score</strong> awarded to the returner
                for completing the verified handover!
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-[#131b2e] hover:bg-black text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Home size={15} /> Back to Dashboard
          </Link>

          {claim && (
            <button
              onClick={() => printClaimReceipt(claim)}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer size={15} /> Download / Print PDF Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
