import { FirestoreService } from "./firestore.service"
import {
  where,
  orderBy,
  QueryConstraint,
  getDocs,
  collection,
  query,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../../config/firebase"
import { COLLECTIONS } from "../../config/constants"
import { LostItem } from "../../types/LostItem"
import { FoundItem } from "../../types/FoundItem"
import { SimpleItemService } from "../simpleItem.service"

export interface ItemQueryFilters {
  category?: string
  color?: string
  status?: string
  location?: string
  search?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  hasMore: boolean
  lastDoc: any
}

function adaptToLostItem(d: any): LostItem {
  return {
    id: d.id,
    userId: d.userId || "",
    userName: d.userName || "Student",
    userEmail: d.userEmail || "",
    title: d.itemName || d.title || "Campus Item",
    category: d.category || "other",
    description: d.description || "",
    color: d.color || "Other",
    brand: d.brand || "",
    locationLost: d.location || d.locationLost || "Campus",
    dateLost: d.date || d.dateLost || "",
    timeLost: d.time || d.timeLost || "",
    imageUrls: d.imageUrls || (d.imageUrl ? [d.imageUrl] : []),
    status: d.status || "pending",
    referenceNumber: d.referenceNumber,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  } as unknown as LostItem
}

function adaptToFoundItem(d: any): FoundItem {
  return {
    id: d.id,
    userId: d.userId || "",
    userName: d.userName || "Finder",
    userEmail: d.userEmail || "",
    title: d.itemName || d.title || "Campus Item",
    category: d.category || "other",
    description: d.description || "",
    color: d.color || "Other",
    brand: d.brand || "",
    locationFound: d.location || d.locationFound || "Campus",
    dateFound: d.date || d.dateFound || "",
    timeFound: d.time || d.timeFound || "",
    imageUrls: d.imageUrls || (d.imageUrl ? [d.imageUrl] : []),
    status: d.status || "pending",
    referenceNumber: d.referenceNumber,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  } as unknown as FoundItem
}

export const LostItemService = {
  async create(
    data: Omit<LostItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const item = await SimpleItemService.createItem({
      type: "LOST",
      userId: data.userId,
      userName: data.userName || "Student",
      userEmail: data.userEmail || "",
      itemName: data.title,
      category: data.category,
      description: data.description,
      location: data.locationLost,
      date: data.dateLost,
      color: data.color,
      brand: data.brand,
      imageUrl: data.imageUrls?.[0] || "",
      imageUrls: data.imageUrls || [],
      status: data.status as any || "pending",
    })
    return item.id
  },

  async getById(id: string): Promise<LostItem | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.ITEMS, id))
    if (snap.exists()) return adaptToLostItem({ id: snap.id, ...snap.data() })
    const legacy = await FirestoreService.getDocument<LostItem>(
      COLLECTIONS.LOST_ITEMS,
      id,
    )
    return legacy
  },

  async getByUser(userId: string): Promise<LostItem[]> {
    const items = await SimpleItemService.getItemsByUser(userId, "LOST")
    if (items.length > 0) return items.map(adaptToLostItem)
    return FirestoreService.queryCollection<LostItem>(
      COLLECTIONS.LOST_ITEMS,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    )
  },

  async getAll(
    filters?: ItemQueryFilters,
    pageSize = 30,
    lastDoc?: any,
  ): Promise<PaginatedResult<LostItem>> {
    const items = await SimpleItemService.getItems({
      type: "LOST",
      category: filters?.category,
      search: filters?.search,
      status: filters?.status,
      userId: filters?.userId,
    })

    const adapted = items.map(adaptToLostItem)
    return {
      items: adapted.slice(0, pageSize),
      total: adapted.length,
      hasMore: adapted.length > pageSize,
      lastDoc: null,
    }
  },

  async update(id: string, data: Partial<LostItem>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.ITEMS, id), {
      ...data,
      updatedAt: serverTimestamp(),
    }).catch(() => {})
    await FirestoreService.updateDocument(
      COLLECTIONS.LOST_ITEMS,
      id,
      data,
    ).catch(() => {})
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.ITEMS, id)).catch(() => {})
    await FirestoreService.deleteDocument(COLLECTIONS.LOST_ITEMS, id).catch(
      () => {},
    )
  },
}

