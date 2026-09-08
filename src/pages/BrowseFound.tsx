import { useState, useEffect, useCallback, useRef, memo } from "react"
import { Link, useSearchParams } from "react-router"
import {
  Search,
  Filter,
  MapPin,
  Clock,
  ChevronRight,
  Grid3X3,
  List,
  X,
  Package,
  Loader2,
} from "lucide-react"
import {
  FoundItemService,
  ItemQueryFilters,
} from "../services/firebase/item.service"
import { FoundItem } from "../types/FoundItem"
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  BUILDING_OPTIONS,
} from "../schemas/reportSchemas"

interface StatusStyle {
  bg: string
  text: string
  label: string
}

const STATUS_COLORS: Record<string, StatusStyle> = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Available" },
  matched: { bg: "bg-teal-100", text: "text-teal-700", label: "Matched" },
  claimed: { bg: "bg-blue-100", text: "text-blue-700", label: "Claimed" },
  resolved: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "Returned",
  },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
}

const CONDITION_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  damaged: "Damaged",
}

const ItemCard = memo(function ItemCard({
  item,
  view,
}: {
  item: FoundItem
  view: "grid" | "list"
}) {
  const st = STATUS_COLORS[item.status] || STATUS_COLORS.pending
  const thumb = item.imageUrls?.[0]
  const timeAgo = item.createdAt?.toDate
    ? formatTimeAgo(item.createdAt.toDate())
    : "—"

  if (view === "list") {
    return (
      <Link to={`/dashboard/item/found/${item.id}`} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
        <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 border border-gray-200 overflow-hidden">
          {thumb ? (
            <img
              src={thumb}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={20} className="text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-[#131b2e] group-hover:text-teal-600 transition-colors line-clamp-1">
                {item.title}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${st.bg} ${st.text}`}
              >
                {st.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-1 mb-1">
              {item.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />
              {item.locationFound}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              {timeAgo}
            </div>
            <span className="text-xs text-gray-500">
              {CONDITION_LABEL[item.condition] || "Good"} condition
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/dashboard/item/found/${item.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden block">
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm text-[#131b2e] group-hover:text-teal-600 transition-colors line-clamp-1">
            {item.title}
          </h3>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${st.bg} ${st.text}`}
          >
            {st.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {item.description}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <MapPin size={11} />
          {item.locationFound}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{timeAgo}</span>
          <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            {CONDITION_LABEL[item.condition] || "Good"}
          </span>
        </div>
      </div>
    </Link>
  )
})

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function BrowseFound() {
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<FoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [total, setTotal] = useState(0)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  )
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ItemQueryFilters>({})
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = searchParams.get("search")
    if (q !== null) {
      setSearchQuery(q)
    }
  }, [searchParams])

  const fetchItems = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true)
        setItems([])
        setLastDoc(null)
      } else {
        setLoadingMore(true)
      }
      try {
        const result = await FoundItemService.getAll(
          filters,
          20,
          reset ? undefined : lastDoc,
        )
        setItems((prev) => (reset ? result.items : [...prev, ...result.items]))
        setHasMore(result.hasMore)
        setLastDoc(result.lastDoc)
        setTotal(result.total)
      } catch (err) {
        console.error("Failed to fetch found items:", err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [filters, lastDoc],
  )

  useEffect(() => {
    fetchItems(true)
  }, [filters])

  useEffect(() => {
    if (!observerRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore)
          fetchItems(false)
      },
      { threshold: 0.1 },
    )
    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, fetchItems])

  const applyFilter = (key: keyof ItemQueryFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  const clearFilters = () => {
    setFilters({})
    setSearchQuery("")
  }

  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.brand?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 md:py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/dashboard" className="hover:text-teal-600">
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Found Items</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">
              Found Items
            </h1>
            <p className="text-gray-500 mt-1">
              {total} items reported · Browse and claim your belongings
            </p>
          </div>
          <Link
            to="/dashboard/report-found"
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white font-bold rounded-xl text-sm hover:bg-teal-600 transition-colors shadow-md"
          >
            <Package size={15} /> Report Found
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search found items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors border ${
              showFilters || activeFilterCount > 0
                ? "bg-teal-50 border-teal-200 text-teal-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter size={16} /> Filters{" "}
            {activeFilterCount > 0 && (
              <span className="bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-2.5 ${
                view === "grid"
                  ? "bg-teal-50 text-teal-600"
                  : "bg-white text-gray-400 hover:bg-gray-50"
              }`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2.5 ${
                view === "list"
                  ? "bg-teal-50 text-teal-600"
                  : "bg-white text-gray-400 hover:bg-gray-50"
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[#131b2e]">
              Filter Results
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1"
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) => applyFilter("category", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="">All</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Color
              </label>
              <select
                value={filters.color || ""}
                onChange={(e) => applyFilter("color", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="">All</option>
                {COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => applyFilter("status", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="">All</option>
                <option value="pending">Available</option>
                <option value="matched">Matched</option>
                <option value="claimed">Claimed</option>
                <option value="resolved">Returned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Location
              </label>
              <select
                value={filters.location || ""}
                onChange={(e) => applyFilter("location", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="">All</option>
                {BUILDING_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-600 mb-4" />
          <p className="text-sm text-gray-500">Loading found items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Search size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-[#131b2e] mb-1">
            No items found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Try adjusting your search or filters.
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-xl"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} view={view} />
            ))}
          </div>
          {hasMore && (
            <div ref={observerRef} className="flex justify-center py-8">
              {loadingMore && (
                <Loader2 size={24} className="animate-spin text-teal-600" />
              )}
            </div>
          )}
          {!hasMore && filteredItems.length > 0 && (
            <div className="text-center py-8 text-sm text-gray-400">
              All {filteredItems.length} items loaded
            </div>
          )}
        </>
      )}
    </div>
  )
}
