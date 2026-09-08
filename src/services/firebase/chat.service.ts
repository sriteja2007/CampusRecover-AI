/**
 * Real-time Chat Service
 *
 * Firestore-backed chat with:
 * - Real-time listeners and offline sync
 * - Read receipts (sent, delivered, read)
 * - Typing indicators
 * - Online / last seen user presence
 * - Attachments: Image sharing, Voice Notes, and Meeting Locations
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc,
  getDocs,
  Unsubscribe,
  limit,
  writeBatch,
} from "firebase/firestore"
import { db } from "../../config/firebase"

// ─── Types ───────────────────────────────────────────────────

export type MessageType = "text" | "image" | "voice" | "location" | "system" | "pdf"

export interface LocationAttachment {
  title: string
  address?: string
  lat: number
  lng: number
  isCampusOffice?: boolean
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderPhoto: string
  text: string
  type: MessageType
  imageUrl?: string
  audioUrl?: string
  audioDuration?: number // duration in seconds
  pdfUrl?: string
  pdfName?: string
  locationData?: LocationAttachment
  readBy: string[]
  createdAt: any
}

export interface ChatRoom {
  id: string
  participants: string[]
  participantNames: Record<string, string>
  participantPhotos: Record<string, string>
  matchId: string
  itemTitle: string
  lastMessage: string
  lastMessageTime: any
  lastMessageSender: string
  unreadCount: Record<string, number>
  status: "active" | "closed"
  blockedBy?: string[]
  createdAt?: any
  updatedAt?: any
}

export interface OnlineStatus {
  online: boolean
  lastSeen: any
}

// ─── Collections ─────────────────────────────────────────────

const ROOMS = "chat_rooms"
const MESSAGES = "messages"
const PRESENCE = "user_presence"

// ─── Chat Service ────────────────────────────────────────────

export const RealtimeChatService = {
  /**
   * Create or get existing chat room between two users
   */
  async getOrCreateRoom(params: {
    currentUserId: string
    otherUserId: string
    currentUserName: string
    otherUserName: string
    currentUserPhoto: string
    otherUserPhoto: string
    matchId: string
    itemTitle: string
  }): Promise<string> {
    const q = query(
      collection(db, ROOMS),
      where("participants", "array-contains", params.currentUserId),
    )
    const snapshot = await getDocs(q)

    for (const docSnap of snapshot.docs) {
      const room = docSnap.data() as ChatRoom
      if (
        room.participants.includes(params.otherUserId) &&
        room.matchId === params.matchId
      ) {
        return docSnap.id
      }
    }

    const roomData = {
      participants: [params.currentUserId, params.otherUserId],
      participantNames: {
        [params.currentUserId]: params.currentUserName,
        [params.otherUserId]: params.otherUserName,
      },
      participantPhotos: {
        [params.currentUserId]: params.currentUserPhoto,
        [params.otherUserId]: params.otherUserPhoto,
      },
      matchId: params.matchId,
      itemTitle: params.itemTitle,
      lastMessage: "Chat created",
      lastMessageTime: serverTimestamp(),
      lastMessageSender: params.currentUserId,
      unreadCount: { [params.currentUserId]: 0, [params.otherUserId]: 0 },
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, ROOMS), roomData)
    return docRef.id
  },

  /**
   * Listen to user's chat rooms in real-time
   */
  subscribeToRooms(
    userId: string,
    callback: (rooms: ChatRoom[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, ROOMS),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTime", "desc"),
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const rooms = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as ChatRoom,
        )
        callback(rooms)
      },
      (err) => {
        console.warn("Rooms listener subscription notice:", err)
        // Fallback query without compound order if index pending
        const fallbackQuery = query(
          collection(db, ROOMS),
          where("participants", "array-contains", userId),
        )
        onSnapshot(fallbackQuery, (snap) => {
          const rooms = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as ChatRoom,
          )
          callback(rooms)
        })
      },
    )
  },

  /**
   * Listen to messages in a room in real-time
   */
  subscribeToMessages(
    roomId: string,
    callback: (messages: ChatMessage[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, MESSAGES),
      where("roomId", "==", roomId),
      orderBy("createdAt", "asc"),
    )

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as ChatMessage,
      )
      callback(messages)
    })
  },

  /**
   * Send a message with text, image, voice note, or location attachment
   */
  async sendMessage(params: {
    roomId: string
    senderId: string
    senderName: string
    senderPhoto: string
    text?: string
    type?: MessageType
    imageUrl?: string
    audioUrl?: string
    audioDuration?: number
    pdfUrl?: string
    pdfName?: string
    locationData?: LocationAttachment
  }): Promise<string> {
    const type = params.type || "text"

    let lastMessageSummary = params.text || ""
    if (type === "image") lastMessageSummary = "📷 Photo Attachment"
    else if (type === "voice")
      lastMessageSummary = `🎤 Voice Note (${params.audioDuration || 0}s)`
    else if (type === "location") {
      lastMessageSummary = `📍 Meeting Spot: ${params.locationData?.title || "Campus Location"}`
    } else if (type === "pdf") {
      lastMessageSummary = `📄 PDF Attachment: ${params.pdfName || "Document"}`
    }
    const messageData = {
      roomId: params.roomId,
      senderId: params.senderId,
      senderName: params.senderName,
      senderPhoto: params.senderPhoto,
      text: params.text || "",
      type,
      imageUrl: params.imageUrl || "",
      audioUrl: params.audioUrl || "",
      audioDuration: params.audioDuration || 0,
      pdfUrl: params.pdfUrl || "",
      pdfName: params.pdfName || "",
      locationData: params.locationData || null,
      readBy: [params.senderId],
      createdAt: serverTimestamp(),
    }

    const msgRef = await addDoc(collection(db, MESSAGES), messageData)

    // Update room metadata
    const roomRef = doc(db, ROOMS, params.roomId)
    const roomSnap = await getDoc(roomRef)
    if (roomSnap.exists()) {
      const room = roomSnap.data() as ChatRoom
      const newUnread = { ...room.unreadCount }
      for (const uid of room.participants) {
        if (uid !== params.senderId) {
          newUnread[uid] = (newUnread[uid] || 0) + 1
        }
      }

      await updateDoc(roomRef, {
        lastMessage: lastMessageSummary,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: params.senderId,
        unreadCount: newUnread,
        updatedAt: serverTimestamp(),
      })
    }

    return msgRef.id
  },

  /**
   * Block a user in the chat room
   */
  async blockUser(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db, ROOMS, roomId)
    const roomSnap = await getDocs(query(collection(db, ROOMS), where("id", "==", roomId)))
    if (!roomSnap.empty) {
      const currentBlocked = roomSnap.docs[0].data().blockedBy || []
      if (!currentBlocked.includes(userId)) {
        await updateDoc(roomSnap.docs[0].ref, {
          blockedBy: [...currentBlocked, userId],
        })
      }
    } else {
      await updateDoc(roomRef, { blockedBy: [userId] })
    }
  },

  /**
   * Report a conversation
   */
  async reportConversation(roomId: string, reportedBy: string, reason: string): Promise<void> {
    const reportRef = doc(collection(db, "messageReports"))
    await setDoc(reportRef, {
      id: reportRef.id,
      roomId,
      reportedBy,
      reason,
      status: "pending",
      createdAt: serverTimestamp(),
    })
  },

  /**
   * Mark messages in a room as read by user
   */
  async markAsRead(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db, ROOMS, roomId)
    const roomSnap = await getDoc(roomRef)
    if (roomSnap.exists()) {
      const room = roomSnap.data() as ChatRoom
      const newUnread = { ...room.unreadCount, [userId]: 0 }
      await updateDoc(roomRef, { unreadCount: newUnread })
    }

    const q = query(
      collection(db, MESSAGES),
      where("roomId", "==", roomId),
      limit(50),
    )
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)
    let count = 0
    for (const msgDoc of snapshot.docs) {
      const msg = msgDoc.data()
      if (!msg.readBy?.includes(userId)) {
        batch.update(msgDoc.ref, { readBy: [...(msg.readBy || []), userId] })
        count++
      }
    }
    if (count > 0) {
      await batch.commit()
    }
  },

  /**
   * Set typing indicator with auto-timeout
   */
  async setTyping(
    roomId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    const typingRef = doc(db, ROOMS, roomId, "typing", userId)
    await setDoc(typingRef, { isTyping, updatedAt: serverTimestamp() }, {
      merge: true,
    })
  },

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(
    roomId: string,
    callback: (typingUsers: string[]) => void,
  ): Unsubscribe {
    const q = collection(db, ROOMS, roomId, "typing")
    return onSnapshot(q, (snapshot) => {
      const typing = snapshot.docs
        .filter((d) => d.data().isTyping)
        .map((d) => d.id)
      callback(typing)
    })
  },

  /**
   * Set user online status
   */
  async setOnlineStatus(userId: string, online: boolean): Promise<void> {
    const presenceRef = doc(db, PRESENCE, userId)
    await setDoc(
      presenceRef,
      {
        online,
        lastSeen: serverTimestamp(),
      },
      { merge: true },
    )
  },

  /**
   * Subscribe to user's online status
   */
  subscribeToPresence(
    userId: string,
    callback: (status: OnlineStatus) => void,
  ): Unsubscribe {
    return onSnapshot(doc(db, PRESENCE, userId), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as OnlineStatus)
      } else {
        callback({ online: false, lastSeen: null })
      }
    })
  },

  /**
   * Fetch user's chat rooms (one-time query)
   */
  async getUserRooms(userId: string): Promise<ChatRoom[]> {
    const q = query(
      collection(db, ROOMS),
      where("participants", "array-contains", userId),
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ChatRoom,
    )
  },

  /**
   * Close a chat room
   */
  async closeRoom(roomId: string): Promise<void> {
    await updateDoc(doc(db, ROOMS, roomId), {
      status: "closed",
      updatedAt: serverTimestamp(),
    })
  },
}
