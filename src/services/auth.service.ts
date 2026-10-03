/**
 * Secure Authentication & Authorization Service for CampusRecoverAI
 *
 * Implements:
 * - Secure registration flow with password confirmation and validation
 * - Account status verification on login (blocking SUSPENDED users)
 * - Anti-enumeration forgot password with generic response
 * - Password reset token validation and confirmation
 * - Email verification lifecycle
 * - Rate limiting on sensitive auth endpoints
 * - Role & Ownership assertion guards: requireAuth(), requireRole(), requireOwnership()
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../config/firebase"
import { COLLECTIONS, ROLES } from "../config/constants"
import { User, UserRole, UserStatus } from "../types/database.models"
import { RateLimiter } from "./rateLimiter.service"

export class AccountSuspendedError extends Error {
  constructor(message: string = "Your account has been suspended by campus administration. Please contact campus security.") {
    super(message)
    this.name = "AccountSuspendedError"
  }
}

export class RateLimitExceededError extends Error {
  constructor(public retryAfterMs: number = 60000) {
    super(`Too many attempts. Please try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`)
    this.name = "RateLimitExceededError"
  }
}

export class AuthValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthValidationError"
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized access.") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

const googleProvider = new GoogleAuthProvider()

export const AuthService = {
  /**
   * Secure User Registration
   * Validates name, email, password strength, and confirmation.
   * Creates Firebase user, generates profile in Firestore, and issues email verification.
   */
  async register(
    name: string,
    email: string,
    password: string,
    confirmPassword?: string,
    phone: string = "",
  ): Promise<FirebaseUser> {
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    // 1. Input Validation
    if (!cleanName || cleanName.length < 2) {
      throw new AuthValidationError("Name must be at least 2 characters long.")
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new AuthValidationError("Please provide a valid institutional email address.")
    }
    if (!password || password.length < 8) {
      throw new AuthValidationError("Password must be at least 8 characters long.")
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      throw new AuthValidationError("Passwords do not match. Please re-enter your password.")
    }

    // 2. Rate Limiting Check
    const rateCheck = RateLimiter.check(`register:${cleanEmail}`, RateLimiter.STANDARD_LIMITS.AUTH_REGISTER)
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(rateCheck.retryAfterMs)
    }

    // 3. Create Firebase User
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
    const user = userCredential.user

    await updateProfile(user, { displayName: cleanName })

    // 4. Initialize Profile in 'users' collection with status ACTIVE
    const isInitialAdmin = cleanEmail === "admin@gmail.com"
    const userDoc: User = {
      id: user.uid,
      name: cleanName,
      email: cleanEmail,
      role: (isInitialAdmin ? "ADMIN" : "STUDENT") as UserRole,
      status: "ACTIVE" as UserStatus,
      emailVerified: false,
      phone: phone.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        ...userDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("User profile Firestore write notice:", err)
    }

    // 5. Send Verification Email
    try {
      await sendEmailVerification(user)
    } catch (emailErr) {
      console.warn("Verification email notice:", emailErr)
    }

    return user
  },

  /**
   * Secure User Login
   * Validates credentials and verifies that account status is NOT SUSPENDED.
   * If SUSPENDED, signs out immediately and throws AccountSuspendedError.
   */
  async login(email: string, password: string): Promise<{ user: FirebaseUser; profile: User }> {
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      throw new AuthValidationError("Email and password are required.")
    }

    // Rate limiting check
    const rateCheck = RateLimiter.check(`login:${cleanEmail}`, RateLimiter.STANDARD_LIMITS.AUTH_LOGIN)
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(rateCheck.retryAfterMs)
    }

    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
    const user = userCredential.user

    // Fetch account status from Firestore
    let profile: User | null = null
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.USERS, user.uid))
      if (snap.exists()) {
        profile = { id: snap.id, ...snap.data() } as User
      }
    } catch (err) {
      console.warn("Failed fetching user profile on login:", err)
    }

    // Account Status Guard: Check if SUSPENDED
    if (profile && profile.status === "SUSPENDED") {
      await signOut(auth)
      throw new AccountSuspendedError()
    }

    // Reset rate limiter on successful authentication
    RateLimiter.reset(`login:${cleanEmail}`)

    const fallbackProfile: User = profile || {
      id: user.uid,
      name: user.displayName || cleanEmail.split("@")[0],
      email: cleanEmail,
      role: cleanEmail === "admin@gmail.com" ? "ADMIN" : "STUDENT",
      status: "ACTIVE",
      emailVerified: user.emailVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return { user, profile: fallbackProfile }
  },

  /**
   * Google OAuth Login
   */
  async googleLogin(): Promise<FirebaseUser> {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid)
    const snap = await getDoc(userDocRef)
    if (!snap.exists()) {
      const newProfile: User = {
        id: user.uid,
        name: user.displayName || "Google User",
        email: user.email || "",
        role: user.email?.toLowerCase() === "admin@gmail.com" ? "ADMIN" : "STUDENT",
        status: "ACTIVE",
        emailVerified: user.emailVerified,
        avatarUrl: user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(() => {})
    } else {
      const data = snap.data() as User
      if (data.status === "SUSPENDED") {
        await signOut(auth)
        throw new AccountSuspendedError()
      }
    }

    return user
  },

  /**
   * User Logout: Invalidate session and clear cached tokens
   */
  async logout(): Promise<void> {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("campusrecover_demo_session")
    }
    await signOut(auth)
  },

  /**
   * Forgot Password
   * Anti-enumeration: ALWAYS returns generic success message so email existence is not leaked.
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new AuthValidationError("Please enter a valid institutional email address.")
    }

    // Rate limiting check
    const rateCheck = RateLimiter.check(`pwd_reset:${cleanEmail}`, RateLimiter.STANDARD_LIMITS.PASSWORD_RESET)
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(rateCheck.retryAfterMs)
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail)
    } catch (err: any) {
      // Intentionally do NOT leak user existence; log internally only
      console.warn("sendPasswordResetEmail internal trace:", err.code)
    }

    return {
      success: true,
      message: "If an account exists for this campus email, a secure password reset link has been sent.",
    }
  },

  /**
   * Reset Password: Validate incoming token
   */
  async verifyResetToken(token: string): Promise<string> {
    if (!token) throw new AuthValidationError("Invalid or missing password reset token.")
    try {
      const email = await verifyPasswordResetCode(auth, token)
      return email
    } catch {
      throw new AuthValidationError("This password reset link has expired or has already been used.")
    }
  },

  /**
   * Reset Password: Set new password and invalidate token
   */
  async confirmResetPassword(token: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new AuthValidationError("New password must be at least 8 characters long.")
    }
    try {
      await confirmPasswordReset(auth, token, newPassword)
    } catch {
      throw new AuthValidationError("Failed to reset password. The link may have expired.")
    }
  },

  /**
   * Resend Verification Email
   */
  async sendVerificationEmail(): Promise<void> {
    if (!auth.currentUser) throw new UnauthorizedError("You must be signed in to request verification.")
    await sendEmailVerification(auth.currentUser)
  },

  /**
   * Check if Current User Email is Verified
   */
  async checkEmailVerified(): Promise<boolean> {
    if (!auth.currentUser) return false
    await auth.currentUser.reload()
    return auth.currentUser.emailVerified
  },

  // ==========================================
  // AUTHORIZATION GUARDS (Never rely on client-side state)
  // ==========================================
  /**
   * requireAuth() Guard
   */
  requireAuth(user: any | null): void {
    if (!user || !user.uid) {
      throw new UnauthorizedError("Authentication required to access this resource.")
    }
  },

  /**
   * requireRole() Guard
   */
  requireRole(profile: User | null, allowedRole: UserRole | UserRole[]): void {
    if (!profile) {
      throw new UnauthorizedError("Authentication required.")
    }
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole]
    if (!roles.includes(profile.role) && profile.role !== "ADMIN") {
      throw new UnauthorizedError(`Forbidden: Requires ${roles.join(" or ")} role.`)
    }
  },

  /**
   * requireOwnership() Guard
   */
  requireOwnership(profile: User | null, resourceOwnerId: string): void {
    if (!profile) {
      throw new UnauthorizedError("Authentication required.")
    }
    // Admins bypass ownership check
    if (profile.role === "ADMIN") return

    if (profile.id !== resourceOwnerId) {
      throw new UnauthorizedError("Forbidden: You do not have permission to modify this resource.")
    }
  },
}

export default AuthService
