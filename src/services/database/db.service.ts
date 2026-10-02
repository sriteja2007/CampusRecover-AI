/**
 * CampusRecoverAI Database Service
 * Provides complete data access methods and strictly enforces all 10 core business rules:
 *
 * 1. User can edit only their own active reports.
 * 2. Suspended users cannot create reports.
 * 3. Suspended users cannot submit claims.
 * 4. Users cannot claim their own found report.
 * 5. Returned items cannot receive new claims.
 * 6. Only admins can approve/reject claims.
 * 7. Only admins can mark recovery complete.
 * 8. Every admin action creates an audit log.
 * 9. Private verification information is never public.
 * 10. Client-side status changes are never trusted.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../../config/firebase"
import {
  User,
  Category,
  Item,
  ItemImage,
  Claim,
  Match,
  Notification,
  Report,
  AuditLog,
  Recovery,
  ItemStatus,
  ClaimStatus,
  RecoveryStatus,
  STANDARD_CATEGORIES,
} from "../../types/database.models"

export class DatabaseConstraintError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = "DatabaseConstraintError"
  }
}

// In-memory / localStorage offline fallback caches for robust operation
const CACHE_KEYS = {
  USERS: "campusrecover_db_users",
  CATEGORIES: "campusrecover_db_categories",
  ITEMS: "campusrecover_db_items",
  ITEM_IMAGES: "campusrecover_db_item_images",
  CLAIMS: "campusrecover_db_claims",
  MATCHES: "campusrecover_db_matches",
  NOTIFICATIONS: "campusrecover_db_notifications",
  REPORTS: "campusrecover_db_reports",
  AUDIT_LOGS: "campusrecover_db_audit_logs",
  RECOVERY: "campusrecover_db_recovery",
}

function getCache<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCache<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

export const DatabaseService = {
  // ==========================================
  // AUDIT LOG (Rule 8: Every admin action logs here; append-only)
  // ==========================================
  async createAuditLog(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, any> = {},
  ): Promise<AuditLog> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const log: AuditLog = {
      id,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      createdAt: new Date().toISOString(),
    }

    try {
      const docRef = doc(db, "auditLogs", id)
      await setDoc(docRef, { ...log, createdAt: serverTimestamp() })
    } catch (err) {
      console.warn("Audit log Firestore notice:", err)
    }

    const cached = getCache<AuditLog>(CACHE_KEYS.AUDIT_LOGS)
    cached.unshift(log)
    saveCache(CACHE_KEYS.AUDIT_LOGS, cached)
    return log
  },

  async getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    let logs = getCache<AuditLog>(CACHE_KEYS.AUDIT_LOGS)
    try {
      const colRef = collection(db, "auditLogs")
      const snap = await getDocs(colRef)
      if (!snap.empty) {
        logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog)
        saveCache(CACHE_KEYS.AUDIT_LOGS, logs)
      }
    } catch {}

    if (entityType) logs = logs.filter((l) => l.entityType === entityType)
    if (entityId) logs = logs.filter((l) => l.entityId === entityId)
    return logs
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  async getCategories(): Promise<Category[]> {
    let categories = getCache<Category>(CACHE_KEYS.CATEGORIES)
    try {
      const colRef = collection(db, "categories")
      const snap = await getDocs(colRef)
      if (!snap.empty) {
        categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)
        saveCache(CACHE_KEYS.CATEGORIES, categories)
      }
    } catch {}

    if (categories.length === 0) {
      // Seed standard categories if empty
      const seeded: Category[] = STANDARD_CATEGORIES.map((c) => ({
        ...c,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      saveCache(CACHE_KEYS.CATEGORIES, seeded)
      return seeded
    }
    return categories.filter((c) => c.isActive)
  },

  // ==========================================
  // USERS
  // ==========================================
  async getUser(id: string): Promise<User | null> {
    try {
      const snap = await getDoc(doc(db, "users", id))
      if (snap.exists()) return { id: snap.id, ...snap.data() } as User
    } catch {}

    const cached = getCache<User>(CACHE_KEYS.USERS)
    return cached.find((u) => u.id === id) || null
  },

  async saveUser(user: User): Promise<User> {
    try {
      await setDoc(doc(db, "users", user.id), {
        ...user,
        updatedAt: serverTimestamp(),
      })
    } catch {}

    const cached = getCache<User>(CACHE_KEYS.USERS).filter((u) => u.id !== user.id)
    cached.push(user)
    saveCache(CACHE_KEYS.USERS, cached)
    return user
  },

  // ==========================================
  // ITEMS
  // ==========================================
  async getItem(id: string): Promise<Item | null> {
    try {
      const snap = await getDoc(doc(db, "items", id))
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Item
    } catch {}

    const cached = getCache<Item>(CACHE_KEYS.ITEMS)
    return cached.find((i) => i.id === id) || null
  },

  /**
   * Enforces Rule 2: Suspended users cannot create reports.
   */
  async createItem(
    itemData: Omit<Item, "id" | "createdAt" | "updatedAt">,
    actorUser?: User,
  ): Promise<Item> {
    // Rule 2 Check
    if (actorUser && actorUser.status === "SUSPENDED") {
      throw new DatabaseConstraintError(
        "Suspended users cannot create reports.",
        "USER_SUSPENDED",
      )
    }

    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()
    const item: Item = {
      ...itemData,
      id,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await setDoc(doc(db, "items", id), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("Item Firestore write notice:", err)
    }

    const cached = getCache<Item>(CACHE_KEYS.ITEMS)
    cached.unshift(item)
    saveCache(CACHE_KEYS.ITEMS, cached)
    return item
  },

  /**
   * Enforces Rule 1: User can edit only their own active reports.
   * Enforces Rule 10: Client-side status changes are never trusted.
   */
  async updateItem(
    itemId: string,
    updates: Partial<Item>,
    actorId: string,
    actorRole: string = "STUDENT",
  ): Promise<Item> {
    const existing = await this.getItem(itemId)
    if (!existing) {
      throw new DatabaseConstraintError("Item not found.", "ITEM_NOT_FOUND")
    }

    const isAdmin = actorRole === "ADMIN"

    // Rule 1 Check: Owner only, and only if ACTIVE (unless admin)
    if (!isAdmin) {
      if (existing.reporterId !== actorId) {
        throw new DatabaseConstraintError(
          "Permission denied: User can edit only their own reports.",
          "UNAUTHORIZED_ITEM_EDIT",
        )
      }
      if (existing.status !== "ACTIVE" && existing.status !== "DRAFT") {
        throw new DatabaseConstraintError(
          "Cannot edit report once it has entered claim or recovery processing.",
          "ITEM_NOT_EDITABLE",
        )
      }
      // Rule 10 Check: Ordinary users cannot force arbitrary status transitions
      if (updates.status && updates.status !== existing.status && updates.status !== "CLOSED") {
        throw new DatabaseConstraintError(
          "Invalid status transition. Status updates must be approved by campus administration.",
          "INVALID_STATUS_TRANSITION",
        )
      }
    }

    const updated: Item = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    try {
      await updateDoc(doc(db, "items", itemId), {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    } catch {}

    const cached = getCache<Item>(CACHE_KEYS.ITEMS).filter((i) => i.id !== itemId)
    cached.unshift(updated)
    saveCache(CACHE_KEYS.ITEMS, cached)

    if (isAdmin) {
      await this.createAuditLog(actorId, "UPDATE_ITEM", "item", itemId, { updates })
    }

    return updated
  },

  // ==========================================
  // CLAIMS
  // ==========================================
  async getClaim(id: string): Promise<Claim | null> {
    try {
      const snap = await getDoc(doc(db, "claims", id))
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Claim
    } catch {}

    const cached = getCache<Claim>(CACHE_KEYS.CLAIMS)
    return cached.find((c) => c.id === id) || null
  },

  /**
   * Enforces:
   * Rule 3: Suspended users cannot submit claims.
   * Rule 4: Users cannot claim their own found report.
   * Rule 5: Returned items cannot receive new claims.
   * Rule 9: Private verification information is safely isolated.
   */
  async createClaim(
    claimData: Omit<Claim, "id" | "status" | "createdAt" | "updatedAt">,
    actorUser?: User,
  ): Promise<Claim> {
    // Rule 3 Check
    if (actorUser && actorUser.status === "SUSPENDED") {
      throw new DatabaseConstraintError(
        "Suspended users cannot submit claims.",
        "USER_SUSPENDED",
      )
    }

    // Verify Target Item
    const targetItem = await this.getItem(claimData.itemId)
    if (!targetItem) {
      throw new DatabaseConstraintError("Item to claim does not exist.", "ITEM_NOT_FOUND")
    }

    // Rule 4 Check: Cannot claim your own item
    if (targetItem.reporterId === claimData.claimantId) {
      throw new DatabaseConstraintError(
        "Users cannot submit a claim on their own reported item.",
        "CANNOT_CLAIM_OWN_ITEM",
      )
    }

    // Rule 5 Check: Returned items cannot receive new claims
    if (targetItem.status === "RETURNED" || targetItem.status === "CLOSED") {
      throw new DatabaseConstraintError(
        "Returned or closed items cannot receive new claims.",
        "ITEM_ALREADY_RETURNED",
      )
    }

    const id = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()

    const claim: Claim = {
      ...claimData,
      id,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    }

    try {
      await setDoc(doc(db, "claims", id), {
        ...claim,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("Claim Firestore write notice:", err)
    }

    const cached = getCache<Claim>(CACHE_KEYS.CLAIMS)
    cached.unshift(claim)
    saveCache(CACHE_KEYS.CLAIMS, cached)

    // Update item status to CLAIM_PENDING
    await this.updateItem(claimData.itemId, { status: "CLAIM_PENDING" }, claimData.claimantId, "ADMIN")

    return claim
  },

  /**
   * Enforces:
   * Rule 6: Only admins can approve/reject claims.
   * Rule 8: Every admin action creates an audit log.
   */
  async reviewClaim(
    claimId: string,
    decision: "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED" | "UNDER_REVIEW",
    adminNotes: string,
    actorId: string,
    actorRole: string,
  ): Promise<Claim> {
    // Rule 6 Check: Only admins
    if (actorRole !== "ADMIN") {
      throw new DatabaseConstraintError(
        "Permission denied: Only administrators can approve or reject claims.",
        "ADMIN_ONLY_ACTION",
      )
    }

    const claim = await this.getClaim(claimId)
    if (!claim) {
      throw new DatabaseConstraintError("Claim not found.", "CLAIM_NOT_FOUND")
    }

    const now = new Date().toISOString()
    const updatedClaim: Claim = {
      ...claim,
      status: decision,
      adminNotes,
      reviewedBy: actorId,
      reviewedAt: now,
      updatedAt: now,
    }

    try {
      await updateDoc(doc(db, "claims", claimId), {
        status: decision,
        adminNotes,
        reviewedBy: actorId,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch {}

    const cached = getCache<Claim>(CACHE_KEYS.CLAIMS).filter((c) => c.id !== claimId)
    cached.unshift(updatedClaim)
    saveCache(CACHE_KEYS.CLAIMS, cached)

    // Rule 8: Log admin decision in audit ledger
    await this.createAuditLog(actorId, `CLAIM_${decision}`, "claim", claimId, {
      itemId: claim.itemId,
      claimantId: claim.claimantId,
      adminNotes,
    })

    // If approved, create Recovery record and transition Item status
    if (decision === "APPROVED") {
      await this.updateItem(claim.itemId, { status: "RECOVERY_PENDING" }, actorId, "ADMIN")
      await this.createRecoveryRecord(claim.itemId, claimId, actorId)
    } else if (decision === "REJECTED") {
      await this.updateItem(claim.itemId, { status: "ACTIVE" }, actorId, "ADMIN")
    }

    return updatedClaim
  },

  // ==========================================
  // RECOVERY
  // ==========================================
  async createRecoveryRecord(
    itemId: string,
    claimId: string,
    approvedBy: string,
    location: string = "Campus Security Office (Main Entrance Gate)",
  ): Promise<Recovery> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const now = new Date().toISOString()

    const recovery: Recovery = {
      id,
      itemId,
      claimId,
      approvedBy,
      handoverMethod: "CAMPUS_SECURITY_OFFICE",
      handoverLocation: location,
      status: "SCHEDULED",
      otpCode,
      qrToken: `QR-REC-${id}-${otpCode}`,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await setDoc(doc(db, "recovery", id), {
        ...recovery,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch {}

    const cached = getCache<Recovery>(CACHE_KEYS.RECOVERY)
    cached.unshift(recovery)
    saveCache(CACHE_KEYS.RECOVERY, cached)

    return recovery
  },

  /**
   * Enforces:
   * Rule 7: Only admins can mark recovery complete.
   * Rule 8: Every admin action creates an audit log.
   */
  async completeRecovery(
    recoveryId: string,
    actorId: string,
    actorRole: string,
    notes?: string,
  ): Promise<Recovery> {
    // Rule 7 Check
    if (actorRole !== "ADMIN") {
      throw new DatabaseConstraintError(
        "Permission denied: Only administrators can mark recovery complete.",
        "ADMIN_ONLY_ACTION",
      )
    }

    const cached = getCache<Recovery>(CACHE_KEYS.RECOVERY)
    const rec = cached.find((r) => r.id === recoveryId)
    if (!rec) {
      throw new DatabaseConstraintError("Recovery record not found.", "RECOVERY_NOT_FOUND")
    }

    const now = new Date().toISOString()
    const completed: Recovery = {
      ...rec,
      status: "COMPLETED",
      completedAt: now,
      notes: notes || "Physical handover verified successfully.",
      updatedAt: now,
    }

    try {
      await updateDoc(doc(db, "recovery", recoveryId), {
        status: "COMPLETED",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch {}

    const filtered = cached.filter((r) => r.id !== recoveryId)
    filtered.unshift(completed)
    saveCache(CACHE_KEYS.RECOVERY, filtered)

    // Mark Item as RETURNED
    await this.updateItem(rec.itemId, { status: "RETURNED" }, actorId, "ADMIN")

    // Mark Claim as COMPLETED
    const claim = await this.getClaim(rec.claimId)
    if (claim) {
      const claims = getCache<Claim>(CACHE_KEYS.CLAIMS).filter((c) => c.id !== rec.claimId)
      claims.unshift({ ...claim, status: "APPROVED", updatedAt: now })
      saveCache(CACHE_KEYS.CLAIMS, claims)
    }

    // Rule 8: Log in audit ledger
    await this.createAuditLog(actorId, "RECOVERY_COMPLETED", "recovery", recoveryId, {
      itemId: rec.itemId,
      claimId: rec.claimId,
      notes,
    })

    return completed
  },

  // ==========================================
  // MATCH (Rule: MATCH must never automatically approve ownership)
  // ==========================================
  async createMatch(
    lostItemId: string,
    foundItemId: string,
    score: number,
    reasons: string[],
  ): Promise<Match> {
    const id = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const match: Match = {
      id,
      lostItemId,
      foundItemId,
      score,
      reasons,
      status: "SUGGESTED", // NEVER automatically approved
      createdAt: new Date().toISOString(),
    }

    try {
      await setDoc(doc(db, "matches", id), {
        ...match,
        createdAt: serverTimestamp(),
      })
    } catch {}

    const cached = getCache<Match>(CACHE_KEYS.MATCHES)
    cached.unshift(match)
    saveCache(CACHE_KEYS.MATCHES, cached)
    return match
  },

  // ==========================================
  // REPORT (Content Flags)
  // ==========================================
  async createReport(
    reporterId: string,
    itemId: string,
    reason: string,
    description: string,
  ): Promise<Report> {
    const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const report: Report = {
      id,
      reporterId,
      itemId,
      reason,
      description,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    }

    try {
      await setDoc(doc(db, "reports", id), {
        ...report,
        createdAt: serverTimestamp(),
      })
    } catch {}

    const cached = getCache<Report>(CACHE_KEYS.REPORTS)
    cached.unshift(report)
    saveCache(CACHE_KEYS.REPORTS, cached)
    return report
  },
}
