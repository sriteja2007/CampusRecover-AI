import { Timestamp } from "firebase/firestore"
import { ItemCategory, ItemVisibility } from "./LostItem"

export type FoundItemStatus = "pending" | "matched" | "claimed" | "resolved" | "rejected"
export type ItemCondition = "excellent" | "good" | "fair" | "damaged"
export type StorageLocation = "campus_office" | "security_office" | "personally_holding"

export interface FoundItem {
  id: string
  title: string
  description: string
  category: ItemCategory
  brand: string
  color: string
  locationFound: string
  dateFound: string
  timeFound: string
  condition: ItemCondition
  storageLocation: StorageLocation
  storageDetails: string
  imageUrls: string[]
  cloudinaryPublicIds: string[]
  userId: string
  userName: string
  userEmail: string
  userPhotoURL: string
  status: FoundItemStatus
  visibility: ItemVisibility
  isDraft: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
