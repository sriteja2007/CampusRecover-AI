export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number // timestamp in ms when window resets
  retryAfterMs?: number
}

export class RateLimiter {
  private static storagePrefix = "cr_ratelimit_"

  /**
   * Check and consume one hit against a rate limit bucket.
   * @param key Unique identifier (e.g. "otp:userId", "report:userId")
   * @param config { maxRequests, windowMs }
   */
  public static check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const storageKey = `${this.storagePrefix}${key}`

    let timestamps: number[] = []
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        timestamps = JSON.parse(raw)
      }
    } catch {
      timestamps = []
    }

    // Filter out timestamps outside the sliding window
    const windowStart = now - config.windowMs
    timestamps = timestamps.filter((t) => t > windowStart)

    if (timestamps.length >= config.maxRequests) {
      const oldestInWindow = timestamps[0]
      const resetTime = oldestInWindow + config.windowMs
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfterMs: Math.max(0, resetTime - now),
      }
    }

    // Record new hit
    timestamps.push(now)
    try {
      localStorage.setItem(storageKey, JSON.stringify(timestamps))
    } catch {
      // Storage quota exceeded fallback
    }

    return {
      allowed: true,
      remaining: config.maxRequests - timestamps.length,
      resetTime: now + config.windowMs,
    }
  }

  /**
   * Reset rate limit state for a key.
   */
  public static reset(key: string): void {
    try {
      localStorage.removeItem(`${this.storagePrefix}${key}`)
    } catch {
      // ignore
    }
  }

  /**
   * Predefined standard configs for CampusRecover SaaS
   */
  public static STANDARD_LIMITS = {
    OTP_VERIFY: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
    REPORT_SUBMIT: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 reports per hr
    AI_MATCH_RUN: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 runs per min
    CHAT_MESSAGE: { maxRequests: 40, windowMs: 60 * 1000 }, // 40 messages per min
  }
}

export default RateLimiter
