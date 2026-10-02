import { describe, it, expect, beforeEach } from "vitest"
import { SimpleClaimService } from "../simpleClaim.service"
import { SimpleFlagService } from "../simpleFlag.service"

describe("SimpleClaimService & SimpleFlagService", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("creates a claim with private verification details securely stored", async () => {
    const claim = await SimpleClaimService.createClaim({
      itemId: "item-101",
      itemTitle: "Scientific Calculator",
      itemReference: "CR-FND-1050",
      itemType: "FOUND",
      claimantId: "user-123",
      claimantName: "Rohit Sharma",
      claimantEmail: "rohit@mvgrce.edu.in",
      reason: "Lost it in 2nd floor lab",
      uniqueCharacteristics: "Sticker on backside",
      privateVerificationDetails: "Secret lock PIN hint and serial ending in 42",
      contactPreference: "email",
    })

    expect(claim.id).toBeDefined()
    expect(claim.status).toBe("pending")
    expect(claim.privateVerificationDetails).toBe("Secret lock PIN hint and serial ending in 42")
    expect(claim.itemReference).toBe("CR-FND-1050")

    // Retrieve claims
    const userClaims = await SimpleClaimService.getClaims({ claimantId: "user-123" })
    expect(userClaims.length).toBeGreaterThanOrEqual(1)
    expect(userClaims[0].itemId).toBe("item-101")
  })

  it("reviews a claim to approved status and attaches handover codes", async () => {
    const claim = await SimpleClaimService.createClaim({
      itemId: "item-102",
      itemTitle: "Blue Backpack",
      itemReference: "CR-FND-2010",
      itemType: "FOUND",
      claimantId: "user-456",
      claimantName: "Ananya",
      claimantEmail: "ananya@mvgrce.edu.in",
      reason: "Left it near cafeteria",
      uniqueCharacteristics: "Keychain attached",
      privateVerificationDetails: "Contains notebook with ID 21331A0512",
    })

    const reviewed = await SimpleClaimService.reviewClaim(claim.id, {
      status: "approved",
      adminId: "admin-1",
      adminName: "Campus Admin",
    })

    expect(reviewed.status).toBe("approved")
    expect(reviewed.otpCode).toBeDefined()
    expect(reviewed.otpCode?.length).toBe(6)
  })

  it("creates and resolves content flags", async () => {
    const flag = await SimpleFlagService.createFlag({
      itemId: "item-999",
      itemTitle: "Lost Umbrella",
      itemReference: "CR-LST-9999",
      reporterId: "user-789",
      reporterEmail: "user@mvgrce.edu.in",
      reason: "already_recovered",
      notes: "This was already returned to the student yesterday.",
    })

    expect(flag.id).toBeDefined()
    expect(flag.status).toBe("pending")
    expect(flag.reason).toBe("already_recovered")

    const flags = await SimpleFlagService.getFlags()
    expect(flags.some((f) => f.id === flag.id)).toBe(true)

    await SimpleFlagService.resolveFlag(flag.id, {
      status: "resolved",
      adminId: "admin-1",
    })

    const updatedFlags = await SimpleFlagService.getFlags()
    const target = updatedFlags.find((f) => f.id === flag.id)
    expect(target?.status).toBe("resolved")
  })
})
