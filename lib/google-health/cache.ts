type CacheEntry<T> = { data: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

type CacheOptions<T> = {
  /** Override the default success check. When false, result is returned but not stored. */
  cacheWhen?: (data: T) => boolean;
};

/** True when a value represents a successful fetch worth caching. */
export function isSuccessfulCacheResult(value: unknown): boolean {
  if (value === null || value === undefined) return false;

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    const o = value as Record<string, unknown>;

    if (typeof o.error === "string" && o.error.length > 0) {
      return false;
    }

    if ("device" in o && o.device == null) {
      return false;
    }

    if (
      "restingHeartRate" in o &&
      "sleep" in o &&
      "spo2" in o &&
      Array.isArray(o.restingHeartRate) &&
      Array.isArray(o.sleep) &&
      Array.isArray(o.spo2)
    ) {
      return (
        o.restingHeartRate.length > 0 ||
        o.sleep.length > 0 ||
        o.spo2.length > 0
      );
    }

    if ("chartSamples" in o && Array.isArray(o.chartSamples)) {
      return o.chartSamples.length > 0;
    }

    if ("days" in o && Array.isArray(o.days)) {
      return o.days.length > 0;
    }
  }

  return true;
}

/**
 * In-memory TTL cache (shared per server instance).
 * Throws are never cached. By default, empty/error/null results are not cached either.
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  options: CacheOptions<T> = {},
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data as T;
  }

  const data = await fn();
  const shouldStore =
    options.cacheWhen !== undefined
      ? options.cacheWhen(data)
      : isSuccessfulCacheResult(data);

  if (shouldStore) {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  return data;
}

export function profileCacheKey(slug: string, key: string): string {
  return `profile:${slug}:${key}`;
}

export const CACHE_TTL = {
  /** Sleep, SpO₂, daily resting HR — changes slowly */
  dailyMs: 15 * 60 * 1000,
  /** Live heart rate window ending near now */
  liveHeartRateMs: 45 * 1000,
  /** Full-day hourly rollup — today */
  heartRateDayTodayMs: 2 * 60 * 1000,
  /** Latest BPM sample when live */
  heartRateLatestMs: 45 * 1000,
  /** Device battery — check at most once per hour */
  deviceMs: 60 * 60 * 1000,
} as const;
