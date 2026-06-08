"use client";

import { useCallback, useEffect, useState } from "react";
import type { StepsDay } from "@/lib/google-health/steps";

const POLL_MS = 5 * 60 * 1000;

function formatDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatSteps(n: number): string {
  return n.toLocaleString();
}

export function TodaySteps({
  history,
}: {
  history: StepsDay[];
}) {
  const [today, setToday] = useState<StepsDay | null>(
    history[0] ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!history[0]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/health/today-steps", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { today: StepsDay | null };
      setToday(json.today);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load steps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const rows = history.length ? history : today ? [today] : [];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Daily steps
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Today&apos;s total — refreshes every few minutes
        </p>
      </div>

      {loading && !today && (
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {today && (
        <p className="mt-4 text-4xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
          {formatSteps(today.steps)}
          <span className="ml-2 text-xl font-normal text-zinc-500">steps</span>
        </p>
      )}

      {!loading && !error && !today && (
        <p className="mt-4 text-sm text-zinc-500">
          No step data for today yet. Open the Fitbit app to sync your watch.
        </p>
      )}

      {rows.length > 1 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Steps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((day) => (
                <tr key={day.date} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {formatDateLabel(day.date)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatSteps(day.steps)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
