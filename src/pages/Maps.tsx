import { useState, useEffect, useCallback, useRef } from "react"
import { Link, useNavigate } from "react-router"
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
  MapPinned,
  Users,
  Shield,
  Compass,
  LocateFixed,
  Eye,
  MessageSquare,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  LostItemService,
  FoundItemService,
} from "../services/firebase/item.service"
import { RealtimeChatService } from "../services/firebase/chat.service"

// ─── Campus Office Data ──────────────────────────────────────

export interface CampusOfficeData {
  id: string
  name: string
  address: string
  hours: string
  phone: string
  lat: number
  lng: number
  x: number
  y: number
  itemsCount: number
}

const CAMPUS_OFFICES: CampusOfficeData[] = [
  {
    id: "eng",
    name: "Engineering Library Office",
    address: "Huang Engineering Center, Rm 101",
    hours: "8:00 AM – 8:00 PM",
    phone: "+1 (650) 723-4000",
    lat: 37.4275,
    lng: -122.1742,
    x: 28,
    y: 22,
    itemsCount: 23,
  },
  {
    id: "union",
    name: "Student Union Lost & Found",
    address: "Tresidder Memorial Union, Rm 101",
    hours: "9:00 AM – 9:00 PM",
    phone: "+1 (650) 723-2300",
    lat: 37.4241,
    lng: -122.171,
    x: 55,
    y: 62,
    itemsCount: 41,
  },
  {
    id: "lib",
    name: "Green Library Office",
    address: "Green Library East, Ground Floor",
    hours: "8:00 AM – 10:00 PM",
    phone: "+1 (650) 723-1064",
    lat: 37.4265,
    lng: -122.167,
    x: 64,
    y: 35,
    itemsCount: 18,
  },
  {
    id: "security",
    name: "Campus Security & Public Safety",
    address: "Campus Public Safety Building, 281 Bonair Siding",
    hours: "24/7 Immediate Dispatch",
    phone: "+1 (650) 723-9633",
    lat: 37.43,
    lng: -122.175,
    x: 18,
    y: 15,
    itemsCount: 35,
  },
]

const SECURITY_OFFICES = [
  {
    name: "Main Security Checkpoint",
    hours: "24/7",
    location: "Gate A Entrance",
    phone: "+1 (650) 723-9633",
  },
  {
    name: "Engineering Security Desk",
    hours: "7:00 AM – 11:00 PM",
    location: "Huang Eng. Center Lobby",
    phone: "+1 (650) 723-4000",
  },
  {
    name: "Green Library Security",
    hours: "8:00 AM – 10:00 PM",
    location: "East Entrance Turnstiles",
    phone: "+1 (650) 723-1064",
  },
  {
    name: "Student Union Night Patrol",
    hours: "8:00 PM – 4:00 AM",
    location: "Tresidder Plaza",
    phone: "+1 (650) 723-2300",
  },
]

const TYPE_CONFIG = {
  high: {
    color: "#dc2626",
    bg: "rgba(220,38,38,0.9)",
    size: 44,
    label: "High Activity (8+)",
  },
  medium: {
    color: "#d97706",
    bg: "rgba(217,119,6,0.9)",
    size: 36,
    label: "Moderate (4–7)",
  },
  low: {
    color: "#0d9488",
    bg: "rgba(13,148,136,0.9)",
    size: 28,
    label: "Low Activity (1–3)",
  },
}

function getHotspotType(count: number): "high" | "medium" | "low" {
  if (count >= 8) return "high"
  if (count >= 4) return "medium"
  return "low"
}

interface LocationCoord {
  x: number
  y: number
}

const LOCATION_POSITIONS: Record<string, LocationCoord> = {
  "Engineering Building": { x: 32, y: 28 },
  "Science Center": { x: 22, y: 42 },
  Library: { x: 64, y: 35 },
  "Student Center": { x: 55, y: 62 },
  "Main Quad": { x: 48, y: 48 },
  "Sports Complex": { x: 20, y: 72 },
  Cafeteria: { x: 70, y: 55 },
  Dormitory: { x: 78, y: 30 },
  "Administration Building": { x: 40, y: 15 },
  "Parking Lot": { x: 84, y: 65 },
  Auditorium: { x: 42, y: 60 },
  "Computer Lab": { x: 30, y: 38 },
}

interface Hotspot {
  location: string
  count: number
  type: "high" | "medium" | "low"
  x: number
  y: number
  items: string[]
}

