export type NotificationType = "match" | "contact" | "handover" | "message" | "system" | "status_update"

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  body?: string // alias for message
  type: NotificationType
  relatedItemId?: string
  relatedMatchId?: string
  read: boolean
  actionUrl?: string | null
  createdAt: any
  updatedAt?: any
}
