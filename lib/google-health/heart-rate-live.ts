import { healthFetch } from "./client";
import { CACHE_TTL, withCache } from "./cache";
import { msUntilLocalMidnight } from "./dates";
import { bucketSecondsForSpan } from "./downsample";
import {
  API_MAX_HEART_RATE_DAYS,
  HEART_RATE_WINDOW_OPTIONS,
  type HeartRateStats,
  type HeartRateViewMode,
  type HeartRateWindowHours,
  type LiveHeartRateData,
  type LiveHeartRateSample,
} from "./heart-rate-types";

export type {
  HeartRateStats,
  HeartRateViewMode,
  HeartRateWindowHours,
  LiveHeartRateData,
  LiveHeartRateSample,
} from "./heart-rate-types";
export {
  API_MAX_HEART_RATE_DAYS,
  HEART_RATE_WINDOW_OPTIONS,
} from "./heart-rate-types";

type HeartRatePoint = {
  heartRate?: {
    sampleTime?: { physicalTime?: string };
    beatsPerMinute?: string;
  };
};

type ListResponse = {
  dataPoints?: HeartRatePoint[];
  nextPageToken?: string;
};

type RollupPoint = {
  startTime?: string;
  endTime?: string;
  heartRate?: {
    beatsPerMinuteAvg?: number;
    beatsPerMinuteMin?: number;
    beatsPerMinuteMax?: number;
  };
};

type RollUpResponse = {
  rollupDataPoints?: RollupPoint[];
  nextPageToken?: string;
};

const CONTEXT_HOURS = 24;
const LIVE_THRESHOLD_MS = 5 * 60 * 1000;
const DAY_BUCKET_SECONDS = 3600;
/** Google heart-rate rollUp: windowSize × pageSize must not exceed 14 days. */
const HEART_RATE_MAX_ROLLUP_SEC = API_MAX_HEART_RATE_DAYS * 24 * 3600;

function rollupPageSize(
  windowSeconds: number,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const maxByPolicy = Math.floor(HEART_RATE_MAX_ROLLUP_SEC / windowSeconds);
  const rangeSec = Math.max(
    1,
    Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 1000),
  );
  const bucketsNeeded = Math.ceil(rangeSec / windowSeconds);
  return Math.min(bucketsNeeded, maxByPolicy, 1000);
}

function clampWindowHours(hours: number): HeartRateWindowHours {
  const allowed = HEART_RATE_WINDOW_OPTIONS as readonly number[];
  if (allowed.includes(hours)) return hours as HeartRateWindowHours;
  return 2;
}

function rollupWindowSeconds(windowHours: number, targetBars = 80): number {
  const spanMs = windowHours * 60 * 60 * 1000;
  const raw = Math.ceil(spanMs / targetBars / 1000);
  if (raw <= 60) return Math.max(30, Math.round(raw / 10) * 10);
  if (raw <= 600) return Math.round(raw / 30) * 30;
  return Math.round(raw / 60) * 60;
}

function computeStats(samples: LiveHeartRateSample[]): HeartRateStats | null {
  if (samples.length === 0) return null;
  const bpms = samples.map((s) => s.bpm);
  return {
    avg: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length),
    min: Math.min(...bpms),
    max: Math.max(...bpms),
    bucketCount: samples.length,
  };
}

function isNearNow(end: Date): boolean {
  return end.getTime() >= Date.now() - LIVE_THRESHOLD_MS;
}

function earliestAllowed(): Date {
  return new Date(Date.now() - API_MAX_HEART_RATE_DAYS * 24 * 60 * 60 * 1000);
}

function assertInRange(end: Date): void {
  if (end.getTime() < earliestAllowed().getTime()) {
    throw new Error(
      `Heart rate history is limited to ${API_MAX_HEART_RATE_DAYS} days`,
    );
  }
}

