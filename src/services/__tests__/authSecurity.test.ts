import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  AuthService,
  AuthValidationError,
  AccountSuspendedError,
  UnauthorizedError,
  RateLimitExceededError,
} from "../auth.service"
import { RateLimiter } from "../rateLimiter.service"
import { DatabaseService, DatabaseConstraintError } from "../database/db.service"
import { User } from "../../types/database.models"

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>()
  return {
    ...actual,
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  }
})

describe("Secure Authentication & Authorization Suite", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear()
    }
  })

  // ==========================================
  // 1. REGISTRATION VALIDATION
  // ==========================================
  describe("Registration Flow & Validations", () => {
    it("rejects registration if password confirmation does not match", async () => {
      await expect(
        AuthService.register(
          "Alex Johnson",
          "alex@campus.edu",
          "Password123!",
          "DifferentPassword456!",
        ),
      ).rejects.toThrow(AuthValidationError)
    })

    it("rejects registration if password is shorter than 8 characters", async () => {
      await expect(
        AuthService.register(
          "Alex Johnson",
          "alex@campus.edu",
          "Short7!",
          "Short7!",
        ),
      ).rejects.toThrow("Password must be at least 8 characters long.")
    })

    it("rejects registration if email format is invalid", async () => {
      await expect(
        AuthService.register(
          "Alex Johnson",
          "notanemail",
          "Password123!",
          "Password123!",
        ),
      ).rejects.toThrow("Please provide a valid institutional email address.")
    })

    it("rejects registration if name is empty", async () => {
      await expect(
        AuthService.register(
          " ",
          "alex@campus.edu",
          "Password123!",
          "Password123!",
        ),
      ).rejects.toThrow("Name must be at least 2 characters long.")
    })
  })

  // ==========================================
  // 2. FORGOT PASSWORD (ANTI-ENUMERATION)
  // ==========================================
  describe("Forgot Password Flow", () => {
    it("always shows a generic response so email existence is not exposed", async () => {
      const result1 = await AuthService.forgotPassword("existing@campus.edu")
      expect(result1.success).toBe(true)
      expect(result1.message).toContain("If an account exists for this campus email")

      const result2 = await AuthService.forgotPassword("nonexistent_unknown_user_99@campus.edu")
      expect(result2.success).toBe(true)
      expect(result2.message).toContain("If an account exists for this campus email")
    })

    it("enforces rate limiting on password reset requests", async () => {
      const email = "ratelimit_test@campus.edu"
      // Consume 3 allowed reset requests
      await AuthService.forgotPassword(email)
      await AuthService.forgotPassword(email)
      await AuthService.forgotPassword(email)

      // 4th attempt exceeds maxRequests = 3
      await expect(AuthService.forgotPassword(email)).rejects.toThrow(RateLimitExceededError)
    })
  })

  // ==========================================
  // 3. RESET PASSWORD VALIDATION
  // ==========================================
  describe("Reset Password Flow", () => {
    it("rejects empty or missing reset tokens", async () => {
      await expect(AuthService.verifyResetToken("")).rejects.toThrow(AuthValidationError)
    })

    it("rejects short passwords during reset", async () => {
      await expect(
        AuthService.confirmResetPassword("dummy_token", "short"),
      ).rejects.toThrow("New password must be at least 8 characters long.")
    })
  })

  // ==========================================
  // 4. AUTHORIZATION GUARDS & CORE SECURITY TESTS
  // ==========================================
  describe("Authorization Guards & Invariants", () => {
    const studentUser: User = {
      id: "student_01",
      name: "Alex Johnson",
      email: "alex@campus.edu",
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const adminUser: User = {
      id: "admin_01",
      name: "Campus Security Lead",
      email: "admin@gmail.com",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const suspendedUser: User = {
      id: "suspended_01",
      name: "Suspended Student",
      email: "suspended@campus.edu",
      role: "STUDENT",
      status: "SUSPENDED",
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // TEST 1: Unauthenticated user cannot access dashboard
    it("Test 1: unauthenticated user cannot access dashboard (requireAuth fails)", () => {
      expect(() => AuthService.requireAuth(null)).toThrow(UnauthorizedError)
      expect(() => AuthService.requireAuth({})).toThrow("Authentication required to access this resource.")
      // When valid user is passed, it does not throw
      expect(() => AuthService.requireAuth({ uid: "user_123" })).not.toThrow()
    })

    // TEST 2: Student cannot access admin
    it("Test 2: student cannot access admin (requireRole('ADMIN') fails for STUDENT)", () => {
      // Student is blocked
      expect(() => AuthService.requireRole(studentUser, "ADMIN")).toThrow(UnauthorizedError)
      expect(() => AuthService.requireRole(studentUser, "ADMIN")).toThrow("Forbidden: Requires ADMIN role.")

      // Admin is permitted
      expect(() => AuthService.requireRole(adminUser, "ADMIN")).not.toThrow()
    })

    // TEST 3: Suspended user cannot create reports
    it("Test 3: suspended user cannot create reports", async () => {
      await expect(
        DatabaseService.createItem(
          {
            reporterId: suspendedUser.id,
            type: "LOST",
            status: "ACTIVE",
            title: "Black Earbuds",
            description: "Lost in hallway",
            categoryId: "cat_electronics",
            location: "Main Gate",
            eventDate: "2026-10-02",
          },
          suspendedUser,
        ),
      ).rejects.toThrow(DatabaseConstraintError)
      await expect(
        DatabaseService.createItem(
          {
            reporterId: suspendedUser.id,
            type: "LOST",
            status: "ACTIVE",
            title: "Black Earbuds",
            description: "Lost in hallway",
            categoryId: "cat_electronics",
            location: "Main Gate",
            eventDate: "2026-10-02",
          },
          suspendedUser,
        ),
      ).rejects.toThrow("Suspended users cannot create reports.")
    })

    // TEST 4: Ownership Guard
    it("requireOwnership allows resource owner or admin, but blocks third-party users", () => {
      // Owner accessing their own item
      expect(() => AuthService.requireOwnership(studentUser, "student_01")).not.toThrow()

      // Other student accessing someone else's item
      expect(() => AuthService.requireOwnership(studentUser, "other_student_99")).toThrow(UnauthorizedError)

      // Admin can access any item
      expect(() => AuthService.requireOwnership(adminUser, "student_01")).not.toThrow()
      expect(() => AuthService.requireOwnership(adminUser, "other_student_99")).not.toThrow()
    })
  })
})
