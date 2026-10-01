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
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { Item, ItemType } from "../types/Item"
import { CATEGORY_OPTIONS } from "../schemas/reportSchemas"

export default function BrowseItems() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = searchParams.get("type") as ItemType | "ALL" || "ALL"
  const initialQuery = searchParams.get("q") || ""

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedType, setSelectedType] = useState<ItemType | "ALL">(
    initialType,
  )
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showContact, setShowContact] = useState(false)

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
      },
    )
    return () => unsubscribe()
  }, [selectedType, selectedCategory, searchQuery])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    SimpleItemService.getItems({
      type: selectedType,
      category: selectedCategory,
      search: searchQuery,
    }).then(setItems)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Campus Lost & Found Search
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Search real-time database records by reference number, item name,
          location, or description.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-800 shadow-sm mb-6 space-y-4">
        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, item name, reference (e.g. wallet, laptop, CR-LST-1024)..."
              className="w-full pl-11 pr-10 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedType("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === "ALL"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-black"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedType("LOST")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === "LOST"
                  ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm font-black"
                  : "text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
              }`}
            >
              Lost Only
            </button>
            <button
              onClick={() => setSelectedType("FOUND")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === "FOUND"
                  ? "bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm font-black"
                  : "text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400"
              }`}
            >
              Found Only
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Found {items.length} {items.length === 1 ? "report" : "reports"} in
          database
        </span>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm font-medium">Searching campus database...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200/80 dark:border-gray-800 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No matching reports found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-md mx-auto">
            We couldn't find any reports matching your search. Try changing your
            search keywords or category filter.
          </p>
          <div className="mt-6 flex justify-center gap-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const isLost = item.type === "LOST"
            const thumb = item.imageUrl || item.imageUrls?.[0]
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Bar: Type Badge & Reference */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                        isLost
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          : "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                      }`}
                    >
                      {isLost ? (
                        <FileWarning size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      {item.type}
                    </span>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                      {item.referenceNumber}
                    </span>
                  </div>

                  {/* Thumbnail & Title */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="text-gray-400" size={24} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 text-base">
                        {item.itemName}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Tags */}
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-4 bg-gray-50/80 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={13}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar
                        size={13}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <span>
                        {item.date} {item.time ? `· ${item.time}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Status & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <span className="font-semibold text-gray-500 dark:text-gray-400 capitalize">
                    Status:{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {item.status.replace("_", " ")}
                    </strong>
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    View Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                    selectedItem.type === "LOST"
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      : "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                  }`}
                >
                  {selectedItem.type}
                </span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                  {selectedItem.referenceNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {selectedItem.imageUrl && (
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.itemName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
              {selectedItem.itemName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              {selectedItem.description}
            </p>

            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-4 space-y-2.5 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 mb-6">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Category</span>
                <span className="font-bold capitalize text-gray-900 dark:text-white">
                  {selectedItem.category}
                </span>
              </div>
              {selectedItem.color && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Color</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedItem.color}</span>
                </div>
              )}
              {selectedItem.brand && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Brand</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedItem.brand}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Location</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedItem.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Date</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedItem.date} {selectedItem.time || ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500 dark:text-gray-400">
                  Current Status
                </span>
                <span className="font-bold capitalize text-blue-600 dark:text-blue-400">
                  {selectedItem.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Contact Reporter Section */}
            {selectedItem.userId === user?.uid ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 mb-6 flex items-center gap-2">
                <span className="font-bold">ℹ️ Your Report:</span>
                <span>You submitted this report. Check AI Matches or your dashboard for updates.</span>
              </div>
            ) : showContact ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 text-xs space-y-3 mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 text-sm">
                    <UserCheck size={16} /> Verified Contact Info
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowContact(false)}
                    className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                <div className="space-y-1.5 text-gray-800 dark:text-gray-200">
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
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Mail size={14} /> Send Email
                  </a>
                  <Link
                    to={`/dashboard/scan-qr?${selectedItem.type === "LOST" ? "lostId=" + selectedItem.id + "&lostRef=" + selectedItem.referenceNumber : "foundId=" + selectedItem.id + "&foundRef=" + selectedItem.referenceNumber}`}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1.5"
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
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail size={15} /> Contact {selectedItem.type === "LOST" ? "Owner" : "Finder"}
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <Link
                to={`/dashboard/ai-match?ref=${selectedItem.referenceNumber}`}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} /> Scan for AI Matches
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null)
                  setShowContact(false)
                }}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
