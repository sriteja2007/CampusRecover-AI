/**
 * Canonical Database Models for CampusRecoverAI
 * Comprehensive schema matching exact specifications:
 * USER, CATEGORY, ITEM, ITEM IMAGE, CLAIM, MATCH, NOTIFICATION, REPORT, AUDIT LOG, RECOVERY
 */

// ==========================================
// 1. USER
// ==========================================
export type UserRole = "STUDENT" | "STAFF" | "ADMIN"
export type UserStatus = "ACTIVE" | "SUSPENDED"

export interface User {
  id: string
  name: string
  email: string
  passwordHash?: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  avatarUrl?: string
  trustScore?: number
  college?: string
  department?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

// ==========================================
// 2. CATEGORY
// ==========================================
export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Standard initial campus categories
export const STANDARD_CATEGORIES: Array<Omit<Category, "createdAt" | "updatedAt">> = [
  { id: "cat_electronics", name: "Electronics", description: "Laptops, phones, chargers, headphones, calculators", icon: "Laptop", isActive: true },
  { id: "cat_bags", name: "Bags", description: "Backpacks, totes, laptop sleeves, gym bags", icon: "Briefcase", isActive: true },
  { id: "cat_books", name: "Books", description: "Textbooks, notebooks, library books, study material", icon: "BookOpen", isActive: true },
  { id: "cat_clothing", name: "Clothing", description: "Jackets, hoodies, caps, scarves, lab coats", icon: "Shirt", isActive: true },
  { id: "cat_id_cards", name: "ID Cards", description: "Student IDs, access badges, government cards, driver licenses", icon: "CreditCard", isActive: true },
  { id: "cat_keys", name: "Keys", description: "Dorm keys, bike keys, car keys, lock keys", icon: "Key", isActive: true },
  { id: "cat_accessories", name: "Accessories", description: "Watches, jewelry, glasses, water bottles, umbrellas", icon: "Glasses", isActive: true },
  { id: "cat_documents", name: "Documents", description: "Certificates, project files, receipts, tickets", icon: "FileText", isActive: true },
  { id: "cat_other", name: "Other", description: "Miscellaneous campus belongings", icon: "HelpCircle", isActive: true },
]

// ==========================================
// 3. ITEM
// ==========================================
export type ItemType = "LOST" | "FOUND"

export type ItemStatus =
  | "DRAFT"
  | "ACTIVE"
  | "CLAIM_PENDING"
  | "CLAIMED"
  | "RECOVERY_PENDING"
  | "RETURNED"
  | "CLOSED"
  | "HIDDEN"

export interface Item {
  id: string
  reporterId: string
  type: ItemType
  status: ItemStatus
  title: string
  description: string
  categoryId: string
  brand?: string
  color?: string
  location: string
  eventDate: string
  // Enhanced & geolocation fields
  referenceNumber?: string
  latitude?: number
  longitude?: number
  locationName?: string
  campusLocationId?: string
  reporterName?: string
  reporterEmail?: string
  reporterPhone?: string
  images?: ItemImage[]
  createdAt: string
  updatedAt: string
}

// ==========================================
// 4. ITEM IMAGE
// ==========================================
export interface ItemImage {
  id: string
  itemId: string
  storageKey: string
  url: string
  altText?: string
  createdAt: string
}

// ==========================================
// 5. CLAIM
// ==========================================
export type ClaimStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "MORE_INFO_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"

export interface Claim {
  id: string
  itemId: string
  claimantId: string
  status: ClaimStatus
  reason: string
  identifyingDetails: string
  privateVerification: string // STRICTLY CONFIDENTIAL - Never rendered publicly
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  // Handshake and contact linkage
  claimantName?: string
  claimantEmail?: string
  claimantPhone?: string
  itemTitle?: string
  itemReference?: string
  createdAt: string
  updatedAt: string
}

// ==========================================
// 6. MATCH
// ==========================================
export type MatchStatus = "SUGGESTED" | "DISMISSED" | "CONFIRMED"

export interface Match {
  id: string
  lostItemId: string
  foundItemId: string
  score: number // 0 to 100
  reasons: string[]
  status: MatchStatus
  createdAt: string
}

// ==========================================
// 7. NOTIFICATION
// ==========================================
export type NotificationType =
  | "MATCH_FOUND"
  | "CLAIM_SUBMITTED"
  | "CLAIM_REVIEWED"
  | "HANDOVER_SCHEDULED"
  | "RECOVERY_COMPLETED"
  | "SECURITY_ALERT"
  | "SYSTEM"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  entityType?: "item" | "claim" | "match" | "recovery" | "report"
  entityId?: string
  isRead: boolean
  createdAt: string
}

// ==========================================
// 8. REPORT (Content & Accuracy Flags)
// ==========================================
export type ReportStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED"

export interface Report {
  id: string
  reporterId: string
  itemId: string
  reason: string
  description: string
  status: ReportStatus
  resolvedBy?: string
  resolvedAt?: string
  adminNotes?: string
  createdAt: string
}

// ==========================================
// 9. AUDIT LOG (Append-Only Immutable Ledger)
// ==========================================
export interface AuditLog {
  id: string
  actorId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, any>
  createdAt: string
}

// ==========================================
// 10. RECOVERY
// ==========================================
export type RecoveryStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED"

export interface Recovery {
  id: string
  itemId: string
  claimId: string
  approvedBy: string
  handoverMethod: "CAMPUS_SECURITY_OFFICE" | "DIRECT_SAFE_SPOT" | "DEPARTMENT_DESK"
  handoverLocation: string
  scheduledAt?: string
  completedAt?: string
  status: RecoveryStatus
  otpCode?: string
  qrToken?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
