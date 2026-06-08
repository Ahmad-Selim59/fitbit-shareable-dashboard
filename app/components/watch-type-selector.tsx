"use client";

import { useState } from "react";
import type { WatchType } from "@/lib/watch-config";
import { watchTypeLabel } from "@/lib/watch-config";

const OPTIONS: { id: WatchType; description: string }[] = [
  {
    id: "fitbit",
    description: "Fitbit tracker or Pixel Watch synced via Google Health",
  },
  {
    id: "samsung",
    description: "Galaxy Watch data available through your Google Health account",
  },
];

export function WatchTypeSelector({
  initial,
  envLocked,
}: {
  initial: WatchType;
  envLocked: boolean;
}) {
  const [watchType, setWatchType] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(next: WatchType) {
    if (envLocked || next === watchType) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/setup/watch-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchType: next }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setWatchType(next);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Watch type
      </p>
      {envLocked && (
        <p className="text-xs text-zinc-500">
          Locked by <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">WATCH_TYPE</code>{" "}
          env var ({watchTypeLabel(watchType)}).
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const selected = watchType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={envLocked || saving}
              onClick={() => save(opt.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                selected
                  ? "border-teal-500 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
              } disabled:opacity-60`}
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {watchTypeLabel(opt.id)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{opt.description}</p>
            </button>
          );
        })}
      </div>
      {saving && (
        <p className="text-xs text-zinc-500">Saving…</p>
      )}
      {saved && !saving && (
        <p className="text-xs text-teal-700 dark:text-teal-300">Saved.</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
