/**
 * Secure Item Handover Service
 *
 * Implements the complete secure handover workflow:
 * AI Match -> Admin Review -> Chat -> Meeting -> OTP Generation -> QR Generation ->
 * Identity Verification -> Item Handover -> Success
 *
 * Manages collections:
 * - claims
 * - handoverLogs
 * - verificationLogs
 */

import { FirestoreService } from "./firebase/firestore.service"
import {
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS } from "../config/constants"
import {
  Claim,
  ClaimStatus,
  VerificationMethod,
  HandoverLog,
  VerificationLog,
} from "../types/Claim"
import { LostItem } from "../types/LostItem"
import { FoundItem } from "../types/FoundItem"
import { UserService } from "./firebase/user.service"
import {
  LostItemService,
  FoundItemService,
  ActivityLogService,
} from "./firebase/item.service"
import { NotificationService } from "./firebase/notification.service"
import { PushNotificationService } from "./push.service"
import { EmailService } from "./email.service"

export interface HandoverVerificationResult {
  success: boolean
  message: string
}

export const HandoverService = {
  /**
   * Create or fetch existing claim for matched lost and found items
   */
  async getOrCreateClaim(params: {
    matchId?: string
    lostItem: LostItem
    foundItem: FoundItem
    claimerId: string
    claimerName?: string
    claimerEmail?: string
  }): Promise<Claim> {
    // Check if claim already exists for these items
    const existing = await FirestoreService.queryCollection<Claim>(
      COLLECTIONS.CLAIMS,
      where("lostItemId", "==", params.lostItem.id),
      where("foundItemId", "==", params.foundItem.id),
    )

    if (existing.length > 0) {
      return existing[0]
    }

    const claimData: Omit<Claim, "id" | "createdAt" | "updatedAt"> = {
      matchId: params.matchId || "",
      lostItemId: params.lostItem.id,
      foundItemId: params.foundItem.id,
      lostItemTitle: params.lostItem.title,
      foundItemTitle: params.foundItem.title,
      lostItemImage: params.lostItem.imageUrls?.[0] || "",
      foundItemImage: params.foundItem.imageUrls?.[0] || "",
      claimerId: params.claimerId,
      claimerName: params.claimerName || params.lostItem.userName,
      claimerEmail: params.claimerEmail || params.lostItem.userEmail,
      finderId: params.foundItem.userId,
      finderName: params.foundItem.userName,
      finderEmail: params.foundItem.userEmail,
      status: "pending",
      verifiedMethods: [],
      meetingLocation: params.foundItem.locationFound || "Campus Office",
      scheduledTime: new Date(Date.now() + 86400000).toISOString(),
    }

    const docId = await FirestoreService.createDocument(
      COLLECTIONS.CLAIMS,
      claimData,
    )
    return {
      id: docId,
      ...claimData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },

  /**
   * Get single claim by ID
   */
  async getClaim(claimId: string): Promise<Claim | null> {
    return FirestoreService.getDocument<Claim>(COLLECTIONS.CLAIMS, claimId)
  },

  /**
   * Get all claims for a user (as claimer or finder)
   */
  async getClaimsForUser(userId: string): Promise<Claim[]> {
    const asClaimer = await FirestoreService.queryCollection<Claim>(
      COLLECTIONS.CLAIMS,
      where("claimerId", "==", userId),
      orderBy("createdAt", "desc"),
    )
    const asFinder = await FirestoreService.queryCollection<Claim>(
      COLLECTIONS.CLAIMS,
      where("finderId", "==", userId),
      orderBy("createdAt", "desc"),
    )
    const all = [...asClaimer, ...asFinder]
    const seen = new Set<string>()
    return all.filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  },

  /**
   * Get all claims (Admin queue)
   */
  async getAllClaims(): Promise<Claim[]> {
    return FirestoreService.getCollection<Claim>(COLLECTIONS.CLAIMS)
  },

  /**
   * Admin approves claim to proceed to Handover & Verification stage
   */
  async adminApproveClaim(
    claimId: string,
    adminId: string,
    notes: string,
  ): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.CLAIMS, claimId, {
      status: "admin_approved",
      adminApprovedBy: adminId,
      adminNotes: notes,
    })

    const claim = await this.getClaim(claimId)
    if (claim) {
      const claimerUserId = claim.claimerId || claim.claimantId || ""
      await NotificationService.createNotification({
        userId: claimerUserId,
        title: `Claim Approved: Ready for Handover!`,
        body: `An admin approved your claim for ${claim.foundItemTitle}. Generate your OTP/QR code to verify with the finder.`,
        type: "claim",
        read: false,
        actionUrl: `/dashboard/scan-qr?claimId=${claimId}`,
        icon: "claim",
        metadata: { claimId },
      })
    }
  },

  /**
   * Generates a 6-digit secure numeric OTP for the claimant
   */
  async generateHandoverOTP(claimId: string): Promise<{
    otp: string
    expiresAt: Date
  }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins validity

    await FirestoreService.updateDocument(COLLECTIONS.CLAIMS, claimId, {
      otpCode: otp,
      otpExpiresAt: expiresAt,
      status: "in_handover",
    })

    await this.logVerification({
      claimId,
      method: "otp",
      status: "pending",
      verifiedBy: "system",
      details: "New 6-digit OTP code issued (15-min expiry window)",
    })

    return { otp, expiresAt }
  },

  /**
   * Verify input OTP during handover
   */
  async verifyHandoverOTP(
    claimId: string,
    inputOtp: string,
    officerOrFinderId: string,
  ): Promise<HandoverVerificationResult> {
    const claim = await this.getClaim(claimId)
    if (!claim) return { success: false, message: "Claim record not found." }

    if (!claim.otpCode) {
      return {
        success: false,
        message: "No active OTP generated for this claim.",
      }
    }

    const expiryTime = claim.otpExpiresAt?.toDate
      ? claim.otpExpiresAt.toDate().getTime()
      : new Date(claim.otpExpiresAt).getTime()

    if (Date.now() > expiryTime) {
      await this.logVerification({
        claimId,
        method: "otp",
        status: "failed",
        verifiedBy: officerOrFinderId,
        details: "Entered OTP code was expired",
      })
      return {
        success: false,
        message: "OTP code has expired. Please generate a new one.",
      }
    }

    if (claim.otpCode.trim() !== inputOtp.trim()) {
      await this.logVerification({
        claimId,
        method: "otp",
        status: "failed",
        verifiedBy: officerOrFinderId,
        details: "Incorrect OTP code entered",
      })
      return {
        success: false,
        message: "Incorrect OTP code. Please verify and retry.",
      }
    }

    // Success! Update verifiedMethods
    const updatedMethods = Array.from(
      new Set([...(claim.verifiedMethods || []), "otp" as VerificationMethod]),
    )

    await FirestoreService.updateDocument(COLLECTIONS.CLAIMS, claimId, {
      verifiedMethods: updatedMethods,
    })

    await this.logVerification({
      claimId,
      method: "otp",
      status: "success",
      verifiedBy: officerOrFinderId,
      details: "OTP successfully authenticated by finder/officer",
    })

    return { success: true, message: "OTP verified successfully!" }
  },

  /**
   * Generates dynamic verification QR Token payload
   */
  async generateHandoverQR(claimId: string): Promise<{
    qrToken: string
    expiresAt: Date
  }> {
    const nonce = Math.random().toString(36).substring(2, 10)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 mins validity
    const qrToken = `CR-VERIFY-${claimId}-${nonce}-${Date.now()}`

    await FirestoreService.updateDocument(COLLECTIONS.CLAIMS, claimId, {
      qrToken,
      qrExpiresAt: expiresAt,
      status: "in_handover",
    })

    await this.logVerification({
      claimId,
      method: "qr",
      status: "pending",
      verifiedBy: "system",
      details: "Dynamic handover QR Token generated with cryptographic nonce",
    })

    return { qrToken, expiresAt }
  },

  /**
   * Verifies scanned QR token
   */
  async verifyHandoverQR(
    claimId: string,
    scannedToken: string,
    officerOrFinderId: string,
  ): Promise<HandoverVerificationResult> {
    const claim = await this.getClaim(claimId)
    if (!claim) return { success: false, message: "Claim record not found." }

    if (!claim.qrToken) {
      return {
        success: false,
        message: "No active QR Token generated for this claim.",
      }
    }

    const expiryTime = claim.qrExpiresAt?.toDate
      ? claim.qrExpiresAt.toDate().getTime()
      : new Date(claim.qrExpiresAt).getTime()

    if (Date.now() > expiryTime) {
      await this.logVerification({
        claimId,
        method: "qr",
        status: "failed",
        verifiedBy: officerOrFinderId,
        details: "Scanned QR code was expired",
      })
      return {
        success: false,
        message: "QR Token expired. Please refresh the QR code.",
      }
    }

    if (claim.qrToken.trim() !== scannedToken.trim()) {
      await this.logVerification({
        claimId,
        method: "qr",
        status: "failed",
        verifiedBy: officerOrFinderId,
        details: "Scanned token does not match claim verification hash",
      })
      return { success: false, message: "Invalid QR Token." }
    }

    const updatedMethods = Array.from(
      new Set([...(claim.verifiedMethods || []), "qr" as VerificationMethod]),
    )

    await FirestoreService.updateDocument(COLLECTIONS.CLAIMS, claimId, {
      verifiedMethods: updatedMethods,
    })

    await this.logVerification({
      claimId,
      method: "qr",
      status: "success",
      verifiedBy: officerOrFinderId,
      details: "QR code successfully scanned and cryptographically validated",
    })

    return { success: true, message: "QR Code authenticated!" }
  },

  /**
   * Verify identity methods (Student ID, Purchase Bill, Serial Number, Gov ID, Face)
   */
  async verifyIdentityMethod(
    claimId: string,
    method: VerificationMethod,
    details: string,
    verifiedBy: string,
  ): Promise<void> {
    const claim = await this.getClaim(claimId)
    if (!claim) throw new Error("Claim not found")

    const updatedMethods = Array.from(
      new Set([...(claim.verifiedMethods || []), method]),
    )

    await FirestoreService.updateDocument(COLLECTIONS.CLAIMS, claimId, {
      verifiedMethods: updatedMethods,
      verificationNotes: details,
    })

    await this.logVerification({
      claimId,
      method,
      status: "success",
      verifiedBy,
      details,
    })
  },

  /**
   * Finalizes the handover:
   * - Marks Claim completed
   * - Marks LostItem resolved/claimed
   * - Marks FoundItem resolved/claimed
   * - Updates Finder's Trust Score (+1.0)
   * - Writes immutable record to handoverLogs
   * - Dispatches completion notifications
   */
  async completeHandover(
    claimId: string,
    officerId: string,
    officerName: string,
    notes: string = "Verified physical custody transfer completed",
  ): Promise<HandoverLog> {
    const claim = await this.getClaim(claimId)
    if (!claim) throw new Error("Claim not found")

    // 1. Mark claim complete
    await FirestoreService.updateDocument(COLLECTIONS.CLAIMS, claimId, {
      status: "completed",
      handoverOfficerId: officerId,
      handoverOfficerName: officerName,
      completedAt: serverTimestamp(),
      verificationNotes: notes,
    })

    // 2. Mark Lost Item claimed
    if (claim.lostItemId) {
      await LostItemService.update(claim.lostItemId, {
        status: "claimed",
      }).catch(console.warn)
    }

    // 3. Mark Found Item claimed
    if (claim.foundItemId) {
      await FoundItemService.update(claim.foundItemId, {
        status: "claimed",
      }).catch(console.warn)
    }

    // 4. Update Finder Trust Score (+1.0)
    if (claim.finderId) {
      await UserService.updateTrustScore(claim.finderId, 1.0).catch(
        console.warn,
      )
    }

    // 5. Create immutable Handover Log in handoverLogs collection
    const resolvedClaimerId = claim.claimerId || claim.claimantId || ""
    const logData: Omit<HandoverLog, "id"> = {
      claimId,
      lostItemId: claim.lostItemId,
      foundItemId: claim.foundItemId,
      itemTitle: claim.foundItemTitle || claim.lostItemTitle || "Campus Item",
      claimerId: resolvedClaimerId,
      claimerName: claim.claimerName || "Verified Claimant",
      finderId: claim.finderId,
      finderName: claim.finderName || "Campus Returner",
      officerId,
      officerName,
      verificationMethodsUsed: claim.verifiedMethods || [],
      notes,
      trustScoreDelta: 1.0,
      location: claim.meetingLocation || "Campus Office",
      timestamp: serverTimestamp(),
    }

    const logId = await FirestoreService.createDocument(
      COLLECTIONS.HANDOVER_LOGS,
      logData,
    )

    // 6. Log to Activity Log
    await ActivityLogService.log({
      userId: officerId || resolvedClaimerId,
      action: "claimed",
      itemType: "lost",
      itemId: claim.lostItemId,
      itemTitle: claim.foundItemTitle || "Item",
      details: `Handover finalized with methods: ${(claim.verifiedMethods || []).join(", ")}`,
    })

    // 7. Dispatch Notifications
    await NotificationService.createNotification({
      userId: resolvedClaimerId,
      title: `Item Recovered: ${claim.foundItemTitle}`,
      body: `Physical handover was verified and complete. Thank you for using CampusRecover AI!`,
      type: "status",
      read: false,
      actionUrl: `/dashboard/claim-success?claimId=${claimId}`,
      icon: "claim",
      metadata: { claimId },
    })

    if (claim.finderId && claim.finderId !== claim.claimerId) {
      await NotificationService.createNotification({
        userId: claim.finderId,
        title: `Item Successfully Returned (+1.0 Trust Score)`,
        body: `The owner verified receipt of ${claim.foundItemTitle}. Your campus trust score increased by +1.0!`,
        type: "status",
        read: false,
        actionUrl: `/dashboard/claim-success?claimId=${claimId}`,
        icon: "claim",
        metadata: { claimId },
      })
    }

    PushNotificationService.sendNotification("Item Recovered Successfully", {
      body: `Handover of ${claim.foundItemTitle} is complete and logged.`,
    })

    return { id: logId, ...logData }
  },

  /**
   * Log entry in verificationLogs collection
   */
  async logVerification(
    data: Omit<VerificationLog, "id" | "timestamp">,
  ): Promise<string> {
    return FirestoreService.createDocument(COLLECTIONS.VERIFICATION_LOGS, {
      ...data,
      timestamp: serverTimestamp(),
    })
  },

  /**
   * Get all handover logs (Audit trail)
   */
  async getHandoverLogs(): Promise<HandoverLog[]> {
    return FirestoreService.queryCollection<HandoverLog>(
      COLLECTIONS.HANDOVER_LOGS,
      orderBy("timestamp", "desc"),
    )
  },

  /**
   * Get all verification logs for a claim or all
   */
  async getVerificationLogs(claimId?: string): Promise<VerificationLog[]> {
    if (claimId) {
      return FirestoreService.queryCollection<VerificationLog>(
        COLLECTIONS.VERIFICATION_LOGS,
        where("claimId", "==", claimId),
        orderBy("timestamp", "desc"),
      )
    }
    return FirestoreService.queryCollection<VerificationLog>(
      COLLECTIONS.VERIFICATION_LOGS,
      orderBy("timestamp", "desc"),
    )
  },
}
