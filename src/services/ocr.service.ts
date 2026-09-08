/**
 * OCR Text Extraction Service
 *
 * Extracts text from item images, identifying student IDs, serial numbers,
 * tags, engraved names, and model numbers for precise matching.
 */

import { GeminiService } from "./gemini.service"

export interface OCRExtractionResult {
  rawText: string
  studentId?: string
  serialNumber?: string
  detectedBrand?: string
  detectedName?: string
  labels: string[]
  confidence: number
}

export interface OCRComparisonResult {
  matchScore: number
  reason: string
  exactEntityMatch: boolean
}

export const OCRService = {
  /**
   * Extract OCR text from an item image and parse key identifiers
   */
  async extractText(imageUrl: string): Promise<OCRExtractionResult> {
    if (!imageUrl) {
      return {
        rawText: "",
        labels: [],
        confidence: 0,
      }
    }

    try {
      const geminiResult = await GeminiService.analyzeItem(imageUrl)

      const raw = geminiResult.ocrText || ""
      const parsed = this.parseIdentifiers(raw)

      return {
        rawText: raw,
        studentId: parsed.studentId,
        serialNumber: geminiResult.serialNumberDetected || parsed.serialNumber,
        detectedBrand: geminiResult.brand,
        detectedName: parsed.detectedName,
        labels: geminiResult.labels,
        confidence: geminiResult.confidence,
      }
    } catch (err) {
      console.error("OCR extraction failed:", err)
      return {
        rawText: "",
        labels: [],
        confidence: 0,
      }
    }
  },

  /**
   * Parse structured entities from raw OCR strings using regex patterns
   */
  parseIdentifiers(rawText: string): {
    studentId?: string
    serialNumber?: string
    detectedName?: string
  } {
    if (!rawText) return {}

    const clean = rawText.trim()

    // Student ID pattern (e.g. 7-10 digit number or university prefixes like S12345678)
    const studentIdMatch = clean.match(/\b([A-Z]{0,2}\d{7,10})\b/i)
    const studentId = studentIdMatch
      ? studentIdMatch[1].toUpperCase()
      : undefined

    // Serial number pattern (e.g. alphanumeric 8-16 chars often preceded by S/N or Serial)
    const serialMatch =
      clean.match(/(?:S\/N|Serial|SN|IMEI|Model)[:\s]*([A-Z0-9-]{6,18})/i) ||
      clean.match(/\b([A-Z0-9]{10,14})\b/)
    const serialNumber = serialMatch ? serialMatch[1].toUpperCase() : undefined

    // Name detection on ID cards (e.g. "Name: First Last" or 2-3 capitalized words)
    const nameMatch = clean.match(
      /(?:Name|Cardholder)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    )
    const detectedName = nameMatch ? nameMatch[1] : undefined

    return { studentId, serialNumber, detectedName }
  },

  /**
   * Compares two OCR texts / entity sets for similarity and identity matches
   */
  compareOCR(
    ocrA: OCRExtractionResult | null | undefined,
    ocrB: OCRExtractionResult | null | undefined,
  ): OCRComparisonResult {
    if (!ocrA || !ocrB)
      return { matchScore: 0, reason: "No OCR data", exactEntityMatch: false }

    // Exact Serial Number Match
    if (
      ocrA.serialNumber &&
      ocrB.serialNumber &&
      ocrA.serialNumber === ocrB.serialNumber
    ) {
      return {
        matchScore: 1.0,
        reason: `Exact serial number match: ${ocrA.serialNumber}`,
        exactEntityMatch: true,
      }
    }

    // Exact Student ID Match
    if (ocrA.studentId && ocrB.studentId && ocrA.studentId === ocrB.studentId) {
      return {
        matchScore: 1.0,
        reason: `Exact Student ID match: ${ocrA.studentId}`,
        exactEntityMatch: true,
      }
    }

    // Exact Name on Card Match
    if (
      ocrA.detectedName &&
      ocrB.detectedName &&
      ocrA.detectedName.toLowerCase() === ocrB.detectedName.toLowerCase()
    ) {
      return {
        matchScore: 0.95,
        reason: `Matching cardholder name: ${ocrA.detectedName}`,
        exactEntityMatch: true,
      }
    }

    // Substring / raw text word overlap
    if (ocrA.rawText && ocrB.rawText) {
      const wordsA = new Set(
        ocrA.rawText
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3),
      )
      const wordsB = new Set(
        ocrB.rawText
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3),
      )
      let overlap = 0
      for (const w of wordsA) if (wordsB.has(w)) overlap++
      const score =
        wordsA.size > 0 ? overlap / Math.max(wordsA.size, wordsB.size) : 0
      if (score > 0.4) {
        return {
          matchScore: score,
          reason: `Significant text inscription overlap (${Math.round(score * 100)}%)`,
          exactEntityMatch: false,
        }
      }
    }

    return {
      matchScore: 0,
      reason: "No OCR text correlation",
      exactEntityMatch: false,
    }
  },
}
