export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || "",
}

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`
export const CLOUDINARY_DESTROY_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`

export const ALLOWED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"]
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const MAX_UPLOAD_FILES = 5
