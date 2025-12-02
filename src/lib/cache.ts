import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL values in seconds - longer = fewer API calls
export const CACHE_TTL = {
  TYPES: 60 * 60 * 24 * 7,  // 1 week (types never change)
  SETS: 60 * 60 * 24 * 7,   // 1 week (new sets are rare)
  SET_DETAIL: 60 * 60 * 24, // 24 hours
  CARDS: 60 * 60 * 6,       // 6 hours (for search results)
  CARD_DETAIL: 60 * 60 * 24, // 24 hours (individual card prices update daily)
} as const;

// Generic cache wrapper
export async function getOrSetCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      console.log(`[CACHE HIT] ${key}`);
      return cached;
    }
    console.log(`[CACHE MISS] ${key} - calling API`);
  } catch (error) {
    // If Redis fails, just fetch from API
    console.error('Redis get error:', error);
  }

  // Fetch fresh data
  const data = await fetchFn();

  try {
    // Store in cache (don't await - fire and forget)
    redis.set(key, data, { ex: ttl }).catch((error) => {
      console.error('Redis set error:', error);
    });
  } catch (error) {
    console.error('Redis set error:', error);
  }

  return data;
}

// Helper to create cache keys
export function createCacheKey(prefix: string, params?: Record<string, string | number>): string {
  if (!params) return prefix;
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

export { redis };
