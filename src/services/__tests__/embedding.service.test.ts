import { describe, it, expect } from "vitest"
import { cosineSimilarity, generateTextEmbedding } from "../embedding.service"

describe("EmbeddingService Vector Engine", () => {
  it("should calculate cosine similarity between identical vectors as 1.0", () => {
    const v1 = [0.5, 0.5, 0.5, 0.5]
    const v2 = [0.5, 0.5, 0.5, 0.5]

    const sim = cosineSimilarity(v1, v2)
    expect(sim).toBeCloseTo(1.0, 4)
  })

  it("should calculate cosine similarity between orthogonal vectors as 0.5 (normalized)", () => {
    const v1 = [1, 0, 0]
    const v2 = [0, 1, 0]

    const sim = cosineSimilarity(v1, v2)
    expect(sim).toBeCloseTo(0.5, 4)
  })

  it("should handle empty or mismatched dimensions gracefully", () => {
    expect(cosineSimilarity([], [])).toBe(0)
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBeGreaterThan(0)
  })

  it("should compute normalized text hash vectors consistently", () => {
    const vec1 = generateTextEmbedding("Blue Apple MacBook Pro 14 M2")
    const vec2 = generateTextEmbedding("Blue Apple MacBook Pro 14 M2")
    const vecDiff = generateTextEmbedding("Red Umbrella in Library")

    expect(vec1).toEqual(vec2)
    expect(vec1.length).toBe(64)

    const simIdentical = cosineSimilarity(vec1, vec2)
    const simDiff = cosineSimilarity(vec1, vecDiff)

    expect(simIdentical).toBeCloseTo(1.0, 3)
    expect(simDiff).toBeLessThan(simIdentical)
  })
})
