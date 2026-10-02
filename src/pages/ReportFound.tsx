import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  CheckCircle2,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Palette,
  Briefcase,
  ArrowRight,
  Loader2,
  ImageIcon,
  X,
  Search,
  FileText,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Building,
  Info,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { CloudinaryService } from "../services/cloudinary/upload.service"
import { Item } from "../types/Item"
import { Badge } from "../components/ui/Badge"
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  BUILDING_OPTIONS,
} from "../schemas/reportSchemas"
import CampusLocationSelector from "../components/map/CampusLocationSelector"

export default function ReportFound() {
  const { user, customUser } = useAuth()
  const navigate = useNavigate()

  // Form states
  const [itemName, setItemName] = useState("")
  const [category, setCategory] = useState("electronics")
  const [description, setDescription] = useState("")
  const [locationName, setLocationName] = useState("Central Library")
  const [campusLocationId, setCampusLocationId] = useState("loc_library")
  const [latitude, setLatitude] = useState<number | undefined>(18.0676)
  const [longitude, setLongitude] = useState<number | undefined>(83.4338)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = useState("")
  const [color, setColor] = useState("Black")
  const [brand, setBrand] = useState("")
  const [additionalDetails, setAdditionalDetails] = useState("")

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Submission states
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedItem, setSubmittedItem] = useState<Item | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!itemName.trim()) {
      setError("Please provide an item name.")
      return
    }
    if (!description.trim()) {
      setError("Please enter a short description.")
      return
    }
    if (!locationName.trim()) {
      setError("Please specify where the item was found.")
      return
    }

    setSubmitting(true)
    try {
      let finalImageUrl = ""
      if (imageFile) {
        setUploadingImage(true)
        try {
          const res = await CloudinaryService.uploadImage(imageFile)
          finalImageUrl = res.secure_url
        } catch (uploadErr) {
          console.warn("Cloudinary upload fallback:", uploadErr)
          finalImageUrl = imagePreview || ""
        } finally {
          setUploadingImage(false)
        }
      }

      const item = await SimpleItemService.createItem({
        type: "FOUND",
        userId: user?.uid || "guest-user",
        userName: customUser?.name || user?.displayName || "Campus Finder",
        userEmail: customUser?.email || user?.email || "finder@university.edu",
        userMobile: customUser?.phone || (customUser as any)?.mobile || "",
        itemName: itemName.trim(),
        category,
        description: description.trim(),
        location: locationName.trim(),
        locationName: locationName.trim(),
        campusLocationId: campusLocationId || "",
        latitude: latitude,
        longitude: longitude,
        date,
        time: time.trim() || "",
        color: color.trim() || "",
        brand: brand.trim() || "",
        imageUrl: finalImageUrl,
        additionalDetails: additionalDetails.trim() || "",
        status: "pending",
      })

      setSubmittedItem(item)
    } catch (err: any) {
      console.error("Report found error:", err)
      setError(
        err.message || "Failed to submit found item report. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Section 20: Polished Report Confirmation Screen
  if (submittedItem) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-teal-200 dark:border-teal-900/60 shadow-xl shadow-teal-500/5 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mb-6 ring-8 ring-teal-50/50 dark:ring-teal-950/40">
            <ShieldCheck size={40} />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 text-xs font-bold tracking-wide uppercase mb-3">
            Custodian Report Registered
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Found Item Report Logged!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
            Thank you for being a responsible campus member. Our AI matching model is actively scanning lost reports for possible owners.
          </p>

          {/* Reference Card */}
          <div className="my-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Reference ID
              </span>
              <span className="text-base font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-lg border border-teal-200 dark:border-teal-800 font-mono tracking-wider">
                {submittedItem.referenceNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Item Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {submittedItem.itemName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm capitalize">
                  {submittedItem.category}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Discovery Location</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {submittedItem.location}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Date Found</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {submittedItem.date} {submittedItem.time && `• ${submittedItem.time}`}
                </span>
              </div>
            </div>

            {submittedItem.additionalDetails && (
              <div className="pt-2 text-xs border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block">Current Custody / Notes</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {submittedItem.additionalDetails}
                </span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() =>
                navigate(
                  `/dashboard/ai-match?ref=${submittedItem.referenceNumber}`,
                )
              }
              className="py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} /> Check AI Matches
            </button>
            <button
              onClick={() => navigate("/dashboard/search")}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search size={16} /> Browse Directory
            </button>
            <button
              onClick={() => navigate("/dashboard/my-reports")}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={16} /> View My Items
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <button
              onClick={() => {
                setSubmittedItem(null)
                setItemName("")
                setDescription("")
                setAdditionalDetails("")
                setImageFile(null)
                setImagePreview(null)
              }}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
            >
              + Report another found item
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
          <CheckCircle2 size={14} />
          <span>Found Item Intake</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Report a Found Item
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Log items discovered on campus. CampusRecover AI will cross-reference description, location, time, and image against active lost reports to coordinate a verified return.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-sm text-rose-700 dark:text-rose-300 font-medium">
          {error}
        </div>
      )}

      {/* 2-Column Guided Layout: Form on Left, Live Card Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <div className="lg:col-span-7 xl:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
          >
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Tag size={16} className="text-teal-500" />
                1. Item Identification
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Item Title *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Apple AirPods Pro in White Case, Silver Casio Watch"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                    Primary Color
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  >
                    {COLOR_OPTIONS.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                    Brand / Model
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., Apple, Dell"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Where & When */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin size={16} className="text-teal-500" />
                2. Discovery Time & Location
              </h2>

              <div className="space-y-4">
                <CampusLocationSelector
                  value={locationName}
                  locationId={campusLocationId}
                  latitude={latitude}
                  longitude={longitude}
                  onChange={(data) => {
                    setLocationName(data.locationName)
                    setCampusLocationId(data.campusLocationId || "")
                    setLatitude(data.latitude)
                    setLongitude(data.longitude)
                  }}
                  label="Where did you find it?"
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                      Date Found *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                      Time
                    </label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="e.g. 11:30 AM"
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Visual Description & Image */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <FileText size={16} className="text-teal-500" />
                3. Physical Details & Custody
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Visual Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe condition, exterior signs, case style, engravings, stickers, or notable characteristics..."
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Current Custody / Handover Location (Optional)
                </label>
                <input
                  type="text"
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="e.g. Left with Main Library Front Desk, or Kept with me in Room 302"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Item Photo (Crucial for AI Multimodal Matching)
                </label>

                {imagePreview ? (
                  <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-teal-500 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-2xl cursor-pointer bg-slate-50/60 dark:bg-slate-800/40 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all">
                    <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3">
                      <Upload size={22} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Click to upload photo
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      JPEG, PNG, WebP up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting || uploadingImage ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>
                      {uploadingImage
                        ? "Uploading photo to secure storage..."
                        : "Saving item & running Gemini AI matcher..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Submit Found Item Report</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Sticky Column: Live Preview & Best Practices */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Card Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Card Preview
              </span>
              <Badge variant="found">Found Item</Badge>
            </div>

            {/* Thumbnail */}
            <div className="w-full h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden mb-4 border border-slate-200 dark:border-slate-700">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Live preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon size={32} className="mb-1 opacity-50" />
                  <span className="text-[11px] font-medium">No photo uploaded</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                {itemName || "Item Name"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {description || "Item description will appear here as you type..."}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-teal-500" />
                  {locationName || "Campus Location"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-teal-500" />
                  {date || "Today"}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 capitalize">
                  {category}
                </span>
                {color && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {color}
                  </span>
                )}
                {brand && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {brand}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Custody Best Practices Card */}
          <div className="bg-teal-50/60 dark:bg-teal-950/30 rounded-3xl p-6 border border-teal-200 dark:border-teal-900/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-600 dark:text-teal-400" />
              Campus Custody Protocol
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                <span><strong>High-Value Items:</strong> For laptops, phones, or jewelry, please consider depositing them with Campus Security or Department Front Desks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                <span><strong>Secure Handover:</strong> When an owner claims the item, use the verified 6-digit OTP or QR code to validate their identity before giving it back.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                <span><strong>Community Trust:</strong> Every verified recovery increases your campus karma and helps keep our community safe.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
