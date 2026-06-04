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

const VERCEL_HINTS: Record<string, string> = {
  invalid_client:
    "Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel env vars, then redeploy.",
  redirect_uri_mismatch:
    "GOOGLE_REDIRECT_URI in Vercel must exactly match Google Cloud redirect URI.",
};

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string; detail?: string }>;
}) {
  const params = await searchParams;
  const onVercel = process.env.VERCEL === "1";
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
          <div className="space-y-2 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            <p>
              Connected. Open the{" "}
              <a href="/" className="font-medium underline">
                dashboard
              </a>
              .
            </p>
            {onVercel && !envRefresh && (
              <p className="text-xs">
                To show data to <strong>all visitors</strong> (not only this
                browser), run <code className="rounded bg-teal-100 px-1">/setup</code>{" "}
                locally once, copy{" "}
                <code className="rounded bg-teal-100 px-1">refreshToken</code> from{" "}
                <code className="rounded bg-teal-100 px-1">.data/google-health-tokens.json</code>{" "}
                into Vercel as{" "}
                <code className="rounded bg-teal-100 px-1">GOOGLE_REFRESH_TOKEN</code>, then
                redeploy.
              </p>
            )}
          </div>
        )}
        {params.error && (
          <div className="space-y-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            <p>{ERROR_MESSAGES[params.error] ?? `Error: ${params.error}`}</p>
            {params.detail && (
              <p className="break-all font-mono text-xs opacity-90">
                {params.detail}
              </p>
            )}
            {params.detail &&
              Object.entries(VERCEL_HINTS).map(([key, hint]) =>
                params.detail!.includes(key) ? (
                  <p key={key} className="text-xs">
                    {hint}
                  </p>
                ) : null,
              )}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Google may mention Fitbit on the consent screen — that is normal.
            You are authorizing <strong>your</strong> account once; the server
            stores tokens on the server
            {onVercel
              ? " (secure httpOnly cookie on Vercel — set GOOGLE_REFRESH_TOKEN in env for a permanent deploy)"
              : " in .data/google-health-tokens.json locally"}
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
