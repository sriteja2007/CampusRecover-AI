import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import { useAuth } from "../context/AuthContext"
import {
  LostItemService,
  FoundItemService,
  ActivityLogService,
  ActivityLog,
} from "../services/firebase/item.service"
import { MatchingService, MatchResult } from "../services/matching.service"
import { RecommendationService } from "../services/recommendation.service"
import { LostItem } from "../types/LostItem"
import { FoundItem } from "../types/FoundItem"
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
} from "lucide-react"

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  return Math.floor(seconds) + " seconds ago"
}

export default function ItemDetail() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const { user, customUser } = useAuth()

  const [item, setItem] = useState<LostItem | FoundItem | null>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [recommendations, setRecommendations] =
    useState<(LostItem | FoundItem)[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (!id || !type) return
    const loadData = async () => {
      setLoading(true)
      try {
        let fetchedItem: LostItem | FoundItem | null = null
        if (type === "lost") {
          fetchedItem = await LostItemService.getById(id)
        } else if (type === "found") {
          fetchedItem = await FoundItemService.getById(id)
        }

        if (fetchedItem) {
          setItem(fetchedItem)
          const fetchedLogs = await ActivityLogService.getItemLogs(id)
          setLogs(fetchedLogs)

          const recs = await RecommendationService.getSimilarItems(
            fetchedItem,
            type as "lost" | "found",
          )
          setRecommendations(recs)

          if (user) {
            const fetchedMatches = await MatchingService.getUserMatches(
              user.uid,
            )
            const itemMatches = fetchedMatches.filter(
              (m) =>
                (type === "lost" && m.lostItemId === id) ||
                (type === "found" && m.foundItemId === id),
            )
            setMatches(itemMatches)
          }
        }
      } catch (error) {
        console.error("Failed to load item detail:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, type, user])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-gray-800">Item not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    )
  }

  const isOwner = user?.uid === item.userId
  const isAdmin =
    customUser?.role === "admin" || customUser?.role === "superadmin"
  const canEdit = isOwner || isAdmin

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    matched: "bg-teal-100 text-teal-800",
    claimed: "bg-blue-100 text-blue-800",
    resolved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
        >
          <ChevronLeft size={20} className="mr-1" /> Back
        </button>
        <div className="flex gap-3">
          <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
            <Share2 size={18} />
          </button>
          <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
            <Bookmark size={18} />
          </button>
          {!isOwner && (
            <button className="p-2 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/60 flex items-center gap-2">
              <AlertTriangle size={18} /> Report Duplicate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gallery & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            {item.imageUrls && item.imageUrls.length > 0 ? (
              <div className="relative">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <img
                    src={item.imageUrls[activeImage]}
                    alt={item.title}
                    className="max-h-full object-contain"
                  />
                </div>
                {item.imageUrls.length > 1 && (
                  <div className="flex overflow-x-auto gap-2 p-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800">
                    {item.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                          activeImage === idx
                            ? "border-blue-500"
                            : "border-transparent"
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
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <ImageIcon size={48} className="mb-2" />
                <p>No images available</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{item.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${statusColors[item.status] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"}`}
              >
                {item.status}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-1">
                  Category
                </span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <Tag size={14} className="text-blue-500" />{" "}
                  {item.category || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-1">
                  Brand
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.brand || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-1">
                  Color
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.color || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-1">
                  Reward
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {"rewardOffered" in item && item.rewardOffered
                    ? `₹${item.rewardOffered}`
                    : "None"}
                </span>
              </div>
            </div>

            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <Info size={18} /> Additional Details
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {"serialNumber" in item && item.serialNumber && (
                <li>
                  <span className="font-medium text-gray-900 dark:text-white">Serial Number:</span>{" "}
                  {item.serialNumber}
                </li>
              )}
              {(item as any).uniqueFeatures && (
                <li>
                  <span className="font-medium text-gray-900 dark:text-white">Unique Features:</span>{" "}
                  {(item as any).uniqueFeatures}
                </li>
              )}
              {(item as FoundItem).condition && (
                <li>
                  <span className="font-medium text-gray-900 dark:text-white">Condition:</span>{" "}
                  {(item as FoundItem).condition}
                </li>
              )}
              {(item as any).currentHolder && (
                <li>
                  <span className="font-medium text-gray-900 dark:text-white">Held By:</span>{" "}
                  {(item as any).currentHolder}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Location, Reporter, Timeline */}
        <div className="space-y-6">
          {/* Location & Time */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={18} /> Location & Time
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-red-100 dark:bg-red-950/50 p-2 rounded-lg text-red-600 dark:text-red-400">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {type === "lost"
                      ? (item as LostItem).locationLost
                      : (item as FoundItem).locationFound}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {[
                       (item as any).building,
                       (item as any).room,
                       (item as any).floor,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-100 dark:bg-blue-950/50 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {type === "lost"
                      ? (item as LostItem).dateLost
                      : (item as FoundItem).dateFound}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {type === "lost"
                      ? (item as LostItem).timeLost
                      : (item as FoundItem).timeFound}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reporter Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} /> Reporter Info
            </h3>
            <div className="flex items-center gap-4">
              <img
                src={
                  item.userPhotoURL || "https://ui-avatars.com/api/?name=User"
                }
                alt={item.userName}
                className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700"
              />
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{item.userName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
              </div>
            </div>
            {!isOwner && (
              <button className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition cursor-pointer">
                <MessageSquare size={18} /> Contact Reporter
              </button>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={18} /> Activity Timeline
            </h3>
            <div className="relative border-l border-gray-200 dark:border-gray-800 ml-3 space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-gray-900" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.action.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{log.details}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {log.createdAt
                      ? formatTimeAgo(log.createdAt.toDate())
                      : "Just now"}
                  </p>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 pl-6">
                  No activity recorded yet.
                </p>
              )}
            </div>
          </div>

          {/* AI Matches */}
          {matches.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-950/40 to-purple-50 dark:to-purple-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 shadow-sm">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                <ShieldCheck size={18} /> AI Suggestions
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                We found {matches.length} potential matches for this item!
              </p>
              <button
                onClick={() => navigate("/dashboard/ai-match")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl transition cursor-pointer"
              >
                Review Matches
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Similar Items You Might Be Looking For
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() =>
                  navigate(
                    `/dashboard/item/${
                      type === "lost" ? "found" : "lost"
                    }/${rec.id}`,
                  )
                }
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition"
              >
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 relative">
                  {rec.imageUrls?.[0] ? (
                    <img
                      src={rec.imageUrls[0]}
                      alt={rec.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50">
                    {type === "lost" ? "Found" : "Lost"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} />{" "}
                    {(rec as any).locationFound || (rec as any).locationLost}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
