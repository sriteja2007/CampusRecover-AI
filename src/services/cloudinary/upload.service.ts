import {
  cloudinaryConfig,
  CLOUDINARY_UPLOAD_URL,
  CLOUDINARY_DESTROY_URL,
} from "../../config/cloudinary"

export interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  width: number
  height: number
  bytes: number
  format: string
  delete_token?: string
}

export const compressImage = async (
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Only compress images
    if (!file.type.startsWith("image/")) {
      return resolve(file)
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = (event.target?.result as string)
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          return reject(new Error("Failed to get canvas context"))
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Canvas to Blob failed"))
            }
            // Retain original name, output as WebP for optimal compression
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
            const compressedFile = new File([blob], newName, {
              type: "image/webp",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          "image/webp",
          quality,
        )
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

export const uploadImage = (
  file: File,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadResponse> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    formData.append("file", file)
    formData.append("upload_preset", cloudinaryConfig.uploadPreset)

    xhr.open("POST", CLOUDINARY_UPLOAD_URL, true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            format: response.format,
            delete_token: response.delete_token,
          })
        } catch (err) {
          reject(new Error("Failed to parse Cloudinary response"))
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(
            new Error(
              errorResponse.error?.message ||
                `Upload failed with status ${xhr.status}`,
            ),
          )
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    }

    xhr.onerror = () =>
      reject(new Error("Network Error occurred during upload"))
    xhr.onabort = () => reject(new Error("Upload Cancelled"))

    xhr.send(formData)
  })
}

export const uploadMultipleImages = async (
  files: File[],
  onProgress?: (progressData: Record<string, number>) => void,
): Promise<CloudinaryUploadResponse[]> => {
  const progresses: Record<string, number> = {}

  const uploadPromises = files.map((file, index) => {
    const fileId = `${file.name}-${index}`
    progresses[fileId] = 0

    return uploadImage(file, (prog) => {
      progresses[fileId] = prog
      if (onProgress) {
        onProgress({ ...progresses })
      }
    })
  })

  return Promise.all(uploadPromises)
}

export const deleteImage = async (
  publicId: string,
  deleteToken?: string,
): Promise<boolean> => {
  // If we have a delete token from the upload response, we can use the delete_by_token endpoint
  if (deleteToken) {
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/delete_by_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: deleteToken }),
        },
      )
      if (response.ok) return true
    } catch (err) {
      console.error("Failed to delete by token", err)
    }
  }

  // Fallback to destroy endpoint (Usually requires signature generated on backend)
  try {
    const formData = new FormData()
    formData.append("public_id", publicId)
    if (cloudinaryConfig.apiKey) {
      formData.append("api_key", cloudinaryConfig.apiKey)
    }

    const response = await fetch(CLOUDINARY_DESTROY_URL, {
      method: "POST",
      body: formData,
    })
    return response.ok
  } catch (err) {
    console.error("Failed to destroy image", err)
    return false
  }
}

export type UploadResult = CloudinaryUploadResponse

export const CloudinaryService = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  compressImage,
}
