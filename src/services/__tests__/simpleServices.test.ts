import { describe, it, expect } from "vitest"
import { SimpleItemService } from "../simpleItem.service"
import { SimpleMatchingService } from "../simpleMatching.service"
import { Item } from "../../types/Item"

describe("CampusRecover AI Simplified Services", () => {
  it("generates correct reference number formats", () => {
    const lostRef = SimpleItemService.generateReferenceNumber("LOST")
    const foundRef = SimpleItemService.generateReferenceNumber("FOUND")

    expect(lostRef).toMatch(/^CR-LST-\d{4}$/)
    expect(foundRef).toMatch(/^CR-FND-\d{4}$/)
  })

  it("accurately scores matching items with high confidence", async () => {
    const lostItem: Item = {
      id: "lost-1",
      referenceNumber: "CR-LST-1001",
      type: "LOST",
      userId: "user-a",
      userName: "Alex",
      userEmail: "alex@college.edu",
      itemName: "Black Leather Wallet",
      category: "wallets",
      description: "Black leather wallet with college ID and cards",
      location: "CSE Block",
      color: "Black",
      brand: "Fossil",
      date: "2026-09-30",
      status: "pending",
      createdAt: null,
      updatedAt: null,
    }

    const foundItem: Item = {
      id: "found-1",
      referenceNumber: "CR-FND-1054",
      type: "FOUND",
      userId: "user-b",
      userName: "Sam",
      userEmail: "sam@college.edu",
      itemName: "Black Leather Wallet",
      category: "wallets",
      description: "Black leather wallet found near CSE Block ground floor",
      location: "CSE Block",
      color: "Black",
      brand: "Fossil",
      date: "2026-09-30",
      status: "pending",
      createdAt: null,
      updatedAt: null,
    }

    const result = await SimpleMatchingService.compareItems(lostItem, foundItem)

    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.confidence).toBe("high")
    expect(result.reason).toContain("Black")
  })

  it("heavily discounts completely incompatible categories", async () => {
    const lostLaptop: Item = {
      id: "lost-2",
      referenceNumber: "CR-LST-2002",
      type: "LOST",
      userId: "user-a",
      userName: "Alex",
      userEmail: "alex@college.edu",
      itemName: "MacBook Pro",
      category: "electronics",
      description: "Silver 14-inch laptop with stickers",
      location: "Library",
      color: "Silver",
      date: "2026-09-30",
      status: "pending",
      createdAt: null,
      updatedAt: null,
    }

    const foundBottle: Item = {
      id: "found-2",
      referenceNumber: "CR-FND-2003",
      type: "FOUND",
      userId: "user-c",
      userName: "Charlie",
      userEmail: "charlie@college.edu",
      itemName: "Water Bottle",
      category: "water_bottles",
      description: "Hydroflask bottle",
      location: "Library",
      color: "Silver",
      date: "2026-09-30",
      status: "pending",
      createdAt: null,
      updatedAt: null,
    }

    const result = await SimpleMatchingService.compareItems(
      lostLaptop,
      foundBottle,
    )

    expect(result.score).toBeLessThan(60)
    expect(result.confidence).toBe("low")
  })
})
