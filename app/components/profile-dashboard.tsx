import { HeartRateSection } from "./heart-rate-section";
import { SamsungCloudDataNotice } from "./samsung-cloud-data-notice";
import { SleepSection } from "./sleep-section";
import { SpO2Section } from "./spo2-section";
import { fetchDashboardDataCached } from "@/lib/google-health/data";
import { fetchDeviceStatusCached } from "@/lib/google-health/device";
import { fetchStepsHistoryCached, fetchTodaySteps } from "@/lib/google-health/steps";
import type { ProfileRow } from "@/lib/profiles/types";
import {
  getProfileCapabilities,
  getProfileWatchType,
} from "@/lib/profiles/store";
import { resolveEffectiveCapabilities } from "@/lib/watch-config";

export async function ProfileDashboard({
  profile,
  connected = true,
}: {
  profile: ProfileRow;
  connected?: boolean;
}) {
  const slug = profile.slug;
  if (!connected) {
    return null;
  }
  const watchType = getProfileWatchType(profile);
  const capabilities = resolveEffectiveCapabilities({
    watchType,
    probed: getProfileCapabilities(profile),
  });

  try {
    const [data, stepsHistory, todaySteps, deviceStatus] = await Promise.all([
      fetchDashboardDataCached(slug, 7),
      fetchStepsHistoryCached(slug, 7),
      fetchTodaySteps(slug),
      fetchDeviceStatusCached(slug),
    ]);

    const stepsError = todaySteps.error ?? stepsHistory.error;
    const hasSteps =
      (todaySteps.today?.steps ?? 0) > 0 ||
      stepsHistory.days.some((d) => d.steps > 0);
    const showSamsungCloudLimit =
      watchType === "samsung" &&
      hasSteps &&
      data.sleep.length === 0 &&
      data.spo2.length === 0 &&
      data.restingHeartRate.length === 0;

    return (
      <>
        {showSamsungCloudLimit && <SamsungCloudDataNotice />}
        <p className="text-sm text-zinc-500">
          Showing {data.range.start} → {data.range.end}
        </p>
        {(capabilities.restingHeartRate ||
          capabilities.liveHeartRate ||
          capabilities.steps ||
          capabilities.deviceBattery) && (
          <HeartRateSection
            profileSlug={slug}
            days={data.restingHeartRate}
            stepsHistory={stepsHistory.days}
            initialToday={todaySteps.today}
            stepsError={stepsError}
            deviceStatus={deviceStatus}
            watchType={watchType}
            showDeviceBattery={capabilities.deviceBattery}
            showRestingHeartRate={capabilities.restingHeartRate}
            showLiveHeartRate={capabilities.liveHeartRate}
            showSteps={capabilities.steps}
          />
        )}
        {capabilities.sleep && <SleepSection logs={data.sleep} />}
        {capabilities.spo2 && <SpO2Section days={data.spo2} />}
        {!Object.values(capabilities).some(Boolean) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-medium">No supported metrics found yet.</p>
            <p className="mt-2">
              Sync your watch with Google Health, then use manage settings to
              re-check features.
            </p>
          </div>
        )}
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Could not load health data: {message}.
      </p>
    );
  }
}
