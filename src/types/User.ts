import { Timestamp } from "firebase/firestore"
import { ROLES } from "../config/constants"

export type UserRole = typeof ROLES[keyof typeof ROLES]

export interface User {
  uid: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  college: string | null
  university?: string | null
  department: string | null
  year: string | null
  photoURL: string | null
  avatar?: string | null
  verified: boolean
  trustScore?: number
  isBanned?: boolean
  banReason?: string | null
  bannedAt?: Timestamp | any
  createdAt: Timestamp
  updatedAt: Timestamp
}
