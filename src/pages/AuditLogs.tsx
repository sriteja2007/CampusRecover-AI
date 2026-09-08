import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router"
import {
  ArrowLeft,
  Filter,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  QrCode,
  Brain,
  Shield,
  Loader2,
  Calendar,
  Clock,
  Check,
  X,
} from "lucide-react"
import { HandoverService } from "../services/handover.service"
import { AdminService } from "../services/admin.service"
import { HandoverLog, VerificationLog } from "../types/Claim"

export default function AuditLogs() {
  const [handoverLogs, setHandoverLogs] = useState<HandoverLog[]>([])
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [hLogs, vLogs] = await Promise.all([
          HandoverService.getHandoverLogs(),
          HandoverService.getVerificationLogs(),
        ])
        setHandoverLogs(hLogs)
        setVerificationLogs(vLogs)
      } catch (err) {
        console.error("Failed to load audit logs:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Format timestamp helper
  const formatTime = (ts: any) => {
    if (!ts) return "Just now"
    if (ts.toDate) return ts.toDate().toLocaleString()
    return new Date(ts).toLocaleString()
  }

  // Combine and normalize events from Firestore
  const allEvents = useMemo(() => {
    const events: any[] = []

    handoverLogs.forEach((h) => {
      events.push({
        id: `HO-${h.id?.substring(0, 8) || "LOG"}`,
        type: "handover_completed",
        actor: h.officerName || h.finderName || "Officer",
        target: `${h.itemTitle} (Claimant: ${h.claimerName})`,
        time: formatTime(h.timestamp),
        details: `Verified with: ${(h.verificationMethodsUsed || []).join(", ")}. Notes: ${h.notes || "None"}`,
        status: "success",
        color: "#0d9488",
      })
    })

    verificationLogs.forEach((v) => {
      events.push({
        id: `VER-${v.id?.substring(0, 8) || "LOG"}`,
        type: `verify_${v.method}`,
        actor: v.verifiedBy || "System",
        target: `Claim #${v.claimId?.substring(0, 8)} (${v.method.toUpperCase()})`,
        time: formatTime(v.timestamp),
        details: v.details || "Verification step checked",
        status: v.status,
        color: v.status === "success" ? "#2563eb" : "#dc2626",
      })
    })

    return events
  }, [handoverLogs, verificationLogs])

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      const matchesSearch =
        evt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.details.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter =
        filterType === "all" ||
        (filterType === "handover" && evt.type === "handover_completed") ||
        (filterType === "verification" && evt.type.startsWith("verify_"))

      return matchesSearch && matchesFilter
    })
  }, [allEvents, searchTerm, filterType])

  const handleExportCSV = () => {
    AdminService.exportToCSV("campusrecover_audit_trail", filteredEvents, [
      "id",
      "type",
      "actor",
      "target",
      "time",
      "details",
      "status",
    ])
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] tracking-tight">
              Campus Handover Audit Logs
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Live tamper-evident event stream from Firestore{" "}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                handoverLogs
              </code>{" "}
              &{" "}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                verificationLogs
              </code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search
            size={15}
            className="text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by event, actor, or item..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {["all", "handover", "verification"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                filterType === t
                  ? "bg-[#131b2e] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t === "all" ? "All Events" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-3 p-3 px-5 bg-gray-50 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500 tracking-wider">
          <span className="col-span-2">Event ID</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-2">Actor</span>
          <span className="col-span-3">Target Details</span>
          <span className="col-span-3 text-right">Timestamp</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-blue-600 mb-2" />
            <span className="text-xs text-gray-400">
              Loading audit records from Firestore...
            </span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            <Shield size={36} className="text-gray-300 mx-auto mb-2" />
            No audit logs found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="grid grid-cols-12 gap-3 p-4 px-5 hover:bg-gray-50/80 transition-colors items-center"
              >
                <span className="col-span-2 font-mono font-bold text-gray-600 truncate">
                  {evt.id}
                </span>

                <div className="col-span-2 flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: evt.color }}
                  />
                  <span className="font-bold text-[#131b2e] capitalize truncate">
                    {evt.type.replace("_", " ")}
                  </span>
                </div>

                <span className="col-span-2 text-gray-700 truncate font-medium">
                  {evt.actor}
                </span>

                <div className="col-span-3 min-w-0">
                  <div className="font-bold text-[#131b2e] truncate">
                    {evt.target}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {evt.details}
                  </div>
                </div>

                <span className="col-span-3 text-right text-[11px] font-mono text-gray-400">
                  {evt.time}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 px-5 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          <span>Total Logged Events: {filteredEvents.length}</span>
          <span className="text-[11px]">
            Audit Engine: Connected to Firestore Realtime
          </span>
        </div>
      </div>
    </div>
  )
}
