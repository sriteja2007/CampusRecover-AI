import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../../config/firebase"

export interface Meeting {
  id: string
  matchId: string
  roomId: string
  requesterId: string
  responderId: string
  officeName: string
  date: string
  time: string
  status: "pending" | "approved" | "rescheduled" | "cancelled"
  notes?: string
  createdAt?: any
  updatedAt?: any
}

const MEETINGS_COLLECTION = "meetings"

export const MeetingService = {
  async requestMeeting(
    data: Omit<Meeting, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const meetingRef = doc(collection(db, MEETINGS_COLLECTION))
    await setDoc(meetingRef, {
      ...data,
      id: meetingRef.id,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return meetingRef.id
  },

  async updateMeetingStatus(
    meetingId: string,
    status: Meeting["status"],
    notes?: string,
  ): Promise<void> {
    const meetingRef = doc(db, MEETINGS_COLLECTION, meetingId)
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    }
    if (notes) updateData.notes = notes
    await updateDoc(meetingRef, updateData)
  },

  async getUserMeetings(userId: string): Promise<Meeting[]> {
    const q = query(collection(db, MEETINGS_COLLECTION))
    const snap = await getDocs(q)
    return snap.docs
      .map((d) => d.data() as Meeting)
      .filter((m) => m.requesterId === userId || m.responderId === userId)
      .sort((a, b) => {
        const tA = a.createdAt?.seconds || 0
        const tB = b.createdAt?.seconds || 0
        return tB - tA
      })
  },
}
