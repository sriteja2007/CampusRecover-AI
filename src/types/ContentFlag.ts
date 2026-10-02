export type FlagReason =
  | "incorrect_location"
  | "already_recovered"
  | "offensive_content"
  | "duplicate_report"
  | "spam_or_fake"
  | "other"

export type FlagStatus = "pending" | "investigating" | "resolved" | "dismissed"

export interface ContentFlag {
  id: string
  itemId: string
  itemTitle?: string
  itemReference?: string
  reporterId?: string
  reporterEmail?: string
  reporterName?: string
  reason: FlagReason
  notes: string
  status: FlagStatus
  adminNotes?: string
  resolvedBy?: string
  resolvedAt?: any
  createdAt: any
  updatedAt: any
}
