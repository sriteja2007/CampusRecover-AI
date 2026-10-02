import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import {
  LostItemService,
  FoundItemService,
  ActivityLogService,
  ActivityLog,
} from "../services/firebase/item.service"
import { Item } from "../types/Item"
import { Badge } from "../components/ui/Badge"
import { StatusIndicator } from "../components/ui/StatusIndicator"
import {
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Tag,
  Info,
  User,
  ChevronLeft,
  Share2,
  Bookmark,
  AlertTriangle,
  MessageSquare,
  ImageIcon,
  Sparkles,
  KeyRound,
  Mail,
  Phone,
  UserCheck,
  CheckCircle2,
  FileWarning,
  Navigation,
} from "lucide-react"
import CampusMap from "../components/map/CampusMap"

export default function ItemDetail() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const { user, customUser } = useAuth()

  const [item, setItem] = useState<any | null>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [showContact, setShowContact] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    const loadData = async () => {
      setLoading(true)
      try {
        // Try SimpleItemService first
        let fetchedItem: any = await SimpleItemService.getItemById(id)
        if (!fetchedItem && id.startsWith("CR-")) {
          fetchedItem = await SimpleItemService.getItemByReference(id)
        }

        // Fallback to legacy service
        if (!fetchedItem) {
          if (type === "lost") {
            fetchedItem = await LostItemService.getById(id)
          } else if (type === "found") {
            fetchedItem = await FoundItemService.getById(id)
          }
        }

        if (fetchedItem) {
          setItem(fetchedItem)
          try {
            const fetchedLogs = await ActivityLogService.getItemLogs(id)
            setLogs(fetchedLogs)
          } catch {
            // optional logs
          }
        }
      } catch (error) {
        console.error("Failed to load item detail:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, type])

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Retrieving item profile...</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Item Record Not Found</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-6">
          The requested campus item record could not be found or may have been deleted.
        </p>
        <button
          onClick={() => navigate("/dashboard/search")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
        >
          Return to Directory
        </button>
      </div>
    )
  }

  const isLost =
    item.type === "LOST" || type === "lost" || item.referenceNumber?.startsWith("CR-LST")
  const isOwner = user?.uid === item.userId
  const itemTitle = item.itemName || item.title || "Campus Item"
  const itemImages: string[] = item.imageUrls?.length
    ? item.imageUrls
    : item.imageUrl
    ? [item.imageUrl]
    : []
  const itemLocation =
    item.location || item.locationLost || item.locationFound || "Campus Grounds"
  const itemDate = item.date || item.dateLost || item.dateFound || "Recent"
  const itemTime = item.time || item.timeLost || item.timeFound || ""
  const refCode = item.referenceNumber || (item.id ? `CR-${item.id.slice(0, 6).toUpperCase()}` : "CR-ITEM")

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition cursor-pointer"
        >
          <ChevronLeft size={18} className="mr-1" /> Back to Search
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Share2 size={15} />
            <span>{copied ? "Copied Link!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Gallery & Detailed Information */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Main Media Gallery */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {itemImages.length > 0 ? (
              <div>
                <div className="h-80 sm:h-96 bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={itemImages[activeImage]}
                    alt={itemTitle}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                {itemImages.length > 1 && (
                  <div className="flex overflow-x-auto gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
                    {itemImages.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition ${
                          activeImage === idx
                            ? "border-blue-500 scale-95"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${idx}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 sm:h-80 bg-slate-100 dark:bg-slate-800/60 flex flex-col items-center justify-center text-slate-400">
                <ImageIcon size={48} className="mb-2 opacity-50" />
                <p className="text-xs font-semibold">No photographic evidence provided</p>
              </div>
            )}
          </div>

          {/* Core Item Metadata */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant={isLost ? "lost" : "found"}>
                  {isLost ? "Lost Item Report" : "Found Item Report"}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 tracking-wider">
                  {refCode}
                </span>
              </div>
              <StatusIndicator status={item.status || "pending"} size="md" showLabel />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {itemTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Spec Sheet Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Category
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white capitalize">
                  {item.category || "General"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Primary Color
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.color || "Not specified"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Brand / Model
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.brand || "Unspecified"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Reference Code
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                  {refCode}
                </span>
              </div>
            </div>

            {item.additionalDetails && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Info size={14} /> Custody / Notes
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {item.additionalDetails}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Time/Location, Reporter Info, Action Workflows */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Time & Location Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin size={15} className="text-blue-600" /> Incident Location & Time
              </h3>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude || 18.0675},${item.longitude || 83.4336}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Navigation size={12} /> Directions
              </a>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Reported Location</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {item.locationName || itemLocation}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                    Approximate campus location · MVGR College
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date & Time</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {itemDate} {itemTime ? `• ${itemTime}` : ""}
                  </span>
                </div>
              </div>

              {/* Compact Map Preview (Prompt Section 17) */}
              <div className="pt-2">
                <CampusMap
                  singleItem={item}
                  height="220px"
                  showControls={false}
                  showLegend={false}
                  showMeetingPoints={false}
                  showCampusBlocks={true}
                  zoom={17}
                  center={{
                    lat: item.latitude || 18.0675,
                    lng: item.longitude || 83.4336,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Reporter & Verified Custody Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User size={15} className="text-teal-600" /> Reporter Details
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-200 dark:border-teal-800 shrink-0">
                {(item.userName || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {item.userName || "Campus Member"}
                </p>
                <p className="text-xs text-slate-400">Verified Campus Account</p>
              </div>
            </div>

            {/* Reporter Contact Toggle */}
            {isOwner ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-xs text-blue-800 dark:text-blue-300 font-medium">
                You are the registered reporter of this item.
              </div>
            ) : showContact ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                    <UserCheck size={14} /> Direct Contacts
                  </span>
                  <button
                    onClick={() => setShowContact(false)}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${item.userEmail}`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {item.userEmail || "finder@campus.edu"}
                  </a>
                </p>
                {item.userMobile && (
                  <p>
                    <strong>Mobile:</strong>{" "}
                    <a
                      href={`tel:${item.userMobile}`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {item.userMobile}
                    </a>
                  </p>
                )}
                <div className="pt-2">
                  <a
                    href={`mailto:${item.userEmail}?subject=CampusRecover%20Regarding%20${encodeURIComponent(refCode)}`}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Mail size={14} /> Send Email Directly
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowContact(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail size={15} /> Reveal Reporter Contacts
              </button>
            )}
          </div>

          {/* Action Workflows: Handover & AI Match */}
          <div className="space-y-3">
            <Link
              to={`/dashboard/ai-match?ref=${refCode}`}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Scan Potential AI Matches
            </Link>

            <Link
              to={`/dashboard/scan-qr?${isLost ? "lostId=" + item.id + "&lostRef=" + refCode : "foundId=" + item.id + "&foundRef=" + refCode}`}
              className="w-full py-3.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <KeyRound size={16} /> Handover Verification (OTP / QR)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
