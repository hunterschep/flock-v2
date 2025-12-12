/**
 * API Rate Limiting
 * Uses in-memory store for development, Redis for production
 */

import type { RateLimitResult, ApiContext } from './types';

// In-memory store for development (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 60000);
}

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  let entry = rateLimitStore.get(key);
  
  // Create new entry or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }
  
  // Increment count
  entry.count += 1;
  rateLimitStore.set(key, entry);
  
  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit;
  
  return {
    allowed,
    remaining,
    resetAt: new Date(entry.resetAt),
    limit,
  };
}

/**
 * Check both per-minute and per-day rate limits
 */
export async function checkApiRateLimits(
  context: ApiContext
): Promise<{
  allowed: boolean;
  error?: { code: string; message: string; retryAfter: number };
  headers: Record<string, string>;
}> {
  // Per-minute limit
  const minuteResult = await checkRateLimit(
    `minute:${context.keyId}`,
    context.rateLimitPerMinute,
    60 * 1000 // 1 minute
  );
  
  // Per-day limit
  const dayResult = await checkRateLimit(
    `day:${context.keyId}`,
    context.rateLimitPerDay,
    24 * 60 * 60 * 1000 // 24 hours
  );
  
  // Build headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit-Minute': context.rateLimitPerMinute.toString(),
    'X-RateLimit-Remaining-Minute': minuteResult.remaining.toString(),
    'X-RateLimit-Reset-Minute': minuteResult.resetAt.toISOString(),
    'X-RateLimit-Limit-Day': context.rateLimitPerDay.toString(),
    'X-RateLimit-Remaining-Day': dayResult.remaining.toString(),
    'X-RateLimit-Reset-Day': dayResult.resetAt.toISOString(),
  };
  
  // Check minute limit first (most likely to be hit)
  if (!minuteResult.allowed) {
    const retryAfter = Math.ceil((minuteResult.resetAt.getTime() - Date.now()) / 1000);
    return {
      allowed: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Too many requests per minute. Retry after ${retryAfter} seconds.`,
        retryAfter,
      },
      headers: {
        ...headers,
        'Retry-After': retryAfter.toString(),
      },
    };
  }
  
  // Check day limit
  if (!dayResult.allowed) {
    const retryAfter = Math.ceil((dayResult.resetAt.getTime() - Date.now()) / 1000);
    return {
      allowed: false,
      error: {
        code: 'DAILY_LIMIT_EXCEEDED',
        message: `Daily rate limit exceeded. Retry after ${retryAfter} seconds.`,
        retryAfter,
      },
      headers: {
        ...headers,
        'Retry-After': retryAfter.toString(),
      },
    };
  }
  
  return {
    allowed: true,
    headers,
  };
}

/**
 * Get current usage stats for a key
 */
export async function getUsageStats(keyId: string): Promise<{
  minute: { count: number; limit: number; resetAt: Date };
  day: { count: number; limit: number; resetAt: Date };
}> {
  const now = Date.now();
  
  const minuteEntry = rateLimitStore.get(`ratelimit:minute:${keyId}`);
  const dayEntry = rateLimitStore.get(`ratelimit:day:${keyId}`);
  
  return {
    minute: {
      count: minuteEntry?.resetAt && minuteEntry.resetAt > now ? minuteEntry.count : 0,
      limit: 0, // Would need context to know limit
      resetAt: new Date(minuteEntry?.resetAt || now + 60000),
    },
    day: {
      count: dayEntry?.resetAt && dayEntry.resetAt > now ? dayEntry.count : 0,
      limit: 0,
      resetAt: new Date(dayEntry?.resetAt || now + 86400000),
    },
  };
}

