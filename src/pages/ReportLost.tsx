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

export default function ReportLost() {
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
          // Fallback to data URL so image preview still shows
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
      console.error("Report lost error:", err)
      setError(
        err.message || "Failed to submit lost item report. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Success view once reported
  if (submittedItem) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-500/5 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Lost Item Reported Successfully!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-6">
            Your report is permanently recorded and the AI matching engine is
            scanning found records.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-700 text-left mb-8 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Reference Number
              </span>
              <span className="text-base font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800 font-mono">
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
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Lost Date</span>
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
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
          <FileWarning className="text-rose-500" size={26} />
          Report Lost Item
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Submit details about what you lost. CampusRecover AI will immediately
          scan for matching found items.
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
            placeholder="e.g. Black Leather Wallet, HP Pavilion 15, AirPods Pro"
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
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
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
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
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
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
              Lost Location *
            </label>
            <input
              type="text"
              list="buildings-list"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. CSE Block, Main Library, Cafeteria"
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            />
            <datalist id="buildings-list">
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
              placeholder="e.g. Apple, Dell, Nike, Fossil"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            />
          </div>
        </div>

        {/* Date & Approximate Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
              Date Lost *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
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
              placeholder="e.g. 2:30 PM, Morning lecture"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
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
            placeholder="Describe unique markings, scratches, stickers, or distinctive features..."
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
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
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 rounded-2xl cursor-pointer bg-gray-50/60 dark:bg-gray-800/40 hover:bg-blue-50/30 transition-all">
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
            placeholder="e.g. Serial number, student ID inside, engraved name..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploadingImage}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
              Submit Lost Item Report
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
