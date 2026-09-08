import { useState, useCallback, useEffect, memo } from "react"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Upload,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Brain,
  Package,
  X,
  Loader2,
  Save,
  AlertCircle,
  Sparkles,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  FoundItemService,
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
  checkDuplicateFoundItems,
  DuplicateMatch,
} from "../services/duplicate.service"
import {
  foundItemSchema,
  FoundItemFormData,
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
          <Loader2 size={20} className="animate-spin text-teal-600" />
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all"
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
            className="text-xs text-teal-600 font-semibold flex items-center gap-1 hover:underline"
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

const STEP_LABELS = [
  "Found Item Info",
  "Photo Upload",
  "Handover Details",
  "Submit",
]

export default function ReportFound() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { user, customUser } = useAuth()
  const [images, setImages] = useState<UploadedImage[]>([])
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
    trigger,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FoundItemFormData>({
    resolver: zodResolver(foundItemSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      brand: "",
      color: "",
      locationFound: "",
      dateFound: new Date().toISOString().split("T")[0],
      timeFound: "",
      condition: "good",
      storageLocation: "personally_holding",
      storageDetails: "",
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
    async (files: FileList | File[]) => {
      const remaining = 5 - images.length
      const filesToUpload = Array.from(files).slice(0, remaining)
      if (filesToUpload.length === 0) {
        showToast("error", "Maximum 5 images allowed.")
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
        setImages((prev) => [...prev, placeholder])

        try {
          const result: UploadResult = await CloudinaryService.uploadImage(
            file,
            (p) => {
              setImages((prev) =>
                prev.map((img) =>
                  img.file === file ? { ...img, progress: p } : img,
                ),
              )
            },
          )
          setImages((prev) =>
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
        } catch {
          setImages((prev) =>
            prev.map((img) =>
              img.file === file ? { ...img, status: "error" } : img,
            ),
          )
          showToast("error", `Failed to upload ${file.name}`)
        }
      }
    },
    [images.length, showToast],
  )

  const retryUpload = useCallback(
    async (index: number) => {
      const img = images[index]
      if (!img.retryFile) return
      setImages((prev) =>
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
            setImages((prev) =>
              prev.map((im, i) => (i === index ? { ...im, progress: p } : im)),
            )
          },
        )
        setImages((prev) =>
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
        setImages((prev) =>
          prev.map((im, i) =>
            i === index ? { ...im, status: "error" as const } : im,
          ),
        )
      }
    },
    [images],
  )

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
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
      if (result.estimatedBrand) setValue("brand", result.estimatedBrand)
      showToast(
        "success",
        `AI analysis complete (${Math.round(result.confidenceScore * 100)}% confidence)`,
      )
    } catch {
      showToast("error", "AI analysis failed.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [images, setValue, watch, showToast])

  const goNextStep = async () => {
    if (step === 1) {
      const valid = await trigger([
        "title",
        "description",
        "category",
        "color",
        "locationFound",
        "dateFound",
      ])
      if (!valid) return
      // Check duplicates
      const vals = getValues()
      const matches = await checkDuplicateFoundItems({
        title: vals.title,
        description: vals.description,
        brand: vals.brand,
        dateFound: vals.dateFound,
      })
      if (matches.length > 0) {
        setDuplicates(matches)
        setShowDuplicateWarning(true)
      }
    }
    setStep((s) => Math.min(4, s + 1))
  }

  const saveDraft = useCallback(async () => {
    if (!user) return
    setIsSavingDraft(true)
    try {
      await DraftService.saveDraft({
        userId: user.uid,
        type: "found",
        formData: getValues(),
        imageUrls: images.filter((i) => i.status === "done").map((i) => i.url),
        cloudinaryPublicIds: images
          .filter((i) => i.status === "done")
          .map((i) => i.publicId),
      })
      showToast("success", "Draft saved!")
    } catch {
      showToast("error", "Failed to save draft.")
    } finally {
      setIsSavingDraft(false)
    }
  }, [user, getValues, images, showToast])

  const onSubmit = async (data: FoundItemFormData) => {
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
      const docId = await FoundItemService.create({
        ...data,
        imageUrls: doneImages.map((i) => i.url),
        cloudinaryPublicIds: doneImages.map((i) => i.publicId),
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
        itemType: "found",
        itemId: docId,
        itemTitle: data.title,
        details: `Reported found item: ${data.title}`,
      })

      // Automatically trigger background AI lost-found pairing scan
      MatchingService.triggerBackgroundPairing(
        {
          id: docId,
          ...data,
          imageUrls: doneImages.map((i) => i.url),
          userId: user.uid,
        } as any,
        "found",
      ).catch(console.warn)

      showToast("success", "Found item reported! AI pairing scan started.")
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid #c3c6d7",
    fontSize: 14,
    color: "#131b2e",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
  }

  const watched = watch()

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 64px" }}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ${
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(20,184,166,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Package size={22} color="#14b8a6" />
        </div>
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#131b2e",
              letterSpacing: "-0.025em",
              margin: "0 0 2px",
            }}
          >
            Report a Found Item
          </h1>
          <p style={{ fontSize: 14, color: "#434655", margin: 0 }}>
            Help return this item to its owner. AI will instantly match it
            against lost item reports.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
        {STEP_LABELS.map((s, i) => (
          <div
            key={s}
            style={{ flex: 1, display: "flex", alignItems: "center" }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  background:
                    step > i + 1
                      ? "#14b8a6"
                      : step === i + 1
                        ? "#14b8a6"
                        : "#e2e7ff",
                  color: step >= i + 1 ? "white" : "#737686",
                }}
              >
                {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: step === i + 1 ? "#131b2e" : "#737686",
                  whiteSpace: "nowrap",
                }}
                className="hidden sm:inline"
              >
                {s}
              </span>
            </div>
            {i < 3 && (
              <div
                style={{
                  height: 2,
                  flex: 1,
                  background: step > i + 1 ? "#14b8a6" : "#e2e7ff",
                  margin: "0 8px",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Duplicate Warning */}
      {showDuplicateWarning && duplicates.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <div className="text-sm font-bold text-amber-800 mb-1">
                Possible duplicates found
              </div>
              {duplicates.map((d) => (
                <div key={d.id} className="text-xs text-amber-700 mb-0.5">
                  • <strong>{d.title}</strong> ({d.similarityScore}%)
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowDuplicateWarning(false)}
                className="mt-2 px-3 py-1 text-xs font-semibold bg-amber-600 text-white rounded-lg"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #e2e7ff",
            overflow: "hidden",
          }}
        >
          {step === 1 && (
            <div style={{ padding: 32 }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#131b2e",
                  margin: "0 0 24px",
                }}
              >
                What did you find?
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#131b2e",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Item Name *
                  </label>
                  <input
                    {...register("title")}
                    type="text"
                    placeholder="e.g., Black leather wallet"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#14b8a6"
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(20,184,166,0.1)"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#c3c6d7"
                      e.target.style.boxShadow = "none"
                    }}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#131b2e",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Description *
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Describe the item, any unique markings..."
                    style={{ ...inputStyle, resize: "vertical" as const }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#14b8a6"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#c3c6d7"
                    }}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#131b2e",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Category *
                    </label>
                    <select
                      {...register("category")}
                      style={{ ...inputStyle, background: "white" }}
                    >
                      <option value="">Select</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#131b2e",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Color *
                    </label>
                    <select
                      {...register("color")}
                      style={{ ...inputStyle, background: "white" }}
                    >
                      <option value="">Select</option>
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.color && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.color.message}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#131b2e",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Brand
                    </label>
                    <input
                      {...register("brand")}
                      type="text"
                      placeholder="e.g. Apple, Samsung"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#14b8a6"
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#c3c6d7"
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#131b2e",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Condition
                    </label>
                    <select
                      {...register("condition")}
                      style={{ ...inputStyle, background: "white" }}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#131b2e",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      <MapPin
                        size={12}
                        style={{ display: "inline", marginRight: 4 }}
                      />
                      Where you found it *
                    </label>
                    <select
                      {...register("locationFound")}
                      style={{ ...inputStyle, background: "white" }}
                    >
                      <option value="">Select</option>
                      {BUILDING_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    {errors.locationFound && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.locationFound.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#131b2e",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Date Found *
                    </label>
                    <input
                      {...register("dateFound")}
                      type="date"
                      style={inputStyle}
                    />
                    {errors.dateFound && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.dateFound.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#131b2e",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Time Found
                  </label>
                  <input
                    {...register("timeFound")}
                    type="time"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#14b8a6"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#c3c6d7"
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ padding: 32 }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#131b2e",
                  margin: "0 0 8px",
                }}
              >
                Upload Photos
              </h2>
              <p style={{ fontSize: 13, color: "#434655", margin: "0 0 24px" }}>
                Upload clear photos to help the AI match this item. (
                {images.length}/5)
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                {images.map((img, i) => (
                  <ImagePreview
                    key={i}
                    img={img}
                    index={i}
                    onRemove={removeImage}
                    onRetry={retryUpload}
                  />
                ))}
                {images.length < 5 && (
                  <label
                    style={{
                      border: "2px dashed #14b8a6",
                      borderRadius: 16,
                      aspectRatio: "1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: "rgba(20,184,166,0.02)",
                    }}
                  >
                    <Upload
                      size={28}
                      color="#14b8a6"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#131b2e",
                      }}
                    >
                      Upload
                    </div>
                    <div style={{ fontSize: 11, color: "#737686" }}>
                      JPEG, PNG, WebP
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) =>
                        e.target.files && handleImageUpload(e.target.files)
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
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 9,
                    background: "#14b8a6",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isAnalyzing ? "wait" : "pointer",
                    border: "none",
                  }}
                >
                  {isAnalyzing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Brain size={14} />
                  )}
                  {isAnalyzing ? "Analyzing..." : "Analyze with Vision AI"}
                </button>
              )}

              {aiSuggestion && (
                <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 text-xs">
                  <div className="font-bold text-teal-800 mb-1 flex items-center gap-1">
                    <Sparkles size={12} /> AI Suggestions (
                    {Math.round(aiSuggestion.confidenceScore * 100)}%)
                  </div>
                  <div className="text-gray-600 space-y-0.5">
                    <div>
                      Category: <strong>{aiSuggestion.possibleCategory}</strong>
                    </div>
                    <div>
                      Colors:{" "}
                      <strong>{aiSuggestion.dominantColors.join(", ")}</strong>
                    </div>
                  </div>
                  <p className="text-gray-400 mt-1 italic">
                    Fields auto-filled on Step 1.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ padding: 32 }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#131b2e",
                  margin: "0 0 24px",
                }}
              >
                Handover Details
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#131b2e",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Where is the item now?
                  </label>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {([
                      {
                        value: "campus_office",
                        label: "I'll turn it in to the campus office",
                      },
                      {
                        value: "security_office",
                        label: "I'll hand it to security",
                      },
                      {
                        value: "personally_holding",
                        label: "I have it with me — will handover in person",
                      },
                    ] as const).map((opt) => (
                      <label
                        key={opt.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: "1px solid #e2e7ff",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          {...register("storageLocation")}
                          value={opt.value}
                          style={{ accentColor: "#14b8a6" }}
                        />
                        <span style={{ fontSize: 13, color: "#131b2e" }}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#131b2e",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Additional Storage Details
                  </label>
                  <input
                    {...register("storageDetails")}
                    type="text"
                    placeholder="e.g., Left at front desk, Room 204"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#14b8a6"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#c3c6d7"
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: "rgba(20,184,166,0.06)",
                    border: "1px solid rgba(20,184,166,0.2)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#131b2e",
                      marginBottom: 6,
                    }}
                  >
                    Your anonymity is protected
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#434655", lineHeight: 1.6 }}
                  >
                    Your identity is shared with the item owner only after admin
                    approves the match and ownership is verified.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ padding: 32 }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#131b2e",
                  margin: "0 0 24px",
                }}
              >
                Review &amp; Submit
              </h2>
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: "rgba(20,184,166,0.06)",
                  border: "1px solid rgba(20,184,166,0.2)",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#131b2e",
                    marginBottom: 12,
                  }}
                >
                  {watched.title || "Untitled Item"}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 13,
                    color: "#434655",
                  }}
                >
                  <div>📍 Found at: {watched.locationFound || "—"}</div>
                  <div>
                    🕐 Date: {watched.dateFound || "—"}
                    {watched.timeFound ? ` at ${watched.timeFound}` : ""}
                  </div>
                  <div>
                    📦 Storage:{" "}
                    {watched.storageLocation === "campus_office"
                      ? "Campus Office"
                      : watched.storageLocation === "security_office"
                        ? "Security Office"
                        : "Personally Holding"}
                  </div>
                  <div>
                    🏷️ Category:{" "}
                    {CATEGORY_OPTIONS.find((c) => c.value === watched.category)
                      ?.label || "—"}{" "}
                    · {watched.color || "—"}
                  </div>
                  <div>
                    📸 Photos:{" "}
                    {images.filter((i) => i.status === "done").length} uploaded
                  </div>
                </div>
              </div>
              {images.filter((i) => i.status === "done").length > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {images
                    .filter((i) => i.status === "done")
                    .map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt={`Preview ${i + 1}`}
                        className="rounded-lg aspect-square object-cover border border-gray-200"
                        loading="lazy"
                      />
                    ))}
                </div>
              )}
              <div
                style={{ padding: 16, borderRadius: 12, background: "#eaedff" }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#2563eb",
                    marginBottom: 4,
                  }}
                >
                  Thank you for being a Good Samaritan!
                </div>
                <div style={{ fontSize: 13, color: "#434655" }}>
                  Your trust score increases by 0.5 points for each successful
                  item return.
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              padding: "16px 32px",
              borderTop: "1px solid #e2e7ff",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid #e2e7ff",
                  background: "white",
                  cursor: step === 1 ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: step === 1 ? "#c3c6d7" : "#434655",
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSavingDraft}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid #e2e7ff",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#434655",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isSavingDraft ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}{" "}
                Draft
              </button>
            </div>
            {step < 4 ? (
              <button
                type="button"
                onClick={goNextStep}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  borderRadius: 10,
                  background: "#14b8a6",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 28px",
                  borderRadius: 10,
                  background: "#14b8a6",
                  color: "white",
                  border: "none",
                  cursor: isSubmitting ? "wait" : "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {isSubmitting ? "Submitting..." : "Submit Found Report"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
