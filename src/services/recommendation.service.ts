import { FirestoreService } from "./firebase/firestore.service"
import { COLLECTIONS } from "../config/constants"
import { where, orderBy, limit } from "firebase/firestore"
import { LostItem } from "../types/LostItem"
import { FoundItem } from "../types/FoundItem"

export const RecommendationService = {
  /**
   * Get recently reported lost items
   */
  async getRecentlyLost(maxItems: number = 5): Promise<LostItem[]> {
    return FirestoreService.queryCollection<LostItem>(
      COLLECTIONS.LOST_ITEMS,
      where("status", "in", ["pending", "matched"]),
      orderBy("createdAt", "desc"),
      limit(maxItems),
    )
  },

  /**
   * Get recently reported found items
   */
  async getRecentlyFound(maxItems: number = 5): Promise<FoundItem[]> {
    return FirestoreService.queryCollection<FoundItem>(
      COLLECTIONS.FOUND_ITEMS,
      where("status", "in", ["pending", "matched"]),
      orderBy("createdAt", "desc"),
      limit(maxItems),
    )
  },

  /**
   * Get similar items based on category and color
   * If viewing a lost item, we recommend found items.
   * If viewing a found item, we recommend lost items.
   */
  async getSimilarItems(
    item: LostItem | FoundItem,
    itemType: "lost" | "found",
    maxItems: number = 4,
  ): Promise<(LostItem | FoundItem)[]> {
    const targetCollection =
      itemType === "lost" ? COLLECTIONS.FOUND_ITEMS : COLLECTIONS.LOST_ITEMS

    // Primary query by category
    const similarItems =
      await FirestoreService.queryCollection<LostItem | FoundItem>(
        targetCollection,
        where("status", "in", ["pending", "matched"]),
        where("category", "==", item.category),
        orderBy("createdAt", "desc"),
        limit(20),
      )

    // Sort further by color match or building
    const locationField = itemType === "lost" ? "locationFound" : "locationLost"
    const myLocation =
      itemType === "lost"
        ? (item as LostItem).locationLost
        : (item as FoundItem).locationFound

    const scoredItems = similarItems
      .filter((sim) => sim.id !== item.id)
      .map((sim) => {
        let score = 0
        if (
          sim.color &&
          item.color &&
          sim.color.toLowerCase() === item.color.toLowerCase()
        )
          score += 2

        const simLoc = (sim as any)[locationField] || ""
        if (
          simLoc &&
          myLocation &&
          simLoc.toLowerCase() === myLocation.toLowerCase()
        )
          score += 1

        return { item: sim, score }
      })

    scoredItems.sort((a, b) => b.score - a.score)

    return scoredItems.slice(0, maxItems).map((s) => s.item)
  },
}
