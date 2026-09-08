import { FirestoreService } from "./firestore.service"
import {
  where,
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../../config/firebase"
import { COLLECTIONS } from "../../config/constants"
import { User, UserRole } from "../../types/User"

export const UserService = {
  async createUser(
    data: Omit<User, "uid" | "createdAt" | "updatedAt">,
    uid: string,
  ) {
    return FirestoreService.createDocument<Omit<User, "uid" | "createdAt" | "updatedAt">>(
      COLLECTIONS.USERS,
      { ...data, trustScore: data.trustScore ?? 5.0, isBanned: false },
      uid,
    )
  },

  async getUser(uid: string) {
    return FirestoreService.getDocument<User>(COLLECTIONS.USERS, uid)
  },

  async getUserByEmail(email: string) {
    const users = await FirestoreService.queryCollection<User>(
      COLLECTIONS.USERS,
      where("email", "==", email),
    )
    return users.length > 0 ? users[0] : null
  },

  async getAllUsers() {
    return FirestoreService.getCollection<User>(COLLECTIONS.USERS)
  },

  async getUsersByRole(role: string) {
    return FirestoreService.queryCollection<User>(
      COLLECTIONS.USERS,
      where("role", "==", role),
    )
  },

  async updateUser(uid: string, data: Partial<User>) {
    return FirestoreService.updateDocument<User>(COLLECTIONS.USERS, uid, data)
  },

  async updateRole(uid: string, role: UserRole) {
    return FirestoreService.updateDocument<User>(COLLECTIONS.USERS, uid, {
      role,
    })
  },

  async banUser(uid: string, reason: string) {
    return FirestoreService.updateDocument<User>(COLLECTIONS.USERS, uid, {
      isBanned: true,
      banReason: reason,
      bannedAt: serverTimestamp(),
    })
  },

  async unbanUser(uid: string) {
    return FirestoreService.updateDocument<User>(COLLECTIONS.USERS, uid, {
      isBanned: false,
      banReason: null,
    })
  },

  async updateTrustScore(uid: string, delta: number) {
    const userRef = doc(db, COLLECTIONS.USERS, uid)
    await updateDoc(userRef, {
      trustScore: increment(delta),
      updatedAt: serverTimestamp(),
    })
  },

  async deleteUser(uid: string) {
    return FirestoreService.deleteDocument(COLLECTIONS.USERS, uid)
  },
}
