import { createContext, useContext, useEffect, useState } from "react"
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../config/firebase"
import { COLLECTIONS, ROLES } from "../config/constants"
import { User as CustomUser } from "../types/User"

type AuthContextType = {
  user: FirebaseUser | any | null
  customUser: CustomUser | null
  loading: boolean
  login: (email: string, pass: string) => Promise<any>
  loginWithGoogle: () => Promise<any>
  register: (
    name: string,
    email: string,
    pass: string,
    phone?: string,
    confirmPass?: string,
  ) => Promise<any>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  customUser: null,
  loading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
})

const DEMO_SESSION_KEY = "campusrecover_demo_session"

export const DEMO_PRESET_USERS = {
  admin: {
    uid: "demo-admin-uid",
    email: "admin@gmail.com",
    name: "Campus Administrator",
    displayName: "Campus Administrator",
    phone: "+1 555-0100",
    role: ROLES.ADMIN,
    pass: "Admin123",
    description:
      "Security & Admin (Manage reports, approve matches, ban users)",
  },
  student1: {
    uid: "demo-student1-uid",
    email: "student1@campus.edu",
    name: "Alex Johnson",
    displayName: "Alex Johnson",
    phone: "+1 555-0101",
    role: ROLES.STUDENT,
    pass: "Student123",
    description: "Student 1 (Owner: reports lost items, requests handover)",
  },
  student2: {
    uid: "demo-student2-uid",
    email: "student2@campus.edu",
    name: "Sarah Davis",
    displayName: "Sarah Davis",
    phone: "+1 555-0202",
    role: ROLES.STUDENT,
    pass: "Student123",
    description: "Student 2 (Finder: reports found items, enters OTP)",
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | any | null>(null)
  const [customUser, setCustomUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (
    uid: string,
    fallbackEmail?: string,
    fallbackName?: string,
  ) => {
    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, uid)
      const snap = await getDoc(userDocRef)
      if (snap.exists()) {
        const data = snap.data() as any
        if (data.status === "SUSPENDED" || data.status === "suspended" || data.isBanned === true) {
          await signOut(auth).catch(() => {})
          setUser(null)
          setCustomUser(null)
          throw new Error("Your account has been suspended by campus administration. Please contact campus security.")
        }
        setCustomUser({ uid, ...data } as CustomUser)
        return { uid, ...data } as CustomUser
      } else {
        // Create initial profile if missing
        const newProfile: any = {
          uid,
          name: fallbackName || fallbackEmail?.split("@")[0] || "User",
          email: fallbackEmail || "",
          phone: "",
          role:
            fallbackEmail?.toLowerCase() === "admin@gmail.com"
              ? ROLES.ADMIN
              : ROLES.STUDENT,
          college: "CampusRecover University",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
        await setDoc(userDocRef, newProfile).catch(() => {})
        setCustomUser(newProfile)
        return newProfile
      }
    } catch (err) {
      console.warn("Failed to fetch user profile:", err)
      const fallbackProfile: any = {
        uid,
        name: fallbackName || fallbackEmail?.split("@")[0] || "User",
        email: fallbackEmail || "",
        phone: "",
        role:
          fallbackEmail?.toLowerCase() === "admin@gmail.com"
            ? ROLES.ADMIN
            : ROLES.STUDENT,
        status: "active",
      }
      setCustomUser(fallbackProfile)
      return fallbackProfile
    }
  }

  useEffect(() => {
    // Check for cached demo session first
    const storedSession = localStorage.getItem(DEMO_SESSION_KEY)
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession)
        setUser(parsed)
        setCustomUser(parsed)
        setLoading(false)
        return
      } catch {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(
          currentUser.uid,
          currentUser.email || "",
          currentUser.displayName || "",
        )
      } else {
        setCustomUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      const userCredential = await signInWithPopup(auth, provider)
      setUser(userCredential.user)
      const profile = await fetchProfile(
        userCredential.user.uid,
        userCredential.user.email || "",
        userCredential.user.displayName || "Google User",
      )
      setCustomUser(profile)
      setLoading(false)
      return userCredential.user
    } catch (err: any) {
      console.error("Google sign in error:", err)
      setLoading(false)
      throw err
    }
  }

  const login = async (email: string, pass: string) => {
    setLoading(true)
    const normalizedEmail = email.trim().toLowerCase()

    // 1. Check if email is one of the designated 3 demo accounts
    const matchedDemo = Object.values(DEMO_PRESET_USERS).find(
      (u) => u.email.toLowerCase() === normalizedEmail,
    )

    if (matchedDemo && pass === matchedDemo.pass) {
      try {
        // Try Firebase Auth login first
        const userCredential = await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          pass,
        )
        setUser(userCredential.user)
        const profile = await fetchProfile(
          userCredential.user.uid,
          normalizedEmail,
          matchedDemo.name,
        )
        setCustomUser(profile)
        setLoading(false)
        return userCredential.user
      } catch {
        // If not in Firebase Auth, attempt auto-registration in Firebase Auth
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            pass,
          )
          await updateProfile(userCredential.user, {
            displayName: matchedDemo.name,
          })
          const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid)
          const demoDoc = {
            uid: userCredential.user.uid,
            id: userCredential.user.uid,
            name: matchedDemo.name,
            email: normalizedEmail,
            phone: matchedDemo.phone,
            role: matchedDemo.role,
            status: "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
          await setDoc(userDocRef, demoDoc).catch(() => {})
          setUser(userCredential.user)
          setCustomUser(demoDoc as any)
          setLoading(false)
          return userCredential.user
        } catch {
          // Guaranteed offline demo session fallback for presentations
          const sessionObj = {
            uid: matchedDemo.uid,
            id: matchedDemo.uid,
            email: matchedDemo.email,
            displayName: matchedDemo.name,
            name: matchedDemo.name,
            phone: matchedDemo.phone,
            role: matchedDemo.role,
            status: "active",
          }
          localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(sessionObj))
          setUser(sessionObj)
          setCustomUser(sessionObj as any)
          setLoading(false)
          return sessionObj
        }
      }
    }

    // Standard User Login
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        pass,
      )
      setUser(userCredential.user)
      await fetchProfile(
        userCredential.user.uid,
        userCredential.user.email || "",
        userCredential.user.displayName || "",
      )
      setLoading(false)
      return userCredential.user
    } catch (err: any) {
      setLoading(false)
      throw err
    }
  }

  const register = async (
    name: string,
    email: string,
    pass: string,
    phone: string = "",
    confirmPass?: string,
  ) => {
    setLoading(true)
    if (confirmPass !== undefined && pass !== confirmPass) {
      setLoading(false)
      throw new Error("Passwords do not match. Please re-enter your password.")
    }
    if (pass.length < 8) {
      setLoading(false)
      throw new Error("Password must be at least 8 characters long.")
    }
    const normalizedEmail = email.trim().toLowerCase()
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        pass,
      )
      await updateProfile(userCredential.user, { displayName: name.trim() })
      await sendEmailVerification(userCredential.user).catch(() => {})

      // Create permanent record in 'users' collection
      const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid)
      const userProfile = {
        uid: userCredential.user.uid,
        id: userCredential.user.uid,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        mobile: phone.trim(),
        role:
          normalizedEmail === "admin@gmail.com" ? ROLES.ADMIN : ROLES.STUDENT,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      await setDoc(userDocRef, userProfile).catch(() => {})

      setUser(userCredential.user)
      setCustomUser(userProfile as any)
      setLoading(false)
      return userCredential.user
    } catch (err: any) {
      setLoading(false)
      throw err
    }
  }

  const logout = async () => {
    localStorage.removeItem(DEMO_SESSION_KEY)
    await signOut(auth).catch(() => {})
    setUser(null)
    setCustomUser(null)
  }

  const refreshProfile = async () => {
    if (user?.uid) {
      await fetchProfile(user.uid, user.email, user.displayName)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        customUser,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
