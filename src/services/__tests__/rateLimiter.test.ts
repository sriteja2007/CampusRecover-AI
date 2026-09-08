import { describe, it, expect, beforeEach } from "vitest"
import { RateLimiter } from "../rateLimiter.service"

describe("RateLimiter Service", () => {
  const testKey = "user_test_action"
  const config = { maxRequests: 3, windowMs: 1000 }

  beforeEach(() => {
    RateLimiter.reset(testKey)
  })

  it("should allow requests under the limit", () => {
    const res1 = RateLimiter.check(testKey, config)
    expect(res1.allowed).toBe(true)
    expect(res1.remaining).toBe(2)

    const res2 = RateLimiter.check(testKey, config)
    expect(res2.allowed).toBe(true)
    expect(res2.remaining).toBe(1)

    const res3 = RateLimiter.check(testKey, config)
    expect(res3.allowed).toBe(true)
    expect(res3.remaining).toBe(0)
  })

  it("should reject requests that exceed the limit", () => {
    RateLimiter.check(testKey, config)
    RateLimiter.check(testKey, config)
    RateLimiter.check(testKey, config)

    const denied = RateLimiter.check(testKey, config)
    expect(denied.allowed).toBe(false)
    expect(denied.remaining).toBe(0)
    expect(denied.retryAfterMs).toBeGreaterThan(0)
  })

  it("should reset rate limits successfully", () => {
    RateLimiter.check(testKey, config)
    RateLimiter.check(testKey, config)
    RateLimiter.check(testKey, config)

    expect(RateLimiter.check(testKey, config).allowed).toBe(false)

    RateLimiter.reset(testKey)

    expect(RateLimiter.check(testKey, config).allowed).toBe(true)
  })
})
