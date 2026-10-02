import { describe, it, expect, beforeEach } from "vitest"
import { MigrationRunner } from "../migrations/runner"
import { DatabaseService, DatabaseConstraintError } from "../../services/database/db.service"
import { User, Item } from "../../types/database.models"

describe("CampusRecoverAI Database Migrations & Business Rules", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear()
    }
  })

  // ====================================================
  // TEST SUITE 1: EXECUTE ALL DATABASE MIGRATIONS
  // ====================================================
  it("executes all 5 migrations in sequence successfully", async () => {
    const results = await MigrationRunner.runAllMigrations()

    expect(results).toHaveLength(5)
    expect(results.every((r) => r.success)).toBe(true)

    // Verify Migration 001: Standard Categories
    const categories = await DatabaseService.getCategories()
    expect(categories.length).toBeGreaterThanOrEqual(9)
    const categoryNames = categories.map((c) => c.name)
    expect(categoryNames).toContain("Electronics")
    expect(categoryNames).toContain("Bags")
    expect(categoryNames).toContain("Books")
    expect(categoryNames).toContain("ID Cards")
    expect(categoryNames).toContain("Keys")

    // Verify Migration 005: Audit Log Created
    const logs = await DatabaseService.getAuditLogs()
    expect(logs.length).toBeGreaterThanOrEqual(1)
    expect(logs[0].action).toBe("DATABASE_MIGRATION_COMPLETED")
  }, 25000)

  // ====================================================
  // TEST SUITE 2: BUSINESS RULES & CONSTRAINTS ENFORCEMENT
  // ====================================================
  describe("10 Core Database Business Rules", () => {
    const activeStudent: User = {
      id: "student_active_01",
      name: "John Doe",
      email: "john@campus.edu",
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const otherStudent: User = {
      id: "student_other_02",
      name: "Jane Smith",
      email: "jane@campus.edu",
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const suspendedUser: User = {
      id: "user_suspended_03",
      name: "Bad Actor",
      email: "banned@campus.edu",
      role: "STUDENT",
      status: "SUSPENDED",
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const adminUser: User = {
      id: "admin_security_01",
      name: "Security Lead",
      email: "security@campus.edu",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Rule 2: Suspended users cannot create reports
    it("Rule 2: blocks suspended users from creating reports", async () => {
      await expect(
        DatabaseService.createItem(
          {
            reporterId: suspendedUser.id,
            type: "LOST",
            status: "ACTIVE",
            title: "Black Backpack",
            description: "Lost in library",
            categoryId: "cat_bags",
            location: "Library",
            eventDate: "2026-10-01",
          },
          suspendedUser,
        ),
      ).rejects.toThrow(DatabaseConstraintError)
    })

    // Rule 1 & Rule 10: User can edit only their own active reports & untrusted client transitions
    it("Rule 1 & 10: user can edit only their own active reports and cannot forge status", async () => {
      const item = await DatabaseService.createItem(
        {
          reporterId: activeStudent.id,
          type: "LOST",
          status: "ACTIVE",
          title: "Blue Notebook",
          description: "Math notes",
          categoryId: "cat_books",
          location: "Classroom 101",
          eventDate: "2026-10-02",
        },
        activeStudent,
      )

      // Another user attempts to edit
      await expect(
        DatabaseService.updateItem(
          item.id,
          { description: "Hacked description" },
          otherStudent.id,
          "STUDENT",
        ),
      ).rejects.toThrow("Permission denied: User can edit only their own reports.")

      // Owner attempts to forge status transition to RETURNED without admin review
      await expect(
        DatabaseService.updateItem(
          item.id,
          { status: "RETURNED" },
          activeStudent.id,
          "STUDENT",
        ),
      ).rejects.toThrow("Invalid status transition")

      // Owner can edit their own active report details
      const edited = await DatabaseService.updateItem(
        item.id,
        { description: "Updated math notebook details" },
        activeStudent.id,
        "STUDENT",
      )
      expect(edited.description).toBe("Updated math notebook details")
    })

    // Rule 3: Suspended users cannot submit claims
    it("Rule 3: blocks suspended users from submitting claims", async () => {
      const item = await DatabaseService.createItem(
        {
          reporterId: activeStudent.id,
          type: "FOUND",
          status: "ACTIVE",
          title: "Casio Watch",
          description: "Silver digital watch",
          categoryId: "cat_accessories",
          location: "Gymnasium",
          eventDate: "2026-10-02",
        },
        activeStudent,
      )

      await expect(
        DatabaseService.createClaim(
          {
            itemId: item.id,
            claimantId: suspendedUser.id,
            reason: "It's my watch",
            identifyingDetails: "Scratched back plate",
            privateVerification: "Alarm is set to 6:30 AM",
          },
          suspendedUser,
        ),
      ).rejects.toThrow("Suspended users cannot submit claims.")
    })

    // Rule 4: Users cannot claim their own found report
    it("Rule 4: users cannot submit a claim on their own reported item", async () => {
      const foundItem = await DatabaseService.createItem(
        {
          reporterId: activeStudent.id,
          type: "FOUND",
          status: "ACTIVE",
          title: "EarPods Pro Case",
          description: "White case found in cafeteria",
          categoryId: "cat_electronics",
          location: "Cafeteria",
          eventDate: "2026-10-02",
        },
        activeStudent,
      )

      await expect(
        DatabaseService.createClaim(
          {
            itemId: foundItem.id,
            claimantId: activeStudent.id, // Self-claim attempt
            reason: "Trying to claim my own report",
            identifyingDetails: "Has my name",
            privateVerification: "Serial inside lid",
          },
          activeStudent,
        ),
      ).rejects.toThrow("Users cannot submit a claim on their own reported item.")
    })

    // Rule 5: Returned items cannot receive new claims
    it("Rule 5: returned or closed items cannot receive new claims", async () => {
      const returnedItem = await DatabaseService.createItem(
        {
          reporterId: otherStudent.id,
          type: "FOUND",
          status: "RETURNED", // Already recovered/returned
          title: "Keys with Red Lanyard",
          description: "Dorm keys",
          categoryId: "cat_keys",
          location: "Hostel Gate",
          eventDate: "2026-10-01",
        },
        otherStudent,
      )

      await expect(
        DatabaseService.createClaim(
          {
            itemId: returnedItem.id,
            claimantId: activeStudent.id,
            reason: "My lost dorm keys",
            identifyingDetails: "Brass key and bicycle key",
            privateVerification: "Room 304 engraved",
          },
          activeStudent,
        ),
      ).rejects.toThrow("Returned or closed items cannot receive new claims.")
    })

    // Rule 6 & Rule 8: Only admins can approve/reject claims; every admin action creates an audit log
    it("Rule 6 & 8: only admins can approve/reject claims and creates audit log", async () => {
      const item = await DatabaseService.createItem(
        {
          reporterId: otherStudent.id,
          type: "FOUND",
          status: "ACTIVE",
          title: "Wallet with ID",
          description: "Brown leather wallet",
          categoryId: "cat_accessories",
          location: "Auditorium",
          eventDate: "2026-10-02",
        },
        otherStudent,
      )

      const claim = await DatabaseService.createClaim(
        {
          itemId: item.id,
          claimantId: activeStudent.id,
          reason: "I lost my brown wallet during orientation",
          identifyingDetails: "Driver license inside",
          privateVerification: "Library card number ending in 9081 inside zipped flap",
        },
        activeStudent,
      )

      // Student tries to approve their own claim
      await expect(
        DatabaseService.reviewClaim(claim.id, "APPROVED", "Self approve", activeStudent.id, "STUDENT"),
      ).rejects.toThrow("Only administrators can approve or reject claims.")

      const auditLogsBefore = (await DatabaseService.getAuditLogs()).length

      // Admin approves the claim
      const reviewed = await DatabaseService.reviewClaim(
        claim.id,
        "APPROVED",
        "Private library card number matched records.",
        adminUser.id,
        "ADMIN",
      )
      expect(reviewed.status).toBe("APPROVED")
      expect(reviewed.reviewedBy).toBe(adminUser.id)

      // Rule 8 check: audit log incremented
      const auditLogsAfter = (await DatabaseService.getAuditLogs()).length
      expect(auditLogsAfter).toBeGreaterThan(auditLogsBefore)
    }, 20000)

    // Rule 7: Only admins can mark recovery complete
    it("Rule 7: only admins can mark recovery complete", async () => {
      const item = await DatabaseService.createItem(
        {
          reporterId: otherStudent.id,
          type: "FOUND",
          status: "ACTIVE",
          title: "Glasses Case",
          description: "Black rayban case",
          categoryId: "cat_accessories",
          location: "Library",
          eventDate: "2026-10-02",
        },
        otherStudent,
      )

      const claim = await DatabaseService.createClaim(
        {
          itemId: item.id,
          claimantId: activeStudent.id,
          reason: "My glasses case",
          identifyingDetails: "Has micro cloth",
          privateVerification: "Prescription slip inside",
        },
        activeStudent,
      )

      const recovery = await DatabaseService.createRecoveryRecord(
        item.id,
        claim.id,
        adminUser.id,
        "Main Security Post",
      )

      // Student tries to complete recovery
      await expect(
        DatabaseService.completeRecovery(recovery.id, activeStudent.id, "STUDENT"),
      ).rejects.toThrow("Only administrators can mark recovery complete.")

      // Admin completes recovery
      const completed = await DatabaseService.completeRecovery(
        recovery.id,
        adminUser.id,
        "ADMIN",
        "ID checked and physical handover completed.",
      )
      expect(completed.status).toBe("COMPLETED")
      expect(completed.completedAt).toBeDefined()
    }, 20000)

    // MATCH requirement: MATCH must never automatically approve ownership
    it("Match requirement: match creation status is SUGGESTED and never APPROVED", async () => {
      const match = await DatabaseService.createMatch(
        "item_lost_01",
        "item_found_01",
        95, // High similarity
        ["Brand identical: Apple", "Color identical: Space Gray"],
      )

      expect(match.status).toBe("SUGGESTED")
      expect(match.status).not.toBe("CONFIRMED")
      expect((match as any).status).not.toBe("APPROVED")
    })
  })
})
