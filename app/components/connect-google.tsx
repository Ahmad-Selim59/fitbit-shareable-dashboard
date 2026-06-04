"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConnectGoogle({
  configured,
  working,
  envTokenSet,
}: {
  configured: boolean;
  working: boolean;
  envTokenSet: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function disconnect() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/google/disconnect", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        envTokenStillSet?: boolean;
      };
      if (data.envTokenStillSet) {
        setNotice(
          "Cookie cleared. Also delete GOOGLE_REFRESH_TOKEN in Vercel → Environment Variables, then redeploy — otherwise the app will keep using the old token.",
        );
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <a
        href="/api/auth/google"
        className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
      >
        Connect Google Health
      </a>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={disconnect}
          disabled={loading}
          className="inline-flex items-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {loading ? "Disconnecting…" : "Disconnect"}
        </button>
        <span
          className={`text-xs font-medium ${working ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400"}`}
        >
          {working ? "Token working" : "Token not working — reconnect or fix Vercel env"}
        </span>
      </div>
      {envTokenSet && (
        <p className="text-xs text-zinc-500">
          Token is loaded from Vercel env{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
            GOOGLE_REFRESH_TOKEN
          </code>
          . Disconnect also requires removing that variable in Vercel.
        </p>
      )}
      {notice && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {notice}
        </p>
      )}
    </div>
  );
}
