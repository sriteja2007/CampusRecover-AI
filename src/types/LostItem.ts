import { Timestamp } from "firebase/firestore"

export type LostItemStatus = "pending" | "matched" | "claimed" | "resolved" | "rejected"

export type ItemCategory = "electronics" | "clothing" | "accessories" | "documents" | "keys" | "bags" | "water_bottles" | "sports" | "stationery" | "wallets" | "other"

export type ContactPreference = "email" | "phone" | "in_app" | "any"
export type ItemVisibility = "public" | "campus_only" | "private"

export interface LostItem {
  id: string
  title: string
  description: string
  category: ItemCategory
  brand: string
  color: string
  locationLost: string
  dateLost: string
  timeLost: string
  rewardOffered: string
  serialNumber: string
  purchaseBillUrl: string
  additionalProofUrls: string[]
  contactPreference: ContactPreference
  visibility: ItemVisibility
  imageUrls: string[]
  cloudinaryPublicIds: string[]
  userId: string
  userName: string
  userEmail: string
  userPhotoURL: string
  status: LostItemStatus
  isDraft: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
