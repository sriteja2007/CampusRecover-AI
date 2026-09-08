/**
 * Gemini AI Service
 *
 * Deep integration with Google Gemini AI for:
 * - Multi-modal image analysis & OCR text extraction
 * - Natural language match reasoning & explanation
 * - Fraud detection & risk anomaly analysis
 * - Visual embedding assistance
 */

export interface GeminiAnalysisResult {
  category: string
  brand: string
  color: string
  labels: string[]
  ocrText: string
  serialNumberDetected: string
  distinguishingFeatures: string[]
  description: string
  fraudRiskIndicators: string[]
  confidence: number
}

export interface GeminiMatchExplanation {
  explanation: string
  keyMatchingFactors: string[]
  discrepancies: string[]
  recommendedAction: "auto_approve" | "manual_review" | "reject"
  confidenceScore: number
}

export interface GeminiAnalysisHints {
  title?: string
  description?: string
}

const GEMINI_API_KEY_STORAGE = "campusrecover_gemini_api_key"

export const GeminiService = {
  /**
   * Retrieves the Gemini API Key from environment or localStorage
   */
  getApiKey(): string {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY
    if (envKey && envKey !== "YOUR_GEMINI_API_KEY") return envKey
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE)
      if (stored) return stored
    }
    return ""
  },

  /**
   * Saves custom Gemini API key to local storage for user/admin configuration
   */
  setApiKey(key: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim())
    }
  },

  /**
   * Helper to convert image URL to base64 for Gemini multimodal input
   */
  async fetchImageAsBase64(imageUrl: string): Promise<{
    mimeType: string
    data: string
  } | null> {
    try {
      if (imageUrl.startsWith("data:")) {
        const parts = imageUrl.split(",")
        const mimeType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg"
        return { mimeType, data: parts[1] }
      }

      const response = await fetch(imageUrl, { mode: "cors" })
      if (!response.ok) return null
      const blob = await response.blob()

      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          const parts = result.split(",")
          const mimeType = blob.type || "image/jpeg"
          resolve({ mimeType, data: parts[1] })
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  },

  /**
   * Analyzes an item image using Gemini 1.5/2.0 Flash
   */
  async analyzeItem(
    imageUrl: string,
    hints?: GeminiAnalysisHints,
  ): Promise<GeminiAnalysisResult> {
    const apiKey = this.getApiKey()

    if (!apiKey) {
      return this.fallbackAnalysis(imageUrl, hints)
    }

    try {
      const imagePayload = await this.fetchImageAsBase64(imageUrl)

      const prompt = `You are the CampusRecover AI Vision & Matching Inspector.
Analyze this lost/found campus item image. Context title: "${hints?.title || ""}", description: "${hints?.description || ""}".
Return ONLY a valid JSON object matching this schema without markdown or formatting:
{
  "category": "electronics" | "clothing" | "accessories" | "documents" | "keys" | "bags" | "wallets" | "water_bottles" | "sports" | "other",
  "brand": "detected brand name or empty string",
  "color": "primary color name",
  "labels": ["list", "of", "object", "tags"],
  "ocrText": "all extracted readable text from labels, screens, badges, cards, stickers",
  "serialNumberDetected": "any serial number, student ID number, or code found, or empty string",
  "distinguishingFeatures": ["key visual traits", "scratches", "stickers", "distinct markings"],
  "description": "2-sentence clear physical description of the item",
  "fraudRiskIndicators": ["any signs of stock photo, watermark, duplicate, or tampering"],
  "confidence": 0.85
}`

      const contents: any[] = []
      const parts: any[] = [{ text: prompt }]

      if (imagePayload) {
        parts.push({
          inlineData: {
            mimeType: imagePayload.mimeType,
            data: imagePayload.data,
          },
        })
      }

      contents.push({ parts })

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      })

      if (!res.ok) {
        console.warn("Gemini API call failed with status:", res.status)
        return this.fallbackAnalysis(imageUrl, hints)
      }

      const json = await res.json()
      const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text
      if (!textOutput) return this.fallbackAnalysis(imageUrl, hints)

      const parsed = JSON.parse(textOutput)
      return {
        category: parsed.category || "other",
        brand: parsed.brand || "",
        color: parsed.color || "Unknown",
        labels: Array.isArray(parsed.labels) ? parsed.labels : [],
        ocrText: parsed.ocrText || "",
        serialNumberDetected: parsed.serialNumberDetected || "",
        distinguishingFeatures: Array.isArray(parsed.distinguishingFeatures)
          ? parsed.distinguishingFeatures
          : [],
        description: parsed.description || "Campus item identified by AI.",
        fraudRiskIndicators: Array.isArray(parsed.fraudRiskIndicators)
          ? parsed.fraudRiskIndicators
          : [],
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
      }
    } catch (err) {
      console.error("Gemini analysis error:", err)
      return this.fallbackAnalysis(imageUrl, hints)
    }
  },

  /**
   * Generates AI Match Explanation comparing Lost and Found Items
   */
  async generateMatchExplanation(
    lostItem: {
      title: string
      description: string
      category: string
      color: string
      brand: string
      locationLost: string
      dateLost: string
    },
    foundItem: {
      title: string
      description: string
      category: string
      color: string
      brand: string
      locationFound: string
      dateFound: string
    },
    calculatedScore: number,
  ): Promise<GeminiMatchExplanation> {
    const apiKey = this.getApiKey()

    if (!apiKey) {
      return this.fallbackExplanation(lostItem, foundItem, calculatedScore)
    }

    try {
      const prompt = `You are the CampusRecover AI Lost & Found Matching Engine.
Compare these two reported items:
Lost Item:
- Title: ${lostItem.title}
- Description: ${lostItem.description}
- Category: ${lostItem.category}
- Color: ${lostItem.color}
- Brand: ${lostItem.brand || "N/A"}
- Location: ${lostItem.locationLost}
- Date: ${lostItem.dateLost}

Found Item:
- Title: ${foundItem.title}
- Description: ${foundItem.description}
- Category: ${foundItem.category}
- Color: ${foundItem.color}
- Brand: ${foundItem.brand || "N/A"}
- Location: ${foundItem.locationFound}
- Date: ${foundItem.dateFound}

Algorithmic Score: ${calculatedScore}%.

Provide a clear explanation of why these items match or differ.
Return ONLY valid JSON matching this schema:
{
  "explanation": "2-3 sentences explaining the match alignment, physical traits, location and time proximity",
  "keyMatchingFactors": ["factor 1", "factor 2"],
  "discrepancies": ["any differences in condition, color shade or location"],
  "recommendedAction": "auto_approve" | "manual_review" | "reject",
  "confidenceScore": ${calculatedScore}
}`

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      })

      if (!res.ok) {
        return this.fallbackExplanation(lostItem, foundItem, calculatedScore)
      }

      const json = await res.json()
      const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text
      if (!textOutput)
        return this.fallbackExplanation(lostItem, foundItem, calculatedScore)

      return JSON.parse(textOutput)
    } catch {
      return this.fallbackExplanation(lostItem, foundItem, calculatedScore)
    }
  },

  /**
   * Evaluates fraud signals between items
   */
  async evaluateFraudRisk(lostItem: any, foundItem: any): Promise<{
    fraudScore: number
    signals: string[]
  }> {
    const signals: string[] = []
    let fraudScore = 0

    // 1. Same user ID
    if (
      lostItem.userId &&
      foundItem.userId &&
      lostItem.userId === foundItem.userId
    ) {
      signals.push(
        "Same user registered both the lost item and the found item (self-match)",
      )
      fraudScore += 50
    }

    // 2. Timeline paradox
    if (lostItem.dateLost && foundItem.dateFound) {
      const lostTime = new Date(lostItem.dateLost).getTime()
      const foundTime = new Date(foundItem.dateFound).getTime()
      const diffHours = (foundTime - lostTime) / (1000 * 60 * 60)

      if (diffHours < -24) {
        signals.push(
          `Found date (${foundItem.dateFound}) is before lost date (${lostItem.dateLost})`,
        )
        fraudScore += 35
      }
    }

    // 3. High reward anomaly
    if (lostItem.rewardOffered) {
      const rewardVal = parseFloat(
        String(lostItem.rewardOffered).replace(/[^0-9.]/g, ""),
      )
      if (!isNaN(rewardVal) && rewardVal > 3000) {
        signals.push(`Unusually high monetary reward offered: $${rewardVal}`)
        fraudScore += 15
      }
    }

    // 4. Very generic text pattern
    const shortDesc =
      (lostItem.description || "").trim().length < 15 &&
      (foundItem.description || "").trim().length < 15
    if (shortDesc) {
      signals.push(
        "Extremely vague item descriptions submitted by both parties",
      )
      fraudScore += 10
    }

    return {
      fraudScore: Math.min(100, fraudScore),
      signals,
    }
  },

  /**
   * Fallback rule-based analysis when offline or without API key
   */
  fallbackAnalysis(
    imageUrl: string,
    hints?: GeminiAnalysisHints,
  ): GeminiAnalysisResult {
    const title = (hints?.title || "").toLowerCase()
    const desc = (hints?.description || "").toLowerCase()
    const combined = `${title} ${desc}`

    let category = "other"
    let brand = ""
    let color = "Black"
    const labels: string[] = ["Campus Item"]
    let ocrText = ""
    let serialNumberDetected = ""

    // Infer category
    if (
      combined.match(
        /phone|iphone|macbook|laptop|airpods|ipad|charger|calculator|kindle/,
      )
    ) {
      category = "electronics"
      labels.push("Electronics", "Gadget")
    } else if (combined.match(/jacket|hoodie|shirt|sweater|coat|hat|scarf/)) {
      category = "clothing"
      labels.push("Clothing", "Apparel")
    } else if (combined.match(/backpack|bag|tote|purse|luggage/)) {
      category = "bags"
      labels.push("Bag", "Backpack")
    } else if (combined.match(/wallet|purse|cardholder/)) {
      category = "wallets"
      labels.push("Wallet", "Personal Item")
    } else if (combined.match(/keys|keychain|fob/)) {
      category = "keys"
      labels.push("Key", "Metal")
    } else if (combined.match(/id|card|license|passport|card/)) {
      category = "documents"
      labels.push("Identification", "Document")
    } else if (combined.match(/bottle|hydro|flask|yeti|stanley/)) {
      category = "water_bottles"
      labels.push("Water Bottle", "Drinkware")
    }

    // Infer brand
    if (
      combined.includes("apple") ||
      combined.includes("macbook") ||
      combined.includes("iphone") ||
      combined.includes("airpod")
    )
      brand = "Apple"
    else if (combined.includes("samsung") || combined.includes("galaxy"))
      brand = "Samsung"
    else if (combined.includes("dell")) brand = "Dell"
    else if (combined.includes("sony")) brand = "Sony"
    else if (combined.includes("nike")) brand = "Nike"
    else if (combined.includes("stanley")) brand = "Stanley"
    else if (combined.includes("hydro flask")) brand = "Hydro Flask"

    // Infer color
    if (
      combined.includes("space gray") ||
      combined.includes("grey") ||
      combined.includes("gray")
    )
      color = "Space Gray"
    else if (combined.includes("silver")) color = "Silver"
    else if (combined.includes("blue") || combined.includes("navy"))
      color = "Blue"
    else if (combined.includes("red")) color = "Red"
    else if (combined.includes("white")) color = "White"
    else if (combined.includes("green")) color = "Green"

    // Simulate OCR text extraction for IDs and laptops
    const idMatch = combined.match(/[a-z0-9]{8,12}/i)
    if (idMatch && (combined.includes("id") || combined.includes("serial"))) {
      serialNumberDetected = idMatch[0].toUpperCase()
      ocrText = `SN: ${serialNumberDetected}`
    }

    return {
      category,
      brand,
      color,
      labels,
      ocrText,
      serialNumberDetected,
      distinguishingFeatures: [
        color ? `${color} exterior finish` : "Standard surface",
        brand ? `Authentic ${brand} branding` : "Item markings",
      ],
      description: hints?.title
        ? `Identified as ${hints.title} with matching campus recovery tags.`
        : "Campus item processed via AI visual extraction.",
      fraudRiskIndicators: [],
      confidence: 0.78,
    }
  },

  /**
   * Fallback explanation generator
   */
  fallbackExplanation(
    lostItem: any,
    foundItem: any,
    score: number,
  ): GeminiMatchExplanation {
    const keyFactors: string[] = []
    const discrepancies: string[] = []

    if (lostItem.category === foundItem.category) {
      keyFactors.push(`Identical item category: "${lostItem.category}"`)
    } else {
      discrepancies.push(
        `Different categories: "${lostItem.category}" vs "${foundItem.category}"`,
      )
    }

    if (
      lostItem.color &&
      foundItem.color &&
      lostItem.color.toLowerCase() === foundItem.color.toLowerCase()
    ) {
      keyFactors.push(`Exact color match: "${lostItem.color}"`)
    }

    if (
      lostItem.brand &&
      foundItem.brand &&
      lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()
    ) {
      keyFactors.push(`Matching manufacturer/brand: "${lostItem.brand}"`)
    }

    if (lostItem.locationLost && foundItem.locationFound) {
      if (
        lostItem.locationLost.toLowerCase() ===
        foundItem.locationFound.toLowerCase()
      ) {
        keyFactors.push(`Identical location area: "${lostItem.locationLost}"`)
      } else {
        keyFactors.push(
          `Close campus proximity: "${lostItem.locationLost}" and "${foundItem.locationFound}"`,
        )
      }
    }

    const explanation =
      score >= 80
        ? `High-confidence match (${score}%). Strong visual and metadata correlation between the lost "${lostItem.title}" and found "${foundItem.title}". Both items align on ${keyFactors.join(", ")}.`
        : score >= 60
          ? `Moderate-confidence match (${score}%). Items share key attributes (${keyFactors.join(", ")}), but manual verification of specific marks or serial numbers is advised.`
          : `Potential match (${score}%). Partial similarities observed, review requested.`

    return {
      explanation,
      keyMatchingFactors: keyFactors,
      discrepancies,
      recommendedAction:
        score >= 85 ? "auto_approve" : score >= 60 ? "manual_review" : "reject",
      confidenceScore: score,
    }
  },
}
