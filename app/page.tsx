import { HeartRateSection } from "./components/heart-rate-section";
import { SleepSection } from "./components/sleep-section";
import { SpO2Section } from "./components/spo2-section";
import { getConnectionStatus } from "@/lib/google-health/client";
import { fetchDashboardDataCached } from "@/lib/google-health/data";
import { fetchDeviceStatusCached } from "@/lib/google-health/device";
import { fetchStepsHistoryCached, fetchTodaySteps } from "@/lib/google-health/steps";

export const dynamic = "force-dynamic";

export default async function Home() {
  const status = await getConnectionStatus();
  const connected = status.working;

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Health dashboard
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Personal heart rate, steps, sleep, and SpO₂
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
        {status.configured && !status.working && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Google token is configured but not working
            {status.refreshError ? `: ${status.refreshError}` : ""}. Fix at{" "}
            <a href="/setup" className="font-medium underline">
              /setup
            </a>
            .
          </div>
        )}

        {!connected ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 dark:border-amber-900 dark:bg-amber-950">
            <h2 className="text-lg font-medium text-amber-950 dark:text-amber-100">
              Dashboard not configured yet
            </h2>
            <p className="mt-2 max-w-lg text-sm text-amber-900 dark:text-amber-200">
              Client ID and secret only identify the app — they do not grant
              access to health data. As the owner, complete a one-time connection
              at{" "}
              <a href="/setup" className="font-medium underline">
                /setup
              </a>{" "}
              (you only, not visitors). After that, this page shows your data
              with no sign-in prompt.
            </p>
          </div>
        ) : (
          <DashboardContent />
        )}
      </main>
    </div>
  );
}

async function DashboardContent() {
  try {
    const [data, stepsHistory, todaySteps, deviceStatus] = await Promise.all([
      fetchDashboardDataCached(7),
      fetchStepsHistoryCached(7),
      fetchTodaySteps(),
      fetchDeviceStatusCached(),
    ]);

    const stepsError = todaySteps.error ?? stepsHistory.error;

    return (
      <>
        <p className="text-sm text-zinc-500">
          Showing {data.range.start} → {data.range.end}
        </p>
        <HeartRateSection
          days={data.restingHeartRate}
          stepsHistory={stepsHistory.days}
          initialToday={todaySteps.today}
          stepsError={stepsError}
          deviceStatus={deviceStatus}
        />
        <SleepSection logs={data.sleep} />
        <SpO2Section days={data.spo2} />
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Could not load health data: {message}. Re-run setup at{" "}
        <a href="/setup" className="font-medium underline">
          /setup
        </a>
        .
      </p>
    );
  }
}
