export type MatchStatus = "pending" | "confirmed" | "contact_shared" | "rejected" | "handover_pending" | "recovered"

export type ConfidenceLevel = "high" | "possible" | "low"

export interface Match {
  id: string
  lostItemId: string
  foundItemId: string
  lostReference: string
  foundReference: string
  lostItemName: string
  foundItemName: string
  lostItemImage?: string
  foundItemImage?: string
  lostUserId: string
  foundUserId: string
  lostUserName: string
  foundUserName: string
  lostUserEmail: string
  foundUserEmail: string
  lostUserMobile?: string
  foundUserMobile?: string
  aiScore: number // 0 to 100
  aiReason: string
  confidenceLevel: ConfidenceLevel // high: 80-100%, possible: 60-79%, low: <60%
  lostLocation?: string
  foundLocation?: string
  locationSimilarity?: "High" | "Moderate" | "Different Area"
  source: "AI" | "MANUAL"
  status: MatchStatus
  contactShared: boolean
  createdAt?: any
  updatedAt?: any
}
