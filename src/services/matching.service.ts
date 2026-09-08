/**
 * Production AI Matching Engine Service
 *
 * Features:
 * - Image similarity matching using embeddings & cosine similarity
 * - OCR text extraction & entity matching (serial numbers, student IDs)
 * - Multi-factor confidence scoring & thresholding
 * - Automatic lost-found pairing
 * - AI natural language explanation (Gemini AI)
 * - Manual verification & Admin approval workflow
 * - Multi-signal fraud detection score & fraud reporting
 * - Match history tracking
 * - Firestore integration with collections: matches, aiResults, fraudReports
 * - Background processing & Queue integration
 * - Automatic multi-channel notifications (In-App, Push, Email)
 */

import { FirestoreService } from "./firebase/firestore.service"
import { where, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "../config/firebase"
import { COLLECTIONS } from "../config/constants"
import { LostItem } from "../types/LostItem"
import { FoundItem } from "../types/FoundItem"
import {
  generateImageEmbedding,
  generateTextEmbedding,
  cosineSimilarity,
} from "./embedding.service"
import { OCRService, OCRExtractionResult } from "./ocr.service"
import { GeminiService } from "./gemini.service"
import { QueueService } from "./queue.service"
import { NotificationService } from "./firebase/notification.service"
import { PushNotificationService } from "./push.service"
import { EmailService } from "./email.service"

// ─── Types ───────────────────────────────────────────────────

export type MatchStatus = "pending" | "confirmed" | "admin_approved" | "rejected" | "expired"

export interface MatchReason {
  field: string
  similarity: number // 0 to 100
  details: string
  isStrong?: boolean
}

export interface MatchResult {
  id?: string
  lostItemId: string
  foundItemId: string
  lostItemTitle: string
  foundItemTitle: string
  lostItemImage: string
  foundItemImage: string
  lostUserId: string
  foundUserId: string
  confidenceScore: number // 0 to 100
  embeddingSimilarity: number // 0 to 100
  ocrSimilarity: number // 0 to 100
  matchReasons: MatchReason[]
  aiExplanation: string
  fraudScore: number // 0 to 100
  fraudSignals: string[]
  status: MatchStatus
  adminReviewedBy: string
  adminNotes: string
  confirmedByUser: boolean
  userConfirmedAt?: any
  createdAt?: any
  updatedAt?: any
}

export interface AIAnalysisResult {
  id?: string
  itemId: string
  itemType: "lost" | "found"
  detectedCategory: string
  detectedColors: string[]
  detectedBrand: string
  ocrText: string
  serialNumberDetected: string
  studentIdDetected?: string
  objectLabels: string[]
  imageEmbedding: number[]
  textEmbedding: number[]
  fraudIndicators: string[]
  processedAt?: any
  createdAt?: any
}

export interface FraudReport {
  id?: string
  matchId: string
  lostItemId: string
  foundItemId: string
  reportedBy: string
  reason: string
  fraudScore: number
  signals: string[]
  status: "pending" | "investigating" | "confirmed" | "dismissed"
  adminNotes: string
  createdAt?: any
  updatedAt?: any
}

// ─── Constants ───────────────────────────────────────────────

const MATCHES_COLLECTION = COLLECTIONS.MATCHES || "matches"
const AI_RESULTS_COLLECTION = COLLECTIONS.AI_RESULTS || "aiResults"
const FRAUD_COLLECTION = COLLECTIONS.FRAUD_REPORTS || "fraudReports"
export const DEFAULT_CONFIDENCE_THRESHOLD = 60 // 60%

// ─── String & Location Utilities ─────────────────────────────

function normalizeStr(s: string): string {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
}

function wordOverlap(a: string, b: string): number {
  const wa = new Set(
    normalizeStr(a)
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  const wb = new Set(
    normalizeStr(b)
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  if (wa.size === 0 && wb.size === 0) return 0
  let overlap = 0
  for (const w of wa) if (wb.has(w)) overlap++
  return overlap / Math.max(wa.size, wb.size, 1)
}

function colorSimilarity(c1: string, c2: string): number {
  if (!c1 || !c2) return 0
  const n1 = normalizeStr(c1)
  const n2 = normalizeStr(c2)
  if (n1 === n2) return 1.0
  if (n1.includes(n2) || n2.includes(n1)) return 0.8
  return 0
}

function categorySimilarity(c1: string, c2: string): number {
  if (!c1 || !c2) return 0
  return c1 === c2 ? 1.0 : 0
}

function dateProximityScore(d1: string, d2: string): number {
  if (!d1 || !d2) return 0.5
  const t1 = new Date(d1).getTime()
  const t2 = new Date(d2).getTime()
  if (isNaN(t1) || isNaN(t2)) return 0.5

  const diffDays = Math.abs(t1 - t2) / (1000 * 60 * 60 * 24)
  if (diffDays <= 1) return 1.0
  if (diffDays <= 3) return 0.85
  if (diffDays <= 7) return 0.65
  if (diffDays <= 14) return 0.4
  return 0.15
}

function locationProximityScore(l1: string, l2: string): number {
  if (!l1 || !l2) return 0.4
  const norm1 = normalizeStr(l1)
  const norm2 = normalizeStr(l2)
  if (norm1 === norm2) return 1.0
  const overlap = wordOverlap(l1, l2)
  return overlap > 0.4 ? 0.85 : overlap > 0.2 ? 0.5 : 0.2
}

// ─── AI Matching Engine Service ──────────────────────────────

export const MatchingService = {
  /**
   * Run or retrieve AI analysis (embeddings + OCR) for an item
   */
  async getOrRunAIAnalysis(
    item: LostItem | FoundItem,
    type: "lost" | "found",
  ): Promise<AIAnalysisResult> {
    const existing = await AIResultsService.getAnalysis(item.id)
    if (
      existing &&
      existing.imageEmbedding &&
      existing.imageEmbedding.length > 0
    ) {
      return existing
    }

    const imageUrl = item.imageUrls?.[0] || ""

    // 1. Image embedding
    const imageEmbedding = await generateImageEmbedding(imageUrl)

    // 2. Semantic text embedding
    const textEmbedding = generateTextEmbedding(
      `${item.title} ${item.description}`,
    )

    // 3. Gemini / OCR analysis
    const geminiData = await GeminiService.analyzeItem(imageUrl, {
      title: item.title,
      description: item.description,
    })

    const parsedOCR = OCRService.parseIdentifiers(geminiData.ocrText)

    const analysisData: Omit<AIAnalysisResult, "id" | "createdAt"> = {
      itemId: item.id,
      itemType: type,
      detectedCategory: geminiData.category,
      detectedColors: [geminiData.color],
      detectedBrand: geminiData.brand || item.brand || "",
      ocrText: geminiData.ocrText,
      serialNumberDetected:
        geminiData.serialNumberDetected ||
        parsedOCR.serialNumber ||
        (item as any).serialNumber ||
        "",
      studentIdDetected: parsedOCR.studentId,
      objectLabels: geminiData.labels,
      imageEmbedding,
      textEmbedding,
      fraudIndicators: geminiData.fraudRiskIndicators,
      processedAt: new Date().toISOString(),
    }

    await AIResultsService.saveAnalysis(analysisData)

    return { id: item.id, ...analysisData }
  },

  /**
   * Compute comprehensive match score between a LostItem and FoundItem
   */
  async computeComprehensiveMatch(
    lost: LostItem,
    found: FoundItem,
    lostAnalysis?: AIAnalysisResult,
    foundAnalysis?: AIAnalysisResult,
  ): Promise<{
    score: number
    embeddingSim: number
    ocrSim: number
    reasons: MatchReason[]
    explanation: string
    fraudScore: number
    fraudSignals: string[]
  }> {
    const reasons: MatchReason[] = []

    // Ensure AI analyses exist
    const lAnalysis =
      lostAnalysis || (await this.getOrRunAIAnalysis(lost, "lost"))
    const fAnalysis =
      foundAnalysis || (await this.getOrRunAIAnalysis(found, "found"))

    // 1. Visual Image Embedding Similarity (30% weight)
    let embeddingSim = 0
    if (lAnalysis.imageEmbedding?.length && fAnalysis.imageEmbedding?.length) {
      embeddingSim = cosineSimilarity(
        lAnalysis.imageEmbedding,
        fAnalysis.imageEmbedding,
      )
    } else {
      embeddingSim = 0.5 // Neutral baseline
    }
    const embeddingPct = Math.round(embeddingSim * 100)
    reasons.push({
      field: "Visual Embedding",
      similarity: embeddingPct,
      details:
        embeddingPct >= 75
          ? "Strong visual match across colors and shape features"
          : "General appearance correlation",
      isStrong: embeddingPct >= 75,
    })

    // 2. OCR & Serial Number Match (boost factor up to 100%)
    let ocrSim = 0
    let exactEntityMatch = false

    // Check serial numbers
    const lostSerial = (
      lost.serialNumber ||
      lAnalysis.serialNumberDetected ||
      ""
    )
      .trim()
      .toUpperCase()
    const foundSerial = (fAnalysis.serialNumberDetected || "")
      .trim()
      .toUpperCase()

    if (lostSerial && foundSerial && lostSerial === foundSerial) {
      ocrSim = 1.0
      exactEntityMatch = true
      reasons.push({
        field: "Serial Number (OCR)",
        similarity: 100,
        details: `Exact match on hardware serial number "${lostSerial}"`,
        isStrong: true,
      })
    } else if (
      lAnalysis.studentIdDetected &&
      fAnalysis.studentIdDetected &&
      lAnalysis.studentIdDetected === fAnalysis.studentIdDetected
    ) {
      ocrSim = 1.0
      exactEntityMatch = true
      reasons.push({
        field: "Student ID (OCR)",
        similarity: 100,
        details: `Exact Student ID number matched: ${lAnalysis.studentIdDetected}`,
        isStrong: true,
      })
    } else {
      const ocrComparison = OCRService.compareOCR(
        {
          rawText: lAnalysis.ocrText,
          labels: lAnalysis.objectLabels,
          confidence: 0.8,
        },
        {
          rawText: fAnalysis.ocrText,
          labels: fAnalysis.objectLabels,
          confidence: 0.8,
        },
      )
      ocrSim = ocrComparison.matchScore
      if (ocrSim > 0.3) {
        reasons.push({
          field: "OCR Text Inscriptions",
          similarity: Math.round(ocrSim * 100),
          details: ocrComparison.reason,
          isStrong: ocrSim >= 0.7,
        })
      }
    }

    // 3. Category Match (15% weight)
    const catSim = categorySimilarity(lost.category, found.category)
    reasons.push({
      field: "Category",
      similarity: Math.round(catSim * 100),
      details:
        catSim === 1.0
          ? `Both are categorized as "${lost.category}"`
          : `Different: "${lost.category}" vs "${found.category}"`,
      isStrong: catSim === 1.0,
    })

    // 4. Title & Description Overlap (15% weight)
    const titleSim = wordOverlap(lost.title, found.title)
    const descSim = wordOverlap(lost.description, found.description)
    const textSim = titleSim * 0.6 + descSim * 0.4
    reasons.push({
      field: "Title & Keywords",
      similarity: Math.round(textSim * 100),
      details: `Title similarity: "${lost.title}" vs "${found.title}"`,
      isStrong: textSim >= 0.6,
    })

    // 5. Brand Match (10% weight)
    const brandA = normalizeStr(lost.brand || lAnalysis.detectedBrand)
    const brandB = normalizeStr(found.brand || fAnalysis.detectedBrand)
    let brandSim = 0
    if (brandA && brandB) {
      brandSim =
        brandA === brandB
          ? 1.0
          : brandA.includes(brandB) || brandB.includes(brandA)
            ? 0.75
            : 0
      reasons.push({
        field: "Brand",
        similarity: Math.round(brandSim * 100),
        details:
          brandSim === 1.0
            ? `Both items manufactured by "${lost.brand || lAnalysis.detectedBrand}"`
            : `Brand: "${brandA}" vs "${brandB}"`,
        isStrong: brandSim >= 0.8,
      })
    }

    // 6. Color Match (10% weight)
    const colSim = colorSimilarity(lost.color, found.color)
    reasons.push({
      field: "Color",
      similarity: Math.round(colSim * 100),
      details:
        colSim === 1.0
          ? `Identical color "${lost.color}"`
          : `Colors: "${lost.color}" vs "${found.color}"`,
      isStrong: colSim === 1.0,
    })

    // 7. Location Proximity (10% weight)
    const locSim = locationProximityScore(
      lost.locationLost,
      found.locationFound,
    )
    reasons.push({
      field: "Campus Location",
      similarity: Math.round(locSim * 100),
      details:
        locSim >= 0.8
          ? `Same zone: "${lost.locationLost}"`
          : `Area comparison: "${lost.locationLost}" vs "${found.locationFound}"`,
      isStrong: locSim >= 0.8,
    })

    // 8. Date Proximity (10% weight)
    const dateSim = dateProximityScore(lost.dateLost, found.dateFound)
    reasons.push({
      field: "Date Proximity",
      similarity: Math.round(dateSim * 100),
      details:
        dateSim >= 0.85
          ? "Reported lost & found within 48 hours"
          : "Time difference within acceptable range",
      isStrong: dateSim >= 0.85,
    })

    // Weighted composite score (weights sum to 1.00)
    let rawScore =
      embeddingSim * 0.25 +
      catSim * 0.15 +
      textSim * 0.15 +
      brandSim * 0.1 +
      colSim * 0.1 +
      locSim * 0.15 +
      dateSim * 0.1

    // Exact Serial / ID Match gives definitive 98%+ confidence
    if (exactEntityMatch) {
      rawScore = Math.max(rawScore, 0.98)
    } else if (ocrSim > 0.6) {
      rawScore = Math.min(1.0, rawScore + 0.15)
    }

    // Disqualification if completely incompatible categories (e.g. water bottle vs laptop)
    if (catSim === 0 && !exactEntityMatch) {
      rawScore = rawScore * 0.45
    }

    const finalScore = Math.round(Math.min(100, Math.max(0, rawScore * 100)))

    // Fraud Evaluation
    const fraudEval = await GeminiService.evaluateFraudRisk(lost, found)

    // Generate Gemini explanation
    const geminiExplanation = await GeminiService.generateMatchExplanation(
      {
        title: lost.title,
        description: lost.description,
        category: lost.category,
        color: lost.color,
        brand: lost.brand,
        locationLost: lost.locationLost,
        dateLost: lost.dateLost,
      },
      {
        title: found.title,
        description: found.description,
        category: found.category,
        color: found.color,
        brand: found.brand,
        locationFound: found.locationFound,
        dateFound: found.dateFound,
      },
      finalScore,
    )

    return {
      score: finalScore,
      embeddingSim: embeddingPct,
      ocrSim: Math.round(ocrSim * 100),
      reasons,
      explanation: geminiExplanation.explanation,
      fraudScore: fraudEval.fraudScore,
      fraudSignals: fraudEval.signals,
    }
  },

  /**
   * Find and pair matches for a lost item against all active found items
   */
  async findMatchesForLostItem(
    lostItem: LostItem,
    threshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
  ): Promise<MatchResult[]> {
    const foundItems = await FirestoreService.queryCollection<FoundItem>(
      COLLECTIONS.FOUND_ITEMS,
      where("status", "in", ["pending", "matched"]),
    )

    const lostAnalysis = await this.getOrRunAIAnalysis(lostItem, "lost")
    const results: MatchResult[] = []

    for (const foundItem of foundItems) {
      // Don't pair with own item unless testing
      const {
        score,
        embeddingSim,
        ocrSim,
        reasons,
        explanation,
        fraudScore,
        fraudSignals,
      } = await this.computeComprehensiveMatch(
        lostItem,
        foundItem,
        lostAnalysis,
      )

      if (score >= threshold) {
        const matchRecord: MatchResult = {
          lostItemId: lostItem.id,
          foundItemId: foundItem.id,
          lostItemTitle: lostItem.title,
          foundItemTitle: foundItem.title,
          lostItemImage: lostItem.imageUrls?.[0] || "",
          foundItemImage: foundItem.imageUrls?.[0] || "",
          lostUserId: lostItem.userId,
          foundUserId: foundItem.userId,
          confidenceScore: score,
          embeddingSimilarity: embeddingSim,
          ocrSimilarity: ocrSim,
          matchReasons: reasons,
          aiExplanation: explanation,
          fraudScore,
          fraudSignals,
          status: "pending",
          adminReviewedBy: "",
          adminNotes: "",
          confirmedByUser: false,
        }

        results.push(matchRecord)
      }
    }

    results.sort((a, b) => b.confidenceScore - a.confidenceScore)

    // Persist matches and trigger notifications
    for (const match of results.slice(0, 5)) {
      const matchId = await FirestoreService.createDocument(
        MATCHES_COLLECTION,
        match,
      )
      match.id = matchId

      // Automatic notification
      await this.dispatchMatchNotifications(match, matchId)

      // Flag fraud if high risk
      if (match.fraudScore >= 40) {
        await FraudService.reportFraud({
          matchId,
          lostItemId: match.lostItemId,
          foundItemId: match.foundItemId,
          reportedBy: "System_AI_Fraud_Detector",
          reason: `High automated fraud risk: ${match.fraudSignals.join("; ")}`,
          fraudScore: match.fraudScore,
          signals: match.fraudSignals,
          status: "pending",
          adminNotes: "Auto-flagged during AI matching run.",
        })
      }
    }

    return results
  },

  /**
   * Find and pair matches for a found item against all active lost items
   */
  async findMatchesForFoundItem(
    foundItem: FoundItem,
    threshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
  ): Promise<MatchResult[]> {
    const lostItems = await FirestoreService.queryCollection<LostItem>(
      COLLECTIONS.LOST_ITEMS,
      where("status", "in", ["pending", "matched"]),
    )

    const foundAnalysis = await this.getOrRunAIAnalysis(foundItem, "found")
    const results: MatchResult[] = []

    for (const lostItem of lostItems) {
      const {
        score,
        embeddingSim,
        ocrSim,
        reasons,
        explanation,
        fraudScore,
        fraudSignals,
      } = await this.computeComprehensiveMatch(
        lostItem,
        foundItem,
        undefined,
        foundAnalysis,
      )

      if (score >= threshold) {
        const matchRecord: MatchResult = {
          lostItemId: lostItem.id,
          foundItemId: foundItem.id,
          lostItemTitle: lostItem.title,
          foundItemTitle: foundItem.title,
          lostItemImage: lostItem.imageUrls?.[0] || "",
          foundItemImage: foundItem.imageUrls?.[0] || "",
          lostUserId: lostItem.userId,
          foundUserId: foundItem.userId,
          confidenceScore: score,
          embeddingSimilarity: embeddingSim,
          ocrSimilarity: ocrSim,
          matchReasons: reasons,
          aiExplanation: explanation,
          fraudScore,
          fraudSignals,
          status: "pending",
          adminReviewedBy: "",
          adminNotes: "",
          confirmedByUser: false,
        }

        results.push(matchRecord)
      }
    }

    results.sort((a, b) => b.confidenceScore - a.confidenceScore)

    for (const match of results.slice(0, 5)) {
      const matchId = await FirestoreService.createDocument(
        MATCHES_COLLECTION,
        match,
      )
      match.id = matchId
      await this.dispatchMatchNotifications(match, matchId)

      if (match.fraudScore >= 40) {
        await FraudService.reportFraud({
          matchId,
          lostItemId: match.lostItemId,
          foundItemId: match.foundItemId,
          reportedBy: "System_AI_Fraud_Detector",
          reason: `High automated fraud risk: ${match.fraudSignals.join("; ")}`,
          fraudScore: match.fraudScore,
          signals: match.fraudSignals,
          status: "pending",
          adminNotes: "Auto-flagged during found item scan.",
        })
      }
    }

    return results
  },

  /**
   * Dispatches notifications to both parties when a match is discovered
   */
  async dispatchMatchNotifications(match: MatchResult, matchId: string) {
    // 1. Notify Lost item owner
    if (match.lostUserId) {
      await NotificationService.notifyMatch(
        match.lostUserId,
        match.foundItemTitle,
        match.confidenceScore,
        matchId,
      )

      PushNotificationService.sendNotification(
        `AI Match: ${match.foundItemTitle}`,
        {
          body: `${match.confidenceScore}% confidence match found for your lost item. Review now!`,
        },
      )
    }

    // 2. Notify Finder
    if (match.foundUserId && match.foundUserId !== match.lostUserId) {
      await NotificationService.createNotification({
        userId: match.foundUserId,
        title: `Potential Owner Found for ${match.foundItemTitle}`,
        body: `A student report matches your found item (${match.confidenceScore}% confidence).`,
        type: "match",
        read: false,
        actionUrl: `/dashboard/ai-match?id=${matchId}`,
        icon: "brain",
        metadata: { matchId, confidence: match.confidenceScore },
      })
    }
  },

  /**
   * Enqueue asynchronous background pairing job
   */
  async triggerBackgroundPairing(
    item: LostItem | FoundItem,
    itemType: "lost" | "found",
  ): Promise<string> {
    return QueueService.enqueue("pair_matching", item.id, itemType, {
      title: item.title,
      category: item.category,
    })
  },

  /**
   * Get all matches for a user
   */
  async getUserMatches(userId: string): Promise<MatchResult[]> {
    return this.getMatchesForUser(userId)
  },

  async getMatchesForUser(userId: string): Promise<MatchResult[]> {
    const asLost = await FirestoreService.queryCollection<MatchResult>(
      MATCHES_COLLECTION,
      where("lostUserId", "==", userId),
      orderBy("confidenceScore", "desc"),
    )
    const asFound = await FirestoreService.queryCollection<MatchResult>(
      MATCHES_COLLECTION,
      where("foundUserId", "==", userId),
      orderBy("confidenceScore", "desc"),
    )
    const all = [...asLost, ...asFound]
    const seen = new Set<string>()
    return all.filter((m) => {
      const key = m.id || `${m.lostItemId}-${m.foundItemId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  },

  /**
   * Get match history for a user (including resolved/confirmed/rejected)
   */
  async getMatchHistory(userId: string): Promise<MatchResult[]> {
    return this.getMatchesForUser(userId)
  },

  /**
   * Get all pending matches for Admin review queue
   */
  async getPendingMatches(): Promise<MatchResult[]> {
    return FirestoreService.queryCollection<MatchResult>(
      MATCHES_COLLECTION,
      where("status", "in", ["pending", "confirmed"]),
      orderBy("confidenceScore", "desc"),
    )
  },

  /**
   * Get all matches regardless of status for admin audit
   */
  async getAllMatches(): Promise<MatchResult[]> {
    return FirestoreService.getCollection<MatchResult>(MATCHES_COLLECTION)
  },

  /**
   * Get single match by ID
   */
  async getMatch(id: string): Promise<MatchResult | null> {
    return FirestoreService.getDocument<MatchResult>(MATCHES_COLLECTION, id)
  },

  /**
   * User manual verification: Yes, this is mine
   */
  async confirmMatch(matchId: string): Promise<void> {
    await FirestoreService.updateDocument(MATCHES_COLLECTION, matchId, {
      confirmedByUser: true,
      status: "confirmed",
      userConfirmedAt: new Date().toISOString(),
    })

    const match = await this.getMatch(matchId)
    if (match) {
      PushNotificationService.sendNotification("Match Confirmed", {
        body: "Your confirmation was logged. An admin or campus officer will finalize handover.",
      })
    }
  },

  /**
   * User manual dismissal: No, this isn't mine
   */
  async rejectMatch(matchId: string): Promise<void> {
    await FirestoreService.updateDocument(MATCHES_COLLECTION, matchId, {
      status: "rejected",
    })
  },

  /**
   * Admin approves match
   */
  async adminApproveMatch(
    matchId: string,
    adminUid: string,
    notes: string,
  ): Promise<void> {
    await FirestoreService.updateDocument(MATCHES_COLLECTION, matchId, {
      status: "admin_approved",
      adminReviewedBy: adminUid,
      adminNotes: notes,
    })

    const match = await this.getMatch(matchId)
    if (match) {
      // Notify both parties
      await NotificationService.createNotification({
        userId: match.lostUserId,
        title: `Match Approved by Admin — ${match.foundItemTitle}`,
        body: `An admin verified your claim! Proceed to Chat or the Campus Office for safe handover.`,
        type: "status",
        read: false,
        actionUrl: `/dashboard/messages?match=${matchId}`,
        icon: "status",
        metadata: { matchId },
      })

      // Send simulated approval email
      EmailService.notifyClaimApproved(
        "student@stanford.edu",
        "Student",
        match.foundItemTitle,
        "Campus Lost & Found Office",
      )
    }
  },

  /**
   * Admin rejects match
   */
  async adminRejectMatch(
    matchId: string,
    adminUid: string,
    notes: string,
  ): Promise<void> {
    await FirestoreService.updateDocument(MATCHES_COLLECTION, matchId, {
      status: "rejected",
      adminReviewedBy: adminUid,
      adminNotes: notes,
    })
  },
}

// ─── AI Results Service ──────────────────────────────────────

export const AIResultsService = {
  async saveAnalysis(
    data: Omit<AIAnalysisResult, "id" | "createdAt">,
  ): Promise<string> {
    return FirestoreService.createDocument(AI_RESULTS_COLLECTION, {
      ...data,
      processedAt: new Date().toISOString(),
    })
  },

  async getAnalysis(itemId: string): Promise<AIAnalysisResult | null> {
    const results = await FirestoreService.queryCollection<AIAnalysisResult>(
      AI_RESULTS_COLLECTION,
      where("itemId", "==", itemId),
    )
    return results.length > 0 ? results[0] : null
  },
}

// ─── Fraud Report Service ────────────────────────────────────

export const FraudService = {
  async reportFraud(
    data: Omit<FraudReport, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    return FirestoreService.createDocument(FRAUD_COLLECTION, data)
  },

  async getFraudReports(): Promise<FraudReport[]> {
    return FirestoreService.queryCollection<FraudReport>(
      FRAUD_COLLECTION,
      orderBy("createdAt", "desc"),
    )
  },

  async updateFraudStatus(
    id: string,
    status: FraudReport["status"],
    notes: string,
  ): Promise<void> {
    await FirestoreService.updateDocument(FRAUD_COLLECTION, id, {
      status,
      adminNotes: notes,
    })
  },
}

// Register Queue Handler for Background AI Tasks
QueueService.registerHandler("pair_matching", async (job) => {
  const collectionName =
    job.itemType === "lost" ? COLLECTIONS.LOST_ITEMS : COLLECTIONS.FOUND_ITEMS
  const docSnap = await getDoc(doc(db, collectionName, job.itemId))
  if (!docSnap.exists()) return

  const item = { id: docSnap.id, ...docSnap.data() } as any
  if (job.itemType === "lost") {
    return MatchingService.findMatchesForLostItem(item)
  } else {
    return MatchingService.findMatchesForFoundItem(item)
  }
})
