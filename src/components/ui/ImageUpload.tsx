import { useState, useCallback } from "react"
import { UploadCloud, X, Image as ImageIcon } from "lucide-react"
import { uploadImageToCloudinary } from "../../services/cloudinary.service"

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void
  onUploadError?: (error: string) => void
  label?: string
}

export function ImageUpload({
  onUploadSuccess,
  onUploadError,
  label = "Upload Image",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [])

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      onUploadError?.("Please select a valid image file.")
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setIsUploading(true)
    setProgress(0)

    try {
      const url = await uploadImageToCloudinary(selectedFile, (p) =>
        setProgress(p),
      )
      setUploadedUrl(url)
      onUploadSuccess(url)
    } catch (error: any) {
      onUploadError?.(error.message || "Failed to upload image")
      setFile(null)
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const clearUpload = () => {
    setFile(null)
    setPreview(null)
    setProgress(0)
    setUploadedUrl(null)
  }

  if (preview) {
    return (
      <div className="w-full relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-cover"
        />

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-xs bg-white rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white text-sm font-medium">
              {progress}% Uploaded
            </p>
          </div>
        )}

        {!isUploading && (
          <button
            onClick={clearUpload}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}
      </label>
      <div
        className={`relative w-full rounded-xl border-2 border-dashed transition-colors p-8 flex flex-col items-center justify-center text-center cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*"
          onChange={handleChange}
        />
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-sm">
          <UploadCloud size={24} />
        </div>
        <h4 className="text-sm font-semibold text-gray-900 mb-1">
          Click to upload or drag and drop
        </h4>
        <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
      </div>
    </div>
  )
}
