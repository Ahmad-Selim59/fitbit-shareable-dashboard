import { healthFetchForProfile } from "./client";
import { queryDateRange } from "./dates";
import { listAllReconciledDataPoints } from "./reconcile";
import { fetchStepsHistory, fetchTodaySteps } from "./steps";

export type HealthProbeResult = {
  range: { start: string; endExclusive: string };
  counts: {
    stepsDailyRollUp: number;
    heartRateReconcile: number;
    heartRateRollUp: number;
    sleepCivilEnd: number;
    sleepEndTime: number;
    dailyRestingHeartRate: number;
    dailyOxygenSaturation: number;
    oxygenSaturationSamples: number;
  };
  notes: string[];
};

async function countReconcile(
  slug: string,
  dataType: string,
  filter: string,
  pageSize = 25,
): Promise<number> {
  try {
    const points = await listAllReconciledDataPoints(
      slug,
      dataType,
      filter,
      pageSize,
    );
    return points.length;
  } catch {
    return -1;
  }
}

/** Probe Google Health cloud API for what data types actually return rows. */
export async function probeGoogleHealthData(slug: string): Promise<HealthProbeResult> {
  const range = queryDateRange(7);
  const end = new Date();
  const hrStart = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const hrFilter = `heart_rate.sample_time.physical_time >= "${hrStart.toISOString()}" AND heart_rate.sample_time.physical_time < "${end.toISOString()}"`;
  const sleepCivilFilter = `sleep.interval.civil_end_time >= "${range.start}" AND sleep.interval.civil_end_time < "${range.endExclusive}"`;
  const sleepEndFilter = `sleep.interval.end_time >= "${range.start}T00:00:00Z" AND sleep.interval.end_time < "${range.endExclusive}T00:00:00Z"`;
  const restingFilter = `daily_resting_heart_rate.date >= "${range.start}" AND daily_resting_heart_rate.date < "${range.endExclusive}"`;
  const spo2DailyFilter = `daily_oxygen_saturation.date >= "${range.start}" AND daily_oxygen_saturation.date < "${range.endExclusive}"`;
  const spo2SampleFilter = `oxygen_saturation.sample_time.physical_time >= "${hrStart.toISOString()}" AND oxygen_saturation.sample_time.physical_time < "${end.toISOString()}"`;

  const [stepsHistory, todaySteps] = await Promise.all([
    fetchStepsHistory(slug, 7).catch(() => ({ days: [] })),
    fetchTodaySteps(slug).catch(() => ({ today: null, days: [] })),
  ]);

  let heartRateRollUp = 0;
  try {
    const res = await healthFetchForProfile<{ rollupDataPoints?: unknown[] }>(
      slug,
      "/v4/users/me/dataTypes/heart-rate/dataPoints:rollUp",
      {
        method: "POST",
        body: JSON.stringify({
          range: {
            startTime: hrStart.toISOString(),
            endTime: end.toISOString(),
          },
          windowSize: "3600s",
          pageSize: 25,
        }),
      },
    );
    heartRateRollUp = res.rollupDataPoints?.length ?? 0;
  } catch {
    heartRateRollUp = -1;
  }

  const [
    heartRateReconcile,
    sleepCivilEnd,
    sleepEndTime,
    dailyRestingHeartRate,
    dailyOxygenSaturation,
    oxygenSaturationSamples,
  ] = await Promise.all([
    countReconcile(slug, "heart-rate", hrFilter),
    countReconcile(slug, "sleep", sleepCivilFilter, 25),
    countReconcile(slug, "sleep", sleepEndFilter, 25),
    countReconcile(slug, "daily-resting-heart-rate", restingFilter),
    countReconcile(slug, "daily-oxygen-saturation", spo2DailyFilter),
    countReconcile(slug, "oxygen-saturation", spo2SampleFilter, 100),
  ]);

  const stepsDays =
    stepsHistory.days.length + (todaySteps.today?.steps ? 1 : 0);

  const notes: string[] = [];
  if (stepsDays > 0 && heartRateReconcile === 0 && sleepCivilEnd === 0 && sleepEndTime === 0) {
    notes.push(
      "Steps exist in Google Health cloud but heart rate and sleep do not. " +
        "Samsung metrics may only be in the Google Health app on the phone (Health Connect), " +
        "not in the cloud API this dashboard uses.",
    );
  }
  if (dailyRestingHeartRate === 0) {
    notes.push(
      "Daily resting heart rate is usually unavailable for Samsung via Google Health.",
    );
  }

  return {
    range: { start: range.start, endExclusive: range.endExclusive },
    counts: {
      stepsDailyRollUp: stepsDays,
      heartRateReconcile,
      heartRateRollUp,
      sleepCivilEnd,
      sleepEndTime,
      dailyRestingHeartRate,
      dailyOxygenSaturation,
      oxygenSaturationSamples,
    },
    notes,
  };
}
