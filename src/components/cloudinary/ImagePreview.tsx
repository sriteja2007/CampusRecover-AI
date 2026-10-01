import React from "react"
import { X } from "lucide-react"
import { UploadProgress } from "./UploadProgress"

interface ImagePreviewProps {
  url: string
  onRemove?: () => void
  progress?: number
  isUploading?: boolean
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  onRemove,
  progress = 0,
  isUploading = false,
}) => {
  return (
    <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <img
        src={url}
        alt="Preview"
        className={`w-full h-full object-cover transition-opacity ${
          isUploading ? "opacity-50" : "opacity-100"
        }`}
      />

      {!isUploading && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          type="button"
          aria-label="Remove image"
        >
          <X size={16} />
        </button>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/30">
          <span className="text-white text-xs font-medium mb-2">
            {progress}%
          </span>
          <UploadProgress progress={progress} />
        </div>
      )}
    </div>
  )
}
