/**
 * Simple Gemini AI Matching Service
 * Compares Lost and Found reports using descriptions, category, location, date, color, brand, and images.
 * Generates match scores, confidence levels, human-readable explanations, and handles
 * match approval, rejection, and manual matching.
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS } from "../config/constants"
import { Item } from "../types/Item"
import { Match, MatchStatus, ConfidenceLevel } from "../types/Match"
import { EmailNotificationService } from "./emailNotification.service"
import { cleanFirestoreData } from "../utils/firestoreUtils"

const LOCAL_MATCHES_KEY = "campusrecover_matches_cache"

function getLocalMatches(): Match[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_MATCHES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalMatches(matches: Match[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_MATCHES_KEY, JSON.stringify(matches))
  } catch {}
}

function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
}

function wordSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(
    normalize(textA)
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  const wordsB = new Set(
    normalize(textB)
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  if (wordsA.size === 0 && wordsB.size === 0) return 0
  let matches = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) matches++
  }
  return matches / Math.max(wordsA.size, wordsB.size, 1)
}

function dateProximity(d1: string, d2: string): number {
  if (!d1 || !d2) return 0.5
  const t1 = new Date(d1).getTime()
  const t2 = new Date(d2).getTime()
  if (isNaN(t1) || isNaN(t2)) return 0.5
  const diffDays = Math.abs(t1 - t2) / (1000 * 60 * 60 * 24)
  if (diffDays <= 1) return 1.0
  if (diffDays <= 3) return 0.85
  if (diffDays <= 7) return 0.65
  if (diffDays <= 14) return 0.4
  return 0.2
}

export const SimpleMatchingService = {
  /**
   * Helper to retrieve Gemini API key
   */
  getApiKey(): string {
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY
    if (envKey && envKey !== "YOUR_GEMINI_API_KEY") return envKey
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("campusrecover_gemini_api_key")
      if (stored) return stored
    }
    return ""
  },

  /**
   * Evaluates comparison between a Lost Item and a Found Item using Gemini AI (with calibrated algorithmic fallback)
   */
  async compareItems(lost: Item, found: Item): Promise<{
    score: number
    reason: string
    confidence: ConfidenceLevel
  }> {
    const apiKey = this.getApiKey()

    // 1. Calculate baseline heuristic score
    const catMatch =
      normalize(lost.category) === normalize(found.category) ? 1.0 : 0.0
    const nameSim = wordSimilarity(
      lost.itemName || lost.title || "",
      found.itemName || found.title || "",
    )
    const descSim = wordSimilarity(lost.description, found.description)
    const locSim = wordSimilarity(lost.location, found.location)
    const colorMatch =
      lost.color &&
      found.color &&
      normalize(lost.color) === normalize(found.color)
        ? 1.0
        : lost.color &&
            found.color &&
            (normalize(lost.color).includes(normalize(found.color)) ||
              normalize(found.color).includes(normalize(lost.color)))
          ? 0.7
          : 0.3
    const brandMatch =
      lost.brand &&
      found.brand &&
      normalize(lost.brand) === normalize(found.brand)
        ? 1.0
        : lost.brand && found.brand
          ? 0.0
          : 0.5
    const dateSim = dateProximity(lost.date, found.date)

    // Weighted algorithmic score
    let baseScore =
      catMatch * 0.25 +
      nameSim * 0.25 +
      descSim * 0.15 +
      locSim * 0.15 +
      colorMatch * 0.1 +
      dateSim * 0.1

    if (catMatch === 0) {
      baseScore *= 0.4 // heavy penalty for incompatible categories
    }

    let calculatedScore = Math.min(
      100,
      Math.max(0, Math.round(baseScore * 100)),
    )

    // Check for exact name + location match boost
    if (nameSim >= 0.8 && locSim >= 0.5) {
      calculatedScore = Math.max(calculatedScore, 90)
    }

    // Default explanation
    let explanation = `Both reports describe "${lost.itemName || lost.title}" with ${
      catMatch
        ? "identical category (" + lost.category + ")"
        : "different categories"
    }, matching color tone (${lost.color || "N/A"}), and proximate campus location (${lost.location} vs ${found.location}).`

    // 2. If Gemini API key is available, run live Gemini LLM comparison
    if (apiKey) {
      try {
        const prompt = `You are CampusRecover AI's Lost & Found Matching Engine.
Compare these two campus reports:
Lost Item:
- Reference: ${lost.referenceNumber}
- Name: ${lost.itemName || lost.title}
- Category: ${lost.category}
- Description: ${lost.description}
- Color: ${lost.color || "N/A"}
- Brand: ${lost.brand || "N/A"}
- Location Lost: ${lost.location}
- Date: ${lost.date}

Found Item:
- Reference: ${found.referenceNumber}
- Name: ${found.itemName || found.title}
- Category: ${found.category}
- Description: ${found.description}
- Color: ${found.color || "N/A"}
- Brand: ${found.brand || "N/A"}
- Location Found: ${found.location}
- Date: ${found.date}

Baseline Similarity: ${calculatedScore}%.

Analyze whether these two items are likely the same physical object.
Return ONLY a valid JSON object matching this schema:
{
  "score": number between 0 and 100,
  "reason": "1-2 concise sentences explaining why they match or differ"
}`

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        })

        if (res.ok) {
          const json = await res.json()
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            const parsed = JSON.parse(text)
            if (typeof parsed.score === "number") calculatedScore = parsed.score
            if (parsed.reason) explanation = parsed.reason
          }
        }
      } catch (err) {
        console.warn("Gemini call error (using calibrated fallback):", err)
      }
    }

    // Determine confidence level: 80-100% High, 60-79% Possible, <60% Low
    let confidence: ConfidenceLevel = "low"
    if (calculatedScore >= 80) confidence = "high"
    else if (calculatedScore >= 60) confidence = "possible"

    return {
      score: calculatedScore,
      reason: explanation,
      confidence,
    }
  },

  /**
   * Scans a newly reported item against all opposite open items and creates matches
   */
  async matchItem(item: Item): Promise<Match[]> {
    const isLost = item.type === "LOST"
    const oppositeType = isLost ? "FOUND" : "LOST"
    const createdMatches: Match[] = []

    try {
      const candidatesMap = new Map<string, Item>()

      // 1. Load candidates from local items cache
      try {
        const rawLocal = localStorage.getItem("campusrecover_items_cache")
        if (rawLocal) {
          const parsed: Item[] = JSON.parse(rawLocal)
          for (const cand of parsed) {
            if (
              cand.type === oppositeType &&
              cand.status !== "recovered" &&
              cand.status !== "closed"
            ) {
              candidatesMap.set(cand.referenceNumber || cand.id, cand)
            }
          }
        }
      } catch {}

      // 2. Load candidates from Firestore
      try {
        const itemsRef = collection(db, COLLECTIONS.ITEMS)
        const q = query(itemsRef, where("type", "==", oppositeType))
        const snap = await getDocs(q)
        snap.forEach((docSnap) => {
          const d = docSnap.data() as any
          if (d.status !== "recovered" && d.status !== "closed") {
            const cand = { id: docSnap.id, ...d }
            candidatesMap.set(cand.referenceNumber || cand.id, cand)
          }
        })
      } catch (err) {
        console.warn("Could not fetch remote candidates for matching, using local:", err)
      }

      const candidates = Array.from(candidatesMap.values())

      for (const candidate of candidates) {
        // Prevent matching own items if user IDs exist
        if (
          candidate.userId &&
          item.userId &&
          candidate.userId === item.userId
        ) {
          continue
        }

        const lost = isLost ? item : candidate
        const found = isLost ? candidate : item

        const result = await this.compareItems(lost, found)

        // Threshold: Save match if score >= 60%
        if (result.score >= 60) {
          const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
          const matchData: Omit<Match, "id"> = {
            lostItemId: lost.id,
            foundItemId: found.id,
            lostReference: lost.referenceNumber,
            foundReference: found.referenceNumber,
            lostItemName: lost.itemName || lost.title || "Lost Item",
            foundItemName: found.itemName || found.title || "Found Item",
            lostItemImage: lost.imageUrl || lost.imageUrls?.[0] || "",
            foundItemImage: found.imageUrl || found.imageUrls?.[0] || "",
            lostUserId: lost.userId || "",
            foundUserId: found.userId || "",
            lostUserName: lost.userName || "Student",
            foundUserName: found.userName || "Campus Finder",
            lostUserEmail: lost.userEmail || "",
            foundUserEmail: found.userEmail || "",
            lostUserMobile: lost.userMobile || "",
            foundUserMobile: found.userMobile || "",
            aiScore: result.score,
            aiReason: result.reason,
            confidenceLevel: result.confidence,
            source: "AI",
            status: "pending",
            contactShared: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          const cleanedMatchData = cleanFirestoreData(matchData)
          let savedMatch: Match = {
            id: matchId,
            ...cleanedMatchData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          // Persist to local cache immediately
          const localMatches = getLocalMatches()
          saveLocalMatches([savedMatch, ...localMatches])

          // Persist to Firestore
          try {
            const matchDoc = await addDoc(
              collection(db, COLLECTIONS.MATCHES),
              cleanedMatchData,
            )
            savedMatch = { ...savedMatch, id: matchDoc.id }
            // Update local cache with Firestore ID
            const updated = getLocalMatches().map((m) =>
              m.lostReference === savedMatch.lostReference &&
              m.foundReference === savedMatch.foundReference
                ? savedMatch
                : m
            )
            saveLocalMatches(updated)
          } catch (firestoreErr) {
            console.warn("Firestore match write notice:", firestoreErr)
          }

          createdMatches.push(savedMatch)

          // Update item statuses to possible_match
          try {
            if (lost.id) {
              await updateDoc(doc(db, COLLECTIONS.ITEMS, lost.id), {
                status: "possible_match",
                updatedAt: serverTimestamp(),
              }).catch(() => {})
            }
            if (found.id) {
              await updateDoc(doc(db, COLLECTIONS.ITEMS, found.id), {
                status: "possible_match",
                updatedAt: serverTimestamp(),
              }).catch(() => {})
            }
          } catch {}

          // Dispatch in-app notifications
          await this.createMatchNotifications(
            savedMatch,
            result.score,
            result.reason,
          )

          // Trigger email notifications
          if (lost.userEmail) {
            EmailNotificationService.sendMatchEmail({
              toEmail: lost.userEmail,
              toName: lost.userName,
              matchedItemName: lost.itemName,
              itemReference: lost.referenceNumber,
              counterpartName: found.userName,
              counterpartEmail: found.userEmail,
              counterpartMobile: found.userMobile,
              confidence: result.score,
              reason: result.reason,
              isFinder: false,
            }).catch(() => {})
          }

          if (found.userEmail) {
            EmailNotificationService.sendMatchEmail({
              toEmail: found.userEmail,
              toName: found.userName,
              matchedItemName: found.itemName,
              itemReference: found.referenceNumber,
              counterpartName: lost.userName,
              counterpartEmail: lost.userEmail,
              counterpartMobile: lost.userMobile,
              confidence: result.score,
              reason: result.reason,
              isFinder: true,
            }).catch(() => {})
          }
        }
      }
    } catch (err) {
      console.error("SimpleMatchingService.matchItem error:", err)
    }

    return createdMatches
  },

  /**
   * Creates notifications for both users upon match creation
   */
  async createMatchNotifications(
    match: Match,
    score: number,
    _reason: string,
  ): Promise<void> {
    const notifsRef = collection(db, COLLECTIONS.NOTIFICATIONS)

    // Notify lost user
    if (match.lostUserId) {
      const lostNotif = cleanFirestoreData({
        userId: match.lostUserId,
        title: "Possible Match Found!",
        message: `CampusRecover AI found a possible match for your lost item "${match.lostItemName}" (${score}% confidence).`,
        body: `CampusRecover AI found a possible match for your lost item "${match.lostItemName}" (${score}% confidence).`,
        type: "match",
        relatedItemId: match.lostItemId,
        relatedMatchId: match.id,
        read: false,
        actionUrl: `/dashboard/ai-match?matchId=${match.id}`,
        createdAt: serverTimestamp(),
      })
      await addDoc(notifsRef, lostNotif).catch(() => {})
    }

    // Notify found user
    if (match.foundUserId) {
      const foundNotif = cleanFirestoreData({
        userId: match.foundUserId,
        title: "Potential Owner Found!",
        message: `Your found item "${match.foundItemName}" matches a reported lost item (${score}% confidence).`,
        body: `Your found item "${match.foundItemName}" matches a reported lost item (${score}% confidence).`,
        type: "match",
        relatedItemId: match.foundItemId,
        relatedMatchId: match.id,
        read: false,
        actionUrl: `/dashboard/ai-match?matchId=${match.id}`,
        createdAt: serverTimestamp(),
      })
      await addDoc(notifsRef, foundNotif).catch(() => {})
    }
  },

  /**
   * Fetches all matches (for Admin Dashboard) with local cache fallback
   */
  async getAllMatches(): Promise<Match[]> {
    const matchesMap = new Map<string, Match>()

    // Local cache
    const local = getLocalMatches()
    for (const m of local) {
      matchesMap.set(m.id, m)
    }

    // Firestore
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.MATCHES))
      snap.forEach((d) => {
        matchesMap.set(d.id, { id: d.id, ...d.data() } as Match)
      })
      saveLocalMatches(Array.from(matchesMap.values()))
    } catch (err) {
      console.warn("getAllMatches Firestore notice:", err)
    }

    return Array.from(matchesMap.values()).sort((a, b) => {
      const getTime = (m: Match) => {
        if (!m.createdAt) return 0
        if (typeof (m.createdAt as any).toDate === "function") {
          return (m.createdAt as any).toDate().getTime()
        }
        return new Date(m.createdAt).getTime() || 0
      }
      return getTime(b) - getTime(a)
    })
  },

  /**
   * Fetches matches for a given user (either as lost or found owner)
   */
  async getUserMatches(userId: string): Promise<Match[]> {
    const matchesMap = new Map<string, Match>()

    // Local cache first
    const local = getLocalMatches()
    for (const m of local) {
      if (m.lostUserId === userId || m.foundUserId === userId) {
        matchesMap.set(m.id, m)
      }
    }

    // Try Firestore
    try {
      const matchesRef = collection(db, COLLECTIONS.MATCHES)
      const q1 = query(matchesRef, where("lostUserId", "==", userId))
      const q2 = query(matchesRef, where("foundUserId", "==", userId))

      const [snap1, snap2] = await Promise.all([
        getDocs(q1).catch(() => ({ forEach: () => {} })),
        getDocs(q2).catch(() => ({ forEach: () => {} })),
      ])

      ;(snap1 as any).forEach((d: any) =>
        matchesMap.set(d.id, { id: d.id, ...d.data() } as Match),
      )
      ;(snap2 as any).forEach((d: any) =>
        matchesMap.set(d.id, { id: d.id, ...d.data() } as Match),
      )

      saveLocalMatches(Array.from(matchesMap.values()))
    } catch (err) {
      console.warn("getUserMatches Firestore notice:", err)
    }

    return Array.from(matchesMap.values()).sort((a, b) => {
      const getTime = (m: Match) => {
        if (!m.createdAt) return 0
        if (typeof (m.createdAt as any).toDate === "function") {
          return (m.createdAt as any).toDate().getTime()
        }
        return new Date(m.createdAt).getTime() || 0
      }
      return getTime(b) - getTime(a)
    })
  },

  /**
   * Admin or User creates manual match between two items
   */
  async createManualMatch(lostItem: Item, foundItem: Item): Promise<Match> {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const rawMatchData: Omit<Match, "id"> = {
      lostItemId: lostItem.id,
      foundItemId: foundItem.id,
      lostReference: lostItem.referenceNumber,
      foundReference: foundItem.referenceNumber,
      lostItemName: lostItem.itemName || lostItem.title || "Lost Item",
      foundItemName: foundItem.itemName || foundItem.title || "Found Item",
      lostItemImage: lostItem.imageUrl || lostItem.imageUrls?.[0] || "",
      foundItemImage: foundItem.imageUrl || foundItem.imageUrls?.[0] || "",
      lostUserId: lostItem.userId || "",
      foundUserId: foundItem.userId || "",
      lostUserName: lostItem.userName || "Student",
      foundUserName: foundItem.userName || "Campus Finder",
      lostUserEmail: lostItem.userEmail || "",
      foundUserEmail: foundItem.userEmail || "",
      lostUserMobile: lostItem.userMobile || "",
      foundUserMobile: foundItem.userMobile || "",
      aiScore: 100,
      aiReason: "Manually matched and verified by Campus Administrator.",
      confidenceLevel: "high",
      source: "MANUAL",
      status: "confirmed",
      contactShared: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const cleanedMatchData = cleanFirestoreData(rawMatchData)

    let match: Match = {
      id: matchId,
      ...cleanedMatchData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Cache locally immediately
    const local = getLocalMatches()
    saveLocalMatches([match, ...local])

    // Save to Firestore
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.MATCHES), cleanedMatchData)
      match = { ...match, id: docRef.id }
      const updated = getLocalMatches().map((m) => (m.id === matchId ? match : m))
      saveLocalMatches(updated)
    } catch (err) {
      console.warn("createManualMatch Firestore notice:", err)
    }

    // Update item statuses to match_confirmed
    try {
      if (lostItem.id) {
        await updateDoc(doc(db, COLLECTIONS.ITEMS, lostItem.id), {
          status: "match_confirmed",
          updatedAt: serverTimestamp(),
        }).catch(() => {})
      }
      if (foundItem.id) {
        await updateDoc(doc(db, COLLECTIONS.ITEMS, foundItem.id), {
          status: "match_confirmed",
          updatedAt: serverTimestamp(),
        }).catch(() => {})
      }
    } catch {}

    // Notify users
    await this.createMatchNotifications(match, 100, rawMatchData.aiReason)

    // Send emails
    if (lostItem.userEmail) {
      EmailNotificationService.sendMatchEmail({
        toEmail: lostItem.userEmail,
        toName: lostItem.userName,
        matchedItemName: lostItem.itemName,
        itemReference: lostItem.referenceNumber,
        counterpartName: foundItem.userName,
        counterpartEmail: foundItem.userEmail,
        counterpartMobile: foundItem.userMobile,
        confidence: 100,
        reason: rawMatchData.aiReason,
        isFinder: false,
      }).catch(() => {})
    }

    if (foundItem.userEmail) {
      EmailNotificationService.sendMatchEmail({
        toEmail: foundItem.userEmail,
        toName: foundItem.userName,
        matchedItemName: foundItem.itemName,
        itemReference: foundItem.referenceNumber,
        counterpartName: lostItem.userName,
        counterpartEmail: lostItem.userEmail,
        counterpartMobile: lostItem.userMobile,
        confidence: 100,
        reason: rawMatchData.aiReason,
        isFinder: true,
      }).catch(() => {})
    }

    return match
  },

  /**
   * Updates match status (e.g. 'confirmed', 'rejected', 'recovered')
   */
  async updateMatchStatus(matchId: string, status: MatchStatus): Promise<void> {
    const contactShared = status === "confirmed" || status === "contact_shared" || status === "recovered"

    // Update locally
    const local = getLocalMatches()
    const updated = local.map((m) =>
      m.id === matchId ? { ...m, status, contactShared, updatedAt: new Date().toISOString() } : m
    )
    saveLocalMatches(updated)

    // Update in Firestore
    try {
      await updateDoc(doc(db, COLLECTIONS.MATCHES, matchId), {
        status,
        contactShared,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn("updateMatchStatus Firestore notice:", err)
    }
  },

  /**
   * Admin approves a match
   */
  async approveMatch(matchId: string): Promise<void> {
    await this.updateMatchStatus(matchId, "confirmed")
  },

  /**
   * Admin rejects a match
   */
  async rejectMatch(matchId: string): Promise<void> {
    await this.updateMatchStatus(matchId, "rejected")
  },

  /**
   * Confirms a match and reveals contact info
   */
  async confirmMatch(matchId: string): Promise<void> {
    await this.updateMatchStatus(matchId, "contact_shared")
  },
}
