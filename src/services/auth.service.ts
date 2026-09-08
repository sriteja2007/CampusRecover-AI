import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth"

import { auth } from "../config/firebase"

const googleProvider = new GoogleAuthProvider()

export const AuthService = {
  async register(name: string, email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,

      email,

      password,
    )

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: name,
      })

      await sendEmailVerification(auth.currentUser)
    }

    return userCredential.user
  },

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      auth,

      email,

      password,
    )

    return userCredential.user
  },

  async googleLogin() {
    const result = await signInWithPopup(auth, googleProvider)

    return result.user
  },

  async logout() {
    await signOut(auth)
  },

  async sendVerification() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
    }
  },
}
