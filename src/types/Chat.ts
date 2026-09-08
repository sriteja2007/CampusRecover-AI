import { Timestamp } from "firebase/firestore"

export type MessageType = "text" | "image" | "voice" | "location" | "system"

export interface LocationAttachment {
  title: string
  address?: string
  lat: number
  lng: number
  isCampusOffice?: boolean
}

export interface ChatRoom {
  id: string
  participants: string[]
  participantNames?: Record<string, string>
  participantPhotos?: Record<string, string>
  matchId: string
  itemTitle?: string
  lastMessage: string | null
  lastMessageTime: Timestamp | any
  lastMessageSender?: string
  unreadCount?: Record<string, number>
  status: "active" | "closed"
  createdAt: Timestamp | any
  updatedAt: Timestamp | any
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName?: string
  senderPhoto?: string
  text: string
  type: MessageType
  imageUrl?: string
  audioUrl?: string
  audioDuration?: number
  locationData?: LocationAttachment
  readBy: string[]
  createdAt: Timestamp | any
  updatedAt?: Timestamp | any
}
