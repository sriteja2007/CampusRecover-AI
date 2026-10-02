/**
 * Reusable Interactive Campus Map Component
 * Built with Leaflet & OpenStreetMap tiles.
 * Centered on MVGR College of Engineering:
 * 3C65+24W, Raghumanda Road, Chintalavalasa, Andhra Pradesh 535005 (18.0675 N, 83.4336 E)
 */

import React, { useEffect, useRef, useState, useCallback } from "react"
import L from "leaflet"
import { useNavigate } from "react-router"
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  Search,
  Building2,
  Shield,
  LocateFixed,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  FileWarning,
  Package,
  Calendar,
  Sparkles,
  Info,
  X,
  AlertCircle,
} from "lucide-react"
import { Item, ItemType } from "../../types/Item"
import {
  CampusLocation,
  MeetingLocation,
  MVGR_CAMPUS_CENTER,
} from "../../types/CampusLocation"
import { CampusLocationService } from "../../services/campusLocation.service"

export interface CampusMapProps {
  items?: Item[]
  selectedLocation?: { lat: number; lng: number; name?: string } | null
  onSelectLocation?: (location: {
    lat: number
    lng: number
    name: string
  }) => void
  selectable?: boolean
  height?: string
  showControls?: boolean
  showFilters?: boolean
  showLegend?: boolean
  showCampusBlocks?: boolean
  showMeetingPoints?: boolean
  center?: { lat: number; lng: number }
  zoom?: number
  adminMode?: boolean
  initialFilter?: "ALL" | "LOST" | "FOUND" | "RECOVERED"
  singleItem?: Item | null
  className?: string
}

// ─── Custom Accessible Marker Icons (Zero bundle path bugs) ────────

const createCampusCenterIcon = () =>
  L.divIcon({
    className: "campus-center-marker",
    html: `
      <div style="
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #1d4ed8, #2563eb);
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 25px -5px rgba(29, 78, 216, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        position: relative;
      ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
          <path d="M6 6h10"></path>
          <path d="M6 10h10"></path>
        </svg>
        <span style="
          position: absolute;
          bottom: -20px;
          white-space: nowrap;
          background: #0f172a;
          color: #f8fafc;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        ">MVGR Main Campus</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  })

const createBlockIcon = (name: string, type: string) => {
  return L.divIcon({
    className: "campus-block-marker",
    html: `
      <div style="
        background: #ffffff;
        border: 2px solid #3b82f6;
        border-radius: 20px;
        padding: 4px 10px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        cursor: pointer;
        font-family: system-ui, sans-serif;
        transform: translate(-50%, -50%);
        transition: transform 0.15s ease;
      ">
        <span style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          display: inline-block;
        "></span>
        <span style="
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
        ">${name}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -14],
  })
}

const createItemIcon = (type: "LOST" | "FOUND" | "recovered", label?: string) => {
  const isLost = type === "LOST"
  const isRecovered = type === "recovered"
  const bg = isRecovered
    ? "#4f46e5"
    : isLost
      ? "#e11d48"
      : "#0d9488"
  const title = isRecovered ? "Recovered" : isLost ? "Lost" : "Found"

  return L.divIcon({
    className: `item-marker-${type.toLowerCase()}`,
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${bg};
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        position: relative;
        transform: translate(-50%, -50%);
      ">
        ${
          isRecovered
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
            : isLost
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`
        }
        <span style="
          position: absolute;
          bottom: -16px;
          background: #0f172a;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        ">${title}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -20],
  })
}

const createMeetingPointIcon = (name: string) =>
  L.divIcon({
    className: "meeting-point-marker",
    html: `
      <div style="
        background: #7c3aed;
        color: #ffffff;
        border: 2px solid #ffffff;
        border-radius: 12px;
        padding: 4px 8px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 6px 14px rgba(124, 58, 237, 0.4);
        cursor: pointer;
        font-family: system-ui, sans-serif;
        transform: translate(-50%, -50%);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
        </svg>
        <span style="font-size: 10px; font-weight: 800; white-space: nowrap;">Safe Spot: ${name}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  })

const createSelectedPinIcon = () =>
  L.divIcon({
    className: "selected-pin-marker",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: #f59e0b;
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) translate(-10px, -10px);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.5);
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })

