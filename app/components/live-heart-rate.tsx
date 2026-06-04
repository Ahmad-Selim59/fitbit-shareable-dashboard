"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveHeartRateData } from "@/lib/google-health/heart-rate-live";

const POLL_MS = 60_000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAgo(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export function LiveHeartRate() {
  const [data, setData] = useState<LiveHeartRateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/health/live-heart-rate", {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as LiveHeartRateData;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const chart = data?.chartSamples ?? [];
  const bpms = chart.map((s) => s.bpm);
  const minBpm = bpms.length ? Math.min(...bpms) : 0;
  const maxBpm = bpms.length ? Math.max(...bpms) : 0;
  const bpmRange = Math.max(maxBpm - minBpm, 12);

  return (
    <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 dark:border-teal-900 dark:from-teal-950 dark:to-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Live heart rate
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Latest synced sample — refreshes every minute
          </p>
        </div>
        {data?.fetchedAt && (
          <p className="text-xs text-zinc-500">
            Checked {formatTime(data.fetchedAt)}
          </p>
        )}
      </div>

      {loading && !data && (
        <p className="mt-6 text-sm text-zinc-500">Loading…</p>
      )}

      {error && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {data?.latest && (
        <div className="mt-6">
          <p className="text-5xl font-semibold tabular-nums tracking-tight text-teal-700 dark:text-teal-300">
            {data.latest.bpm}
            <span className="ml-2 text-2xl font-normal text-zinc-500">bpm</span>
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Last sample {formatTime(data.latest.at)} ({formatAgo(data.latest.at)})
          </p>
        </div>
      )}

      {!loading && !error && !data?.latest && (
        <p className="mt-6 text-sm text-zinc-500">
          No heart rate samples in the last few hours. Open the Fitbit app to sync
          your watch, then wait a minute.
        </p>
      )}

      {chart.length > 1 && (
        <div className="mt-6">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Trend (last ~2 hours)
            </p>
            <p className="text-xs text-zinc-500">
              Each bar ≈ {data?.chartBucketSeconds ?? 40}s average · {chart.length}{" "}
              points
            </p>
          </div>
          <div className="flex gap-1">
            <div className="flex w-8 shrink-0 flex-col justify-between py-1 text-right text-[10px] tabular-nums text-zinc-400">
              <span>{maxBpm}</span>
              <span>{minBpm}</span>
            </div>
            <div className="flex h-28 min-w-0 flex-1 items-end gap-0.5 overflow-hidden rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900">
              {chart.map((s) => {
                const pct = ((s.bpm - minBpm) / bpmRange) * 100;
                return (
                  <div
                    key={s.at}
                    className="min-w-[3px] max-w-[12px] flex-1 rounded-sm bg-teal-600 dark:bg-teal-400"
                    style={{ height: `${Math.max(6, pct)}%` }}
                    title={`${s.bpm} bpm (~${data?.chartBucketSeconds}s avg) · ${formatTime(s.at)}`}
                  />
                );
              })}
            </div>
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">Older ← → now</p>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        Chart uses ~{data?.chartBucketSeconds ?? 40}s averages (not every raw
        reading) so drops like 120→80 are easier to see. Data still only updates when
        your watch syncs to Google Health.
      </p>
    </div>
  );
}
