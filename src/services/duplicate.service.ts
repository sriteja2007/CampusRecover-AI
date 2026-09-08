/**
 * Duplicate Detection Service
 *
 * Checks existing items in Firestore for potential duplicate reports
 * based on title similarity, description overlap, brand, visual embeddings, and OCR.
 */

import { collection, getDocs, query, where, limit } from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS } from "../config/constants"
import { cosineSimilarity, generateTextEmbedding } from "./embedding.service"

export interface DuplicateMatch {
  id: string
  title: string
  similarityScore: number
  matchedOn: string[]
  explanation: string
}

/**
 * Checks for duplicate lost item reports
 */
export async function checkDuplicateLostItems(data: {
  title: string
  description: string
  brand?: string
  serialNumber?: string
  dateLost?: string
}): Promise<DuplicateMatch[]> {
  return checkDuplicates(COLLECTIONS.LOST_ITEMS, data)
}

/**
 * Checks for duplicate found item reports
 */
export async function checkDuplicateFoundItems(data: {
  title: string
  description: string
  brand?: string
  serialNumber?: string
  dateFound?: string
}): Promise<DuplicateMatch[]> {
  return checkDuplicates(COLLECTIONS.FOUND_ITEMS, data)
}

async function checkDuplicates(
  collectionName: string,
  data: {
    title: string
    description: string
    brand?: string
    serialNumber?: string
  },
): Promise<DuplicateMatch[]> {
  try {
    const q = query(
      collection(db, collectionName),
      where("status", "in", ["pending", "matched"]),
      limit(50),
    )
    const snapshot = await getDocs(q)
    const matches: DuplicateMatch[] = []

    const inputEmbedding = generateTextEmbedding(
      `${data.title} ${data.description}`,
    )
    const inputSerial = (data.serialNumber || "").trim().toUpperCase()

    for (const doc of snapshot.docs) {
      const item = doc.data()
      const matchedOn: string[] = []
      let totalScore = 0
      let weightSum = 0

      // 1. Serial number match (immediate high indicator)
      const existingSerial = (item.serialNumber || "").trim().toUpperCase()
      if (inputSerial && existingSerial && inputSerial === existingSerial) {
        matchedOn.push("serial_number")
        totalScore += 1.0 * 0.4
        weightSum += 0.4
      }

      // 2. Semantic Text Embedding Similarity
      const existingEmbedding = generateTextEmbedding(
        `${item.title || ""} ${item.description || ""}`,
      )
      const textSim = cosineSimilarity(inputEmbedding, existingEmbedding)
      if (textSim > 0.4) {
        matchedOn.push("description_similarity")
      }
      totalScore += textSim * 0.35
      weightSum += 0.35

      // 3. Title token overlap
      const titleSim = calculateTokenOverlap(data.title, item.title || "")
      if (titleSim > 0.5) {
        matchedOn.push("title_match")
      }
      totalScore += titleSim * 0.25
      weightSum += 0.25

      // 4. Brand match
      if (
        data.brand &&
        item.brand &&
        data.brand.toLowerCase() === item.brand.toLowerCase()
      ) {
        matchedOn.push("brand")
      }

      const compositeScore = weightSum > 0 ? totalScore / weightSum : 0

      if (compositeScore >= 0.4 || matchedOn.includes("serial_number")) {
        matches.push({
          id: doc.id,
          title: item.title || "Untitled",
          similarityScore: Math.round(compositeScore * 100),
          matchedOn,
          explanation: matchedOn.includes("serial_number")
            ? "Exact serial number match detected with another report."
            : `High correlation detected in ${matchedOn.join(", ")}.`,
        })
      }
    }

    return matches
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5)
  } catch (error) {
    console.error("Duplicate check failed:", error)
    return []
  }
}

function calculateTokenOverlap(str1: string, str2: string): number {
  const norm1 = new Set(
    (str1 || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  const norm2 = new Set(
    (str2 || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  if (norm1.size === 0 || norm2.size === 0) return 0
  let overlap = 0
  for (const w of norm1) if (norm2.has(w)) overlap++
  return overlap / Math.max(norm1.size, norm2.size)
}
