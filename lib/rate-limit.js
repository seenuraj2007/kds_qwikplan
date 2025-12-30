// Simple In-Memory Rate Limiter for Next.js (User ID based)
const limit = 5 // Max 5 requests
const window = 60 * 1000 // 60 seconds window

const requestStore = new Map() // Key: userId, Value: { count: number, resetTime: number }

export function checkRateLimit(userId) {
  const now = Date.now()
  const record = requestStore.get(userId)

  // 1. No record yet (First request)
  if (!record) {
    requestStore.set(userId, { count: 1, resetTime: now + window })
    return { success: true }
  }

  // 2. Window expired? (1 minute over)
  if (now > record.resetTime) {
    // Reset count
    requestStore.set(userId, { count: 1, resetTime: now + window })
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
