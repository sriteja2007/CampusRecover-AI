import { Timestamp } from "firebase/firestore"

export interface Admin {
  id: string
  userId: string
  accessLevel: "superadmin" | "moderator"
  managedUniversities: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
