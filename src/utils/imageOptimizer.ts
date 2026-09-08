/**
 * Enterprise image optimization utilities for Cloudinary and web images
 */

export interface OptimizedImageProps {
  src: string
  width?: number
  quality?: "auto" | "good" | "best" | "low"
  format?: "auto" | "webp" | "avif"
}

export function getOptimizedImageUrl(
  src: string,
  width = 800,
  quality: "auto" | "good" | "best" | "low" = "auto",
): string {
  if (!src) return ""

  // If it's a Cloudinary URL, inject optimal transformation parameters
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const parts = src.split("/upload/")
    if (parts.length === 2) {
      const transform = `f_auto,q_${quality},w_${width},c_limit`
      return `${parts[0]}/upload/${transform}/${parts[1]}`
    }
  }

  return src
}

export function generateImageSrcSet(
  src: string,
  widths = [320, 640, 960, 1280],
): string {
  if (!src || !src.includes("res.cloudinary.com")) return ""

  return widths.map((w) => `${getOptimizedImageUrl(src, w)} ${w}w`).join(", ")
}

/**
 * Generate lightweight SVG placeholder for smooth image loading
 */
export function getBlurPlaceholderSvg(width = 400, height = 300): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><filter id="b" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="20"/></filter><rect width="100%" height="100%" fill="#f1f5f9" filter="url(#b)"/></svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export interface CompressedImageResult {
  file: File
  dataUrl: string
}

/**
 * Client-side file compression and MIME validator before Cloudinary ingestion
 */
export async function validateAndCompressImage(
  file: File,
  maxSizeMB = 5,
  maxWidth = 1920,
): Promise<CompressedImageResult> {
  // Validate MIME type
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error("Invalid image format. Supported formats: JPG, PNG, WEBP.")
  }

  // Validate file size limit
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(
      `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`,
    )
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read image file"))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error("Failed to parse image element"))
      img.onload = () => {
        // If image is already smaller than maxWidth, return original
        if (img.width <= maxWidth) {
          resolve({ file, dataUrl: e.target?.result as string })
          return
        }

        // Downscale maintaining aspect ratio
        const canvas = document.createElement("canvas")
        const scale = maxWidth / img.width
        canvas.width = maxWidth
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve({ file, dataUrl: e.target?.result as string })
          return
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, dataUrl: e.target?.result as string })
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve({
              file: compressedFile,
              dataUrl: canvas.toDataURL("image/jpeg", 0.85),
            })
          },
          "image/jpeg",
          0.85,
        )
      }
      img.src = (e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}
