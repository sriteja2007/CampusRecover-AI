import { describe, it, expect } from "vitest"
import { generateClaimReceipt } from "../../utils/receiptGenerator"
import { Claim } from "../../types/Claim"

describe("Receipt Generator Cryptographic Audit", () => {
  const dummyClaim: Claim = {
    id: "CLM-TEST-001",
    lostItemId: "LOST-99",
    foundItemId: "FOUND-99",
    claimantId: "user_claimant_123",
    finderId: "user_finder_456",
    status: "resolved",
    verifiedMethods: ["otp", "qr", "student_id"],
    verificationNotes: "Verified at Campus Security Desk",
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
  }

  it("should generate a complete printable HTML certificate", () => {
    const html = generateClaimReceipt(
      dummyClaim,
      "Apple MacBook Pro Space Gray",
    )

    expect(html).toContain("Item Custody Release Receipt")
    expect(html).toContain("CLM-TEST-001")
    expect(html).toContain("LOST-99")
    expect(html).toContain("FOUND-99")
    expect(html).toContain("user_finder_456")
  })

  it("should include cryptographic seal verification block", () => {
    const html = generateClaimReceipt(dummyClaim)
    expect(html).toContain("CRYPTOGRAPHIC SEAL: CR-SEAL-")
    expect(html).toContain("FERPA COMPLIANT")
    expect(html).toContain("Official Handover Certificate")
  })
})
