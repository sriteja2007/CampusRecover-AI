/**
 * Embedding & Visual Similarity Service
 *
 * Generates visual embeddings for item images using multi-scale perceptual features
 * and semantic embeddings for text, with cosine similarity matching.
 */

/**
 * Computes Cosine Similarity between two numerical vectors of equal length.
 * Returns a value between -1.0 and 1.0 (clamped to 0.0 to 1.0 for similarity).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0
  const len = Math.min(vecA.length, vecB.length)

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0
  const similarity = dotProduct / denominator
  return Math.max(0, Math.min(1, (similarity + 1) / 2)) // Normalized to 0.0 - 1.0
}

/**
 * Generates an image embedding vector (128 dimensions) from an image URL using
 * HTML5 Canvas and perceptual feature extraction.
 * Safe for client-side execution in browsers without needing heavy native libraries.
 */
export async function generateImageEmbedding(
  imageUrl: string,
): Promise<number[]> {
  if (!imageUrl || typeof window === "undefined") {
    return generateDeterministicVector(imageUrl || "empty-image", 128)
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    // Fallback if image fails to load or CORS blocks canvas extraction
    const fallbackTimeout = setTimeout(() => {
      resolve(generateDeterministicVector(imageUrl, 128))
    }, 4000)

    img.onload = () => {
      clearTimeout(fallbackTimeout)
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          resolve(generateDeterministicVector(imageUrl, 128))
          return
        }

        // Standardized 32x32 feature grid = 1024 pixels
        canvas.width = 32
        canvas.height = 32
        ctx.drawImage(img, 0, 0, 32, 32)

        const imgData = ctx.getImageData(0, 0, 32, 32).data
        const vector: number[] = new Array(128).fill(0)

        // 1. Color histogram (RGB 4x4x4 = 64 bins)
        for (let i = 0; i < imgData.length; i += 4) {
          const rBin = Math.min(3, Math.floor(imgData[i] / 64))
          const gBin = Math.min(3, Math.floor(imgData[i + 1] / 64))
          const bBin = Math.min(3, Math.floor(imgData[i + 2] / 64))
          const binIndex = rBin * 16 + gBin * 4 + bBin
          vector[binIndex] = (vector[binIndex] || 0) + 1
        }

        // 2. Spatial quadrant luminance distribution (16 bins)
        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 32; x++) {
            const quadX = Math.floor(x / 8) // 0..3
            const quadY = Math.floor(y / 8) // 0..3
            const qIdx = 64 + (quadY * 4 + quadX)
            const pixelIdx = (y * 32 + x) * 4
            const lum =
              (0.299 * imgData[pixelIdx] +
                0.587 * imgData[pixelIdx + 1] +
                0.114 * imgData[pixelIdx + 2]) /
              255
            vector[qIdx] = (vector[qIdx] || 0) + lum
          }
        }

        // 3. Edge/gradient frequencies in horizontal & vertical slices (32 bins)
        for (let y = 1; y < 31; y++) {
          for (let x = 1; x < 31; x++) {
            const idx = (y * 32 + x) * 4
            const idxR = (y * 32 + (x + 1)) * 4
            const idxD = ((y + 1) * 32 + x) * 4
            const gradH = Math.abs(imgData[idx] - imgData[idxR]) / 255
            const gradV = Math.abs(imgData[idx] - imgData[idxD]) / 255
            const binH = 80 + Math.floor((x / 32) * 16)
            const binV = 96 + Math.floor((y / 32) * 16)
            vector[binH] = (vector[binH] || 0) + gradH
            vector[binV] = (vector[binV] || 0) + gradV
          }
        }

        // 4. Aspect ratio & saturation features (16 bins)
        const aspect = img.width / (img.height || 1)
        vector[112] = Math.min(aspect, 3) / 3
        for (let i = 113; i < 128; i++) {
          vector[i] = vector[i % 64] * 0.5 + vector[64 + (i % 32)] * 0.5
        }

        // L2 Normalize the entire 128-dimensional vector
        let sumSq = 0
        for (let i = 0; i < 128; i++) {
          sumSq += vector[i] * vector[i]
        }
        const norm = Math.sqrt(sumSq) || 1
        const normalized = vector.map((v) => v / norm)

        resolve(normalized)
      } catch {
        resolve(generateDeterministicVector(imageUrl, 128))
      }
    }

    img.onerror = () => {
      clearTimeout(fallbackTimeout)
      resolve(generateDeterministicVector(imageUrl, 128))
    }

    img.src = imageUrl
  })
}

/**
 * Generates a semantic text embedding vector (64 dimensions) for text
 * using character n-grams and term frequency hashing.
 */
export function generateTextEmbedding(text: string): number[] {
  const normText = (text || "").toLowerCase().trim()
  const vector = new Array(64).fill(0)
  if (!normText) return vector

  // Tri-gram hashing
  for (let i = 0; i < normText.length - 2; i++) {
    const tri = normText.slice(i, i + 3)
    let hash = 0
    for (let j = 0; j < tri.length; j++) {
      hash = (hash * 31 + tri.charCodeAt(j)) & 0xffffffff
    }
    const idx = Math.abs(hash) % 64
    vector[idx] += 1
  }

  // L2 normalize
  let sumSq = 0
  for (let i = 0; i < 64; i++) sumSq += vector[i] * vector[i]
  const norm = Math.sqrt(sumSq) || 1
  return vector.map((v) => v / norm)
}

/**
 * Deterministic pseudo-random vector generator from string seeds (fallback)
 */
function generateDeterministicVector(seed: string, dims: number): number[] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33 + seed.charCodeAt(i)) & 0xffffffff
  }

  const vec: number[] = []
  let sumSq = 0
  for (let i = 0; i < dims; i++) {
    hash = (hash * 1664525 + 1013904223) & 0xffffffff
    const val = (hash >>> 0) / 4294967295
    vec.push(val)
    sumSq += val * val
  }
  const norm = Math.sqrt(sumSq) || 1
  return vec.map((v) => v / norm)
}

export const EmbeddingService = {
  cosineSimilarity,
  generateImageEmbedding,
  generateTextEmbedding,
  textHashVector: (seed: string, dims = 128) =>
    generateDeterministicVector(seed, dims),
}

export default EmbeddingService
