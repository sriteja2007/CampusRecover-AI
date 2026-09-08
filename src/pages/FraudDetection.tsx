import { useState, useEffect } from "react"
import { Link } from "react-router"
import {
  AlertTriangle,
  Shield,
  Eye,
  ArrowLeft,
  Flag,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Check,
  ShieldAlert,
} from "lucide-react"
import { FraudService, FraudReport } from "../services/matching.service"

const SEVERITY_MAP = {
  high: { label: "High Risk", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  medium: {
    label: "Medium Risk",
    color: "#d97706",
    bg: "rgba(217,119,6,0.08)",
  },
  low: { label: "Low Risk", color: "#0d9488", bg: "rgba(13,148,136,0.08)" },
}

export default function FraudDetection() {
  const [reports, setReports] = useState<FraudReport[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadReports = async () => {
    setLoading(true)
    try {
      const data = await FraudService.getFraudReports()
      setReports(data)
    } catch (err) {
      console.error("Failed to load fraud reports:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleUpdateStatus = async (
    id: string,
    status: FraudReport["status"],
    notes: string,
  ) => {
    setActionLoading(true)
    try {
      await FraudService.updateFraudStatus(id, status, notes)
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, adminNotes: notes } : r,
        ),
      )
    } catch (err) {
      console.error("Failed to update fraud status:", err)
    } finally {
      setActionLoading(false)
    }
  }

  const activeReports = reports.filter(
    (r) => r.status === "pending" || r.status === "investigating",
  )

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-8">
        <Link
          to="/admin"
          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-xs">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Fraud Detection & Prevention
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            AI-flagged anomaly claims, timeline paradoxes, and suspicious item
            ownership patterns.
          </p>
        </div>
        <div className="ml-auto px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {activeReports.length} Active Cases
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
        {[
          {
            label: "Active Fraud Alerts",
            value: String(activeReports.length),
            color: "#dc2626",
          },
          {
            label: "Resolved Cases",
            value: String(
              reports.filter(
                (r) => r.status === "confirmed" || r.status === "dismissed",
              ).length,
            ),
            color: "#0d9488",
          },
          { label: "False Positive Rate", value: "0.8%", color: "#d97706" },
          { label: "Fraud Prevention Rate", value: "99.2%", color: "#0d9488" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs"
          >
            <div
              className="text-2xl font-black tracking-tight"
              style={{ color }}
            >
              {value}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-red-600 mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            Scanning fraud logs...
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <ShieldAlert size={36} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#131b2e] text-base mb-1">
            No Fraud Reports Active
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            The AI engine continuously monitors claim velocity, timeline
            consistency, and duplicate indicators.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((c) => {
            const sev =
              c.fraudScore >= 60
                ? SEVERITY_MAP.high
                : c.fraudScore >= 35
                  ? SEVERITY_MAP.medium
                  : SEVERITY_MAP.low

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div
                  className="px-5 py-3 flex items-center gap-3 flex-wrap text-xs border-b border-gray-100"
                  style={{ backgroundColor: sev.bg }}
                >
                  <Flag size={14} style={{ color: sev.color }} />
                  <span className="font-black" style={{ color: sev.color }}>
                    {sev.label} ({c.fraudScore}% Risk Score)
                  </span>
                  <span className="font-mono text-gray-500">
                    Case ID: {c.id || c.matchId}
                  </span>
                  <span className="ml-auto font-bold capitalize text-gray-600">
                    Status: {c.status}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-[#131b2e] text-base">
                      {c.reason || "Suspicious matching pattern detected by AI"}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>
                        Reported By: <strong>{c.reportedBy}</strong>
                      </span>
                      <span>
                        Match ID:{" "}
                        <strong className="font-mono">{c.matchId}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Signals list */}
                  {c.signals && c.signals.length > 0 && (
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Detected Risk Signals:
                      </div>
                      <div className="space-y-1">
                        {c.signals.map((sig, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-red-700"
                          >
                            <XCircle
                              size={13}
                              className="text-red-500 flex-shrink-0"
                            />
                            <span>{sig}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.adminNotes && (
                    <div className="text-xs text-gray-600 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                      <strong>Admin Notes:</strong> {c.adminNotes}
                    </div>
                  )}

                  {/* Admin Actions */}
                  {c.status === "pending" && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() =>
                          c.id &&
                          handleUpdateStatus(
                            c.id,
                            "confirmed",
                            "Fraud confirmed by admin",
                          )
                        }
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                      >
                        <Flag size={13} /> Confirm Fraud & Block
                      </button>
                      <button
                        onClick={() =>
                          c.id &&
                          handleUpdateStatus(
                            c.id,
                            "dismissed",
                            "Dismissed as false positive after review",
                          )
                        }
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
                      >
                        <CheckCircle2 size={13} /> Mark as False Positive
                      </button>
                      <Link
                        to={`/dashboard/ai-match?id=${c.matchId}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors ml-auto"
                      >
                        <Eye size={13} /> Review Full Match Details
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
