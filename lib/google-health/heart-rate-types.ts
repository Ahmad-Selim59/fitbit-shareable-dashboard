export type LiveHeartRateSample = {
  bpm: number;
  at: string;
  minBpm?: number;
  maxBpm?: number;
};

export type HeartRateStats = {
  avg: number;
  min: number;
  max: number;
  bucketCount: number;
};

export const HEART_RATE_WINDOW_OPTIONS = [2, 6, 12, 24] as const;
export type HeartRateWindowHours = (typeof HEART_RATE_WINDOW_OPTIONS)[number];

export type HeartRateViewMode = "window" | "day" | "hour";

export type LiveHeartRateData = {
  viewMode: HeartRateViewMode;
  latest: LiveHeartRateSample | null;
  chartSamples: LiveHeartRateSample[];
  chartBucketSeconds: number;
  windowHours: number;
  contextHours: number;
  windowStart: string;
  windowEnd: string;
  windowStats: HeartRateStats | null;
  contextStats: HeartRateStats | null;
  isLive: boolean;
  apiMaxDays: number;
  fetchedAt: string;
  /** Local calendar date YYYY-MM-DD for day/hour views */
  dateKey?: string;
  /** 0–23 when viewMode is hour */
  hour?: number;
  viewLabel?: string;
};

export const API_MAX_HEART_RATE_DAYS = 14;
