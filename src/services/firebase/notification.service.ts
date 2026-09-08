/**
 * Notification Service
 *
 * Firestore-backed notifications with real-time listeners,
 * notification preferences, and batch operations.
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
  updateDoc,
  getDocs,
} from "firebase/firestore"
import { db } from "../../config/firebase"
import { FirestoreService } from "./firestore.service"

// ─── Types ───────────────────────────────────────────────────

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  type: "match" | "message" | "system" | "status" | "fraud" | "claim" | "success" | "warning" | "information" | "critical" | "support"
  read: boolean
  actionUrl: string
  icon: string
  metadata: Record<string, any>
  createdAt: any
}

export interface NotificationPreferences {
  id?: string
  userId: string
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  matchAlerts: boolean
  messageAlerts: boolean
  statusUpdates: boolean
  systemAlerts: boolean
  fraudAlerts: boolean
  quietHoursStart: string
  quietHoursEnd: string
  updatedAt?: any
}

// ─── Collections ─────────────────────────────────────────────

const NOTIFICATIONS = "notifications"
const PREFERENCES = "notification_preferences"

// ─── Service ─────────────────────────────────────────────────

export const NotificationService = {
  /**
   * Create a notification
   */
  async createNotification(
    data: Omit<AppNotification, "id" | "createdAt">,
  ): Promise<string> {
    return FirestoreService.createDocument(NOTIFICATIONS, {
      ...data,
      read: false,
    })
  },

  /**
   * Create match notification
   */
  async notifyMatch(
    userId: string,
    matchTitle: string,
    confidence: number,
    matchId: string,
  ): Promise<string> {
    return this.createNotification({
      userId,
      title: `AI Match Found — ${matchTitle}`,
      body: `${confidence}% confidence match detected. Review and confirm ownership.`,
      type: "match",
      read: false,
      actionUrl: `/dashboard/ai-match?id=${matchId}`,
      icon: "brain",
      metadata: { matchId, confidence },
    })
  },

  /**
   * Create message notification
   */
  async notifyMessage(
    userId: string,
    senderName: string,
    preview: string,
    roomId: string,
  ): Promise<string> {
    return this.createNotification({
      userId,
      title: `New message from ${senderName}`,
      body: preview.length > 80 ? preview.substring(0, 80) + "..." : preview,
      type: "message",
      read: false,
      actionUrl: `/dashboard/messages?room=${roomId}`,
      icon: "message",
      metadata: { roomId, senderName },
    })
  },

  /**
   * Create status update notification
   */
  async notifyStatusChange(
    userId: string,
    itemTitle: string,
    newStatus: string,
  ): Promise<string> {
    return this.createNotification({
      userId,
      title: `Status Updated — ${itemTitle}`,
      body: `Your report has been updated to "${newStatus}".`,
      type: "status",
      read: false,
      actionUrl: "/dashboard/my-reports",
      icon: "status",
      metadata: { itemTitle, newStatus },
    })
  },

  /**
   * Subscribe to notifications in real-time
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, NOTIFICATIONS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50),
    )

    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as AppNotification,
      )
      callback(notifs)
    })
  },

  /**
   * Subscribe to unread count
   */
  subscribeToUnreadCount(
    userId: string,
    callback: (count: number) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, NOTIFICATIONS),
      where("userId", "==", userId),
      where("read", "==", false),
    )

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size)
    })
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notifId: string): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS, notifId), { read: true })
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, NOTIFICATIONS),
      where("userId", "==", userId),
      where("read", "==", false),
    )
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)
    snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }))
    await batch.commit()
  },

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<void> {
    return FirestoreService.deleteDocument(NOTIFICATIONS, id)
  },

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId: string): Promise<void> {
    const q = query(
      collection(db, NOTIFICATIONS),
      where("userId", "==", userId),
      where("read", "==", true),
    )
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)
    snapshot.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  },

  // ─── Preferences ────────────────────────────────────────────

  /**
   * Get or create notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const existing =
      await FirestoreService.getDocument<NotificationPreferences>(
        PREFERENCES,
        userId,
      )
    if (existing) return existing

    const defaults: Omit<NotificationPreferences, "id"> = {
      userId,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      matchAlerts: true,
      messageAlerts: true,
      statusUpdates: true,
      systemAlerts: true,
      fraudAlerts: true,
      quietHoursStart: "",
      quietHoursEnd: "",
    }

    await FirestoreService.createDocument(PREFERENCES, defaults, userId)
    return { id: userId, ...defaults } as NotificationPreferences
  },

  /**
   * Update preferences
   */
  async updatePreferences(
    userId: string,
    data: Partial<NotificationPreferences>,
  ): Promise<void> {
    await FirestoreService.updateDocument(PREFERENCES, userId, data)
  },
}