export default function Maps() {
  const { user, customUser } = useAuth()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<string | null>(null)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] =
    useState<"map" | "google_maps" | "offices" | "security">("map")
  const [totalItems, setTotalItems] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [sharedMeeting, setSharedMeeting] = useState<string | null>(null)

  // Live GPS Tracking
  const [liveLocation, setLiveLocation] = useState<{
    lat: number
    lng: number
    x: number
    y: number
  } | null>(null)
  const [trackingGps, setTrackingGps] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [lostResult, foundResult] = await Promise.all([
          LostItemService.getAll({}, 100),
          FoundItemService.getAll({}, 100),
        ])

        const allItems = [...lostResult.items, ...foundResult.items]
        setTotalItems(allItems.length)

        const matched = allItems.filter(
          (i) => i.status === "matched" || i.status === "resolved",
        )
        setMatchedCount(matched.length)

        interface LocationSummary {
          count: number
          items: string[]
        }
        const locationMap: Record<string, LocationSummary> = {}

        for (const item of lostResult.items) {
          const loc = item.locationLost || "Campus Area"
          if (!locationMap[loc]) locationMap[loc] = { count: 0, items: [] }
          locationMap[loc].count++
          if (locationMap[loc].items.length < 3)
            locationMap[loc].items.push(item.title)
        }

        for (const item of foundResult.items) {
          const loc = item.locationFound || "Campus Area"
          if (!locationMap[loc]) locationMap[loc] = { count: 0, items: [] }
          locationMap[loc].count++
          if (locationMap[loc].items.length < 3)
            locationMap[loc].items.push(item.title)
        }

        const spots: Hotspot[] = Object.entries(locationMap).map(
          ([location, data]) => ({
            location,
            count: data.count,
            type: getHotspotType(data.count),
            x:
              LOCATION_POSITIONS[location]?.x ||
              30 + (Math.abs(hashString(location)) % 45),
            y:
              LOCATION_POSITIONS[location]?.y ||
              20 + (Math.abs(hashString(location + "y")) % 55),
            items: data.items,
          }),
        )

        setHotspots(spots.sort((a, b) => b.count - a.count))
      } catch (err) {
        console.error("Failed to load map data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Toggle Live GPS Geolocation
  const toggleLiveLocation = () => {
    if (trackingGps) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      setTrackingGps(false)
      setLiveLocation(null)
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.")
        return
      }
      setTrackingGps(true)
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          // Normalize GPS coordinates to canvas map percentage (Stanford Campus boundaries)
          // Stanford: Lat ~ 37.424 to 37.432, Lng ~ -122.178 to -122.164
          const latMin = 37.422
          const latMax = 37.432
          const lngMin = -122.179
          const lngMax = -122.164

          const normY = Math.max(
            10,
            Math.min(
              90,
              100 - ((pos.coords.latitude - latMin) / (latMax - latMin)) * 100,
            ),
          )
          const normX = Math.max(
            10,
            Math.min(
              90,
              ((pos.coords.longitude - lngMin) / (lngMax - lngMin)) * 100,
            ),
          )

          setLiveLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            x: Math.round(normX),
            y: Math.round(normY),
          })
        },
        (err) => {
          console.warn("GPS tracking error:", err)
          // Default fallback to center of campus
          setLiveLocation({ lat: 37.4275, lng: -122.1697, x: 50, y: 50 })
        },
        { enableHighAccuracy: true },
      )
    }
  }

  const shareMeetingLocation = useCallback(async (office: CampusOfficeData) => {
    setSharedMeeting(office.name)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet at ${office.name}`,
          text: `Let's meet at ${office.name} (${office.address}) for our lost & found item handover.`,
          url: `https://maps.google.com/?q=${office.lat},${office.lng}`,
        })
      } catch {
        // Share was cancelled or failed
      }
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(
        `Meeting Spot: ${office.name}, ${office.address} (https://maps.google.com/?q=${office.lat},${office.lng})`,
      )
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
            <Link to="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">
              Campus Map & Handover Hub
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Interactive Campus Map
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Real-time heatmaps, live GPS tracking, and verified safe handover
            meeting points.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
          {[
            { key: "map", label: "Campus Map", icon: Compass },
            { key: "google_maps", label: "Google Maps", icon: Navigation },
            { key: "offices", label: "Campus Offices", icon: Building2 },
            { key: "security", label: "Security Desks", icon: Shield },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            Loading campus coordinates and item clusters...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Map Visualization (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm flex flex-col">
            {tab === "map" && (
              <div className="relative h-[560px] bg-gradient-to-br from-blue-50/60 via-emerald-50/30 to-indigo-50/50 overflow-hidden select-none">
                {/* Grid Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="0.8"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Main Campus Pathways & Roads */}
                <div className="absolute left-[12%] right-[12%] top-[45%] h-4 bg-slate-200/90 rounded-full shadow-inner pointer-events-none border border-slate-300/50" />
                <div className="absolute left-[48%] top-[8%] bottom-[8%] w-4 bg-slate-200/90 rounded-full shadow-inner pointer-events-none border border-slate-300/50" />
                <div className="absolute left-[25%] right-[25%] top-[70%] h-3 bg-slate-200/80 rounded-full shadow-inner pointer-events-none" />

                {/* Visual Campus Zones / Buildings */}
                {Object.entries(LOCATION_POSITIONS).map(([name, pos]) => (
                  <div
                    key={name}
                    style={{ left: `${pos.x - 5}%`, top: `${pos.y - 4}%` }}
                    className="absolute w-[11%] h-[9%] bg-white/85 rounded-xl border border-blue-200/80 shadow-xs flex flex-col items-center justify-center p-1 backdrop-blur-xs transition-all hover:bg-blue-50"
                  >
                    <Building2 size={12} className="text-blue-500 mb-0.5" />
                    <span className="text-[9px] font-bold text-gray-700 text-center leading-tight truncate w-full">
                      {name}
                    </span>
                  </div>
                ))}

                {/* Hotspot Cluster Circles */}
                {hotspots.map((spot) => {
                  const cfg = TYPE_CONFIG[spot.type]
                  const isSelected = selected === spot.location

                  return (
                    <button
                      key={spot.location}
                      onClick={() =>
                        setSelected(isSelected ? null : spot.location)
                      }
                      style={{
                        left: `${spot.x}%`,
                        top: `${spot.y}%`,
                        transform: "translate(-50%, -50%)",
                        width: cfg.size,
                        height: cfg.size,
                        backgroundColor: cfg.color,
                      }}
                      className={`absolute rounded-full text-white font-black text-xs flex items-center justify-center shadow-lg border-2 border-white transition-all cursor-pointer z-10 ${
                        isSelected
                          ? "scale-125 ring-4 ring-blue-300"
                          : "hover:scale-110"
                      }`}
                    >
                      {spot.count}

                      {/* Tooltip on Click */}
                      {isSelected && (
                        <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-white text-gray-900 rounded-xl p-3 shadow-2xl border border-gray-200 min-w-[200px] z-30 pointer-events-auto">
                          <div className="text-xs font-black text-[#131b2e] mb-1 flex items-center gap-1.5">
                            <MapPin size={12} className="text-blue-600" />
                            {spot.location}
                          </div>
                          <div className="space-y-1 mb-2">
                            {spot.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="text-[11px] text-gray-600 truncate"
                              >
                                • {item}
                              </div>
                            ))}
                          </div>
                          <div className="text-[10px] font-bold text-blue-600 border-t border-gray-100 pt-1.5">
                            {spot.count} items reported in this area
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}

                {/* Verified Campus Office Markers */}
                {CAMPUS_OFFICES.map((office) => (
                  <button
                    key={office.id}
                    onClick={() => {
                      setSelected(office.name)
                    }}
                    style={{
                      left: `${office.x}%`,
                      top: `${office.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white z-20 hover:scale-115 transition-transform"
                    title={office.name}
                  >
                    <Building2 size={14} />
                  </button>
                ))}

                {/* Live GPS Radar Marker */}
                {liveLocation && (
                  <div
                    style={{
                      left: `${liveLocation.x}%`,
                      top: `${liveLocation.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute z-25 pointer-events-none"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-600 border-3 border-white shadow-xl relative flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-500/25 absolute animate-ping" />
                    </div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#131b2e] text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
                      You are here
                    </div>
                  </div>
                )}

                {/* Map Controls Floating Overlay */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                  <button
                    onClick={toggleLiveLocation}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                      trackingGps
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <LocateFixed
                      size={14}
                      className={trackingGps ? "animate-pulse" : ""}
                    />
                    {trackingGps ? "Tracking Live GPS" : "Track My Location"}
                  </button>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl p-2.5 px-4 shadow-md border border-gray-200 flex items-center gap-4 z-20">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />{" "}
                    High (8+)
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{" "}
                    Moderate (4–7)
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />{" "}
                    Low (1–3)
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                    <Building2 size={12} /> Campus Office
                  </div>
                </div>
              </div>
            )}

            {/* Google Maps Embed / Satellite View */}
            {tab === "google_maps" && (
              <div className="relative h-[560px] bg-gray-100">
                <iframe
                  title="Google Maps Campus View"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12674.288223681724!2d-122.17951563212891!3d37.42747449999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fbb2a678bea9d%3A0x29cdf01a44fc687f!2sStanford%20University!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                />
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-200 text-xs text-gray-700">
                  <span className="font-bold">Stanford University Campus</span>{" "}
                  · 37.4275° N, 122.1697° W
                </div>
              </div>
            )}

            {/* Campus Offices Tab */}
            {tab === "offices" && (
              <div className="p-6 overflow-y-auto max-h-[560px] space-y-4">
                <h2 className="text-lg font-bold text-[#131b2e]">
                  Physical Lost & Found Custody Offices
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CAMPUS_OFFICES.map((office) => (
                    <div
                      key={office.id}
                      className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#131b2e] text-sm truncate">
                            {office.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {office.address}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-gray-400" />{" "}
                          {office.hours}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-blue-600" />{" "}
                          {office.phone}
                        </div>
                        <div className="flex items-center gap-2 font-bold text-blue-700">
                          <Package size={13} /> {office.itemsCount} items
                          currently in custody
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => shareMeetingLocation(office)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          <Share2 size={12} /> Share as Meeting Spot
                        </button>
                        <a
                          href={`https://maps.google.com/?q=${office.lat},${office.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors"
                        >
                          <ExternalLink size={12} /> Directions
                        </a>
                      </div>

                      {sharedMeeting === office.name && (
                        <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                          <CheckCircle2 size={13} /> Meeting point copied &
                          ready to share in chat!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Desks Tab */}
            {tab === "security" && (
              <div className="p-6 overflow-y-auto max-h-[560px] space-y-4">
                <h2 className="text-lg font-bold text-[#131b2e] flex items-center gap-2">
                  <Shield size={20} className="text-red-600" /> 24/7 Security
                  Desks & Emergency Posts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SECURITY_OFFICES.map((sec) => (
                    <div
                      key={sec.name}
                      className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-red-200 shadow-xs space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                          <Shield size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#131b2e] text-sm">
                            {sec.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {sec.location}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock size={12} /> {sec.hours}
                        </span>
                        <a
                          href={`tel:${sec.phone}`}
                          className="font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Phone size={12} /> {sec.phone}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Statistics & Hotspot Rankings */}
          <div className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs text-center">
                <Package size={18} className="text-blue-600 mx-auto mb-1" />
                <div className="text-xl font-extrabold text-[#131b2e]">
                  {totalItems}
                </div>
                <div className="text-[11px] text-gray-500">Items on Map</div>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs text-center">
                <TrendingUp size={18} className="text-teal-600 mx-auto mb-1" />
                <div className="text-xl font-extrabold text-[#131b2e]">
                  {matchedCount}
                </div>
                <div className="text-[11px] text-gray-500">Items Reunited</div>
              </div>
            </div>

            {/* Top Hotspots List */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Top Loss Hotspots
              </h3>
              {hotspots.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No hotspot data available.
                </p>
              ) : (
                <div className="space-y-2">
                  {hotspots.slice(0, 6).map((spot) => {
                    const cfg = TYPE_CONFIG[spot.type]
                    return (
                      <button
                        key={spot.location}
                        onClick={() => {
                          setTab("map")
                          setSelected(spot.location)
                        }}
                        className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <span className="text-xs font-bold text-[#131b2e] truncate">
                            {spot.location}
                          </span>
                        </div>
                        <span
                          className="text-xs font-extrabold px-2 py-0.5 rounded-md"
                          style={{
                            color: cfg.color,
                            backgroundColor: `${cfg.color}15`,
                          }}
                        >
                          {spot.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Safe Meeting Locations Helper */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={18} />
                <h4 className="font-bold text-sm">Campus Handover Safety</h4>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Always exchange high-value items in well-lit designated campus
                offices or security desks.
              </p>
              <button
                onClick={() => setTab("offices")}
                className="w-full py-2 bg-white text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-50 transition-colors shadow-xs"
              >
                View Recommended Desks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
  }
  return hash
}
