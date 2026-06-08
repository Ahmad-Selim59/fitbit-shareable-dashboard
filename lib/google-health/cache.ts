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
  /** Live heart rate window ending near now */
  liveHeartRateMs: 45 * 1000,
  /** Historical heart rate windows (unchanging data) */
  heartRateWindowHistoricalMs: 10 * 60 * 1000,
  /** Full-day hourly rollup — today */
  heartRateDayTodayMs: 2 * 60 * 1000,
  /** Full-day hourly rollup — past days */
  heartRateDayHistoricalMs: 15 * 60 * 1000,
  /** Single-hour detail rollup */
  heartRateHourMs: 5 * 60 * 1000,
  /** Latest BPM sample when live */
  heartRateLatestMs: 45 * 1000,
  /** Today's step count — updates through the day */
  stepsMs: 5 * 60 * 1000,
  /** Device battery — changes slowly */
  deviceMs: 10 * 60 * 1000,
} as const;
