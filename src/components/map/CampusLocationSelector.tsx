/**
 * Reusable Campus Location Selector Component
 * Allows selecting campus blocks via dropdown, search, or interactive map pinning.
 * Ensures privacy with "Approximate location" indicators.
 */

import React, { useState, useEffect } from "react"
import {
  MapPin,
  ChevronDown,
  Navigation,
  Check,
  Search,
  ExternalLink,
  X,
  Compass,
  Building,
  Info,
} from "lucide-react"
import { CampusLocation, MVGR_CAMPUS_CENTER } from "../../types/CampusLocation"
import { CampusLocationService } from "../../services/campusLocation.service"
import CampusMap from "./CampusMap"

export interface CampusLocationSelectorProps {
  value?: string // locationName
  locationId?: string
  latitude?: number
  longitude?: number
  onChange: (data: {
    locationName: string
    campusLocationId?: string
    latitude: number
    longitude: number
  }) => void
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
}

export default function CampusLocationSelector({
  value = "",
  locationId = "",
  latitude,
  longitude,
  onChange,
  label = "Where did you lose / find it?",
  placeholder = "Select campus location...",
  required = false,
  error,
  className = "",
}: CampusLocationSelectorProps) {
  const [locations, setLocations] = useState<CampusLocation[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showMapModal, setShowMapModal] = useState(false)

  // Current temporary selection for map modal
  const [tempMapSelection, setTempMapSelection] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(
    latitude && longitude
      ? { lat: latitude, lng: longitude, name: value || "Selected Location" }
      : null,
  )

  useEffect(() => {
    CampusLocationService.getLocations().then(setLocations)
  }, [])

  // Filtered dropdown options
  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  )

  const handleSelectLocation = (loc: CampusLocation) => {
    onChange({
      locationName: loc.name,
      campusLocationId: loc.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
    })
    setIsOpen(false)
  }

  const handleMapPinSelected = (loc: {
    lat: number
    lng: number
    name: string
  }) => {
    setTempMapSelection(loc)
  }

  const handleConfirmMapSelection = () => {
    if (tempMapSelection) {
      // Find if matches an existing block ID
      const matched = locations.find(
        (l) => l.name.toLowerCase() === tempMapSelection.name.toLowerCase(),
      )

      onChange({
        locationName: tempMapSelection.name,
        campusLocationId: matched?.id || "",
        latitude: tempMapSelection.lat,
        longitude: tempMapSelection.lng,
      })
    }
    setShowMapModal(false)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label & Map Trigger Header */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => {
            setTempMapSelection(
              latitude && longitude
                ? { lat: latitude, lng: longitude, name: value || "Pinned Point" }
                : {
                    lat: MVGR_CAMPUS_CENTER.latitude,
                    lng: MVGR_CAMPUS_CENTER.longitude,
                    name: value || "MVGR Campus",
                  },
            )
            setShowMapModal(true)
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer"
        >
          <Compass size={14} />
          <span>Select on Map</span>
        </button>
      </div>

      {/* Dropdown Selector Input */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition cursor-pointer ${
            error
              ? "border-rose-400 ring-2 ring-rose-500/10"
              : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500"
          } ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <MapPin size={13} />
            </div>
            <span className="truncate">{value || placeholder}</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu Modal / Popover */}
        {isOpen && (
          <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-2 max-h-72 flex flex-col animate-fade-in-up">
            {/* Search Campus Input */}
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campus blocks..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* List of Campus Blocks */}
            <div className="overflow-y-auto space-y-1 pr-1 flex-1">
              {filteredLocations.map((loc) => {
                const isSelected = value === loc.name
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building size={14} className="text-slate-400 shrink-0" />
                      <div className="truncate">
                        <div className="truncate">{loc.name}</div>
                        {loc.description && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {loc.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                  </button>
                )
              })}

              {filteredLocations.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No campus locations found. You can select directly on map!
                </div>
              )}
            </div>

            {/* Bottom Pin Button in dropdown */}
            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setShowMapModal(true)
                }}
                className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Compass size={14} /> Open Interactive Map Picker
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Pill & Approximate Accuracy Notice */}
      {value && (
        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/70 dark:border-blue-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 min-w-0">
            <MapPin size={14} className="text-blue-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold">{value}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Approximate location
                {latitude && longitude
                  ? ` · ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                  : ""}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMapModal(true)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-2"
          >
            Adjust
          </button>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

      {/* Map Selection Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Pin Location on Campus Map
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click on any building or open grounds on MVGR College campus to mark the approximate location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Map Canvas */}
            <div className="p-4 flex-1">
              <CampusMap
                height="380px"
                selectable={true}
                onSelectLocation={handleMapPinSelected}
                selectedLocation={tempMapSelection}
                center={
                  tempMapSelection
                    ? { lat: tempMapSelection.lat, lng: tempMapSelection.lng }
                    : {
                        lat: MVGR_CAMPUS_CENTER.latitude,
                        lng: MVGR_CAMPUS_CENTER.longitude,
                      }
                }
                zoom={17}
                showFilters={false}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850">
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500 shrink-0" />
                <span>
                  Selected:{" "}
                  <strong>
                    {tempMapSelection?.name || "No location pinned yet"}
                  </strong>{" "}
                  (Approximate)
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMapSelection}
                  disabled={!tempMapSelection}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  Confirm Pinned Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
