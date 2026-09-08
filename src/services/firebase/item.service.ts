import { FirestoreService } from "./firestore.service"
import {
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  getDocs,
  collection,
  query,
  getCountFromServer,
} from "firebase/firestore"
import { db } from "../../config/firebase"
import { COLLECTIONS } from "../../config/constants"
import { LostItem } from "../../types/LostItem"
import { FoundItem } from "../../types/FoundItem"

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

export const LostItemService = {
  async create(
    data: Omit<LostItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    return FirestoreService.createDocument(COLLECTIONS.LOST_ITEMS, data)
  },

  async getById(id: string): Promise<LostItem | null> {
    return FirestoreService.getDocument<LostItem>(COLLECTIONS.LOST_ITEMS, id)
  },

  async getByUser(userId: string): Promise<LostItem[]> {
    return FirestoreService.queryCollection<LostItem>(
      COLLECTIONS.LOST_ITEMS,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    )
  },

  async getAll(
    filters?: ItemQueryFilters,
    pageSize = 20,
    lastDoc?: any,
  ): Promise<PaginatedResult<LostItem>> {
    const constraints: QueryConstraint[] = []

    if (filters?.category)
      constraints.push(where("category", "==", filters.category))
    if (filters?.color) constraints.push(where("color", "==", filters.color))
    if (filters?.status) constraints.push(where("status", "==", filters.status))
    if (filters?.userId) constraints.push(where("userId", "==", filters.userId))

    constraints.push(orderBy("createdAt", "desc"))
    constraints.push(limit(pageSize + 1))

    if (lastDoc) constraints.push(startAfter(lastDoc))

    const q = query(collection(db, COLLECTIONS.LOST_ITEMS), ...constraints)
    const snapshot = await getDocs(q)
    const docs = snapshot.docs

    const hasMore = docs.length > pageSize
    const items = docs
      .slice(0, pageSize)
      .map((d) => ({ id: d.id, ...d.data() }) as LostItem)

    const countSnap = await getCountFromServer(
      collection(db, COLLECTIONS.LOST_ITEMS),
    )

    return {
      items,
      total: countSnap.data().count,
      hasMore,
      lastDoc:
        docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize - 1)] : null,
    }
  },

  async update(id: string, data: Partial<LostItem>): Promise<void> {
    return FirestoreService.updateDocument(COLLECTIONS.LOST_ITEMS, id, data)
  },

  async delete(id: string): Promise<void> {
    return FirestoreService.deleteDocument(COLLECTIONS.LOST_ITEMS, id)
  },
}

export const FoundItemService = {
  async create(
    data: Omit<FoundItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    return FirestoreService.createDocument(COLLECTIONS.FOUND_ITEMS, data)
  },

  async getById(id: string): Promise<FoundItem | null> {
    return FirestoreService.getDocument<FoundItem>(COLLECTIONS.FOUND_ITEMS, id)
  },

  async getByUser(userId: string): Promise<FoundItem[]> {
    return FirestoreService.queryCollection<FoundItem>(
      COLLECTIONS.FOUND_ITEMS,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    )
  },

  async getAll(
    filters?: ItemQueryFilters,
    pageSize = 20,
    lastDoc?: any,
  ): Promise<PaginatedResult<FoundItem>> {
    const constraints: QueryConstraint[] = []

    if (filters?.category)
      constraints.push(where("category", "==", filters.category))
    if (filters?.color) constraints.push(where("color", "==", filters.color))
    if (filters?.status) constraints.push(where("status", "==", filters.status))
    if (filters?.userId) constraints.push(where("userId", "==", filters.userId))

    constraints.push(orderBy("createdAt", "desc"))
    constraints.push(limit(pageSize + 1))

    if (lastDoc) constraints.push(startAfter(lastDoc))

    const q = query(collection(db, COLLECTIONS.FOUND_ITEMS), ...constraints)
    const snapshot = await getDocs(q)
    const docs = snapshot.docs

    const hasMore = docs.length > pageSize
    const items = docs
      .slice(0, pageSize)
      .map((d) => ({ id: d.id, ...d.data() }) as FoundItem)

    const countSnap = await getCountFromServer(
      collection(db, COLLECTIONS.FOUND_ITEMS),
    )

    return {
      items,
      total: countSnap.data().count,
      hasMore,
      lastDoc:
        docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize - 1)] : null,
    }
  },

  async update(id: string, data: Partial<FoundItem>): Promise<void> {
    return FirestoreService.updateDocument(COLLECTIONS.FOUND_ITEMS, id, data)
  },

  async delete(id: string): Promise<void> {
    return FirestoreService.deleteDocument(COLLECTIONS.FOUND_ITEMS, id)
  },
}

export interface DraftReport {
  id?: string
  userId: string
  type: "lost" | "found"
  formData: Record<string, any>
  imageUrls: string[]
  cloudinaryPublicIds: string[]
  createdAt?: any
  updatedAt?: any
}

export const DraftService = {
  async save(
    data: Omit<DraftReport, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    return FirestoreService.createDocument(
      COLLECTIONS.ACTIVITY_LOGS.replace("activityLogs", "draftReports"),
      data,
    )
  },

  async saveDraft(
    data: Omit<DraftReport, "id" | "createdAt" | "updatedAt">,
    existingId?: string,
  ): Promise<string> {
    const collName = "draftReports"
    if (existingId) {
      await FirestoreService.updateDocument(collName, existingId, data)
      return existingId
    }
    return FirestoreService.createDocument(collName, data)
  },

  async getUserDrafts(userId: string): Promise<DraftReport[]> {
    return FirestoreService.queryCollection<DraftReport>(
      "draftReports",
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
    )
  },

  async deleteDraft(id: string): Promise<void> {
    return FirestoreService.deleteDocument("draftReports", id)
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
    return FirestoreService.createDocument(COLLECTIONS.ACTIVITY_LOGS, data)
  },

  async getUserLogs(userId: string): Promise<ActivityLog[]> {
    return FirestoreService.queryCollection<ActivityLog>(
      COLLECTIONS.ACTIVITY_LOGS,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    )
  },

  async getItemLogs(itemId: string): Promise<ActivityLog[]> {
    return FirestoreService.queryCollection<ActivityLog>(
      COLLECTIONS.ACTIVITY_LOGS,
      where("itemId", "==", itemId),
      orderBy("createdAt", "desc"),
    )
  },
}
