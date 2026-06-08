import { healthFetch } from "./client";
import { withCache } from "./cache";
import {
  civilDateTimeToString,
  localTodayDateKey,
  msUntilLocalMidnight,
  nextDayAfter,
  queryDateRange,
  toCivilDateRequest,
  type CivilDateTime,
} from "./dates";

type StepsRollupPoint = {
  civilStartTime?: CivilDateTime;
  civil_start_time?: CivilDateTime;
  steps?: { countSum?: string; count_sum?: string };
};

type DailyRollUpResponse = {
  rollupDataPoints?: StepsRollupPoint[];
  rollup_data_points?: StepsRollupPoint[];
};

export type StepsDay = {
  date: string;
  steps: number;
};

export type StepsFetchResult = {
  days: StepsDay[];
  error?: string;
};

export type TodayStepsResult = StepsFetchResult & {
  today: StepsDay | null;
};

const HISTORY_DAYS = 7;

function normalizeStepsRollup(points: StepsRollupPoint[]): StepsDay[] {
  return points
    .map((p) => {
      const civil = p.civilStartTime ?? p.civil_start_time;
      const date = civilDateTimeToString(civil);
      const stepsRaw = p.steps?.countSum ?? p.steps?.count_sum ?? "0";
      const steps = parseInt(stepsRaw, 10);
      return { date: date ?? "", steps: Number.isNaN(steps) ? 0 : steps };
    })
    .filter((row) => row.date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

async function fetchStepsRollupRange(
  startDate: string,
  endExclusiveDate: string,
): Promise<StepsDay[]> {
  const res = await healthFetch<DailyRollUpResponse>(
    "/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp",
    {
      method: "POST",
      body: JSON.stringify({
        range: {
          start: toCivilDateRequest(startDate),
          end: toCivilDateRequest(endExclusiveDate),
        },
        windowSizeDays: 1,
      }),
    },
  );
  const points = res.rollupDataPoints ?? res.rollup_data_points ?? [];
  return normalizeStepsRollup(points);
}

/** Past days only — excludes today. Cached on server until local midnight. */
export async function fetchStepsHistory(
  days = HISTORY_DAYS,
): Promise<StepsFetchResult> {
  const todayKey = localTodayDateKey();
  try {
    const range = queryDateRange(days);
    const rows = await fetchStepsRollupRange(range.start, range.endExclusive);
    return { days: rows.filter((d) => d.date !== todayKey) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load steps";
    console.error("[google-health] steps history:", message);
    return { days: [], error: message };
  }
}

export function fetchStepsHistoryCached(
  days = HISTORY_DAYS,
): Promise<StepsFetchResult> {
  return withCache(
    `steps-history:${days}`,
    msUntilLocalMidnight(),
    () => fetchStepsHistory(days),
  );
}

/** Today only — always fetched fresh, never cached. */
export async function fetchTodaySteps(): Promise<TodayStepsResult> {
  const todayKey = localTodayDateKey();
  try {
    const rows = await fetchStepsRollupRange(todayKey, nextDayAfter(todayKey));
    const today = rows.find((d) => d.date === todayKey) ?? rows[0] ?? null;
    return { days: today ? [today] : [], today };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load steps";
    console.error("[google-health] steps today:", message);
    return { days: [], today: null, error: message };
  }
}