export const FoundItemService = {
  async create(
    data: Omit<FoundItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const item = await SimpleItemService.createItem({
      type: "FOUND",
      userId: data.userId,
      userName: data.userName || "Finder",
      userEmail: data.userEmail || "",
      itemName: data.title,
      category: data.category,
      description: data.description,
      location: data.locationFound,
      date: data.dateFound,
      color: data.color,
      brand: data.brand,
      imageUrl: data.imageUrls?.[0] || "",
      imageUrls: data.imageUrls || [],
      status: data.status as any || "pending",
    })
    return item.id
  },

  async getById(id: string): Promise<FoundItem | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.ITEMS, id))
    if (snap.exists()) return adaptToFoundItem({ id: snap.id, ...snap.data() })
    const legacy = await FirestoreService.getDocument<FoundItem>(
      COLLECTIONS.FOUND_ITEMS,
      id,
    )
    return legacy
  },

  async getByUser(userId: string): Promise<FoundItem[]> {
    const items = await SimpleItemService.getItemsByUser(userId, "FOUND")
    if (items.length > 0) return items.map(adaptToFoundItem)
    return FirestoreService.queryCollection<FoundItem>(
      COLLECTIONS.FOUND_ITEMS,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    )
  },

  async getAll(
    filters?: ItemQueryFilters,
    pageSize = 30,
    lastDoc?: any,
  ): Promise<PaginatedResult<FoundItem>> {
    const items = await SimpleItemService.getItems({
      type: "FOUND",
      category: filters?.category,
      search: filters?.search,
      status: filters?.status,
      userId: filters?.userId,
    })

    const adapted = items.map(adaptToFoundItem)
    return {
      items: adapted.slice(0, pageSize),
      total: adapted.length,
      hasMore: adapted.length > pageSize,
      lastDoc: null,
    }
  },

  async update(id: string, data: Partial<FoundItem>): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.ITEMS, id), {
      ...data,
      updatedAt: serverTimestamp(),
    }).catch(() => {})
    await FirestoreService.updateDocument(
      COLLECTIONS.FOUND_ITEMS,
      id,
      data,
    ).catch(() => {})
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.ITEMS, id)).catch(() => {})
    await FirestoreService.deleteDocument(COLLECTIONS.FOUND_ITEMS, id).catch(
      () => {},
    )
  },
}

export interface ActivityLog {
  id?: string
  userId: string
  action: "created" | "updated" | "deleted" | "status_changed" | "matched" | "claimed"
  itemType: "lost" | "found"
  itemId: string
  itemTitle: string
  details: string
  createdAt?: any
}

export const ActivityLogService = {
  async log(data: Omit<ActivityLog, "id" | "createdAt">): Promise<string> {
    return FirestoreService.createDocument(
      COLLECTIONS.ACTIVITY_LOGS,
      data,
    ).catch(() => "log-id")
  },

  async getItemLogs(itemId: string): Promise<ActivityLog[]> {
    return FirestoreService.queryCollection<ActivityLog>(
      COLLECTIONS.ACTIVITY_LOGS,
      where("itemId", "==", itemId),
      orderBy("createdAt", "desc"),
    ).catch(() => [])
  },

  async getUserLogs(userId: string): Promise<ActivityLog[]> {
    return FirestoreService.queryCollection<ActivityLog>(
      COLLECTIONS.ACTIVITY_LOGS,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ).catch(() => [])
  },
}

export interface DraftReport {
  id?: string
  userId: string
  type: "lost" | "found"
  formData: Record<string, any>
  imageUrls: string[]
  cloudinaryPublicIds: string[]
}

export const DraftService = {
  async saveDraft(data: any): Promise<string> {
    return "draft-saved"
  },
}
