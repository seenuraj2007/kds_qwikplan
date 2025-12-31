// Simple In-Memory Rate Limiter for Next.js (User ID based)
const limit = 5 // Max 5 requests
const windowMs = 60 * 1000 // 60 seconds window

interface RateLimitRecord {
  count: number
  resetTime: number
}

interface RateLimitResult {
  success: boolean
  retryAfter?: number
}

// Key: userId, Value: { count: number, resetTime: number }
const requestStore = new Map<string, RateLimitRecord>()

export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now()
  const record = requestStore.get(userId)

  // 1. No record yet (First request)
  if (!record) {
    requestStore.set(userId, { count: 1, resetTime: now + windowMs })
    return { success: true }
  }

  // 2. Window expired? (1 minute over)
  if (now > record.resetTime) {
    // Reset count
    requestStore.set(userId, { count: 1, resetTime: now + windowMs })
    return { success: true }
  }

  // 3. Check Limit
  if (record.count >= limit) {
    return { success: false, retryAfter: record.resetTime }
  }

  // 4. Increment Count
  record.count++
  requestStore.set(userId, { count: record.count, resetTime: record.resetTime })
  return { success: true }
}
