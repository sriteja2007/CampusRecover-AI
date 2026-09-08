import { Timestamp } from "firebase/firestore"

export interface University {
  id: string
  name: string
  domain: string
  location: string
  contactEmail: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
