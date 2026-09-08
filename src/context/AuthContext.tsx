import { createContext, useContext, useEffect, useState } from "react"

import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth"
import { auth } from "../config/firebase"
import { UserService } from "../services/firebase/user.service"
import { User as CustomUser } from "../types/User"

type AuthContextType = {
  user: FirebaseUser | null
  customUser: CustomUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  customUser: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [customUser, setCustomUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          const profile = await UserService.getUser(currentUser.uid)
          setCustomUser(profile)
        } catch (error) {
          console.error("Failed to fetch custom user profile:", error)
          setCustomUser(null)
        }
      } else {
        setCustomUser(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        customUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
