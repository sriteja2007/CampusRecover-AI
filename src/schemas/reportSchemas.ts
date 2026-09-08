import { z } from "zod"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing & Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "documents", label: "Documents & IDs" },
  { value: "keys", label: "Keys" },
  { value: "bags", label: "Bags & Backpacks" },
  { value: "water_bottles", label: "Water Bottles" },
  { value: "sports", label: "Sports Equipment" },
  { value: "stationery", label: "Stationery" },
  { value: "wallets", label: "Wallets & Cards" },
  { value: "other", label: "Other" },
] as const

export const COLOR_OPTIONS = [
  "Black",
  "White",
  "Silver",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Pink",
  "Purple",
  "Brown",
  "Gold",
  "Multi-color",
  "Other",
] as const

export const BUILDING_OPTIONS = [
  "Engineering Building",
  "Science Center",
  "Library",
  "Student Center",
  "Main Quad",
  "Sports Complex",
  "Cafeteria",
  "Dormitory",
  "Administration Building",
  "Parking Lot",
  "Auditorium",
  "Computer Lab",
  "Arts Building",
  "Medical Center",
  "Bus Stop",
  "Other",
] as const

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, "File must be less than 5MB")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only JPEG, PNG, and WebP formats are accepted",
  )

export const lostItemSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  category: z.enum(
    [
      "electronics",
      "clothing",
      "accessories",
      "documents",
      "keys",
      "bags",
      "water_bottles",
      "sports",
      "stationery",
      "wallets",
      "other",
    ],
    { message: "Please select a category" },
  ),
  brand: z.string().max(100).optional().default(""),
  color: z.string().min(1, "Please select a color"),
  locationLost: z.string().min(3, "Please specify the location"),
  dateLost: z.string().min(1, "Date is required"),
  timeLost: z.string().optional().default(""),
  rewardOffered: z.string().optional().default(""),
  serialNumber: z.string().optional().default(""),
  contactPreference: z.enum(["email", "phone", "in_app", "any"]).default("any"),
  visibility: z.enum(["public", "campus_only", "private"]).default("public"),
})

export const foundItemSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  category: z.enum(
    [
      "electronics",
      "clothing",
      "accessories",
      "documents",
      "keys",
      "bags",
      "water_bottles",
      "sports",
      "stationery",
      "wallets",
      "other",
    ],
    { message: "Please select a category" },
  ),
  brand: z.string().max(100).optional().default(""),
  color: z.string().min(1, "Please select a color"),
  locationFound: z.string().min(3, "Please specify the location"),
  dateFound: z.string().min(1, "Date is required"),
  timeFound: z.string().optional().default(""),
  condition: z.enum(["excellent", "good", "fair", "damaged"]).default("good"),
  storageLocation: z
    .enum(["campus_office", "security_office", "personally_holding"])
    .default("personally_holding"),
  storageDetails: z.string().optional().default(""),
  visibility: z.enum(["public", "campus_only", "private"]).default("public"),
})

export type LostItemFormData = z.infer<typeof lostItemSchema>
export type FoundItemFormData = z.infer<typeof foundItemSchema>
