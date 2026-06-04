"use client";

import { useState } from "react";

export function CopyRefreshToken({ refreshToken }: { refreshToken: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(refreshToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <p className="font-medium">Finish Vercel setup (one time)</p>
      <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed">
        <li>Copy the refresh token below.</li>
        <li>
          Vercel → your project → <strong>Settings</strong> →{" "}
          <strong>Environment Variables</strong>.
        </li>
        <li>
          Add <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">GOOGLE_REFRESH_TOKEN</code>{" "}
          (Production), paste the value, save.
        </li>
        <li>
          <strong>Deployments</strong> → Redeploy (env vars only apply after redeploy).
        </li>
      </ol>
      <textarea
        readOnly
        value={refreshToken}
        rows={3}
        className="w-full resize-none rounded border border-amber-300 bg-white p-2 font-mono text-xs dark:border-amber-700 dark:bg-zinc-900"
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        onClick={copy}
        className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
      >
        {copied ? "Copied" : "Copy refresh token"}
      </button>
      <p className="text-xs opacity-80">
        Only you see this (your browser after Connect). Do not share this value.
        After redeploy, the public dashboard works for all visitors.
      </p>
    </div>
  );
}
