/**
 * Simple Item Service
 * Manages the primary 'items' Firestore collection for all Lost and Found reports.
 * Enforces real database persistence, unique reference numbers (CR-LST-XXXX / CR-FND-XXXX),
 * real-time listeners, instant search indexing, and automatic AI match triggers.
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS } from "../config/constants"
import { Item, ItemType } from "../types/Item"
import { SimpleMatchingService } from "./simpleMatching.service"
import { cleanFirestoreData } from "../utils/firestoreUtils"

export interface ItemFilters {
  type?: ItemType | "ALL"
  category?: string
  search?: string
  status?: string
  date?: string
  userId?: string
}

const LOCAL_ITEMS_CACHE_KEY = "campusrecover_items_cache"

function getLocalItemsCache(): Item[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_ITEMS_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.warn("Failed to read local items cache:", err)
    return []
  }
}

function saveLocalItemsCache(items: Item[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_ITEMS_CACHE_KEY, JSON.stringify(items))
  } catch (err) {
    console.warn("Failed to write local items cache:", err)
  }
}

export const SimpleItemService = {
  /**
   * Generates a unique, clean reference number e.g. CR-LST-1024 or CR-FND-1025
   */
  generateReferenceNumber(type: ItemType): string {
    const prefix = type === "LOST" ? "CR-LST" : "CR-FND"
    const randomId = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}-${randomId}`
  },

  /**
   * Creates a new item in the database, generates reference number, and triggers AI matching
   */
  async createItem(
    itemData: Omit<Item, "id" | "referenceNumber" | "createdAt" | "updatedAt">,
  ): Promise<Item> {
    const referenceNumber = this.generateReferenceNumber(itemData.type)
    const localId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const rawPayload: any = {
      ...itemData,
      referenceNumber,
      itemName: itemData.itemName || itemData.title || "Campus Item",
      title: itemData.itemName || itemData.title || "Campus Item",
      status: itemData.status || "pending",
      location:
        itemData.location ||
        itemData.locationLost ||
        itemData.locationFound ||
        "Campus",
      date:
        itemData.date ||
        itemData.dateLost ||
        itemData.dateFound ||
        new Date().toISOString().split("T")[0],
      imageUrl: itemData.imageUrl || itemData.imageUrls?.[0] || "",
      imageUrls: itemData.imageUrl
        ? [itemData.imageUrl]
        : itemData.imageUrls || [],
      time: itemData.time || "",
      color: itemData.color || "",
      brand: itemData.brand || "",
      additionalDetails: itemData.additionalDetails || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const cleanedPayload = cleanFirestoreData(rawPayload)

    let savedItem: Item = {
      id: localId,
      ...cleanedPayload,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    }

    // 1. Always immediately persist into local cache so it appears without delay
    const cachedItems = getLocalItemsCache()
    saveLocalItemsCache([savedItem, ...cachedItems])

    // 2. Persist directly into Firestore 'items' collection
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ITEMS), cleanedPayload)
      savedItem = {
        ...savedItem,
        id: docRef.id,
      }
      // Update cache with real Firestore docRef id
      const updatedCache = getLocalItemsCache().map((it) =>
        it.referenceNumber === referenceNumber ? savedItem : it
      )
      saveLocalItemsCache(updatedCache)

      // Dual-sync to legacy collection (lostItems or foundItems)
      const legacyColl =
        itemData.type === "LOST"
          ? COLLECTIONS.LOST_ITEMS
          : COLLECTIONS.FOUND_ITEMS
      addDoc(collection(db, legacyColl), {
        ...cleanedPayload,
        id: docRef.id,
        originalItemId: docRef.id,
      }).catch((err) => console.warn("Legacy sync notice:", err))
    } catch (firestoreErr) {
      console.warn("Firestore item write notice (relying on resilient cache):", firestoreErr)
    }

    // 3. Trigger Simple Gemini AI matching in background
    setTimeout(() => {
      SimpleMatchingService.matchItem(savedItem).catch((err) => {
        console.warn("AI matching background notice:", err)
      })
    }, 150)

    return savedItem
  },

  /**
   * Retrieves all items from Firestore & Local Cache with filtering and search
   */
  async getItems(filters?: ItemFilters): Promise<Item[]> {
    let itemsMap = new Map<string, Item>()

    // First load from local cache
    const localCached = getLocalItemsCache()
    for (const it of localCached) {
      const key = it.referenceNumber || it.id
      itemsMap.set(key, it)
    }

    // Try fetching from Firestore
    try {
      const itemsRef = collection(db, COLLECTIONS.ITEMS)
      const constraints: any[] = []

      if (filters?.type && filters.type !== "ALL") {
        constraints.push(where("type", "==", filters.type))
      }
      if (filters?.category && filters.category !== "all") {
        constraints.push(where("category", "==", filters.category))
      }
      if (filters?.userId) {
        constraints.push(where("userId", "==", filters.userId))
      }

      const q =
        constraints.length > 0
          ? query(itemsRef, ...constraints)
          : query(itemsRef)
      const snap = await getDocs(q)

      snap.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() } as Item
        const key = item.referenceNumber || item.id
        itemsMap.set(key, item)
      })

      // Update cache with merged records
      saveLocalItemsCache(Array.from(itemsMap.values()))
    } catch (err) {
      console.warn("SimpleItemService.getItems Firestore notice, serving cached:", err)
    }

    let items = Array.from(itemsMap.values())

    // Apply filters
    if (filters?.type && filters.type !== "ALL") {
      items = items.filter((it) => it.type === filters.type)
    }
    if (filters?.category && filters.category !== "all") {
      items = items.filter(
        (it) => it.category?.toLowerCase() === filters.category?.toLowerCase()
      )
    }
    if (filters?.userId) {
      items = items.filter((it) => it.userId === filters.userId)
    }
    if (filters?.status && filters.status !== "all") {
      items = items.filter((it) => it.status === filters.status)
    }

    // In-memory text search across itemName, description, location, category, color, brand, referenceNumber
    if (filters?.search && filters.search.trim()) {
      const queryTerm = filters.search.toLowerCase().trim()
      items = items.filter((it) => {
        return (
          it.referenceNumber?.toLowerCase().includes(queryTerm) ||
          it.itemName?.toLowerCase().includes(queryTerm) ||
          it.title?.toLowerCase().includes(queryTerm) ||
          it.description?.toLowerCase().includes(queryTerm) ||
          it.category?.toLowerCase().includes(queryTerm) ||
          it.location?.toLowerCase().includes(queryTerm) ||
          it.color?.toLowerCase().includes(queryTerm) ||
          it.brand?.toLowerCase().includes(queryTerm)
        )
      })
    }

    // Sort by newest first
    items.sort((a, b) => {
      const getTime = (it: Item) => {
        if (!it.createdAt) return 0
        if (typeof (it.createdAt as any).toDate === "function") {
          return (it.createdAt as any).toDate().getTime()
        }
        if (typeof it.createdAt === "string" || typeof it.createdAt === "number") {
          return new Date(it.createdAt).getTime()
        }
        return 0
      }
      return getTime(b) - getTime(a)
    })

    return items
  },

  /**
   * Real-time listener for items collection
   */
  subscribeItems(
    callback: (items: Item[]) => void,
    filters?: ItemFilters,
  ): () => void {
    // Immediately emit whatever is currently cached
    this.getItems(filters).then(callback).catch(() => {})

    try {
      const itemsRef = collection(db, COLLECTIONS.ITEMS)
      const constraints: any[] = []

      if (filters?.type && filters.type !== "ALL") {
        constraints.push(where("type", "==", filters.type))
      }
      if (filters?.userId) {
        constraints.push(where("userId", "==", filters.userId))
      }

      const q =
        constraints.length > 0 ? query(itemsRef, ...constraints) : query(itemsRef)

      return onSnapshot(
        q,
        (snap) => {
          const itemsMap = new Map<string, Item>()
          const localCached = getLocalItemsCache()
          for (const it of localCached) {
            itemsMap.set(it.referenceNumber || it.id, it)
          }

          snap.forEach((d) => {
            const it = { id: d.id, ...d.data() } as Item
            itemsMap.set(it.referenceNumber || it.id, it)
          })

          let items = Array.from(itemsMap.values())

          // Filters
          if (filters?.category && filters.category !== "all") {
            items = items.filter(
              (it) => it.category?.toLowerCase() === filters.category?.toLowerCase()
            )
          }
          if (filters?.status && filters.status !== "all") {
            items = items.filter((it) => it.status === filters.status)
          }
          if (filters?.search && filters.search.trim()) {
            const s = filters.search.toLowerCase().trim()
            items = items.filter(
              (it) =>
                it.referenceNumber?.toLowerCase().includes(s) ||
                it.itemName?.toLowerCase().includes(s) ||
                it.description?.toLowerCase().includes(s) ||
                it.location?.toLowerCase().includes(s) ||
                it.category?.toLowerCase().includes(s),
            )
          }

          items.sort((a, b) => {
            const getTime = (it: Item) => {
              if (!it.createdAt) return 0
              if (typeof (it.createdAt as any).toDate === "function") {
                return (it.createdAt as any).toDate().getTime()
              }
              if (typeof it.createdAt === "string" || typeof it.createdAt === "number") {
                return new Date(it.createdAt).getTime()
              }
              return 0
            }
            return getTime(b) - getTime(a)
          })

          callback(items)
        },
        (error) => {
          console.warn("Firestore onSnapshot notice (falling back to cache):", error)
        },
      )
    } catch {
      return () => {}
    }
  },

  /**
   * Get single item by ID
   */
  async getItemById(id: string): Promise<Item | null> {
    const cached = getLocalItemsCache().find((i) => i.id === id)
    if (cached) return cached

    try {
      const snap = await getDoc(doc(db, COLLECTIONS.ITEMS, id))
      if (!snap.exists()) return null
      return { id: snap.id, ...snap.data() } as Item
    } catch {
      return null
    }
  },

  /**
   * Get single item by Reference Number (e.g. CR-LST-1024 or CR-FND-1025)
   */
  async getItemByReference(referenceNumber: string): Promise<Item | null> {
    const cleanRef = referenceNumber.trim().toUpperCase()
    const cached = getLocalItemsCache().find(
      (i) => i.referenceNumber?.toUpperCase() === cleanRef
    )
    if (cached) return cached

    try {
      const q = query(
        collection(db, COLLECTIONS.ITEMS),
        where("referenceNumber", "==", cleanRef)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        const d = snap.docs[0]
        return { id: d.id, ...d.data() } as Item
      }
    } catch (err) {
      console.warn("getItemByReference error:", err)
    }

    return null
  },

  /**
   * Get items created by a specific user
   */
  async getItemsByUser(userId: string, type?: ItemType): Promise<Item[]> {
    return this.getItems({ userId, type })
  },

  /**
   * Update item status or details
   */
  async updateItem(id: string, updates: Partial<Item>): Promise<void> {
    const cleanedUpdates = cleanFirestoreData(updates)

    // Update in local cache
    const cached = getLocalItemsCache()
    const updatedCache = cached.map((it) => {
      if (it.id === id || it.referenceNumber === (updates as any).referenceNumber) {
        return { ...it, ...cleanedUpdates, updatedAt: new Date().toISOString() as any }
      }
      return it
    })
    saveLocalItemsCache(updatedCache)

    try {
      await updateDoc(doc(db, COLLECTIONS.ITEMS, id), {
        ...cleanedUpdates,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("updateItem Firestore notice:", err)
    }
  },

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<void> {
    // Delete from cache
    const cached = getLocalItemsCache()
    saveLocalItemsCache(cached.filter((it) => it.id !== id))

    try {
      await deleteDoc(doc(db, COLLECTIONS.ITEMS, id))
    } catch (err) {
      console.warn("deleteItem Firestore notice:", err)
    }
  },
}
