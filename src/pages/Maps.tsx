/**
 * Interactive Campus Map Page
 * Dedicated page for MVGR College of Engineering:
 * Raghumanda Road, Chintalavalasa, Andhra Pradesh 535005
 * 
 * Includes:
 * - Search campus location
 * - Interactive Leaflet + OpenStreetMap CampusMap
 * - Lost & Found item markers with accessible badges & popups
 * - Campus blocks & verified safe handover meeting points
 * - Real-time statistics from actual database records
 */

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Link } from "react-router"
import {
  MapPin,
  Package,
  Building2,
  TrendingUp,
  Filter,
  Navigation,
  Clock,
  Phone,
  Loader2,
  ChevronRight,
  Share2,
  ExternalLink,
  Shield,
  Compass,
  LocateFixed,
  Search,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService, LocationAnalytics } from "../services/simpleItem.service"
import { CampusLocationService } from "../services/campusLocation.service"
import { Item, ItemType } from "../types/Item"
import {
  CampusLocation,
  MeetingLocation,
  MVGR_CAMPUS_CENTER,
} from "../types/CampusLocation"
import CampusMap from "../components/map/CampusMap"

export default function Maps() {
  const { user } = useAuth()

  // State
  const [items, setItems] = useState<Item[]>([])
  const [campusLocations, setCampusLocations] = useState<CampusLocation[]>([])
  const [meetingLocations, setMeetingLocations] = useState<MeetingLocation[]>([])
  const [locationAnalytics, setLocationAnalytics] = useState<LocationAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters & Selection
  const [activeTab, setActiveTab] = useState<"map" | "blocks" | "meeting" | "analytics">("map")
  const [typeFilter, setTypeFilter] = useState<"ALL" | "LOST" | "FOUND" | "RECOVERED">("ALL")
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "older">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name?: string
  } | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [copiedMeeting, setCopiedMeeting] = useState<string | null>(null)

  // Load initial data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [fetchedItems, locs, meetings, analytics] = await Promise.all([
        SimpleItemService.getItems({
          type: typeFilter === "ALL" ? undefined : (typeFilter as ItemType),
          dateRange: dateRange,
        }),
        CampusLocationService.getLocations(),
        CampusLocationService.getMeetingLocations(),
        SimpleItemService.getLocationAnalytics(),
      ])

      setItems(fetchedItems)
      setCampusLocations(locs)
      setMeetingLocations(meetings)
      setLocationAnalytics(analytics.analytics)
    } catch (err) {
      console.error("Error loading campus map data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [typeFilter, dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Real database metrics
  const metrics = useMemo(() => {
    const total = items.length
    const lost = items.filter((i) => i.type === "LOST" && i.status !== "recovered").length
    const found = items.filter((i) => i.type === "FOUND" && i.status !== "recovered").length
    const recovered = items.filter((i) => i.status === "recovered").length
    return { total, lost, found, recovered }
  }, [items])

  // Filtered locations based on search query
  const filteredCampusLocations = useMemo(() => {
    if (!searchQuery.trim()) return campusLocations
    const q = searchQuery.toLowerCase().trim()
    return campusLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        (loc.description && loc.description.toLowerCase().includes(q)) ||
        loc.address?.toLowerCase().includes(q),
    )
  }, [campusLocations, searchQuery])

  // Handle selecting a block to center the map
  const handleSelectBlock = (loc: CampusLocation) => {
    setSelectedLocation({
      lat: loc.latitude,
      lng: loc.longitude,
      name: loc.name,
    })
    setSelectedBlockId(loc.id)
    setActiveTab("map")
  }

  // Handle sharing meeting location
  const handleShareMeeting = async (meeting: MeetingLocation) => {
    setCopiedMeeting(meeting.name)
    const text = `Campus Handover Meeting Spot: ${meeting.name}\n${meeting.address}\nMVGR College of Engineering (${meeting.latitude}, ${meeting.longitude})`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Handover at ${meeting.name}`,
          text: text,
          url: `https://www.google.com/maps?q=${meeting.latitude},${meeting.longitude}`,
        })
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(text)
    }

    setTimeout(() => setCopiedMeeting(null), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5 font-medium">
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={13} />
            <span className="text-gray-900 font-semibold">Campus Map</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Campus Map
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Explore campus locations and reported lost & found items.
          </p>
        </div>

        {/* Campus Identity Badge & Refresh */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {MVGR_CAMPUS_CENTER.name}
            </span>
            <span className="text-[11px] text-gray-500">
              Chintalavalasa, Vizianagaram
            </span>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            title="Refresh map items"
          >
            <RefreshCw
              size={13}
              className={refreshing ? "animate-spin text-blue-600" : "text-gray-500"}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Campus Info Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 md:p-5 shadow-sm border border-blue-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0 text-blue-300">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base md:text-lg text-white">
                {MVGR_CAMPUS_CENTER.name}
              </h2>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                Official Campus
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5 max-w-xl">
              {MVGR_CAMPUS_CENTER.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${MVGR_CAMPUS_CENTER.latitude},${MVGR_CAMPUS_CENTER.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold transition-colors"
          >
            <ExternalLink size={13} /> Campus Directions
          </a>
          <button
            onClick={() => {
              setSelectedLocation({
                lat: MVGR_CAMPUS_CENTER.latitude,
                lng: MVGR_CAMPUS_CENTER.longitude,
                name: MVGR_CAMPUS_CENTER.name,
              })
              setActiveTab("map")
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Compass size={13} /> Center Campus
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          {[
            { key: "map", label: "Interactive Map", icon: Compass },
            { key: "blocks", label: "Campus Blocks", icon: Building2 },
            { key: "meeting", label: "Safe Meeting Points", icon: Shield },
            { key: "analytics", label: "Location Hotspots", icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Quick Report Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/dashboard/report-lost"
            className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Report Lost
          </Link>
          <Link
            to="/dashboard/report-found"
            className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Report Found
          </Link>
        </div>
      </div>

      {/* Real Database Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
            <Package size={20} />
          </div>
          <div>
            <div className="text-lg md:text-xl font-extrabold text-[#131b2e]">
              {metrics.total}
            </div>
            <div className="text-[11px] font-medium text-gray-500">
              Total Campus Items
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 font-bold">
            <MapPin size={20} />
          </div>
          <div>
            <div className="text-lg md:text-xl font-extrabold text-red-600">
              {metrics.lost}
            </div>
            <div className="text-[11px] font-medium text-gray-500">
              Lost Reports
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-lg md:text-xl font-extrabold text-teal-600">
              {metrics.found}
            </div>
            <div className="text-[11px] font-medium text-gray-500">
              Found In Custody
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-lg md:text-xl font-extrabold text-indigo-600">
              {metrics.recovered}
            </div>
            <div className="text-[11px] font-medium text-gray-500">
              Items Reunited
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Map Canvas (3 Columns) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search & Map Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Campus Location Search */}
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search campus location (e.g. CSE Block, Library, Cafeteria)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 max-h-56 overflow-y-auto space-y-1">
                    {filteredCampusLocations.length === 0 ? (
                      <p className="text-xs text-gray-500 p-2">
                        No campus blocks matching "{searchQuery}"
                      </p>
                    ) : (
                      filteredCampusLocations.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            handleSelectBlock(loc)
                            setSearchQuery("")
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-blue-50 flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 size={13} className="text-blue-600" />
                            <span className="font-semibold text-gray-900">
                              {loc.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {loc.type}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Status Filters: [All] [Lost] [Found] [Recovered] */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl self-start md:self-auto overflow-x-auto">
                {(
                  [
                    { key: "ALL", label: "All Items" },
                    { key: "LOST", label: "Lost" },
                    { key: "FOUND", label: "Found" },
                    { key: "RECOVERED", label: "Recovered" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      typeFilter === key
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Date Filters: [All Time] [Today] [This Week] [Older] */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar size={13} className="text-gray-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="older">Older</option>
                </select>
              </div>
            </div>

            {/* Reusable CampusMap Component */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
              {loading ? (
                <div className="h-[620px] flex flex-col items-center justify-center bg-gray-50 space-y-3">
                  <Loader2 size={36} className="animate-spin text-blue-600" />
                  <p className="text-xs font-semibold text-gray-600">
                    Loading MVGR campus map & item coordinates...
                  </p>
                </div>
              ) : (
                <CampusMap
                  items={items}
                  selectedLocation={selectedLocation}
                  height="620px"
                  showControls={true}
                  showFilters={false}
                  showLegend={true}
                  showCampusBlocks={true}
                  showMeetingPoints={true}
                  initialFilter={typeFilter}
                />
              )}
            </div>

            {/* Privacy & Safe Location Note */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Approximate Location & Privacy Notice:</span>{" "}
                Map markers indicate estimated campus blocks and zones where items were lost or retrieved. Personal addresses, phone numbers, and exact personal coordinates are never disclosed publicly on the map.
              </div>
            </div>
          </div>

          {/* Right Sidebar: Quick Campus Navigation & Hotspots */}
          <div className="space-y-4">
            {/* Campus Blocks Quick Directory */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-600" />
                  Campus Blocks
                </h3>
                <button
                  onClick={() => setActiveTab("blocks")}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View All ({campusLocations.length})
                </button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {campusLocations.slice(0, 7).map((loc) => {
                  const isSelected = selectedBlockId === loc.id
                  return (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectBlock(loc)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50 border-blue-300 text-blue-900 font-bold"
                          : "bg-gray-50/80 border-gray-100 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-medium">{loc.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {loc.type}
                        </div>
                      </div>
                      <ChevronRight
                        size={13}
                        className={isSelected ? "text-blue-600" : "text-gray-400"}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Most Active Locations (Real Database) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-teal-600" />
                Most Active Locations
              </h3>

              {locationAnalytics.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">
                  No location report data yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {locationAnalytics.slice(0, 5).map((loc) => (
                    <button
                      key={loc.location}
                      onClick={() => {
                        const match = campusLocations.find(
                          (c) => c.name.toLowerCase() === loc.location.toLowerCase(),
                        )
                        if (match) {
                          handleSelectBlock(match)
                        } else {
                          setSelectedLocation({
                            lat: loc.latitude || MVGR_CAMPUS_CENTER.latitude,
                            lng: loc.longitude || MVGR_CAMPUS_CENTER.longitude,
                            name: loc.location,
                          })
                        }
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-gray-50 flex items-center justify-between transition-colors text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-gray-800 truncate">
                          {loc.location}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {loc.lostCount} lost · {loc.foundCount} found
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {loc.totalReports}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Handover Safety Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-300">
                <Shield size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Safe Handover
                </h4>
              </div>
              <p className="text-xs text-indigo-100/90 leading-relaxed">
                Meet at monitored locations like the Main Gate Security Post or Admin Front Desk for verified QR/OTP exchanges.
              </p>
              <button
                onClick={() => setActiveTab("meeting")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Safe Meeting Points</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campus Blocks Tab */}
      {activeTab === "blocks" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                MVGR Campus Blocks Directory
              </h2>
              <p className="text-xs text-gray-500">
                All academic departments, administrative offices, and student facilities.
              </p>
            </div>
            <div className="text-xs text-gray-600 font-semibold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {campusLocations.length} Registered Campus Blocks
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campusLocations.map((loc) => {
              const count =
                locationAnalytics.find(
                  (a) => a.location.toLowerCase() === loc.name.toLowerCase(),
                )?.totalReports || 0

              return (
                <div
                  key={loc.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Building2 size={20} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {loc.type}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{loc.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {loc.description}
                      </p>
                    </div>

                    <div className="text-[11px] text-gray-400">
                      Approx. Coordinates: {loc.latitude.toFixed(4)}° N, {loc.longitude.toFixed(4)}° E
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600">
                      {count} items reported
                    </span>
                    <button
                      onClick={() => handleSelectBlock(loc)}
                      className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700"
                    >
                      <span>Show on Map</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Safe Meeting Points Tab */}
      {activeTab === "meeting" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" />
                Verified Safe Handover Points
              </h2>
              <p className="text-xs text-gray-500">
                Staffed, CCTV-monitored campus locations recommended for secure lost & found handovers.
              </p>
            </div>
            <div className="text-xs text-gray-600 font-semibold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {meetingLocations.length} Safe Handover Desks
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetingLocations.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Shield size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {meeting.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {meeting.address}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {meeting.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareMeeting(meeting)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <Share2 size={13} />
                      <span>Share Spot</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLocation({
                          lat: meeting.latitude,
                          lng: meeting.longitude,
                          name: meeting.name,
                        })
                        setActiveTab("map")
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Compass size={13} />
                      <span>Locate on Map</span>
                    </button>
                  </div>

                  {copiedMeeting === meeting.name && (
                    <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={13} /> Meeting point copied & ready to share!
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Hotspots Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-teal-600" />
                Campus Loss & Recovery Hotspots Analytics
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Aggregated statistics computed dynamically from real database item records.
              </p>
            </div>

            {locationAnalytics.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No location reports logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-3">Campus Location</th>
                      <th className="p-3">Total Reports</th>
                      <th className="p-3 text-red-600">Lost Items</th>
                      <th className="p-3 text-teal-600">Found Items</th>
                      <th className="p-3 text-indigo-600">Recovered</th>
                      <th className="p-3">Recovery Rate</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {locationAnalytics.map((stat) => (
                      <tr key={stat.location} className="hover:bg-gray-50/80">
                        <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                          <MapPin size={13} className="text-blue-600" />
                          {stat.location}
                        </td>
                        <td className="p-3 font-extrabold text-[#131b2e]">
                          {stat.totalReports}
                        </td>
                        <td className="p-3 text-red-600">{stat.lostCount}</td>
                        <td className="p-3 text-teal-600">{stat.foundCount}</td>
                        <td className="p-3 text-indigo-600">{stat.recoveredCount}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              stat.recoveryRate >= 50
                                ? "bg-emerald-100 text-emerald-800"
                                : stat.recoveryRate > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {stat.recoveryRate}%
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedLocation({
                                lat: stat.latitude || MVGR_CAMPUS_CENTER.latitude,
                                lng: stat.longitude || MVGR_CAMPUS_CENTER.longitude,
                                name: stat.location,
                              })
                              setActiveTab("map")
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                          >
                            View on Map
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
