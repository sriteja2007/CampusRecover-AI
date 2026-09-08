import { Timestamp } from "firebase/firestore"

export interface SystemSettings {
  id: string
  universityId: string | null
  allowPublicRegistration: boolean
  requireEduEmail: boolean
  matchConfidenceThreshold: number
  autoArchiveDays: number
  maintenanceMode: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
