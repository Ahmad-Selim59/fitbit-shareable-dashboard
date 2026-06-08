type CacheEntry<T> = { data: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

/** In-memory TTL cache (shared per server instance — avoids duplicate Google calls). */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data as T;
  }
  const data = await fn();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

export const CACHE_TTL = {
  /** Sleep, SpO₂, daily resting HR — changes slowly */
  dailyMs: 15 * 60 * 1000,
  /** Live heart rate — refresh often, but share across visitors briefly */
  liveHeartRateMs: 45 * 1000,
} as const;
