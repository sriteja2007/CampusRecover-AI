/**
 * Simple Handover Service (OTP & QR Verification)
 * Manages item custody handovers via 6-digit OTP and QR token validation.
 * Updates item status to 'recovered' upon successful verification.
 */

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS } from "../config/constants"
import { Handover } from "../types/Handover"
import { cleanFirestoreData } from "../utils/firestoreUtils"
import { SimpleItemService } from "./simpleItem.service"
import { SimpleMatchingService } from "./simpleMatching.service"

const LOCAL_HANDOVERS_KEY = "campusrecover_handovers_cache"

function getLocalHandovers(): Handover[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_HANDOVERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalHandovers(handovers: Handover[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_HANDOVERS_KEY, JSON.stringify(handovers))
  } catch {}
}

export const SimpleHandoverService = {
  /**
   * Generates or fetches an existing Handover record for a match
   */
  async getOrCreateHandover(params: {
    matchId: string
    lostItemId: string
    foundItemId: string
    lostReference?: string
    foundReference?: string
    itemName?: string
    claimantId?: string
    finderId?: string
  }): Promise<Handover> {
    const localHandovers = getLocalHandovers()

    // 1. Check local cache first
    if (params.matchId) {
      const existing = localHandovers.find((h) => h.matchId === params.matchId)
      if (existing) return existing
    }

    // 2. Check Firestore
    if (params.matchId) {
      try {
        const handoversRef = collection(db, COLLECTIONS.HANDOVERS)
        const q = query(handoversRef, where("matchId", "==", params.matchId))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const d = snap.docs[0]
          const existing = { id: d.id, ...d.data() } as Handover
          saveLocalHandovers([existing, ...localHandovers.filter((h) => h.id !== existing.id)])
          return existing
        }
      } catch (err) {
        console.warn("getOrCreateHandover query notice:", err)
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

    // Generate dynamic QR token
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
    const qrToken = `CR-HANDOVER-${randomHex}`
    const localId = `handover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const rawData: Omit<Handover, "id"> = {
      matchId: params.matchId || "",
      lostItemId: params.lostItemId || "",
      foundItemId: params.foundItemId || "",
      lostReference: params.lostReference || "",
      foundReference: params.foundReference || "",
      itemName: params.itemName || "Campus Item",
      claimantId: params.claimantId || "",
      finderId: params.finderId || "",
      otp,
      otpExpiresAt,
      otpVerified: false,
      qrToken,
      qrVerified: false,
      status: "pending",
      createdAt: serverTimestamp(),
    }

    const cleanedData = cleanFirestoreData(rawData)

    let handover: Handover = {
      id: localId,
      ...cleanedData,
      createdAt: new Date().toISOString(),
    }

    // Save to local cache
    saveLocalHandovers([handover, ...localHandovers])

    // Save to Firestore
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.HANDOVERS), cleanedData)
      handover = { ...handover, id: docRef.id }
      const updated = getLocalHandovers().map((h) => (h.id === localId ? handover : h))
      saveLocalHandovers(updated)
    } catch (err) {
      console.warn("Handover Firestore write notice:", err)
    }

    return handover
  },

  /**
   * Fetches handover by ID
   */
  async getHandover(handoverId: string): Promise<Handover | null> {
    const cached = getLocalHandovers().find((h) => h.id === handoverId)
    if (cached) return cached

    try {
      const snap = await getDoc(doc(db, COLLECTIONS.HANDOVERS, handoverId))
      if (!snap.exists()) return null
      const item = { id: snap.id, ...snap.data() } as Handover
      saveLocalHandovers([item, ...getLocalHandovers().filter((h) => h.id !== item.id)])
      return item
    } catch {
      return null
    }
  },

  /**
   * Refreshes / generates a new 6-digit OTP
   */
  async refreshOTP(handoverId: string): Promise<{
    otp: string
    expiresAt: Date
  }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Update local cache
    const updated = getLocalHandovers().map((h) =>
      h.id === handoverId ? { ...h, otp, otpExpiresAt: expiresAt, otpVerified: false } : h
    )
    saveLocalHandovers(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS.HANDOVERS, handoverId), {
        otp,
        otpExpiresAt: expiresAt,
        otpVerified: false,
      })
    } catch (err) {
      console.warn("refreshOTP Firestore notice:", err)
    }

    return { otp, expiresAt }
  },

  /**
   * Verifies submitted OTP
   */
  async verifyOTP(handoverId: string, inputOtp: string): Promise<{
    success: boolean
    message: string
  }> {
    const handover = await this.getHandover(handoverId)
    if (!handover)
      return { success: false, message: "Handover session not found." }

    if (handover.status === "completed" || handover.otpVerified) {
      return { success: true, message: "Handover has already been verified!" }
    }

    // Check expiration
    const expiryTime = handover.otpExpiresAt?.toDate
      ? handover.otpExpiresAt.toDate().getTime()
      : new Date(handover.otpExpiresAt).getTime()

    if (Date.now() > expiryTime) {
      return {
        success: false,
        message: "OTP has expired. Please generate a new one.",
      }
    }

    // Validate code
    if (handover.otp.trim() !== inputOtp.trim()) {
      return {
        success: false,
        message: "Incorrect OTP code. Please check and try again.",
      }
    }

    // Mark as verified locally
    const updated = getLocalHandovers().map((h) =>
      h.id === handoverId ? { ...h, otpVerified: true, status: "completed" as const } : h
    )
    saveLocalHandovers(updated)

    // Mark as verified in Firestore
    try {
      await updateDoc(doc(db, COLLECTIONS.HANDOVERS, handoverId), {
        otpVerified: true,
        status: "completed",
        verifiedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("verifyOTP Firestore notice:", err)
    }

    await this.markItemsAsRecovered(handover)

    return {
      success: true,
      message: "Verification Successful! Handover Verified.",
    }
  },

  /**
   * Verifies scanned or entered QR Token
   */
  async verifyQR(handoverId: string, scannedToken: string): Promise<{
    success: boolean
    message: string
  }> {
    const handover = await this.getHandover(handoverId)
    if (!handover)
      return { success: false, message: "Handover session not found." }

    if (handover.qrToken.trim() !== scannedToken.trim()) {
      return { success: false, message: "Invalid Handover QR Token." }
    }

    // Update locally
    const updated = getLocalHandovers().map((h) =>
      h.id === handoverId ? { ...h, qrVerified: true, status: "completed" as const } : h
    )
    saveLocalHandovers(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS.HANDOVERS, handoverId), {
        qrVerified: true,
        status: "completed",
        verifiedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("verifyQR Firestore notice:", err)
    }

    await this.markItemsAsRecovered(handover)

    return {
      success: true,
      message: "Identity/Handover Verified! Item marked as RECOVERED.",
    }
  },

  /**
   * Marks both the lost item and found item as 'recovered' in database and local cache
   */
  async markItemsAsRecovered(handover: Handover): Promise<void> {
    try {
      if (handover.lostItemId) {
        await SimpleItemService.updateItem(handover.lostItemId, { status: "recovered" })
      }

      if (handover.foundItemId) {
        await SimpleItemService.updateItem(handover.foundItemId, { status: "recovered" })
      }

      if (handover.matchId) {
        await SimpleMatchingService.updateMatchStatus(handover.matchId, "recovered")
      }
    } catch (err) {
      console.warn("markItemsAsRecovered warning:", err)
    }
  },
}
