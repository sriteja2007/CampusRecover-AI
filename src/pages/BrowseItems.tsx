import React, { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router"
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  ChevronRight,
  Package,
  FileWarning,
  CheckCircle2,
  Loader2,
  X,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  RotateCcw,
  Sparkles,
  Building2,
  PlusCircle,
  Tag,
  ShieldCheck,
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
import { Button } from "../components/ui/Button"

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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Fetch campus blocks and geolocation
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

  // Subscribe to items with filters
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

  // Filter in memory for status
  let filteredItems = items.filter((it) => {
    if (selectedStatus !== "all" && it.status !== selectedStatus) return false
    return true
  })

  // Sort
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

  const hasActiveFilters =
    searchQuery ||
    selectedType !== "ALL" ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    selectedLocation !== "all" ||
    dateFilter !== "all"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Search size={14} />
            <span>Campus Lost &amp; Found Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Browse Campus Items
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Live campus inventory of lost belongings and reported found items across MVGR College of Engineering.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/dashboard/report-lost">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 shadow-xs">
              <FileWarning size={14} /> Report Lost
            </Button>
          </Link>
          <Link to="/dashboard/report-found">
            <Button size="sm" variant="outline" className="font-bold gap-1.5">
              <CheckCircle2 size={14} className="text-teal-600" /> Report Found
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Filters Sidebar + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <SlidersHorizontal size={16} className="text-blue-600" />
              <span>Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Item Type
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSelectedType("ALL")}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  selectedType === "ALL"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType("LOST")}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  selectedType === "LOST"
                    ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => setSelectedType("FOUND")}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  selectedType === "FOUND"
                    ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-teal-600"
                }`}
              >
                Found
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Location Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Campus Block / Area
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Campus Blocks</option>
              {campusLocations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Date Reported
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Any Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="older">Older than 7 Days</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Active (Pending Match)</option>
              <option value="possible_match">Potential Match Found</option>
              <option value="handover_pending">Handover Pending</option>
              <option value="recovered">Recovered</option>
            </select>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Search Bar & View Mode Toggle */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
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
                  placeholder="Search by keywords, title, ref (e.g. CR-LST-1024), color, building..."
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <Button type="submit" className="font-bold text-xs px-5">
                Search
              </Button>
            </form>

            {/* Sub-bar: Mobile Filter Button + Sort + View Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                {/* Mobile Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                >
                  <Filter size={14} />
                  <span>Filters {hasActiveFilters && "•"}</span>
                </button>

                <span className="text-slate-500 font-medium">
                  Showing <strong className="text-slate-900 dark:text-white">{filteredItems.length}</strong> reports
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="closest">Nearest to Me</option>
                  </select>
                </div>

                {/* List / Map Switcher */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                      viewMode === "list"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <List size={13} />
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                      viewMode === "map"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <MapIcon size={13} />
                    <span>Map</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode: Map */}
          {viewMode === "map" ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <CampusMap
                items={filteredItems}
                height="560px"
                showFilters={false}
                showLegend={true}
              />
            </div>
          ) : (
            /* View Mode: List */
            <>
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="animate-spin text-blue-600" size={36} />
                  <p className="text-sm font-medium text-slate-500">Searching live inventory...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                    <Package size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Nothing here yet
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
                    No active campus reports matched your current criteria. Try clearing your filters or report an item.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={handleClearFilters} variant="outline" size="sm" className="font-bold">
                      Clear Filters
                    </Button>
                    <Link to="/dashboard/report-lost">
                      <Button size="sm" className="font-bold">
                        Report Lost Item
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredItems.map((item) => {
                    const isLost = item.type === "LOST"
                    const thumb = item.imageUrl || item.imageUrls?.[0]
                    const refCode = item.referenceNumber || `CR-${item.id.slice(0, 6)}`
                    const locationLabel = item.locationName || item.location || "MVGR Campus"

                    return (
                      <Link
                        key={item.id}
                        to={`/items/${item.id}`}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all p-5 flex flex-col justify-between group cursor-pointer"
                      >
                        <div>
                          {/* Badges Bar */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <Badge variant={isLost ? "lost" : "found"}>
                              {isLost ? "Lost" : "Found"}
                            </Badge>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              {refCode}
                            </span>
                          </div>

                          {/* Image & Title */}
                          <div className="flex gap-3 mb-3.5">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={item.itemName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <Package className="text-slate-400" size={24} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 text-sm">
                                {item.itemName}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          {/* Metadata box */}
                          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{locationLabel}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-400 shrink-0" />
                              <span>{item.date} {item.time ? `• ${item.time}` : ""}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status & CTA */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <StatusIndicator status={item.status} size="sm" showLabel />
                          <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            View Details <ChevronRight size={13} />
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-over / Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 lg:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white text-base">Filters</span>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="all">All Categories</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Campus Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="all">All Campus Blocks</option>
                {campusLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Active</option>
                <option value="possible_match">Possible Match</option>
                <option value="handover_pending">Handover Pending</option>
                <option value="recovered">Recovered</option>
              </select>
            </div>

            <div className="pt-3 flex gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1 font-bold text-xs"
              >
                Reset
              </Button>
              <Button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 font-bold text-xs"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