async function fetchHeartRateRollup(
  start: Date,
  end: Date,
  windowSeconds: number,
): Promise<LiveHeartRateSample[]> {
  const samples: LiveHeartRateSample[] = [];
  let pageToken: string | undefined;
  const pageSize = rollupPageSize(windowSeconds, start, end);

  do {
    const body: Record<string, unknown> = {
      range: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      windowSize: `${windowSeconds}s`,
      pageSize,
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await healthFetch<RollUpResponse>(
      "/v4/users/me/dataTypes/heart-rate/dataPoints:rollUp",
      { method: "POST", body: JSON.stringify(body) },
    );

    for (const p of res.rollupDataPoints ?? []) {
      const hr = p.heartRate;
      const avg = hr?.beatsPerMinuteAvg;
      if (avg === undefined || !p.endTime || !hr) continue;
      samples.push({
        bpm: Math.round(avg),
        at: p.endTime,
        minBpm: hr.beatsPerMinuteMin,
        maxBpm: hr.beatsPerMinuteMax,
      });
    }

    pageToken = res.nextPageToken;
  } while (pageToken);

  return samples.sort((a, b) => a.at.localeCompare(b.at));
}

function fetchRollupCached(
  cacheKey: string,
  ttlMs: number,
  start: Date,
  end: Date,
  windowSeconds: number,
): Promise<LiveHeartRateSample[]> {
  return withCache(cacheKey, ttlMs, () =>
    fetchHeartRateRollup(start, end, windowSeconds),
  );
}

async function fetchLatestHeartRate(
  before = new Date(),
): Promise<LiveHeartRateSample | null> {
  const end = before;
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  const filter = `heart_rate.sample_time.physical_time >= "${start.toISOString()}" AND heart_rate.sample_time.physical_time < "${end.toISOString()}"`;

  const res = await healthFetch<ListResponse>(
    `/v4/users/me/dataTypes/heart-rate/dataPoints?${new URLSearchParams({
      filter,
      pageSize: "25",
    })}`,
  );

  let latest: LiveHeartRateSample | null = null;
  for (const p of res.dataPoints ?? []) {
    const hr = p.heartRate;
    if (!hr?.beatsPerMinute || !hr.sampleTime?.physicalTime) continue;
    const bpm = parseInt(hr.beatsPerMinute, 10);
    if (bpm <= 0) continue;
    const sample = { bpm, at: hr.sampleTime.physicalTime };
    if (!latest || sample.at > latest.at) latest = sample;
  }
  return latest;
}

function fetchLatestHeartRateCached(): Promise<LiveHeartRateSample | null> {
  return withCache("hr-latest", CACHE_TTL.heartRateLatestMs, () =>
    fetchLatestHeartRate(new Date()),
  );
}

function dayCacheTtl(end: Date): number {
  return isNearNow(end) ? CACHE_TTL.heartRateDayTodayMs : msUntilLocalMidnight();
}

function windowCacheTtl(end: Date): number {
  return isNearNow(end) ? CACHE_TTL.liveHeartRateMs : msUntilLocalMidnight();
}

function hourCacheTtl(end: Date): number {
  return isNearNow(end) ? CACHE_TTL.liveHeartRateMs : msUntilLocalMidnight();
}

function fetchDayRollupCached(
  dateKey: string,
  start: Date,
  end: Date,
): Promise<LiveHeartRateSample[]> {
  return fetchRollupCached(
    `hr-day:${dateKey}`,
    dayCacheTtl(end),
    start,
    end,
    DAY_BUCKET_SECONDS,
  );
}

function windowCacheKey(windowHours: number, end: Date): string {
  const roundedEnd = Math.floor(end.getTime() / (5 * 60 * 1000));
  return `hr-window:${windowHours}:${roundedEnd}`;
}

export async function fetchHeartRateWindowChart(options: {
  windowHours?: number;
  end?: Date;
}): Promise<LiveHeartRateData> {
  const windowHours = clampWindowHours(options.windowHours ?? 2);
  const end = options.end ?? new Date();
  assertInRange(end);
  const isLive = isNearNow(end);

  const contextHours = Math.min(CONTEXT_HOURS, API_MAX_HEART_RATE_DAYS * 24);
  const fetchHours = Math.max(windowHours, contextHours);
  const fetchStart = new Date(
    Math.max(
      end.getTime() - fetchHours * 60 * 60 * 1000,
      earliestAllowed().getTime(),
    ),
  );
  const windowStart = new Date(end.getTime() - windowHours * 60 * 60 * 1000);
  const bucketSec = rollupWindowSeconds(windowHours);

  const allBuckets = await fetchRollupCached(
    windowCacheKey(windowHours, end),
    windowCacheTtl(end),
    fetchStart,
    end,
    bucketSec,
  );

  const chartSamples = allBuckets.filter(
    (s) => new Date(s.at).getTime() >= windowStart.getTime(),
  );
  const contextStart = new Date(end.getTime() - contextHours * 60 * 60 * 1000);
  const contextSamples = allBuckets.filter(
    (s) => new Date(s.at).getTime() >= contextStart.getTime(),
  );

  const latest = isLive
    ? await fetchLatestHeartRateCached()
    : (chartSamples.at(-1) ?? null);

  return {
    viewMode: "window",
    latest,
    chartSamples,
    chartBucketSeconds: bucketSec,
    windowHours,
    contextHours,
    windowStart: windowStart.toISOString(),
    windowEnd: end.toISOString(),
    windowStats: computeStats(chartSamples),
    contextStats: computeStats(contextSamples),
    isLive,
    apiMaxDays: API_MAX_HEART_RATE_DAYS,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchHeartRateDayChart(options: {
  dateKey: string;
  start: Date;
  end: Date;
}): Promise<LiveHeartRateData> {
  const { dateKey, start, end } = options;
  assertInRange(end);
  const isLive = isNearNow(end);

  const chartSamples = await fetchDayRollupCached(dateKey, start, end);
  const stats = computeStats(chartSamples);
  const latest = isLive
    ? await fetchLatestHeartRateCached()
    : (chartSamples.at(-1) ?? null);

  return {
    viewMode: "day",
    latest,
    chartSamples,
    chartBucketSeconds: DAY_BUCKET_SECONDS,
    windowHours: 24,
    contextHours: 24,
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    windowStats: stats,
    contextStats: stats,
    isLive,
    apiMaxDays: API_MAX_HEART_RATE_DAYS,
    fetchedAt: new Date().toISOString(),
    dateKey,
    viewLabel: dateKey,
  };
}

export async function fetchHeartRateHourChart(options: {
  dateKey: string;
  hour: number;
  start: Date;
  end: Date;
  dayStart: Date;
  dayEnd: Date;
}): Promise<LiveHeartRateData> {
  const { dateKey, hour, start, end, dayStart, dayEnd } = options;
  assertInRange(end);
  const isLive = isNearNow(end);
  const bucketSec = rollupWindowSeconds(1);

  const chartSamples = await fetchRollupCached(
    `hr-hour:${dateKey}:${hour}`,
    hourCacheTtl(end),
    start,
    end,
    bucketSec,
  );

  const daySamples = await fetchDayRollupCached(dateKey, dayStart, dayEnd);

  const latest = isLive
    ? await fetchLatestHeartRateCached()
    : (chartSamples.at(-1) ?? null);

  return {
    viewMode: "hour",
    latest,
    chartSamples,
    chartBucketSeconds: bucketSec,
    windowHours: 1,
    contextHours: 24,
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    windowStats: computeStats(chartSamples),
    contextStats: computeStats(daySamples),
    isLive,
    apiMaxDays: API_MAX_HEART_RATE_DAYS,
    fetchedAt: new Date().toISOString(),
    dateKey,
    hour,
    viewLabel: `${dateKey} · hour ${hour}`,
  };
}

export function fetchHeartRateWindowChartCached(options: {
  windowHours?: number;
  end?: Date;
}): Promise<LiveHeartRateData> {
  return fetchHeartRateWindowChart(options);
}

export function fetchHeartRateDayChartCached(options: {
  dateKey: string;
  start: Date;
  end: Date;
}): Promise<LiveHeartRateData> {
  return fetchHeartRateDayChart(options);
}

export function fetchHeartRateHourChartCached(options: {
  dateKey: string;
  hour: number;
  start: Date;
  end: Date;
  dayStart: Date;
  dayEnd: Date;
}): Promise<LiveHeartRateData> {
  return fetchHeartRateHourChart(options);
}

/** @deprecated use fetchHeartRateWindowChartCached */
export async function fetchHeartRateChart(options: {
  windowHours?: number;
  end?: Date;
}): Promise<LiveHeartRateData> {
  return fetchHeartRateWindowChart(options);
}

/** @deprecated use fetchHeartRateWindowChartCached */
export function fetchHeartRateChartCached(options: {
  windowHours?: number;
  end?: Date;
}): Promise<LiveHeartRateData> {
  return fetchHeartRateWindowChartCached(options);
}

/** @deprecated use fetchHeartRateWindowChartCached */
export async function fetchLiveHeartRate(): Promise<LiveHeartRateData> {
  return fetchHeartRateWindowChart({ windowHours: 2 });
}

/** @deprecated use fetchHeartRateWindowChartCached */
export function fetchLiveHeartRateCached(): Promise<LiveHeartRateData> {
  return fetchHeartRateWindowChartCached({ windowHours: 2 });
}

export { bucketSecondsForSpan };
