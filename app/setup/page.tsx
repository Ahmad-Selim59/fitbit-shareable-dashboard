import { ConnectGoogle } from "../components/connect-google";
import { isGoogleHealthConnected } from "@/lib/google-health/client";
import { getEnvRefreshToken } from "@/lib/google-health/config";
import { loadTokens } from "@/lib/google-health/tokens";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Authorization was cancelled.",
  invalid_oauth_state: "OAuth state mismatch. Try again.",
  token_exchange_failed: "Could not exchange the authorization code.",
};

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const params = await searchParams;
  const connected = await isGoogleHealthConnected();
  const envRefresh = getEnvRefreshToken();
  const fileTokens = await loadTokens();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-lg px-4 py-5 sm:px-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Owner setup
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            One-time connection — visitors never see this page
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-8 sm:px-6">
        {params.connected === "1" && (
          <p className="rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            Connected. Open the{" "}
            <a href="/" className="font-medium underline">
              dashboard
            </a>{" "}
            — your data should load with no sign-in.
          </p>
        )}
        {params.error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {ERROR_MESSAGES[params.error] ?? `Error: ${params.error}`}
          </p>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Google may mention Fitbit on the consent screen — that is normal.
            You are authorizing <strong>your</strong> account once; the server
            stores a refresh token in{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-900">
              .data/google-health-tokens.json
            </code>
            .
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ConnectGoogle connected={connected} />
            {connected && (
              <a
                href="/"
                className="text-sm font-medium text-teal-600 hover:text-teal-500"
              >
                View dashboard →
              </a>
            )}
          </div>
        </div>

        {envRefresh && (
          <p className="text-xs text-zinc-500">
            GOOGLE_REFRESH_TOKEN is set in .env — it takes priority over the
            saved file.
          </p>
        )}

        {fileTokens?.refreshToken && !envRefresh && (
          <p className="text-xs text-zinc-500">
            Optional: copy the refresh token from the saved file into{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
              GOOGLE_REFRESH_TOKEN
            </code>{" "}
            in .env.local for production deploys.
          </p>
        )}

        <p className="text-xs text-zinc-500">
          Ensure your Google account is listed as a Test user on the OAuth
          consent screen while the app is in Testing mode.
        </p>
      </main>
    </div>
  );
}
