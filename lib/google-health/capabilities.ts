import type { DashboardCapabilities } from "@/lib/watch-config";
import { fetchDashboardData } from "./data";
import { fetchDeviceStatus } from "./device";
import { fetchHeartRateWindowChart } from "./heart-rate-live";
import { fetchStepsHistory, fetchTodaySteps } from "./steps";

export async function probeDashboardCapabilities(
  slug: string,
): Promise<DashboardCapabilities> {
  const [dashboard, stepsHistory, todaySteps, deviceStatus, liveHr] =
    await Promise.all([
      fetchDashboardData(slug, 7).catch(() => ({
        range: { start: "", end: "" },
        restingHeartRate: [],
        sleep: [],
        spo2: [],
      })),
      fetchStepsHistory(slug, 7).catch(() => ({
        days: [] as { date: string; steps: number }[],
      })),
      fetchTodaySteps(slug).catch(() => ({
        days: [],
        today: null as { date: string; steps: number } | null,
      })),
      fetchDeviceStatus(slug).catch(() => ({ device: null })),
      fetchHeartRateWindowChart(slug, { windowHours: 24 }).catch(() => ({
        chartSamples: [] as { bpm: number; at: string }[],
      })),
    ]);

  const hasSteps =
    (todaySteps.today?.steps ?? 0) > 0 ||
    stepsHistory.days.some((d) => d.steps > 0);

  return {
    restingHeartRate: dashboard.restingHeartRate.length > 0,
    liveHeartRate:
      liveHr.chartSamples.length > 0 || dashboard.restingHeartRate.length > 0,
    steps: hasSteps,
    sleep: dashboard.sleep.length > 0,
    spo2: dashboard.spo2.length > 0,
    deviceBattery: deviceStatus.device !== null,
  };
}
