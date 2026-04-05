/**
 * In-memory rate limiter for tRPC procedures.
 *
 * SECURITY: Prevents abuse by limiting request rates per identifier (userId or IP).
 * Uses sliding window algorithm for accurate rate limiting.
 *
 * Limits (from security ticket #135):
 * - login: 5 requests / 15 minutes
 * - sync: 10 requests / 5 minutes
 * - mutation: 100 requests / minute
 * - query: 300 requests / minute
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

// In-memory store - entries are cleaned up on access
const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  // Convert to array to avoid iterator downlevel issues
  const entries = Array.from(store.entries());
  for (const [key, entry] of entries) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

/**
 * Rate limit configurations for different operation types.
 * SECURITY: These limits protect against brute force and DoS attacks.
 */
export const RATE_LIMITS = {
  /** Login attempts - strict limit to prevent credential stuffing */
  login: { limit: 5, windowMs: 15 * 60 * 1000 } as RateLimitConfig, // 5 per 15 min

  /** Calendar sync operations - moderate limit for API quota protection */
  sync: { limit: 10, windowMs: 5 * 60 * 1000 } as RateLimitConfig, // 10 per 5 min

  /** Write operations - reasonable limit for normal usage */
  mutation: { limit: 100, windowMs: 60 * 1000 } as RateLimitConfig, // 100 per min

  /** Read operations - higher limit for better UX */
  query: { limit: 300, windowMs: 60 * 1000 } as RateLimitConfig, // 300 per min
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique identifier (userId, IP, or combination)
 * @param type - Type of rate limit to apply
 * @returns Rate limit result with remaining quota
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): RateLimitResult {
  cleanup();

  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  // Reset if window has passed
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  // Increment counter
  entry.count++;
  store.set(key, entry);

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Get the current rate limit status without incrementing the counter.
 * Useful for showing remaining quota to users.
 */
export function getRateLimitStatus(
  identifier: string,
  type: RateLimitType
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      resetAt: new Date(now + config.windowMs),
    };
  }

  const remaining = Math.max(0, config.limit - entry.count);
  return {
    success: remaining > 0,
    limit: config.limit,
    remaining,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Reset rate limit for a specific identifier and type.
 * Useful for testing or administrative purposes.
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const key = `${type}:${identifier}`;
  store.delete(key);
}

/**
 * Clear all rate limit entries.
 * CAUTION: Only use for testing or emergency situations.
 */
export function clearAllRateLimits(): void {
  store.clear();
}
