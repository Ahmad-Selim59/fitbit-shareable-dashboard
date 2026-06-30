import { CACHE_TTL, profileCacheKey, withCache } from "./cache";
import { queryDateRange, civilDateTimeToString } from "./dates";
import { listAllReconciledDataPoints } from "./reconcile";

type CivilDateTime = { date?: string | { year?: number; month?: number; day?: number }; time?: string };
type HealthDate = { year?: number; month?: number; day?: number };

type DataPoint = {
  name?: string;
  dailyRestingHeartRate?: {
    date?: HealthDate;
    beatsPerMinute?: string;
  };
  sleep?: {
    interval?: {
      startTime?: string;
      endTime?: string;
      civilEndTime?: CivilDateTime;
    };
    summary?: {
      minutesAsleep?: string;
      minutesAwake?: string;
      minutesInSleepPeriod?: string;
      stagesSummary?: Array<{
        type?: string;
        minutes?: string;
      }>;
    };
    metadata?: { nap?: boolean };
  };
  dailyOxygenSaturation?: {
    date?: HealthDate;
    averagePercentage?: number;
    lowerBoundPercentage?: number;
    upperBoundPercentage?: number;
  };
  oxygenSaturation?: {
    sampleTime?: { physicalTime?: string };
    percentage?: number;
  };
};

export type RestingHeartRateDay = {
  date: string;
  restingBpm: number;
};

export type SleepLogView = {
  dateOfSleep: string;
  startTime: string;
  endTime: string;
  minutesAsleep: number;
  minutesAwake: number;
  efficiency: number | null;
  stages: {
    deep?: number;
    light?: number;
    rem?: number;
    wake?: number;
  };
};

export type SpO2DayView = {
  date: string;
  avg: number;
  min: number;
  max: number;
};

export type DashboardData = {
  range: { start: string; end: string };
  restingHeartRate: RestingHeartRateDay[];
  sleep: SleepLogView[];
  spo2: SpO2DayView[];
};

function healthDateToString(d?: HealthDate): string | null {
  if (!d?.year || !d?.month || !d?.day) return null;
  const month = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  return `${d.year}-${month}-${day}`;
}

function civilDateToString(c?: CivilDateTime): string | null {
  return civilDateTimeToString(c);
}

function parseIntField(value?: string): number {
  return value ? parseInt(value, 10) : 0;
}

