import type { LiveHeartRateSample } from "./heart-rate-types";

/** Average BPM per fixed time bucket (chronological order). */
export function downsampleHeartRate(
  samples: LiveHeartRateSample[],
  bucketSeconds: number,
): LiveHeartRateSample[] {
  if (samples.length === 0 || bucketSeconds <= 0) return [];

  const buckets = new Map<
    number,
    { sum: number; count: number; at: string }
  >();

  for (const s of samples) {
    const t = new Date(s.at).getTime();
    if (Number.isNaN(t)) continue;
    const key = Math.floor(t / (bucketSeconds * 1000));
    const prev = buckets.get(key);
    if (!prev) {
      buckets.set(key, { sum: s.bpm, count: 1, at: s.at });
    } else {
      prev.sum += s.bpm;
      prev.count += 1;
      if (s.at > prev.at) prev.at = s.at;
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([, v]) => ({
      bpm: Math.round(v.sum / v.count),
      at: v.at,
    }));
}

/** Pick bucket size so the chart has roughly targetBars columns. */
export function bucketSecondsForSpan(
  spanMs: number,
  targetBars = 80,
): number {
  if (spanMs <= 0) return 40;
  const raw = Math.ceil(spanMs / targetBars / 1000);
  return Math.max(20, Math.min(60, Math.round(raw / 10) * 10));
}

export function samplesInWindow(
  samples: LiveHeartRateSample[],
  windowMs: number,
): LiveHeartRateSample[] {
  const cutoff = Date.now() - windowMs;
  return samples
    .filter((s) => new Date(s.at).getTime() >= cutoff)
    .sort((a, b) => a.at.localeCompare(b.at));
}
