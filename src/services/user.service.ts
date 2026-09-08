import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { UserRole } from "../types/User"

export interface UserProfileData {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: UserRole
  university: string | null
  department: string | null
  year: string | null
  phone: string | null
  status: "active" | "suspended" | "pending"
  createdAt?: Timestamp | any
  updatedAt?: Timestamp | any
}

const COLLECTION_NAME = "users"

export const UserService = {
  async createUserProfile(
    user: Omit<UserProfileData, "createdAt" | "updatedAt">,
  ): Promise<void> {
    try {
      const userRef = doc(db, COLLECTION_NAME, user.uid)
      await setDoc(userRef, {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error creating user profile:", error)
      throw new Error("Could not create user profile")
    }
  },

  async getUserProfile(uid: string): Promise<UserProfileData | null> {
    try {
      const userRef = doc(db, COLLECTION_NAME, uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return userSnap.data() as UserProfileData
      }
      return null
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw new Error("Could not fetch user profile")
    }
  },

  async updateUserProfile(
    uid: string,
    data: Partial<UserProfileData>,
  ): Promise<void> {
    try {
      const userRef = doc(db, COLLECTION_NAME, uid)
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw new Error("Could not update user profile")
    }
  },

  async deleteUser(uid: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTION_NAME, uid)
      await deleteDoc(userRef)
    } catch (error) {
      console.error("Error deleting user profile:", error)
      throw new Error("Could not delete user profile")
    }
  },
}
