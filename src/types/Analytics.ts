import { Timestamp } from "firebase/firestore"

export interface DailyAnalytics {
  id: string
  date: Timestamp
  universityId: string
  itemsLost: number
  itemsFound: number
  matchesMade: number
  successfulRecoveries: number
  activeUsers: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
