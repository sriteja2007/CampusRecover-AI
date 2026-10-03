import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { SimpleClaimService } from "../services/simpleClaim.service"
import { SimpleFlagService } from "../services/simpleFlag.service"
import {
  LostItemService,
  FoundItemService,
  ActivityLogService,
  ActivityLog,
} from "../services/firebase/item.service"
import { Item } from "../types/Item"
import { Claim } from "../types/Claim"
import { FlagReason } from "../types/ContentFlag"
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
  AlertTriangle,
  Sparkles,
  KeyRound,
  Lock,
  Flag,
  CheckCircle2,
  X,
  Send,
  Eye,
  Check,
  Building2,
  Navigation,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import CampusMap from "../components/map/CampusMap"
import { Button } from "../components/ui/Button"

export default function ItemDetail() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [item, setItem] = useState<Item | null>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [copied, setCopied] = useState(false)

  // Claim State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [existingUserClaim, setExistingUserClaim] = useState<Claim | null>(null)
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [claimForm, setClaimForm] = useState({
    reason: "",
    uniqueCharacteristics: "",
    privateVerificationDetails: "",
    contactPreference: "email" as "email" | "phone" | "campus_office",
    phone: "",
  })

  // Flag/Report Incorrect Info State
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false)
  const [flagSubmitting, setFlagSubmitting] = useState(false)
  const [flagSuccess, setFlagSuccess] = useState(false)
  const [flagReason, setFlagReason] = useState<FlagReason>("incorrect_location")
  const [flagNotes, setFlagNotes] = useState("")

  useEffect(() => {
    if (!id) return
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        let fetchedItem: any = await SimpleItemService.getItemById(id)
        if (!fetchedItem && id.startsWith("CR-")) {
          fetchedItem = await SimpleItemService.getItemByReference(id)
        }

        // Fallback to legacy service if needed
        if (!fetchedItem) {
          if (type === "lost") {
            fetchedItem = await LostItemService.getById(id)
          } else if (type === "found") {
            fetchedItem = await FoundItemService.getById(id)
          }
        }

        if (fetchedItem && isMounted) {
          setItem(fetchedItem)

          // Check if current user already submitted a claim on this item
          if (user?.uid) {
            try {
              const claims = await SimpleClaimService.getClaims({
                itemId: fetchedItem.id,
                claimantId: user.uid,
              })
              if (claims.length > 0) {
                setExistingUserClaim(claims[0])
              }
            } catch (err) {
              console.warn("Could not check existing user claim:", err)
            }
          }

          try {
            const fetchedLogs = await ActivityLogService.getItemLogs(fetchedItem.id)
            setLogs(fetchedLogs)
          } catch {
            // optional
          }
        }
      } catch (error) {
        console.error("Failed to load item detail:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [id, type, user?.uid])

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
          onClick={() => navigate("/items")}
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
    item.locationName || item.location || item.locationLost || item.locationFound || "MVGR Campus"
  const itemDate = item.date || item.dateLost || item.dateFound || "Recent"
  const itemTime = item.time || ""
  const refCode =
    item.referenceNumber || (item.id ? `CR-${item.id.slice(0, 6).toUpperCase()}` : "CR-ITEM")

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (!claimForm.reason.trim() || !claimForm.uniqueCharacteristics.trim()) {
      alert("Please fill in why this item belongs to you and unique identifying features.")
      return
    }

    setClaimSubmitting(true)
    try {
      const claim = await SimpleClaimService.createClaim({
        itemId: item.id,
        itemTitle,
        itemReference: refCode,
        itemImageUrl: itemImages[0] || "",
        itemType: item.type,
        claimantId: user.uid,
        claimantName: user.displayName || user.email?.split("@")[0] || "Campus Member",
        claimantEmail: user.email || "",
        claimantMobile: claimForm.phone,
        finderId: item.userId,
        reason: claimForm.reason,
        uniqueCharacteristics: claimForm.uniqueCharacteristics,
        privateVerificationDetails: claimForm.privateVerificationDetails,
        contactPreference: claimForm.contactPreference,
      })

      setExistingUserClaim(claim)
      setClaimSuccess(true)
    } catch (err) {
      console.error("Failed to submit claim:", err)
      alert("Failed to submit claim. Please try again.")
    } finally {
      setClaimSubmitting(false)
    }
  }

  const handleFoundClick = () => {
    if (!item) return
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/items/${item.id}`)}`)
    } else {
      navigate(
        `/dashboard/report-found?matchLostId=${item.id}&ref=${refCode}&name=${encodeURIComponent(itemTitle)}`,
      )
    }
  }

  const handleClaimClick = () => {
    if (!item) return
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/items/${item.id}`)}`)
    } else {
      setIsClaimModalOpen(true)
    }
  }

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flagNotes.trim()) {
      alert("Please provide details regarding the incorrect information.")
      return
    }

    setFlagSubmitting(true)
    try {
      await SimpleFlagService.createFlag({
        itemId: item.id,
        itemTitle,
        itemReference: refCode,
        reporterId: user?.uid,
        reporterEmail: user?.email || undefined,
        reporterName: user?.displayName || undefined,
        reason: flagReason,
        notes: flagNotes,
      })

      setFlagSuccess(true)
    } catch (err) {
      console.error("Failed to submit flag:", err)
      alert("Failed to submit report. Please try again.")
    } finally {
      setFlagSubmitting(false)
    }
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
            onClick={() => setIsFlagModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900 transition flex items-center gap-1.5 cursor-pointer"
            title="Report Incorrect Information"
          >
            <Flag size={13} />
            <span className="hidden sm:inline">Report Incorrect Info</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} />
            <span>{copied ? "Link Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Main Item Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photos & Details */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Photos Showcase */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="relative aspect-4/3 sm:aspect-16/9 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
              {itemImages.length > 0 ? (
                <img
                  src={itemImages[activeImage]}
                  alt={itemTitle}
                  className="w-full h-full object-contain sm:object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Tag size={40} className="stroke-1" />
                  <span className="text-xs font-medium">No verified photo attached</span>
                </div>
              )}

              {/* Status and Type Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant={isLost ? "lost" : "found"}>
                  {isLost ? "Lost Item" : "Found Item"}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                  {refCode}
                </span>
              </div>

              <div className="absolute top-4 right-4">
                <StatusIndicator status={item.status} size="sm" showLabel />
              </div>
            </div>

            {/* Thumbnail switcher if multiple images */}
            {itemImages.length > 1 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex gap-2 overflow-x-auto">
                {itemImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      activeImage === idx
                        ? "border-blue-600 scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Description Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {item.category || "General Belonging"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {itemTitle}
              </h1>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>

            {/* Specs Grid */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Category
                </span>
                <span className="text-xs sm:text-sm font-bold capitalize text-slate-900 dark:text-white">
                  {item.category || "General"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Color / Shade
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

          {/* Visual Claim Timeline (Shows state progression) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-blue-600" />
              Recovery Lifecycle Timeline
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 block mb-1">
                  01 Report
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Logged on Campus
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">{itemDate}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  item.status === "possible_match" ||
                  item.status === "match_confirmed" ||
                  item.status === "handover_pending" ||
                  item.status === "recovered"
                    ? "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                <span className="text-xs font-mono font-bold block mb-1">02 Discovery</span>
                <span className="text-xs font-bold block">AI / Match Scan</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Active</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  item.status === "handover_pending" || item.status === "recovered"
                    ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                <span className="text-xs font-mono font-bold block mb-1">03 Verification</span>
                <span className="text-xs font-bold block">Security Approved</span>
                <span className="text-[10px] text-slate-500 mt-1 block">OTP Issued</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border ${
                  item.status === "recovered"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                <span className="text-xs font-mono font-bold block mb-1">04 Recovered</span>
                <span className="text-xs font-bold block">Custody Complete</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Reunited</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Location Map & Verified Workflows */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Location & Time Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin size={15} className="text-blue-600" /> Campus Location & Time
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
                  <span className="text-slate-400 block font-medium">Reported Area</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {itemLocation}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                    MVGR College of Engineering · Campus Landmark
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date & Time Logged</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {itemDate} {itemTime ? `• ${itemTime}` : ""}
                  </span>
                </div>
              </div>

              {/* Compact Map Preview */}
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

          {/* Privacy & Safe Recovery Workflow Card (NO RAW CONTACT EXPOSURE!) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" /> Safe Campus Handover
            </h3>

            {/* Reporter Profile Notice - Strictly Zero Phone/Email Exposure */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-900 shrink-0">
                {(item.userName || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  Logged by {isOwner ? "You (Owner)" : "Verified Campus Member"}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Lock size={10} className="text-emerald-500" />
                  <span>Contact info private &amp; admin-guarded</span>
                </p>
              </div>
            </div>

            {/* Action buttons depending on item type and ownership */}
            {isOwner ? (
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-xs text-blue-800 dark:text-blue-300 font-medium">
                  You created this report. You can review AI matching candidates or check incoming claims in your dashboard.
                </div>
                <Link to="/dashboard/ai-match" className="block">
                  <Button className="w-full font-bold gap-2">
                    <Sparkles size={15} /> Check Potential AI Matches
                  </Button>
                </Link>
              </div>
            ) : existingUserClaim ? (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-purple-600" />
                    Claim Submitted
                  </span>
                  <Badge variant="purple">{existingUserClaim.status}</Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your ownership claim is recorded. Campus security will review your private details.
                  Once approved, you will receive an OTP code to complete handover.
                </p>
                {existingUserClaim.otpCode && (
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 font-mono text-center">
                    <span className="text-[10px] text-slate-400 block">YOUR HANDOVER OTP</span>
                    <span className="text-lg font-black text-purple-600 dark:text-purple-400 tracking-widest">
                      {existingUserClaim.otpCode}
                    </span>
                  </div>
                )}
              </div>
            ) : !isLost ? (
              /* FOUND ITEM PRIMARY CTA: "I Think This Is Mine" */
              <div className="space-y-3">
                <Button
                  onClick={handleClaimClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold py-3.5 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={16} /> I Think This Is Mine
                </Button>

                <p className="text-[11px] text-slate-500 text-center leading-normal">
                  Answer a few confidential verification questions to prove ownership and request handover.
                </p>
              </div>
            ) : (
              /* LOST ITEM PRIMARY CTA: "I Found This Item" */
              <div className="space-y-3">
                <Button
                  onClick={handleFoundClick}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold py-3.5 shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} /> I Found This Item
                </Button>

                <p className="text-[11px] text-slate-500 text-center leading-normal">
                  Found this item on campus? Report it to automatically connect with the owner safely.
                </p>
              </div>
            )}

            {/* AI Matching Hub Link */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/dashboard/ai-match?ref=${refCode}`}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Sparkles size={14} className="text-purple-500" />
                Scan AI Match Suggestions
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CLAIM SUBMISSION MODAL */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            {claimSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Claim Submitted Successfully
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your verification details have been securely recorded. Campus administrators will inspect your proof. Once verified, you will be notified with your pickup OTP.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      setIsClaimModalOpen(false)
                      setClaimSuccess(false)
                    }}
                    className="font-bold"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Verify Item Ownership
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <p className="font-bold">Claiming: {itemTitle}</p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Ref: {refCode} · Found near {itemLocation}
                  </p>
                </div>

                {/* Question 1: Why do you believe this is yours? */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Why do you believe this is your item? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={claimForm.reason}
                    onChange={(e) => setClaimForm({ ...claimForm, reason: e.target.value })}
                    placeholder="e.g. I lost my scientific calculator during morning lab hours on Tuesday..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                {/* Question 2: Unique identifying characteristics */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unique identifying characteristics <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={claimForm.uniqueCharacteristics}
                    onChange={(e) =>
                      setClaimForm({ ...claimForm, uniqueCharacteristics: e.target.value })
                    }
                    placeholder="e.g. Scratches on left corner, yellow smiley sticker on backside, serial number prefix..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                {/* Question 3: Private verification details (guarded) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Private Verification Details
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      <Lock size={10} /> Strictly Private
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={claimForm.privateVerificationDetails}
                    onChange={(e) =>
                      setClaimForm({ ...claimForm, privateVerificationDetails: e.target.value })
                    }
                    placeholder="Lockscreen picture description, exact serial number, receipt reference, or secret mark..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    🔒 These answers will only be viewed by authorized Campus Security during verification.
                  </p>
                </div>

                {/* Contact phone (optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Mobile Number (Confidential)
                  </label>
                  <input
                    type="tel"
                    value={claimForm.phone}
                    onChange={(e) => setClaimForm({ ...claimForm, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={claimSubmitting} className="font-bold text-xs gap-1.5">
                    {claimSubmitting ? "Submitting Claim..." : "Submit Claim for Review"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REPORT INCORRECT INFORMATION (CONTENT FLAG) MODAL */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            {flagSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Report Received
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Thank you for helping keep campus records accurate. An administrator will review this report.
                </p>
                <div className="pt-3">
                  <Button
                    onClick={() => {
                      setIsFlagModalOpen(false)
                      setFlagSuccess(false)
                    }}
                    className="font-bold text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFlagSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                    <Flag size={16} className="text-rose-600" />
                    <span>Report Incorrect Information</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFlagModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason
                  </label>
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value as FlagReason)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="incorrect_location">Incorrect Location</option>
                    <option value="already_recovered">Already Recovered / Case Closed</option>
                    <option value="duplicate_report">Duplicate Report</option>
                    <option value="spam_or_fake">Spam or Inappropriate</option>
                    <option value="other">Other Information Discrepancy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Details / Correction Notes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={flagNotes}
                    onChange={(e) => setFlagNotes(e.target.value)}
                    placeholder="Describe what information needs to be corrected..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFlagModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={flagSubmitting} className="font-bold text-xs">
                    {flagSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
