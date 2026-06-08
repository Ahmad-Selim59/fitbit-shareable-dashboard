import { healthFetch } from "./client";
import { CACHE_TTL, withCache } from "./cache";
import { queryDateRange } from "./dates";

type CivilDateTime = { date?: string };
type StepsRollupPoint = {
  civilStartTime?: CivilDateTime;
  steps?: { countSum?: string };
};

type DailyRollUpResponse = {
  rollupDataPoints?: StepsRollupPoint[];
};

export type StepsDay = {
  date: string;
  steps: number;
};

function civilDateToString(c?: CivilDateTime): string | null {
  if (!c?.date) return null;
  return c.date.slice(0, 10);
}

function normalizeStepsRollup(points: StepsRollupPoint[]): StepsDay[] {
  return points
    .map((p) => {
      const date = civilDateToString(p.civilStartTime);
      const steps = parseInt(p.steps?.countSum ?? "0", 10);
      return { date: date ?? "", steps };
    })
    .filter((row) => row.date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

async function fetchStepsRollup(days: number): Promise<StepsDay[]> {
  const range = queryDateRange(days);
  const res = await healthFetch<DailyRollUpResponse>(
    "/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp",
    {
      method: "POST",
      body: JSON.stringify({
        range: {
          start: { date: range.start },
          end: { date: range.endExclusive },
        },
        windowSizeDays: 1,
      }),
    },
  );
  return normalizeStepsRollup(res.rollupDataPoints ?? []);
}

export async function fetchStepsDays(days = 7): Promise<StepsDay[]> {
  try {
    return await fetchStepsRollup(days);
  } catch (err) {
    console.error("[google-health] steps:", err);
    return [];
  }
}

export function fetchStepsDaysCached(days = 7): Promise<StepsDay[]> {
  return withCache(`steps:${days}`, CACHE_TTL.dailyMs, () =>
    fetchStepsDays(days),
  );
}

export async function fetchTodaySteps(): Promise<StepsDay | null> {
  const days = await fetchStepsDays(1);
  return days[0] ?? null;
}

export function fetchTodayStepsCached(): Promise<StepsDay | null> {
  return withCache("steps:today", CACHE_TTL.stepsMs, fetchTodaySteps);
}
