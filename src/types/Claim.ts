import { Timestamp } from "firebase/firestore"

export type ClaimStatus = "pending" | "admin_approved" | "in_handover" | "completed" | "resolved" | "rejected"

export type VerificationMethod = "otp" | "qr" | "purchase_bill" | "serial_number" | "student_id" | "government_id" | "face_verification"

export interface Claim {
  id: string
  matchId?: string
  lostItemId: string
  foundItemId: string
  lostItemTitle?: string
  foundItemTitle?: string
  lostItemImage?: string
  foundItemImage?: string
  claimerId?: string
  claimantId?: string
  claimerName?: string
  claimerEmail?: string
  claimerStudentId?: string
  finderId: string
  finderName?: string
  finderEmail?: string
  status: ClaimStatus
  proofDescription?: string
  meetingLocation?: string
  scheduledTime?: string
  otpCode?: string
  otpExpiresAt?: Timestamp | any
  qrToken?: string
  qrExpiresAt?: Timestamp | any
  verifiedMethods: VerificationMethod[]
  verificationNotes?: string
  handoverOfficerId?: string
  handoverOfficerName?: string
  receiptPdfUrl?: string
  adminApprovedBy?: string
  adminNotes?: string
  completedAt?: Timestamp | any
  createdAt: Timestamp | any
  updatedAt: Timestamp | any
}

export interface HandoverLog {
  id: string
  claimId: string
  lostItemId: string
  foundItemId: string
  itemTitle: string
  claimerId: string
  claimerName: string
  finderId: string
  finderName: string
  officerId?: string
  officerName?: string
  verificationMethodsUsed: VerificationMethod[]
  notes?: string
  trustScoreDelta: number
  location?: string
  timestamp: Timestamp | any
}

export interface VerificationLog {
  id: string
  claimId: string
  method: VerificationMethod
  status: "success" | "failed" | "pending"
  verifiedBy: string
  details: string
  timestamp: Timestamp | any
}
