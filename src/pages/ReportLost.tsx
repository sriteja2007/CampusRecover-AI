import { useState, useCallback, useEffect, memo } from "react"
import { useNavigate, Link } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  FileQuestion,
  Upload,
  ChevronRight,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Brain,
  ImageIcon,
  RotateCcw,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  LostItemService,
  DraftService,
  ActivityLogService,
} from "../services/firebase/item.service"
import { MatchingService } from "../services/matching.service"
import {
  CloudinaryService,
  UploadResult,
} from "../services/cloudinary/upload.service"
import { analyzeMultipleImages, AISuggestion } from "../services/ai.service"
import {
  checkDuplicateLostItems,
  DuplicateMatch,
} from "../services/duplicate.service"
import {
  lostItemSchema,
  LostItemFormData,
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  BUILDING_OPTIONS,
} from "../schemas/reportSchemas"

interface UploadedImage {
  file?: File
  url: string
  publicId: string
  progress: number
  status: "uploading" | "done" | "error"
  retryFile?: File
}

const ImagePreview = memo(function ImagePreview({
  img,
  index,
  onRemove,
  onRetry,
}: {
  img: UploadedImage
  index: number
  onRemove: (i: number) => void
  onRetry: (i: number) => void
}) {
  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50">
      {img.status === "done" ? (
        <img
          src={img.url}
          alt={`Upload ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : img.status === "uploading" ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${img.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{img.progress}%</span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
          <AlertCircle size={20} className="text-red-500" />
          <button
            type="button"
            onClick={() => onRetry(index)}
            className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
          >
            <RotateCcw size={11} /> Retry
          </button>
        </div>
      )}
      {img.status !== "uploading" && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-1.5 right-1.5 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
})

export default function ReportLost() {
  const navigate = useNavigate()
  const { user, customUser } = useAuth()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [proofImages, setProofImages] = useState<UploadedImage[]>([])
  const [billImage, setBillImage] = useState<UploadedImage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    getValues,
  } = useForm<LostItemFormData>({
    resolver: zodResolver(lostItemSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      brand: "",
      color: "",
      locationLost: "",
      dateLost: new Date().toISOString().split("T")[0],
      timeLost: "",
      rewardOffered: "",
      serialNumber: "",
      contactPreference: "any",
      visibility: "public",
    },
  })

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message })
      setTimeout(() => setToast(null), 4000)
    },
    [],
  )

  const handleImageUpload = useCallback(
    async (files: FileList | File[], target: "main" | "proof" | "bill") => {
      const maxCount = target === "main" ? 5 : target === "proof" ? 3 : 1
      const currentCount =
        target === "main"
          ? images.length
          : target === "proof"
            ? proofImages.length
            : billImage
              ? 1
              : 0
      const remaining = maxCount - currentCount
      const filesToUpload = Array.from(files).slice(0, remaining)

      if (filesToUpload.length === 0) {
        showToast("error", `Maximum ${maxCount} images allowed.`)
        return
      }

      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("error", `${file.name} exceeds 5MB limit.`)
          continue
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          showToast("error", `${file.name}: Only JPEG, PNG, WebP accepted.`)
          continue
        }

        const placeholder: UploadedImage = {
          file,
          url: URL.createObjectURL(file),
          publicId: "",
          progress: 0,
          status: "uploading",
          retryFile: file,
        }

        const updateFn =
          target === "main"
            ? setImages
            : target === "proof"
              ? setProofImages
              : null

        if (target === "bill") {
          setBillImage(placeholder)
        } else {
          updateFn?.((prev) => [...prev, placeholder])
        }

        try {
          const result: UploadResult = await CloudinaryService.uploadImage(
            file,
            (p) => {
              if (target === "bill") {
                setBillImage((prev) => (prev ? { ...prev, progress: p } : null))
              } else {
                updateFn?.((prev) =>
                  prev.map((img) =>
                    img.file === file ? { ...img, progress: p } : img,
                  ),
                )
              }
            },
          )

          if (target === "bill") {
            setBillImage((prev) =>
              prev
                ? {
                    ...prev,
                    url: result.secure_url,
                    publicId: result.public_id,
                    status: "done",
                  }
                : null,
            )
          } else {
            updateFn?.((prev) =>
              prev.map((img) =>
                img.file === file
                  ? {
                      ...img,
                      url: result.secure_url,
                      publicId: result.public_id,
                      status: "done",
                    }
                  : img,
              ),
            )
          }
        } catch {
          if (target === "bill") {
            setBillImage((prev) => (prev ? { ...prev, status: "error" } : null))
          } else {
            updateFn?.((prev) =>
              prev.map((img) =>
                img.file === file ? { ...img, status: "error" } : img,
              ),
            )
          }
          showToast("error", `Failed to upload ${file.name}`)
        }
      }
    },
    [images.length, proofImages.length, billImage, showToast],
  )

  const retryUpload = useCallback(
    async (index: number, target: "main" | "proof") => {
      const list = target === "main" ? images : proofImages
      const setList = target === "main" ? setImages : setProofImages
      const img = list[index]
      if (!img.retryFile) return

      setList((prev) =>
        prev.map((im, i) =>
          i === index
            ? { ...im, status: "uploading" as const, progress: 0 }
            : im,
        ),
      )

      try {
        const result = await CloudinaryService.uploadImage(
          img.retryFile,
          (p) => {
            setList((prev) =>
              prev.map((im, i) => (i === index ? { ...im, progress: p } : im)),
            )
          },
        )
        setList((prev) =>
          prev.map((im, i) =>
            i === index
              ? {
                  ...im,
                  url: result.secure_url,
                  publicId: result.public_id,
                  status: "done" as const,
                }
              : im,
          ),
        )
      } catch {
        setList((prev) =>
          prev.map((im, i) =>
            i === index ? { ...im, status: "error" as const } : im,
          ),
        )
      }
    },
    [images, proofImages],
  )

  const removeImage = useCallback((index: number, target: "main" | "proof") => {
    const setList = target === "main" ? setImages : setProofImages
    setList((prev) => {
      const removed = prev[index]
      if (removed.publicId)
        CloudinaryService.deleteImage(removed.publicId).catch(() => {})
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const runAIAnalysis = useCallback(async () => {
    const doneImages = images.filter((img) => img.status === "done")
    if (doneImages.length === 0) {
      showToast("error", "Please upload at least one image first.")
      return
    }
    setIsAnalyzing(true)
    try {
      const result = await analyzeMultipleImages(
        doneImages.map((img) => img.url),
      )
      setAiSuggestion(result)

      // Auto-fill form fields from AI suggestions
      if (result.possibleCategory) {
        const match = CATEGORY_OPTIONS.find(
          (c) => c.value === result.possibleCategory,
        )
        if (match) setValue("category", match.value)
      }
      if (result.dominantColors[0] && result.dominantColors[0] !== "Unknown") {
        setValue("color", result.dominantColors[0])
      }
      if (result.possibleDescription && !watch("description")) {
        setValue("description", result.possibleDescription)
      }
      if (result.estimatedBrand) {
        setValue("brand", result.estimatedBrand)
      }

      showToast(
        "success",
        `AI analysis complete (${Math.round(result.confidenceScore * 100)}% confidence)`,
      )
    } catch {
      showToast("error", "AI analysis failed. Please fill in details manually.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [images, setValue, watch, showToast])

  const checkForDuplicates = useCallback(async () => {
    const vals = getValues()
    if (!vals.title || vals.title.length < 3) return

    const matches = await checkDuplicateLostItems({
      title: vals.title,
      description: vals.description || "",
      brand: vals.brand,
      dateLost: vals.dateLost,
    })
    if (matches.length > 0) {
      setDuplicates(matches)
      setShowDuplicateWarning(true)
    }
  }, [getValues])

  const saveDraft = useCallback(async () => {
    if (!user) return
    setIsSavingDraft(true)
    try {
      const formData = getValues()
      await DraftService.saveDraft({
        userId: user.uid,
        type: "lost",
        formData,
        imageUrls: images.filter((i) => i.status === "done").map((i) => i.url),
        cloudinaryPublicIds: images
          .filter((i) => i.status === "done")
          .map((i) => i.publicId),
      })
      showToast("success", "Draft saved successfully!")
    } catch {
      showToast("error", "Failed to save draft.")
    } finally {
      setIsSavingDraft(false)
    }
  }, [user, getValues, images, showToast])

  const onSubmit = async (data: LostItemFormData) => {
    if (!user || !customUser) {
      showToast("error", "You must be logged in.")
      return
    }

    const doneImages = images.filter((i) => i.status === "done")
    if (doneImages.length === 0) {
      showToast("error", "Please upload at least one image.")
      return
    }

    setIsSubmitting(true)
    try {
      const docId = await LostItemService.create({
        ...data,
        imageUrls: doneImages.map((i) => i.url),
        cloudinaryPublicIds: doneImages.map((i) => i.publicId),
        purchaseBillUrl: billImage?.status === "done" ? billImage.url : "",
        additionalProofUrls: proofImages
          .filter((i) => i.status === "done")
          .map((i) => i.url),
        userId: user.uid,
        userName: customUser.name || "",
        userEmail: customUser.email || "",
        userPhotoURL: customUser.photoURL || "",
        status: "pending",
        isDraft: false,
      })

      await ActivityLogService.log({
        userId: user.uid,
        action: "created",
        itemType: "lost",
        itemId: docId,
        itemTitle: data.title,
        details: `Reported lost item: ${data.title}`,
      })

      // Automatically trigger background AI lost-found pairing scan
      MatchingService.triggerBackgroundPairing(
        {
          id: docId,
          ...data,
          imageUrls: doneImages.map((i) => i.url),
          userId: user.uid,
        } as any,
        "lost",
      ).catch(console.warn)

      showToast(
        "success",
        "Lost item reported! AI background pairing initiated.",
      )
      setTimeout(() => navigate("/dashboard"), 1500)
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit report.")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isDirty) return;
    const intervalId = setInterval(() => {
      saveDraft();
    }, 20000);
    return () => clearInterval(intervalId);
  }, [isDirty, saveDraft]);

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm text-[#131b2e] font-[Inter,sans-serif]"
  const labelClass = "block text-sm font-bold text-[#131b2e] mb-2"
  const errorClass = "text-xs text-red-500 mt-1"

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {/* Breadcrumb / Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Report Lost</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileQuestion size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">
              Report a Lost Item
            </h1>
            <p className="text-gray-500 mt-1">
              Provide details to help our AI match it with found items.
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Warning */}
      {showDuplicateWarning && duplicates.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <div className="text-sm font-bold text-amber-800 mb-2">
                Possible duplicate reports found
              </div>
              {duplicates.map((d) => (
                <div key={d.id} className="text-sm text-amber-700 mb-1">
                  • <strong>{d.title}</strong> ({d.similarityScore}% match —{" "}
                  {d.matchedOn.join(", ")})
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowDuplicateWarning(false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Continue Anyway
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/lost")}
                  className="px-3 py-1.5 text-xs font-semibold border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  View Existing Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 space-y-6">
            {/* AI Tip */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <AlertCircle
                className="text-blue-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Upload images first and use AI Auto-Fill
                to automatically detect category, colors, and brand. The more
                details you provide, the higher the chance our AI will find a
                match.
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className={labelClass}>
                Item Photos <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-2">
                  ({images.length}/5)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                {images.map((img, i) => (
                  <ImagePreview
                    key={i}
                    img={img}
                    index={i}
                    onRemove={(idx) => removeImage(idx, "main")}
                    onRetry={(idx) => retryUpload(idx, "main")}
                  />
                ))}
                {images.length < 5 && (
                  <label className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                    <Upload size={22} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) =>
                        e.target.files &&
                        handleImageUpload(e.target.files, "main")
                      }
                    />
                  </label>
                )}
              </div>
              {images.filter((i) => i.status === "done").length > 0 && (
                <button
                  type="button"
                  onClick={runAIAnalysis}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Brain size={14} />
                  )}
                  {isAnalyzing ? "Analyzing..." : "AI Auto-Fill"}
                </button>
              )}
              {aiSuggestion && (
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 text-xs">
                  <div className="font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <Sparkles size={12} /> AI Suggestions (
                    {Math.round(aiSuggestion.confidenceScore * 100)}%
                    confidence)
                  </div>
                  <div className="text-gray-600 space-y-0.5">
                    <div>
                      Category: <strong>{aiSuggestion.possibleCategory}</strong>
                    </div>
                    <div>
                      Colors:{" "}
                      <strong>{aiSuggestion.dominantColors.join(", ")}</strong>
                    </div>
                    {aiSuggestion.estimatedBrand && (
                      <div>
                        Brand: <strong>{aiSuggestion.estimatedBrand}</strong>
                      </div>
                    )}
                    {aiSuggestion.textDetected && (
                      <div>
                        Text: <strong>{aiSuggestion.textDetected}</strong>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 mt-1 italic">
                    Fields auto-filled. You can edit them below.
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className={labelClass}>
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title", { onBlur: checkForDuplicates })}
                type="text"
                placeholder="e.g. Blue Hydroflask with stickers"
                className={inputClass}
              />
              {errors.title && (
                <p className={errorClass}>{errors.title.message}</p>
              )}
            </div>

            {/* Category + Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("category")}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className={errorClass}>{errors.category.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Color <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("color")}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Select color</option>
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.color && (
                  <p className={errorClass}>{errors.color.message}</p>
                )}
              </div>
            </div>

            {/* Brand + Serial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Brand</label>
                <input
                  {...register("brand")}
                  type="text"
                  placeholder="e.g. Apple, Samsung, Nike"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Serial Number</label>
                <input
                  {...register("serialNumber")}
                  type="text"
                  placeholder="If applicable"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Describe any scratches, stickers, or unique markings..."
                className={`${inputClass} resize-none`}
              />
              {errors.description && (
                <p className={errorClass}>{errors.description.message}</p>
              )}
            </div>

            {/* Location + Date + Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  Location Lost <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("locationLost")}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Select location</option>
                  {BUILDING_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {errors.locationLost && (
                  <p className={errorClass}>{errors.locationLost.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Date Lost <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("dateLost")}
                  type="date"
                  className={inputClass}
                />
                {errors.dateLost && (
                  <p className={errorClass}>{errors.dateLost.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Time Lost</label>
                <input
                  {...register("timeLost")}
                  type="time"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Reward */}
            <div>
              <label className={labelClass}>Reward Offered</label>
              <input
                {...register("rewardOffered")}
                type="text"
                placeholder="e.g. ₹500 or Coffee treat"
                className={inputClass}
              />
            </div>

            {/* Purchase Bill */}
            <div>
              <label className={labelClass}>Purchase Bill (Optional)</label>
              {billImage ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
                  {billImage.status === "done" ? (
                    <img
                      src={billImage.url}
                      alt="Bill"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : billImage.status === "uploading" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2
                        size={20}
                        className="animate-spin text-blue-600"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <AlertCircle size={20} className="text-red-500" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setBillImage(null)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                  <ImageIcon size={22} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">
                    Upload purchase bill
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      e.target.files &&
                      handleImageUpload(e.target.files, "bill")
                    }
                  />
                </label>
              )}
            </div>

            {/* Additional Proof */}
            <div>
              <label className={labelClass}>
                Additional Proof (Optional){" "}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  ({proofImages.length}/3)
                </span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {proofImages.map((img, i) => (
                  <ImagePreview
                    key={i}
                    img={img}
                    index={i}
                    onRemove={(idx) => removeImage(idx, "proof")}
                    onRetry={(idx) => retryUpload(idx, "proof")}
                  />
                ))}
                {proofImages.length < 3 && (
                  <label className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                    <Upload size={18} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500">Proof</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) =>
                        e.target.files &&
                        handleImageUpload(e.target.files, "proof")
                      }
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Contact + Visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contact Preference</label>
                <select
                  {...register("contactPreference")}
                  className={`${inputClass} bg-white`}
                >
                  <option value="any">Any method</option>
                  <option value="email">Email only</option>
                  <option value="phone">Phone only</option>
                  <option value="in_app">In-app only</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Visibility</label>
                <select
                  {...register("visibility")}
                  className={`${inputClass} bg-white`}
                >
                  <option value="public">Public — Everyone</option>
                  <option value="campus_only">Campus Only</option>
                  <option value="private">Private — Admin Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              type="button"
              onClick={saveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
            >
              {isSavingDraft ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
