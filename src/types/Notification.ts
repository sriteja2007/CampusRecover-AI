import { Timestamp } from "firebase/firestore"

export type NotificationType = "match" | "message" | "system" | "status_update"

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  type: NotificationType
  read: boolean
  actionUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
