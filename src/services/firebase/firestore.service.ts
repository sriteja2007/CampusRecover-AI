import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  PartialWithFieldValue,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../../config/firebase"

export const FirestoreService = {
  async createDocument<T extends DocumentData,>(
    collectionName: string,
    data: WithFieldValue<T>,
    customId?: string,
  ): Promise<string> {
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    if (customId) {
      const docRef = doc(db, collectionName, customId)
      await setDoc(docRef, dataWithTimestamp)
      return customId
    } else {
      const docRef = await addDoc(
        collection(db, collectionName),
        dataWithTimestamp,
      )
      return docRef.id
    }
  },

  async updateDocument<T extends DocumentData,>(
    collectionName: string,
    id: string,
    data: PartialWithFieldValue<T>,
  ): Promise<void> {
    const docRef = doc(db, collectionName, id)
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp(),
    }
    await updateDoc(docRef, dataWithTimestamp)
  },

  async deleteDocument(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id)
    await deleteDoc(docRef)
  },

  async getDocument<T = DocumentData,>(
    collectionName: string,
    id: string,
  ): Promise<T | null> {
    const docRef = doc(db, collectionName, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T
    }
    return null
  },

  async getCollection<T = DocumentData,>(collectionName: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, collectionName))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T)
  },

  async queryCollection<T = DocumentData,>(
    collectionName: string,
    ...queryConstraints: QueryConstraint[]
  ): Promise<T[]> {
    const q = query(collection(db, collectionName), ...queryConstraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T)
  },
}
