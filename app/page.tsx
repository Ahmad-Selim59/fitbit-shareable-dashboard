import { ConnectGoogle } from "./components/connect-google";
import { HeartRateSection } from "./components/heart-rate-section";
import { SleepSection } from "./components/sleep-section";
import { SpO2Section } from "./components/spo2-section";
import { isGoogleHealthConnected } from "@/lib/google-health/client";
import { fetchDashboardData } from "@/lib/google-health/data";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google authorization was cancelled.",
  invalid_oauth_state: "OAuth state mismatch. Try connecting again.",
  token_exchange_failed: "Could not exchange the authorization code.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const params = await searchParams;
  const connected = await isGoogleHealthConnected();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Health dashboard
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Fitbit data via Google Health API — tokens stay on the server
            </p>
          </div>
          <ConnectGoogle connected={connected} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
        {params.connected === "1" && (
          <p className="rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            Google Health connected successfully.
          </p>
        )}
        {params.error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {ERROR_MESSAGES[params.error] ?? `Error: ${params.error}`}
          </p>
        )}

        {!connected ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Connect your Google account
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              Sign in with Google to read your Fitbit health data through the
              Google Health API. Tokens are stored in
              <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
                .data/google-health-tokens.json
              </code>
              and never sent to the browser.
            </p>
            <p className="mx-auto mt-3 max-w-md text-xs text-zinc-500">
              In Google Cloud, add yourself as a Test user on the OAuth consent
              screen while the app is in Testing mode.
            </p>
            <div className="mt-6">
              <ConnectGoogle connected={false} />
            </div>
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
    const data = await fetchDashboardData(7);

    return (
      <>
        <p className="text-sm text-zinc-500">
          Showing {data.range.start} → {data.range.end}
        </p>
        <HeartRateSection days={data.restingHeartRate} />
        <SleepSection logs={data.sleep} />
        <SpO2Section days={data.spo2} />
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Could not load health data: {message}. Try disconnecting and connecting
        again. If you see a 403, confirm Google Health API scopes are enabled
        for your OAuth client and your Google account is listed as a test user.
      </p>
    );
  }
}
