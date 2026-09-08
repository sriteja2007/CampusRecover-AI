import { z } from "zod"

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1, "Firebase API Key is required"),
  VITE_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, "Firebase Auth Domain is required"),
  VITE_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "Firebase Project ID is required"),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().min(1, "Firebase App ID is required"),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  VITE_CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "Cloudinary Cloud Name is required"),
  VITE_CLOUDINARY_UPLOAD_PRESET: z.string().optional().default("campus_preset"),
  VITE_GEMINI_API_KEY: z.string().optional(),
  VITE_APP_URL: z.string().optional().default("https://campusrecover.ai"),
  VITE_ENV: z
    .enum(["development", "staging", "production"])
    .optional()
    .default("production"),
})

export type Env = z.infer<typeof envSchema>

function getSanitizedEnv(): Record<string, string | undefined> {
  const metaEnv = import.meta.env
  const sanitized: Record<string, string | undefined> = {}

  for (const [key, val] of Object.entries(metaEnv)) {
    if (typeof val === "string") {
      // Trim surrounding quotes, trailing commas, and whitespace
      sanitized[key] = val.replace(/^["']|["',]+$/g, "").trim()
    } else {
      sanitized[key] = (val as any)
    }
  }
  return sanitized
}

function parseEnv(): Env {
  const raw = getSanitizedEnv()
  const parsed = envSchema.safeParse(raw)

  if (!parsed.success) {
    console.warn(
      "⚠️ Environment variables validation warning:",
      parsed.error.format(),
    )
    // Provide a resilient fallback for critical runtime variables in development
    return {
      VITE_FIREBASE_API_KEY:
        raw.VITE_FIREBASE_API_KEY || "AIzaSyDijw5jbvv82Y9shfuCgauY0726l3kWFQw",
      VITE_FIREBASE_AUTH_DOMAIN:
        raw.VITE_FIREBASE_AUTH_DOMAIN || "campusrecoverai.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID:
        raw.VITE_FIREBASE_PROJECT_ID || "campusrecoverai",
      VITE_FIREBASE_STORAGE_BUCKET:
        raw.VITE_FIREBASE_STORAGE_BUCKET ||
        "campusrecoverai.firebasestorage.app",
      VITE_FIREBASE_MESSAGING_SENDER_ID:
        raw.VITE_FIREBASE_MESSAGING_SENDER_ID || "165223978528",
      VITE_FIREBASE_APP_ID:
        raw.VITE_FIREBASE_APP_ID || "1:165223978528:web:e1fcc24b7fe801a7f7ce45",
      VITE_FIREBASE_MEASUREMENT_ID:
        raw.VITE_FIREBASE_MEASUREMENT_ID || "G-7Y4HT8C52D",
      VITE_CLOUDINARY_CLOUD_NAME: raw.VITE_CLOUDINARY_CLOUD_NAME || "hrygafdy",
      VITE_CLOUDINARY_UPLOAD_PRESET:
        raw.VITE_CLOUDINARY_UPLOAD_PRESET || "campus_preset",
      VITE_GEMINI_API_KEY: raw.VITE_GEMINI_API_KEY || "",
      VITE_APP_URL: raw.VITE_APP_URL || "https://campusrecover.ai",
      VITE_ENV: raw.VITE_ENV as any || "development",
    }
  }

  return parsed.data
}

export const ENV = parseEnv()
