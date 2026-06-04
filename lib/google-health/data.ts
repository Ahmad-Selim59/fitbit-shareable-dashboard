import { healthFetch } from "./client";
import { queryDateRange } from "./dates";

type CivilDateTime = { date?: string; time?: string };
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
};

type ListResponse = {
  dataPoints?: DataPoint[];
  nextPageToken?: string;
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
  if (!c?.date) return null;
  return c.date.slice(0, 10);
}

function parseIntField(value?: string): number {
  return value ? parseInt(value, 10) : 0;
}

async function listAllDataPoints(
  dataType: string,
  filter: string,
  pageSize = 100,
): Promise<DataPoint[]> {
  const all: DataPoint[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      filter,
      pageSize: String(pageSize),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const path = `/v4/users/me/dataTypes/${dataType}/dataPoints?${params}`;
    const res = await healthFetch<ListResponse>(path);
    all.push(...(res.dataPoints ?? []));
    pageToken = res.nextPageToken;
  } while (pageToken);

  return all;
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

export async function fetchDashboardData(
  days = 7,
): Promise<DashboardData> {
  const range = queryDateRange(days);

  const restingFilter = `dailyRestingHeartRate.date >= "${range.start}" AND dailyRestingHeartRate.date < "${range.endExclusive}"`;
  const sleepFilter = `sleep.interval.civil_end_time >= "${range.start}" AND sleep.interval.civil_end_time < "${range.endExclusive}"`;
  const spo2Filter = `dailyOxygenSaturation.date >= "${range.start}" AND dailyOxygenSaturation.date < "${range.endExclusive}"`;

  const [restingRaw, sleepRaw, spo2Raw] = await Promise.all([
    listAllDataPoints("daily-resting-heart-rate", restingFilter),
    listAllDataPoints("sleep", sleepFilter, 25),
    listAllDataPoints("daily-oxygen-saturation", spo2Filter).catch(
      () => [] as DataPoint[],
    ),
  ]);

  return {
    range: { start: range.start, end: range.end },
    restingHeartRate: normalizeRestingHeartRate(restingRaw),
    sleep: normalizeSleep(sleepRaw),
    spo2: normalizeSpO2(spo2Raw),
  };
}