export default function CampusMap({
  items = [],
  selectedLocation,
  onSelectLocation,
  selectable = false,
  height = "560px",
  showControls = true,
  showFilters = true,
  showLegend = true,
  showCampusBlocks = true,
  showMeetingPoints = true,
  center = {
    lat: MVGR_CAMPUS_CENTER.latitude,
    lng: MVGR_CAMPUS_CENTER.longitude,
  },
  zoom = MVGR_CAMPUS_CENTER.zoom,
  adminMode = false,
  initialFilter = "ALL",
  singleItem = null,
  className = "",
}: CampusMapProps) {
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const selectionMarkerRef = useRef<L.Marker | null>(null)

  // State
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<
    "ALL" | "LOST" | "FOUND" | "RECOVERED"
  >(initialFilter)
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "older"
  >("all")
  const [campusBlocks, setCampusBlocks] = useState<CampusLocation[]>([])
  const [meetingPoints, setMeetingPoints] = useState<MeetingLocation[]>([])
  const [searchLocationQuery, setSearchLocationQuery] = useState("")
  const [isLocatingUser, setIsLocatingUser] = useState(false)
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

  // Load campus locations & meeting points
  useEffect(() => {
    let isMounted = true
    Promise.all([
      CampusLocationService.getLocations(),
      CampusLocationService.getMeetingLocations(),
    ])
      .then(([locs, meets]) => {
        if (isMounted) {
          setCampusBlocks(locs)
          setMeetingPoints(meets)
        }
      })
      .catch((err) => {
        console.warn("Could not load campus blocks:", err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    setLoading(true)
    setMapError(null)

    try {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      })

      // Add OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      })
        .addTo(map)
        .on("tileerror", () => {
          // If network tiles fail, fallback gracefully without crash
          console.warn("Notice: OpenStreetMap tile load error.")
        })

      // Add custom Zoom Control at top right
      L.control.zoom({ position: "topright" }).addTo(map)

      // LayerGroup to hold dynamic markers
      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup

      mapInstanceRef.current = map

      // Handle Map Click for Location Selection
      if (selectable && onSelectLocation) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng

          // Find closest known campus block if within ~150 meters
          let closestName = "Campus Area"
          let minDistance = Infinity

          for (const block of campusBlocks) {
            const dist = Math.hypot(
              block.latitude - lat,
              block.longitude - lng,
            )
            if (dist < minDistance) {
              minDistance = dist
              closestName = block.name
            }
          }

          if (minDistance > 0.003) {
            closestName = "Selected Campus Point"
          }

          onSelectLocation({ lat, lng, name: closestName })
        })
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Leaflet map initialization error:", err)
      setMapError("Campus map couldn't be loaded.")
      setLoading(false)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Resize listener
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize()
    }, 250)
    return () => clearTimeout(timer)
  }, [height])

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = layerGroupRef.current
    if (!map || !layer) return

    layer.clearLayers()

    // 1. MVGR College Main Campus Center Marker & Popup (Prompt Section 5)
    const mainCampusMarker = L.marker(
      [MVGR_CAMPUS_CENTER.latitude, MVGR_CAMPUS_CENTER.longitude],
      { icon: createCampusCenterIcon() },
    )

    mainCampusMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 4px;">
        <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px;">
          ${MVGR_CAMPUS_CENTER.name}
        </div>
        <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 8px;">
          Raghumanda Road<br/>
          Chintalavalasa<br/>
          Andhra Pradesh 535005
        </div>
        <div style="font-size: 10px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 6px; border: 1px solid #dbeafe;">
          📍 Official Campus Headquarters
        </div>
      </div>
    `)

    layer.addLayer(mainCampusMarker)

    // 2. Campus Blocks (Configurable, Section 6 & 7)
    if (showCampusBlocks) {
      campusBlocks.forEach((block) => {
        if (!block.active) return
        const marker = L.marker([block.latitude, block.longitude], {
          icon: createBlockIcon(block.name, block.type),
        })

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 190px; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">
                ${block.type}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
              ${block.name}
            </div>
            <div style="font-size: 11px; color: #64748b; line-height: 1.35; margin-bottom: 6px;">
              ${block.description || block.address || "Campus building zone"}
            </div>
            <div style="font-size: 10px; color: #94a3b8;">
              Approximate Location Coordinates: ${block.latitude.toFixed(4)}, ${block.longitude.toFixed(4)}
            </div>
          </div>
        `)

        layer.addLayer(marker)
      })
    }

    // 3. Safe Handover Meeting Points (Section 32)
    if (showMeetingPoints) {
      meetingPoints.forEach((meeting) => {
        if (!meeting.active) return
        const marker = L.marker([meeting.latitude, meeting.longitude], {
          icon: createMeetingPointIcon(meeting.name),
        })

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 210px; padding: 4px;">
            <div style="font-size: 10px; font-weight: 800; color: #7c3aed; text-transform: uppercase; margin-bottom: 2px;">
              🛡️ Safe Handover Zone
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
              ${meeting.name}
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 8px;">
              ${meeting.description}
            </div>
            <div style="font-size: 10px; background: #faf5ff; border: 1px solid #ede9fe; color: #6d28d9; padding: 4px 6px; border-radius: 6px; font-weight: 600;">
              Recommended exchange post with staff presence & monitoring
            </div>
          </div>
        `)

        layer.addLayer(marker)
      })
    }

    // 4. Lost & Found Items Markers (Section 13, 14, 26, 27)
    let displayItems = singleItem ? [singleItem] : items

    // Filter by type
    if (filterType !== "ALL") {
      if (filterType === "RECOVERED") {
        displayItems = displayItems.filter((i) => i.status === "recovered")
      } else {
        displayItems = displayItems.filter(
          (i) => i.type === filterType && i.status !== "recovered",
        )
      }
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      const todayStr = now.toISOString().split("T")[0]
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      displayItems = displayItems.filter((it) => {
        const dStr = it.date || it.dateLost || it.dateFound || ""
        if (!dStr) return true
        if (dateFilter === "today") return dStr === todayStr
        const d = new Date(dStr)
        if (isNaN(d.getTime())) return true
        if (dateFilter === "week") return d >= sevenDaysAgo
        if (dateFilter === "older") return d < sevenDaysAgo
        return true
      })
    }

    displayItems.forEach((item) => {
      // Use item's coordinates or find campus block coordinates
      let lat = item.latitude
      let lng = item.longitude

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const foundBlock = campusBlocks.find(
          (b) =>
            b.name.toLowerCase() ===
              (item.locationName || item.location || "").toLowerCase() ||
            b.id === item.campusLocationId,
        )
        if (foundBlock) {
          // Slight jitter so multiple items in same building don't overlap completely
          const hash = Math.abs(
            (item.referenceNumber || item.id)
              .split("")
              .reduce((acc, c) => acc + c.charCodeAt(0), 0),
          )
          const jitterLat = ((hash % 10) - 5) * 0.0001
          const jitterLng = (((hash * 3) % 10) - 5) * 0.0001
          lat = foundBlock.latitude + jitterLat
          lng = foundBlock.longitude + jitterLng
        } else {
          lat = MVGR_CAMPUS_CENTER.latitude
          lng = MVGR_CAMPUS_CENTER.longitude
        }
      }

      const isRecovered = item.status === "recovered"
      const markerType = isRecovered
        ? "recovered"
        : (item.type as "LOST" | "FOUND")
      const itemTitle = item.itemName || item.title || "Campus Belonging"
      const itemLocation =
        item.locationName || item.location || "Campus Area"
      const itemDate = item.date || item.dateLost || item.dateFound || "Recent"
      const refCode = item.referenceNumber || "CR-ITEM"

      const marker = L.marker([lat, lng], {
        icon: createItemIcon(markerType),
      })

      // Popup Content per Section 14 (Public) & Section 27 (Admin)
      // IMPORTANT: Privacy rules (Section 18): Never display personal phone/email in map popup!
      const popupHtml = adminMode
        ? `
          <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 4px;">
            <div style="font-size: 10px; font-mono; font-weight: 700; color: #475569; margin-bottom: 2px;">
              ${refCode}
            </div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">
              ${itemTitle}
            </div>
            <div style="display: flex; gap: 4px; margin-bottom: 6px;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; background: ${
                item.type === "LOST" ? "#ffe4e6; color: #e11d48;" : "#ccfbf1; color: #0f766e;"
              } padding: 2px 6px; border-radius: 4px;">
                ${item.type}
              </span>
              <span style="font-size: 9px; font-weight: 700; background: #f1f5f9; color: #334155; padding: 2px 6px; border-radius: 4px;">
                Status: ${item.status || "pending"}
              </span>
            </div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 2px;">
              <strong>Location:</strong> ${itemLocation} (Approximate)
            </div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 2px;">
              <strong>Reported by:</strong> ${item.userName || "Student User"}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 10px;">
              <strong>Date:</strong> ${itemDate}
            </div>
            <div style="display: flex; gap: 6px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
              <a href="/dashboard/item/${item.type.toLowerCase()}/${item.id}" style="
                flex: 1;
                text-align: center;
                background: #2563eb;
                color: #ffffff;
                font-size: 11px;
                font-weight: 700;
                padding: 6px 8px;
                border-radius: 8px;
                text-decoration: none;
                display: block;
              ">View Item</a>
              <a href="/admin?tab=matches" style="
                flex: 1;
                text-align: center;
                background: #f1f5f9;
                color: #1e293b;
                font-size: 11px;
                font-weight: 700;
                padding: 6px 8px;
                border-radius: 8px;
                text-decoration: none;
                display: block;
              ">View Match</a>
            </div>
          </div>
        `
        : `
          <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 4px;">
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
              ${itemTitle}
            </div>
            <div style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: ${
              isRecovered
                ? "#e0e7ff; color: #4338ca;"
                : item.type === "LOST"
                  ? "#ffe4e6; color: #e11d48;"
                  : "#ccfbf1; color: #0f766e;"
            } padding: 2px 8px; border-radius: 6px; margin-bottom: 8px;">
              ${isRecovered ? "RECOVERED" : item.type}
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 2px;">
              📍 ${itemLocation}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 4px;">
              (Approximate location)
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
              🗓️ ${itemDate}
            </div>
            <div style="font-size: 10px; font-family: monospace; font-weight: 700; color: #2563eb; margin-bottom: 8px;">
              Reference: ${refCode}
            </div>
            <a href="/dashboard/item/${item.type.toLowerCase()}/${item.id}" style="
              display: block;
              text-align: center;
              background: #2563eb;
              color: #ffffff;
              font-size: 11px;
              font-weight: 700;
              padding: 6px 12px;
              border-radius: 8px;
              text-decoration: none;
              box-shadow: 0 2px 4px rgba(37,99,235,0.2);
            ">View Item</a>
          </div>
        `

      marker.bindPopup(popupHtml)
      layer.addLayer(marker)
    })

    // 5. Selected Location Marker (If user placed a custom pin or picked location)
    if (selectedLocation) {
      const pin = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: createSelectedPinIcon(),
      })
      pin.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 11px; font-weight: 700; color: #0f172a; padding: 2px;">
          📍 Selected Location<br/>
          <span style="font-weight: 500; color: #64748b;">${
            selectedLocation.name || "Custom Point"
          }</span>
        </div>
      `)
      layer.addLayer(pin)
      selectionMarkerRef.current = pin
    }
  }, [
    items,
    singleItem,
    filterType,
    dateFilter,
    campusBlocks,
    meetingPoints,
    selectedLocation,
    adminMode,
    showCampusBlocks,
    showMeetingPoints,
  ])

  // Center on Selected Location if changed
  useEffect(() => {
    if (selectedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedLocation.lat, selectedLocation.lng],
        18,
        { duration: 0.8 },
      )
    }
  }, [selectedLocation])

  // Location Search Handler (Prompt Section 16)
  const handleLocationSearch = (query: string) => {
    setSearchLocationQuery(query)
    if (!query.trim() || !mapInstanceRef.current) return

    const match = campusBlocks.find((b) =>
      b.name.toLowerCase().includes(query.toLowerCase().trim()),
    )
    if (match) {
      mapInstanceRef.current.flyTo([match.latitude, match.longitude], 18, {
        duration: 1.2,
      })
    }
  }

  // Geolocation Handler (Prompt Section 30: "Locate Me")
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setIsLocatingUser(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false)
        const userLat = pos.coords.latitude
        const userLng = pos.coords.longitude
        setUserLocation({ lat: userLat, lng: userLng })

        if (mapInstanceRef.current && layerGroupRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLng], 17, {
            duration: 1.2,
          })

          const userPin = L.circleMarker([userLat, userLng], {
            radius: 8,
            fillColor: "#2563eb",
            fillOpacity: 1,
            color: "#ffffff",
            weight: 3,
          })
          userPin.bindPopup("📍 You are here").openPopup()
          layerGroupRef.current.addLayer(userPin)
        }
      },
      (err) => {
        setIsLocatingUser(false)
        console.warn("Geolocation permission error or timeout:", err)
        // Non-blocking fallback: recenter on MVGR College
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(
            [MVGR_CAMPUS_CENTER.latitude, MVGR_CAMPUS_CENTER.longitude],
            MVGR_CAMPUS_CENTER.zoom,
            { duration: 1.0 },
          )
        }
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  // Open external directions (Prompt Section 31)
  const handleOpenDirections = () => {
    const destLat = selectedLocation?.lat || MVGR_CAMPUS_CENTER.latitude
    const destLng = selectedLocation?.lng || MVGR_CAMPUS_CENTER.longitude
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  // Count metrics for filters
  const lostCount = items.filter(
    (i) => i.type === "LOST" && i.status !== "recovered",
  ).length
  const foundCount = items.filter(
    (i) => i.type === "FOUND" && i.status !== "recovered",
  ).length
  const recoveredCount = items.filter((i) => i.status === "recovered").length

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm flex flex-col ${className}`}
    >
      {/* Top Search & Filter Bar (Prompt Section 15 & 16 & 20) */}
      {showControls && (
        <div className="p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 z-10">
          {/* Campus Location Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchLocationQuery}
              onChange={(e) => handleLocationSearch(e.target.value)}
              placeholder="Search campus location (e.g. CSE Block, Library)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
            {searchLocationQuery && (
              <button
                type="button"
                onClick={() => setSearchLocationQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filters: All, Lost, Found, Recovered */}
          {showFilters && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterType === "ALL"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("LOST")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  filterType === "LOST"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Lost ({lostCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("FOUND")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  filterType === "FOUND"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Found ({foundCount})
              </button>
              {adminMode && (
                <button
                  type="button"
                  onClick={() => setFilterType("RECOVERED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    filterType === "RECOVERED"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Recovered ({recoveredCount})
                </button>
              )}
            </div>
          )}

          {/* Quick Actions: Locate Me & Directions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingUser}
              title="Locate Me on Campus"
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LocateFixed
                size={14}
                className={isLocatingUser ? "animate-spin text-blue-600" : ""}
              />
              <span className="hidden sm:inline">
                {isLocatingUser ? "Locating..." : "Locate Me"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleOpenDirections}
              title="Open directions to MVGR College in Google Maps"
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Navigation size={14} />
              <span className="hidden sm:inline">Directions</span>
            </button>
          </div>
        </div>
      )}

      {/* Map Canvas Area */}
      <div className="relative flex-1 w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Loading State Overlay (Prompt Section 39) */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Loading campus map...
            </p>
          </div>
        )}

        {/* Error State Fallback (Prompt Section 40) */}
        {mapError && (
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-20">
            <AlertCircle size={36} className="text-rose-500 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Campus map couldn't be loaded.
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              You can still select a campus location from the list.
            </p>
          </div>
        )}

        {/* Selectable Helper Badge */}
        {selectable && (
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-md z-10 flex items-center gap-1.5 pointer-events-none">
            <MapPin size={14} />
            <span>Click anywhere on campus map to pin location</span>
          </div>
        )}

        {/* Floating Map Legend (Prompt Section 29) */}
        {showLegend && (
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md z-10 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span>Lost</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              <span>Found</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Campus Block</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span>Safe Meeting Spot</span>
            </div>
          </div>
        )}

        {/* Campus Anchor Tag */}
        <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400 shadow-sm z-10 pointer-events-none">
          MVGR College of Engineering · 18.0675° N, 83.4336° E
        </div>
      </div>
    </div>
  )
}
