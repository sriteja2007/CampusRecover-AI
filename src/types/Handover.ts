export type HandoverStatus = "pending" | "verified" | "completed" | "cancelled"

export interface Handover {
  id: string
  matchId: string
  lostItemId: string
  foundItemId: string
  lostReference?: string
  foundReference?: string
  itemName?: string
  claimantId?: string
  finderId?: string
  otp: string
  otpExpiresAt: any
  otpVerified: boolean
  qrToken: string
  qrVerified: boolean
  status: HandoverStatus
  verifiedAt?: any
  completedAt?: any
  createdAt?: any
}