function normalizeRestingHeartRate(
  points: DataPoint[],
): RestingHeartRateDay[] {
  return points
    .filter((p) => p.dailyRestingHeartRate)
    .map((p) => {
      const d = p.dailyRestingHeartRate!;
      const date = healthDateToString(d.date);
      return {
        date: date ?? "",
        restingBpm: parseInt(d.beatsPerMinute ?? "0", 10),
      };
    })
    .filter((row) => row.date && row.restingBpm > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function stageMinutes(
  summary: NonNullable<DataPoint["sleep"]>["summary"],
  type: string,
): number | undefined {
  const row = summary?.stagesSummary?.find((s) => s.type === type);
  return row?.minutes ? parseInt(row.minutes, 10) : undefined;
}

function normalizeSleep(points: DataPoint[]): SleepLogView[] {
  return points
    .filter((p) => p.sleep && !p.sleep.metadata?.nap)
    .map((p) => {
      const s = p.sleep!;
      const summary = s.summary;
      const minutesAsleep = parseIntField(summary?.minutesAsleep);
      const minutesInPeriod = parseIntField(summary?.minutesInSleepPeriod);
      const efficiency =
        minutesInPeriod > 0
          ? Math.round((minutesAsleep / minutesInPeriod) * 100)
          : null;

      return {
        dateOfSleep:
          civilDateToString(s.interval?.civilEndTime) ??
          (s.interval?.endTime?.slice(0, 10) ?? ""),
        startTime: s.interval?.startTime ?? "",
        endTime: s.interval?.endTime ?? "",
        minutesAsleep,
        minutesAwake: parseIntField(summary?.minutesAwake),
        efficiency,
        stages: {
          deep: stageMinutes(summary, "DEEP"),
          light: stageMinutes(summary, "LIGHT"),
          rem: stageMinutes(summary, "REM"),
          wake: stageMinutes(summary, "AWAKE"),
        },
      };
    })
    .filter((row) => row.dateOfSleep)
    .sort((a, b) => b.dateOfSleep.localeCompare(a.dateOfSleep));
}

function normalizeSpO2(points: DataPoint[]): SpO2DayView[] {
  return points
    .filter((p) => p.dailyOxygenSaturation)
    .map((p) => {
      const d = p.dailyOxygenSaturation!;
      const date = healthDateToString(d.date);
      return {
        date: date ?? "",
        avg: d.averagePercentage ?? 0,
        min: d.lowerBoundPercentage ?? 0,
        max: d.upperBoundPercentage ?? 0,
      };
    })
    .filter((row) => row.date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function normalizeSpO2FromSamples(points: DataPoint[]): SpO2DayView[] {
  const byDate = new Map<string, number[]>();
  for (const p of points) {
    const o = p.oxygenSaturation;
    const at = o?.sampleTime?.physicalTime;
    const pct = o?.percentage;
    if (!at || pct == null || pct <= 0) continue;
    const date = at.slice(0, 10);
    const list = byDate.get(date) ?? [];
    list.push(pct);
    byDate.set(date, list);
  }
  return [...byDate.entries()]
    .map(([date, values]) => ({
      date,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function mergeSleepPoints(a: DataPoint[], b: DataPoint[]): DataPoint[] {
  const seen = new Set<string>();
  const merged: DataPoint[] = [];
  for (const p of [...a, ...b]) {
    const key = `${p.sleep?.interval?.startTime ?? ""}:${p.sleep?.interval?.endTime ?? ""}`;
    if (!key || key === ":" || seen.has(key)) continue;
    seen.add(key);
    merged.push(p);
  }
  return merged;
}

async function fetchSleepPoints(
  slug: string,
  range: { start: string; endExclusive: string },
): Promise<DataPoint[]> {
  const civilFilter = `sleep.interval.civil_end_time >= "${range.start}" AND sleep.interval.civil_end_time < "${range.endExclusive}"`;
  const endFilter = `sleep.interval.end_time >= "${range.start}T00:00:00Z" AND sleep.interval.end_time < "${range.endExclusive}T00:00:00Z"`;
  const [byCivil, byEnd] = await Promise.all([
    listAllReconciledDataPoints<DataPoint>(slug, "sleep", civilFilter, 25),
    listAllReconciledDataPoints<DataPoint>(slug, "sleep", endFilter, 25),
  ]);
  return mergeSleepPoints(byCivil, byEnd);
}

async function fetchSafe(
  label: string,
  fn: () => Promise<DataPoint[]>,
): Promise<DataPoint[]> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[google-health] ${label}:`, err);
    return [];
  }
}

export async function fetchDashboardData(
  slug: string,
  days = 7,
): Promise<DashboardData> {
  const range = queryDateRange(days);

  const restingFilter = `daily_resting_heart_rate.date >= "${range.start}" AND daily_resting_heart_rate.date < "${range.endExclusive}"`;
  const spo2Filter = `daily_oxygen_saturation.date >= "${range.start}" AND daily_oxygen_saturation.date < "${range.endExclusive}"`;
  const spo2SampleEnd = new Date();
  const spo2SampleStart = new Date(spo2SampleEnd.getTime() - days * 24 * 60 * 60 * 1000);
  const spo2SampleFilter = `oxygen_saturation.sample_time.physical_time >= "${spo2SampleStart.toISOString()}" AND oxygen_saturation.sample_time.physical_time < "${spo2SampleEnd.toISOString()}"`;

  const [restingRaw, sleepRaw, spo2DailyRaw, spo2SampleRaw] = await Promise.all([
    fetchSafe("daily-resting-heart-rate", () =>
      listAllReconciledDataPoints<DataPoint>(
        slug,
        "daily-resting-heart-rate",
        restingFilter,
      ),
    ),
    fetchSafe("sleep", () => fetchSleepPoints(slug, range)),
    fetchSafe("daily-oxygen-saturation", () =>
      listAllReconciledDataPoints<DataPoint>(
        slug,
        "daily-oxygen-saturation",
        spo2Filter,
      ),
    ),
    fetchSafe("oxygen-saturation", () =>
      listAllReconciledDataPoints<DataPoint>(
        slug,
        "oxygen-saturation",
        spo2SampleFilter,
        100,
      ),
    ),
  ]);

  const spo2Daily = normalizeSpO2(spo2DailyRaw);
  const spo2 =
    spo2Daily.length > 0 ? spo2Daily : normalizeSpO2FromSamples(spo2SampleRaw);

  return {
    range: { start: range.start, end: range.end },
    restingHeartRate: normalizeRestingHeartRate(restingRaw),
    sleep: normalizeSleep(sleepRaw),
    spo2,
  };
}

export function fetchDashboardDataCached(
  slug: string,
  days = 7,
): Promise<DashboardData> {
  return withCache(
    profileCacheKey(slug, `dashboard:reconcile-v2:${days}`),
    CACHE_TTL.dailyMs,
    () => fetchDashboardData(slug, days),
  );
}
