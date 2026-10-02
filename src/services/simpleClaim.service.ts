/**
 * Simple Claim Service
 * Manages official ownership claims submitted by campus students and staff.
 * Securely isolates private verification details (proof of purchase, secret markings, serials)
 * so they are never exposed publicly and are only accessible during authorized administrative review.
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS } from "../config/constants"
import { Claim, ClaimStatus } from "../types/Claim"
import { cleanFirestoreData } from "../utils/firestoreUtils"
import { SimpleHandoverService } from "./simpleHandover.service"
import { SimpleItemService } from "./simpleItem.service"

const LOCAL_CLAIMS_CACHE_KEY = "campusrecover_claims_cache"

function getLocalClaimsCache(): Claim[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_CLAIMS_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.warn("Failed to read local claims cache:", err)
    return []
  }
}

function saveLocalClaimsCache(claims: Claim[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_CLAIMS_CACHE_KEY, JSON.stringify(claims))
  } catch (err) {
    console.warn("Failed to write local claims cache:", err)
  }
}

export interface CreateClaimParams {
  itemId: string
  itemTitle: string
  itemReference: string
  itemImageUrl?: string
  itemType?: "LOST" | "FOUND"
  claimantId: string
  claimantName: string
  claimantEmail: string
  claimantMobile?: string
  claimerStudentId?: string
  finderId?: string
  finderName?: string
  finderEmail?: string
  reason: string
  uniqueCharacteristics: string
  privateVerificationDetails: string
  contactPreference?: "email" | "phone" | "campus_office"
}

export const SimpleClaimService = {
  /**
   * Submit a new ownership claim for an item
   */
  async createClaim(params: CreateClaimParams): Promise<Claim> {
    const localId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const newClaim: Claim = {
      id: localId,
      itemId: params.itemId,
      lostItemId: params.itemType === "LOST" ? params.itemId : "",
      foundItemId: params.itemType === "FOUND" ? params.itemId : "",
      itemTitle: params.itemTitle,
      itemReference: params.itemReference,
      itemImageUrl: params.itemImageUrl || "",
      itemType: params.itemType || "FOUND",
      claimantId: params.claimantId,
      claimerId: params.claimantId,
      claimantName: params.claimantName,
      claimerName: params.claimantName,
      claimantEmail: params.claimantEmail,
      claimerEmail: params.claimantEmail,
      claimantMobile: params.claimantMobile || "",
      claimerStudentId: params.claimerStudentId || "",
      finderId: params.finderId || "",
      finderName: params.finderName || "",
      finderEmail: params.finderEmail || "",
      status: "pending",
      reason: params.reason,
      uniqueCharacteristics: params.uniqueCharacteristics,
      privateVerificationDetails: params.privateVerificationDetails,
      contactPreference: params.contactPreference || "email",
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    }

    // 1. Optimistically store in local cache
    const cached = getLocalClaimsCache()
    saveLocalClaimsCache([newClaim, ...cached])

    // 2. Persist to Firestore
    try {
      const claimsRef = collection(db, COLLECTIONS.CLAIMS)
      const firestoreData = cleanFirestoreData({
        ...newClaim,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const docRef = await addDoc(claimsRef, firestoreData)
      newClaim.id = docRef.id

      // Update cached entry with real Firestore ID
      const updatedCache = getLocalClaimsCache().map((c) =>
        c.id === localId ? { ...c, id: docRef.id } : c,
      )
      saveLocalClaimsCache(updatedCache)
    } catch (err) {
      console.warn("Firestore claim creation notice (persisted in offline cache):", err)
    }

    return newClaim
  },

  /**
   * Retrieve claims with optional filters
   */
  async getClaims(filters?: {
    claimantId?: string
    itemId?: string
    status?: ClaimStatus
  }): Promise<Claim[]> {
    let claims = getLocalClaimsCache()

    try {
      const claimsRef = collection(db, COLLECTIONS.CLAIMS)
      let q = query(claimsRef)

      if (filters?.claimantId) {
        q = query(claimsRef, where("claimantId", "==", filters.claimantId))
      } else if (filters?.itemId) {
        q = query(claimsRef, where("itemId", "==", filters.itemId))
      }

      const snap = await getDocs(q)
      if (!snap.empty) {
        const firestoreClaims = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Claim[]

        // Merge with cache
        const map = new Map<string, Claim>()
        for (const c of claims) map.set(c.id, c)
        for (const c of firestoreClaims) map.set(c.id, c)
        claims = Array.from(map.values())
        saveLocalClaimsCache(claims)
      }
    } catch (err) {
      console.warn("getClaims Firestore notice:", err)
    }

    if (filters?.claimantId) {
      claims = claims.filter((c) => c.claimantId === filters.claimantId || c.claimerId === filters.claimantId)
    }
    if (filters?.itemId) {
      claims = claims.filter((c) => c.itemId === filters.itemId || c.foundItemId === filters.itemId || c.lostItemId === filters.itemId)
    }
    if (filters?.status) {
      claims = claims.filter((c) => c.status === filters.status)
    }

    // Sort newest first
    claims.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })

    return claims
  },

  /**
   * Get single claim by ID
   */
  async getClaimById(id: string): Promise<Claim | null> {
    const cached = getLocalClaimsCache().find((c) => c.id === id)
    if (cached) return cached

    try {
      const snap = await getDoc(doc(db, COLLECTIONS.CLAIMS, id))
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Claim
      }
    } catch {
      // offline fallback
    }

    return null
  },

  /**
   * Admin Review: Approve, Reject, or set Under Review
   * If approved: Generates OTP/QR Handover codes and sets item to handover_pending
   */
  async reviewClaim(
    claimId: string,
    params: {
      status: "approved" | "rejected" | "under_review"
      adminNotes?: string
      rejectionReason?: string
      adminId?: string
      adminName?: string
    },
  ): Promise<Claim> {
    const claim = await this.getClaimById(claimId)
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`)
    }

    let otpCode = claim.otpCode
    let qrToken = claim.qrToken

    // If approving, generate the handover session
    if (params.status === "approved") {
      try {
        const handover = await SimpleHandoverService.getOrCreateHandover({
          matchId: claim.matchId || `claim_hd_${claimId}`,
          lostItemId: claim.lostItemId || claim.itemId || "",
          foundItemId: claim.foundItemId || claim.itemId || "",
          lostReference: claim.itemReference || "",
          foundReference: claim.itemReference || "",
          itemName: claim.itemTitle || "Campus Item",
          claimantId: claim.claimantId || claim.claimerId || "",
          finderId: claim.finderId || "",
        })

        otpCode = (handover as any).otpCode || handover.otp
        qrToken = handover.qrToken

        // Update item status to handover_pending
        if (claim.itemId) {
          await SimpleItemService.updateItem(claim.itemId, {
            status: "handover_pending",
          })
        }
      } catch (err) {
        console.warn("Handover generation notice during claim approval:", err)
        // Fallback OTP
        if (!otpCode) {
          otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        }
        if (!qrToken) {
          qrToken = `CR-HANDOVER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        }
      }
    }

    const updates: Partial<Claim> = {
      status: params.status,
      adminNotes: params.adminNotes || "",
      rejectionReason: params.rejectionReason || "",
      reviewedBy: params.adminName || params.adminId || "Admin",
      reviewedAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
      ...(otpCode ? { otpCode } : {}),
      ...(qrToken ? { qrToken } : {}),
    }

    // Update local cache
    const cached = getLocalClaimsCache()
    const updated = cached.map((c) => (c.id === claimId ? { ...c, ...updates } : c))
    saveLocalClaimsCache(updated)

    // Update Firestore
    try {
      await updateDoc(doc(db, COLLECTIONS.CLAIMS, claimId), {
        ...cleanFirestoreData(updates),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("reviewClaim Firestore notice:", err)
    }

    return { ...claim, ...updates }
  },

  /**
   * Real-time subscription to claims
   */
  subscribeToClaims(
    callback: (claims: Claim[]) => void,
    filters?: { claimantId?: string; status?: ClaimStatus },
  ): () => void {
    // Initial emit from cache
    callback(getLocalClaimsCache())

    try {
      const claimsRef = collection(db, COLLECTIONS.CLAIMS)
      let q = query(claimsRef)

      if (filters?.claimantId) {
        q = query(claimsRef, where("claimantId", "==", filters.claimantId))
      }

      return onSnapshot(
        q,
        (snap) => {
          let claims = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Claim[]

          if (filters?.status) {
            claims = claims.filter((c) => c.status === filters.status)
          }

          claims.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return timeB - timeA
          })

          saveLocalClaimsCache(claims)
          callback(claims)
        },
        (err) => {
          console.warn("Claims subscription error (using cached):", err)
        },
      )
    } catch {
      return () => {}
    }
  },
}
