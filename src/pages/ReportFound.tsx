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
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { SimpleItemService } from "../services/simpleItem.service"
import { CloudinaryService } from "../services/cloudinary/upload.service"
import { Item } from "../types/Item"
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  BUILDING_OPTIONS,
} from "../schemas/reportSchemas"

export default function ReportFound() {
  const { user, customUser } = useAuth()
  const navigate = useNavigate()

  // Form states
  const [itemName, setItemName] = useState("")
  const [category, setCategory] = useState("electronics")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("Engineering Building")
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
    if (!location.trim()) {
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
        location: location.trim(),
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

  // Success view once reported
  if (submittedItem) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-teal-100 dark:border-teal-900/50 shadow-xl shadow-teal-500/5 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mb-4 ring-8 ring-teal-50/50 dark:ring-teal-950/30">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Found Item Reported Successfully!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-6">
            Thank you for helping the campus community! The report is saved and
            AI matching is scanning for prospective owners.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-700 text-left mb-8 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Reference Number
              </span>
              <span className="text-base font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-lg border border-teal-200 dark:border-teal-800 font-mono">
                {submittedItem.referenceNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Item Name</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {submittedItem.itemName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Found Date</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {submittedItem.date}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Location</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {submittedItem.location}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Status</span>
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800 capitalize">
                {submittedItem.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() =>
                navigate(
                  `/dashboard/ai-match?ref=${submittedItem.referenceNumber}`,
                )
              }
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Search size={16} /> Check AI Matches
            </button>
            <button
              onClick={() => navigate("/dashboard/my-reports")}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <FileText size={16} /> View My Reports
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <CheckCircle2 className="text-teal-600" size={26} />
          Report Found Item
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Report an item you found on campus. CampusRecover AI will immediately
          scan for matching lost reports.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 font-medium">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-6"
      >
        {/* Item Name */}
        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
            Item Name *
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Black Leather Wallet, Silver HydroFlask, Student ID"
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
          />
        </div>

        {/* Category & Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
              Color
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
            >
              {COLOR_OPTIONS.map((col) => (
                <option key={col} value={col} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
              Found Location *
            </label>
            <input
              type="text"
              list="buildings-list-found"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. CSE Block, Ground Floor Hallway, Library Desk"
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
            />
            <datalist id="buildings-list-found">
              {BUILDING_OPTIONS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Apple, Dell, Nike, Casio"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
            />
          </div>
        </div>

        {/* Date & Approximate Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
              Date Found *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
              Approximate Time
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 2:30 PM, Afternoon"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the condition, key markings, or any details to help verify the rightful owner..."
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
          />
        </div>

        {/* Image Upload (Optional) */}
        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
            Item Photo (Optional)
          </label>
          {imagePreview ? (
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-teal-500 rounded-2xl cursor-pointer bg-gray-50/60 dark:bg-gray-800/40 hover:bg-teal-50/30 transition-all">
              <Upload className="text-gray-400 mb-2" size={24} />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                Click to upload photo
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                JPEG, PNG or WebP
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

        {/* Additional Details */}
        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
            Additional Details (Optional)
          </label>
          <input
            type="text"
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="e.g. Handed over to CSE security desk, in room 204..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploadingImage}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {submitting || uploadingImage ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {uploadingImage
                ? "Uploading Photo..."
                : "Saving & Triggering AI Matching..."}
            </>
          ) : (
            <>
              Submit Found Item Report
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
