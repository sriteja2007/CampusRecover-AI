import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router"
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Package,
  FileWarning,
  CheckCircle2,
  Loader2,
  Tag,
  Eye,
  SlidersHorizontal,
  X,
  Mail,
  Phone,
  UserCheck,
  KeyRound,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building,
  List,
  Map as MapIcon,
  RotateCcw,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { Item, ItemType } from "../types/Item"
import { Badge } from "../components/ui/Badge"
import { StatusIndicator } from "../components/ui/StatusIndicator"
import { CATEGORY_OPTIONS } from "../schemas/reportSchemas"
import { CampusLocation } from "../types/CampusLocation"
import { CampusLocationService } from "../services/campusLocation.service"
import CampusMap from "../components/map/CampusMap"

export default function BrowseItems() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = (searchParams.get("type") as ItemType | "ALL") || "ALL"
  const initialQuery = searchParams.get("q") || ""

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedType, setSelectedType] = useState<ItemType | "ALL">(initialType)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "older">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "closest">("newest")
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [campusLocations, setCampusLocations] = useState<CampusLocation[]>([])
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showContact, setShowContact] = useState(false)

  useEffect(() => {
    CampusLocationService.getLocations().then(setCampusLocations)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => {},
        { timeout: 5000 },
      )
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    const unsubscribe = SimpleItemService.subscribeItems(
      (newItems) => {
        setItems(newItems)
        setLoading(false)
      },
      {
        type: selectedType,
        category: selectedCategory,
        search: searchQuery,
        location: selectedLocation,
        dateRange: dateFilter,
      },
    )
    return () => unsubscribe()
  }, [selectedType, selectedCategory, searchQuery, selectedLocation, dateFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    SimpleItemService.getItems({
      type: selectedType,
      category: selectedCategory,
      search: searchQuery,
      location: selectedLocation,
      dateRange: dateFilter,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
    }).then(setItems)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedType("ALL")
    setSelectedCategory("all")
    setSelectedStatus("all")
    setSelectedLocation("all")
    setDateFilter("all")
    setSortBy("newest")
  }

  // Filter items in memory if status filter is applied
  let filteredItems = items.filter((it) => {
    if (selectedStatus !== "all" && it.status !== selectedStatus) return false
    return true
  })

  // Sort By Newest / Oldest / Closest
  filteredItems.sort((a, b) => {
    if (sortBy === "oldest") {
      const tA = new Date(a.date || a.createdAt || 0).getTime()
      const tB = new Date(b.date || b.createdAt || 0).getTime()
      return tA - tB
    }
    if (sortBy === "closest" && userCoords) {
      const distA = Math.hypot(
        (a.latitude || 18.0675) - userCoords.lat,
        (a.longitude || 83.4336) - userCoords.lng,
      )
      const distB = Math.hypot(
        (b.latitude || 18.0675) - userCoords.lat,
        (b.longitude || 83.4336) - userCoords.lng,
      )
      return distA - distB
    }
    const tA = new Date(a.date || a.createdAt || 0).getTime()
    const tB = new Date(b.date || b.createdAt || 0).getTime()
    return tB - tA
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Search size={14} />
            <span>Campus Lost & Found Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Search Campus Belongings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Live campus inventory of lost and reported found possessions. Search by reference code, item title, campus building, or description.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/report-lost"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-500/20 transition-all flex items-center gap-1.5"
          >
            <FileWarning size={14} /> Report Lost
          </Link>
          <Link
            to="/dashboard/report-found"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} /> Report Found
          </Link>
        </div>
      </div>

      {/* Modern Search & Filtering Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-4">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, title, reference number (e.g. CR-LST-1024), color, building..."
              className="w-full pl-11 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  SimpleItemService.getItems({
                    type: selectedType,
                    category: selectedCategory,
                    search: "",
                  }).then(setItems)
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Segmented Type Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
            <button
              onClick={() => setSelectedType("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedType === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedType("LOST")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === "LOST"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              }`}
            >
              <FileWarning size={13} />
              <span>Lost</span>
            </button>
            <button
              onClick={() => setSelectedType("FOUND")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === "FOUND"
                  ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Found</span>
            </button>
          </div>

          {/* Category, Location, Time, Sort & Status Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider">
                Location:
              </span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Campus</option>
                {campusLocations.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider">
                Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Categories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider">
                Time:
              </span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="older">Older</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="closest">Closest Location</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider">
                Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="matched">Matched</option>
                <option value="in_custody">In Custody</option>
                <option value="recovered">Recovered</option>
              </select>
            </div>

            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={13} /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Header Count & View Switcher (List vs Map) */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Displaying {filteredItems.length} {filteredItems.length === 1 ? "record" : "records"}
        </span>

        {/* List View / Map View Toggle Buttons (Prompt Section 12) */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === "list"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <List size={14} />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === "map"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MapIcon size={14} />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* Map View Rendering */}
      {viewMode === "map" ? (
        <div className="mb-8">
          <CampusMap
            items={filteredItems}
            height="580px"
            showFilters={false}
            showLegend={true}
          />
        </div>
      ) : null}

      {/* Items Grid (Only in List View) */}
      {viewMode === "list" && (
        <>
          {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-sm font-medium text-slate-500">Searching live database...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No matching items found
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
            No active database records matched your search query. Try broadening your keywords or check another category.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/dashboard/report-lost"
              className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-800"
            >
              Report Lost Item
            </Link>
            <Link
              to="/dashboard/report-found"
              className="px-4 py-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-bold hover:bg-teal-100 transition-colors border border-teal-200 dark:border-teal-800"
            >
              Report Found Item
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isLost = item.type === "LOST"
            const thumb = item.imageUrl || item.imageUrls?.[0]
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item)
                  setShowContact(false)
                }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Bar: Type Badge & Reference Code */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={isLost ? "lost" : "found"}>
                      {isLost ? "Lost" : "Found"}
                    </Badge>

                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {item.referenceNumber}
                    </span>
                  </div>

                  {/* Thumbnail & Title */}
                  <div className="flex gap-3.5 mb-4">
                    <div className="w-18 h-18 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.itemName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="text-slate-400" size={26} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 text-base">
                        {item.itemName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span>
                        {item.date} {item.time ? `• ${item.time}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Status Indicator & Action CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <StatusIndicator status={item.status} size="sm" showLabel />
                  </div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )}

      {/* Item Detail Slide-over / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Badge variant={selectedItem.type === "LOST" ? "lost" : "found"}>
                  {selectedItem.type === "LOST" ? "Lost Item" : "Found Item"}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  {selectedItem.referenceNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo */}
            {selectedItem.imageUrl && (
              <div className="w-full h-52 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-5">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.itemName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title & Description */}
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              {selectedItem.itemName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              {selectedItem.description}
            </p>

            {/* Spec Sheet Grid */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 space-y-2.5 border border-slate-200 dark:border-slate-700 text-xs mb-6">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Category</span>
                <span className="font-bold capitalize text-slate-900 dark:text-white">
                  {selectedItem.category}
                </span>
              </div>
              {selectedItem.color && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Color</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedItem.color}
                  </span>
                </div>
              )}
              {selectedItem.brand && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Brand</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedItem.brand}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Campus Location</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedItem.location}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Date Logged</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedItem.date} {selectedItem.time ? `• ${selectedItem.time}` : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Status</span>
                <StatusIndicator status={selectedItem.status} size="sm" showLabel />
              </div>
              {selectedItem.additionalDetails && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-500 block mb-0.5">Notes / Custody</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {selectedItem.additionalDetails}
                  </span>
                </div>
              )}
            </div>

            {/* Reporter Contact & Handover Workflows */}
            {selectedItem.userId === user?.uid ? (
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 mb-6 flex items-start gap-2.5">
                <span className="font-bold text-blue-600">ℹ️ Your Post:</span>
                <span>You created this report. Check the AI Matching Hub to see compatible candidates.</span>
              </div>
            ) : showContact ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 text-xs space-y-3 mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 text-xs">
                    <UserCheck size={16} /> Verified Campus Contact Info
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowContact(false)}
                    className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                <div className="space-y-1 text-slate-800 dark:text-slate-200">
                  <p><strong>Name:</strong> {selectedItem.userName || "Campus Student"}</p>
                  <p>
                    <strong>Email:</strong>{" "}
                    <a
                      href={`mailto:${selectedItem.userEmail}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      {selectedItem.userEmail || "N/A"}
                    </a>
                  </p>
                  {selectedItem.userMobile && (
                    <p>
                      <strong>Mobile:</strong>{" "}
                      <a
                        href={`tel:${selectedItem.userMobile}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                      >
                        {selectedItem.userMobile}
                      </a>
                    </p>
                  )}
                </div>
                <div className="pt-2 flex gap-2">
                  <a
                    href={`mailto:${selectedItem.userEmail}?subject=CampusRecover%20Inquiry%20regarding%20${encodeURIComponent(selectedItem.referenceNumber)}`}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Mail size={14} /> Send Email
                  </a>
                  <Link
                    to={`/dashboard/scan-qr?${selectedItem.type === "LOST" ? "lostId=" + selectedItem.id + "&lostRef=" + selectedItem.referenceNumber : "foundId=" + selectedItem.id + "&foundRef=" + selectedItem.referenceNumber}`}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <KeyRound size={14} /> Handover OTP / QR
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowContact(true)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail size={16} /> Contact {selectedItem.type === "LOST" ? "Owner" : "Finder"}
                </button>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-2">
              <Link
                to={`/dashboard/ai-match?ref=${selectedItem.referenceNumber}`}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-center text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} /> Check AI Matches
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null)
                  setShowContact(false)
                }}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
