/**
 * Simple Flag Service
 * Handles user reports regarding incorrect information, suspicious listings,
 * duplicate submissions, or already recovered items.
 * Integrates directly with Firestore 'reports' collection and offline cache.
 */

import {
  collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS } from "../config/constants"
import { ContentFlag, FlagReason, FlagStatus } from "../types/ContentFlag"
import { cleanFirestoreData } from "../utils/firestoreUtils"

const LOCAL_FLAGS_CACHE_KEY = "campusrecover_flags_cache"

function getLocalFlagsCache(): ContentFlag[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_FLAGS_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalFlagsCache(flags: ContentFlag[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_FLAGS_CACHE_KEY, JSON.stringify(flags))
  } catch {}
}

export interface CreateFlagParams {
  itemId: string
  itemTitle?: string
  itemReference?: string
  reporterId?: string
  reporterEmail?: string
  reporterName?: string
  reason: FlagReason
  notes: string
}

export const SimpleFlagService = {
  /**
   * Submit an item content or accuracy report
   */
  async createFlag(params: CreateFlagParams): Promise<ContentFlag> {
    const localId = `flag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const newFlag: ContentFlag = {
      id: localId,
      itemId: params.itemId,
      itemTitle: params.itemTitle || "Campus Item",
      itemReference: params.itemReference || "",
      reporterId: params.reporterId || "",
      reporterEmail: params.reporterEmail || "",
      reporterName: params.reporterName || "Campus User",
      reason: params.reason,
      notes: params.notes,
      status: "pending",
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    }

    const cached = getLocalFlagsCache()
    saveLocalFlagsCache([newFlag, ...cached])

    try {
      const reportsRef = collection(db, COLLECTIONS.REPORTS)
      const firestoreData = cleanFirestoreData({
        ...newFlag,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const docRef = await addDoc(reportsRef, firestoreData)
      newFlag.id = docRef.id

      const updated = getLocalFlagsCache().map((f) =>
        f.id === localId ? { ...f, id: docRef.id } : f,
      )
      saveLocalFlagsCache(updated)
    } catch (err) {
      console.warn("Firestore flag creation notice:", err)
    }

    return newFlag
  },

  /**
   * Retrieve all content flags for administrator review
   */
  async getFlags(status?: FlagStatus): Promise<ContentFlag[]> {
    let flags = getLocalFlagsCache()

    try {
      const reportsRef = collection(db, COLLECTIONS.REPORTS)
      const snap = await getDocs(query(reportsRef))
      if (!snap.empty) {
        const firestoreFlags = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ContentFlag[]

        const map = new Map<string, ContentFlag>()
        for (const f of flags) map.set(f.id, f)
        for (const f of firestoreFlags) map.set(f.id, f)
        flags = Array.from(map.values())
        saveLocalFlagsCache(flags)
      }
    } catch (err) {
      console.warn("getFlags Firestore notice:", err)
    }

    if (status) {
      flags = flags.filter((f) => f.status === status)
    }

    flags.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })

    return flags
  },

  /**
   * Update flag status (resolved / dismissed)
   */
  async resolveFlag(
    flagId: string,
    params: {
      status: FlagStatus
      adminNotes?: string
      adminId?: string
    },
  ): Promise<void> {
    const updates: Partial<ContentFlag> = {
      status: params.status,
      adminNotes: params.adminNotes || "",
      resolvedBy: params.adminId || "Admin",
      resolvedAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    }

    const cached = getLocalFlagsCache()
    const updated = cached.map((f) => (f.id === flagId ? { ...f, ...updates } : f))
    saveLocalFlagsCache(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS.REPORTS, flagId), {
        ...cleanFirestoreData(updates),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("resolveFlag Firestore notice:", err)
    }
  },

  /**
   * Subscribe to flags real-time
   */
  subscribeToFlags(callback: (flags: ContentFlag[]) => void): () => void {
    callback(getLocalFlagsCache())

    try {
      const reportsRef = collection(db, COLLECTIONS.REPORTS)
      return onSnapshot(
        query(reportsRef),
        (snap) => {
          const flags = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ContentFlag[]

          flags.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return timeB - timeA
          })

          saveLocalFlagsCache(flags)
          callback(flags)
        },
        (err) => {
          console.warn("Flags subscription notice:", err)
        },
      )
    } catch {
      return () => {}
    }
  },
}
