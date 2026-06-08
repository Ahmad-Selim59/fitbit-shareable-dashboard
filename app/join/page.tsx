import Link from "next/link";
import { JoinForm } from "../components/join-form";
import { SamsungSetupChecklist } from "../components/samsung-setup-checklist";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google authorization was cancelled.",
  invalid_oauth_state: "OAuth state mismatch. Try again.",
  token_exchange_failed: "Could not exchange the authorization code.",
  session_expired: "Join session expired. Submit the form again.",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-lg px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm text-teal-600 hover:text-teal-500">
            ← Dashboards
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Add your dashboard
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect Google Health once — your data is stored on the server.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-8 sm:px-6">
        {params.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            <p>{ERROR_MESSAGES[params.error] ?? `Error: ${params.error}`}</p>
            {params.detail && (
              <p className="mt-1 break-all font-mono text-xs opacity-90">
                {params.detail}
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Google may mention Fitbit on the consent screen — that is normal.
            You authorize your account once; refresh tokens are encrypted in
            Supabase.
          </p>
          <div className="mt-6">
            <JoinForm />
          </div>
        </div>

        <SamsungSetupChecklist />
      </main>
    </div>
  );
}
