import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  FileWarning,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Palette,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ImageIcon,
  X,
  Search,
  FileText,
  Sparkles,
  Shield,
  HelpCircle,
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

export default function ReportLost() {
  const { user, customUser } = useAuth()
  const navigate = useNavigate()

  // Form states
  const [itemName, setItemName] = useState("")
  const [category, setCategory] = useState("electronics")
  const [description, setDescription] = useState("")
  const [locationName, setLocationName] = useState("CSE / CSM Block")
  const [campusLocationId, setCampusLocationId] = useState("loc_cse")
  const [latitude, setLatitude] = useState<number | undefined>(18.0673)
  const [longitude, setLongitude] = useState<number | undefined>(83.4341)
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
      setError("Please specify where the item was lost.")
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
        type: "LOST",
        userId: user?.uid || "guest-user",
        userName: customUser?.name || user?.displayName || "Student",
        userEmail: customUser?.email || user?.email || "student@university.edu",
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
      console.error("Report lost error:", err)
      setError(
        err.message || "Failed to submit lost item report. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Section 20: Polished Report Confirmation Screen
  if (submittedItem) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Your item has been reported.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              CampusRecover AI is now checking for potential matches.
            </p>
          </div>

          {/* Reference & Metadata Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 text-left space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Reference Number
              </span>
              <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                {submittedItem.referenceNumber}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Item Name:</span>
              <span className="font-bold text-slate-900 dark:text-white">{submittedItem.itemName}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <Badge variant="lost" dot>
                Active
              </Badge>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Lost Location:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{submittedItem.location}</span>
            </div>
          </div>

          {/* Buttons: View My Report & Search Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => navigate("/dashboard/my-reports")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText size={15} />
              <span>View My Report</span>
            </button>

            <button
              onClick={() => navigate("/dashboard/search")}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search size={15} />
              <span>Search Items</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <FileWarning className="text-rose-500" size={26} />
          Report a Lost Item
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tell us what you lost. CampusRecover AI will look for possible matches.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold leading-relaxed">
          {error}
        </div>
      )}

      {/* Two-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group 1: Item Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Item Information
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Black HP Laptop, Blue Hydration Flask"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Primary Color
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Apple, HP, Nike"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Item Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide physical details: stickers, scratches, case color, distinguishing markers..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Group 2: Where & When */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                2. Where &amp; When
              </h3>

              <div className="space-y-3">
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
                  label="Where did you lose it?"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Date Lost *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Approximate Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Group 3: Item Image Drag and Drop */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                3. Item Photo (Greatly boosts AI match accuracy)
              </h3>

              {imagePreview ? (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 cursor-pointer"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-850/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Click to upload photo
                    </span>
                    <span className="text-xs text-slate-400"> or drag and drop</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Group 4: Additional Details */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                4. Additional Notes (Optional)
              </h3>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={2}
                placeholder="Any serial number suffix, reward note, or emergency contact note..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    {uploadingImage ? "Uploading Photo..." : "Recording Lost Item..."}
                  </span>
                </>
              ) : (
                <>
                  <span>Submit Lost Item</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Preview Card & Helpful Tips */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Card Preview
              </span>
              <Badge variant="lost" dot>
                Lost Preview
              </Badge>
            </div>

            {imagePreview ? (
              <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-1">
                <ImageIcon size={24} />
                <span className="text-xs">No image attached</span>
              </div>
            )}

            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {itemName.trim() || "Item Name"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {description.trim() || "Your description will appear here."}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {locationName || "Campus Location"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {date}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Color:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {color}
                </span>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-3xl p-6 border border-blue-200/80 dark:border-blue-900/40 space-y-3 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-700 dark:text-blue-300">
              <Sparkles size={16} />
              <span>Tips for Faster AI Matching</span>
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside">
              <li>Mention distinct stickers, case scratches, or serial stamps.</li>
              <li>Provide the exact campus building and floor where you were last.</li>
              <li>Uploading a photo increases match confidence by up to 40%.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
