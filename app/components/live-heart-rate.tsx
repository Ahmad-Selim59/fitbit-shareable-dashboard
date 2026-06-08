"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  HeartRateViewMode,
  HeartRateWindowHours,
  LiveHeartRateData,
  LiveHeartRateSample,
} from "@/lib/google-health/heart-rate-types";
import { HEART_RATE_WINDOW_OPTIONS } from "@/lib/google-health/heart-rate-types";

const POLL_MS = 60_000;
const WINDOW_OPTIONS = HEART_RATE_WINDOW_OPTIONS;
type UiView = "now" | "day" | "hour";

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localDayBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  return { start, end, dateKey: localDateKey(d) };
}

function localHourBounds(d: Date, hour: number) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour + 1, 0, 0, 0);
  return { start, end };
}

function formatTime(iso: string, withSeconds = false): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
  });
}

function formatAgo(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWindowRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) {
    return `${s.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })} · ${formatTime(start)} – ${formatTime(end)}`;
  }
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

function formatHourLabel(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric" });
}

function formatBucketRange(at: string, bucketSec: number): string {
  const end = new Date(at);
  const start = new Date(end.getTime() - bucketSec * 1000);
  return `${formatTime(start.toISOString())} – ${formatTime(end.toISOString())}`;
}

function HeartRateChart({
  chart,
  bucketSec,
  displayed,
  pinned,
  hoverCapable,
  viewMode,
  onPin,
  onHover,
  onHoverClear,
  onHourSelect,
}: {
  chart: LiveHeartRateSample[];
  bucketSec: number;
  displayed: LiveHeartRateSample | null;
  pinned: LiveHeartRateSample | null;
  hoverCapable: boolean;
  viewMode: HeartRateViewMode;
  onPin: (s: LiveHeartRateSample) => void;
  onHover: (s: LiveHeartRateSample) => void;
  onHoverClear: () => void;
  onHourSelect?: (hour: number) => void;
}) {
  const bpms = chart.map((s) => s.bpm);
  const minBpm = bpms.length ? Math.min(...bpms) : 0;
  const maxBpm = bpms.length ? Math.max(...bpms) : 0;
  const bpmRange = Math.max(maxBpm - minBpm, 12);

  if (chart.length <= 1) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        Not enough samples in this period. Try another day or open the Fitbit app
        to sync.
      </p>
    );
  }

  const bucketLabel =
    viewMode === "day"
      ? "Tap an hour to zoom in"
      : viewMode === "hour"
        ? `~${bucketSec}s avg`
        : `Tap a bar · ~${bucketSec}s avg`;

  return (
    <>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {viewMode === "day" ? "Hourly" : viewMode === "hour" ? "Minute detail" : "Trend"}
        </p>
        <p className="text-xs text-zinc-500">
          {bucketLabel} · {chart.length} bars
        </p>
      </div>
      <div className="flex gap-1">
        <div className="flex w-8 shrink-0 flex-col justify-between py-1 text-right text-[10px] tabular-nums text-zinc-400">
          <span>{maxBpm}</span>
          <span>{minBpm}</span>
        </div>
        <div
          className="flex h-28 min-w-0 flex-1 items-end gap-px overflow-hidden rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900"
          role="list"
          aria-label="Heart rate trend chart"
          onMouseLeave={hoverCapable ? onHoverClear : undefined}
        >
          {chart.map((s) => {
            const pct = ((s.bpm - minBpm) / bpmRange) * 100;
            const isActive = displayed?.at === s.at;
            const hour = new Date(s.at).getHours();
            return (
              <button
                key={s.at}
                type="button"
                role="listitem"
                aria-label={`${s.bpm} bpm around ${formatTime(s.at, true)}`}
                aria-pressed={pinned?.at === s.at}
                onClick={() => {
                  if (viewMode === "day" && onHourSelect) {
                    onHourSelect(hour);
                  } else {
                    onPin(s);
                  }
                }}
                onMouseEnter={hoverCapable ? () => onHover(s) : undefined}
                className="flex min-h-[44px] min-w-0 flex-1 items-end justify-center self-stretch touch-manipulation"
              >
                <span
                  aria-hidden
                  className={`block w-full max-w-[10px] rounded-sm transition-colors ${
                    isActive
                      ? "bg-teal-800 ring-2 ring-teal-400 ring-offset-1 dark:bg-teal-300 dark:ring-teal-600"
                      : "bg-teal-600 hover:bg-teal-500 dark:bg-teal-400 dark:hover:bg-teal-300"
                  }`}
                  style={{ height: `${Math.max(6, pct)}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-1 text-[10px] text-zinc-400">
        {viewMode === "day" ? "Midnight ← → now (hourly bars)" : "Older ← → newer"}
      </p>
    </>
  );
}

export function LiveHeartRate() {
  const [data, setData] = useState<LiveHeartRateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinned, setPinned] = useState<LiveHeartRateSample | null>(null);
  const [hovered, setHovered] = useState<LiveHeartRateSample | null>(null);
  const [hoverCapable, setHoverCapable] = useState(false);
  const [uiView, setUiView] = useState<UiView>("now");
  const [windowHours, setWindowHours] = useState<HeartRateWindowHours>(2);
  const [windowEnd, setWindowEnd] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedHour, setSelectedHour] = useState<number>(() => new Date().getHours());

  const isToday = useMemo(() => {
    const today = new Date();
    return localDateKey(selectedDay) === localDateKey(today);
  }, [selectedDay]);

  const isLive = useMemo(() => {
    if (uiView === "now") {
      return windowEnd.getTime() >= Date.now() - 5 * 60 * 1000;
    }
    if (uiView === "day") return isToday;
    return isToday && selectedHour >= new Date().getHours() - 1;
  }, [uiView, windowEnd, isToday, selectedHour]);

  useEffect(() => {
    setHoverCapable(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
  }, []);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (uiView === "day") {
        const { start, end, dateKey } = localDayBounds(selectedDay);
        params.set("mode", "day");
        params.set("date", dateKey);
        params.set("start", start.toISOString());
        params.set("end", end.toISOString());
      } else if (uiView === "hour") {
        const day = localDayBounds(selectedDay);
        const hour = localHourBounds(selectedDay, selectedHour);
        params.set("mode", "hour");
        params.set("date", day.dateKey);
        params.set("hour", String(selectedHour));
        params.set("start", hour.start.toISOString());
        params.set("end", hour.end.toISOString());
        params.set("dayStart", day.start.toISOString());
        params.set("dayEnd", day.end.toISOString());
      } else {
        const effectiveEnd =
          windowEnd.getTime() >= Date.now() - 5 * 60 * 1000
            ? new Date()
            : windowEnd;
        params.set("mode", "window");
        params.set("hours", String(windowHours));
        params.set("end", effectiveEnd.toISOString());
      }

      const res = await fetch(`/api/health/live-heart-rate?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as LiveHeartRateData;
      setData(json);
      setError(null);
      setPinned(null);
      setHovered(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [uiView, windowHours, windowEnd, selectedDay, selectedHour]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [isLive, load]);

  const shiftWindow = (direction: -1 | 1) => {
    const shiftMs = windowHours * 60 * 60 * 1000;
    setWindowEnd((prev) => {
      const next = new Date(prev.getTime() + direction * shiftMs);
      const now = new Date();
      if (next.getTime() > now.getTime()) return now;
      const maxBack = (data?.apiMaxDays ?? 14) * 24 * 60 * 60 * 1000;
      if (next.getTime() < now.getTime() - maxBack) {
        return new Date(now.getTime() - maxBack);
      }
      return next;
    });
  };

  const shiftDay = (direction: -1 | 1) => {
    setSelectedDay((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction);
      const earliest = new Date();
      earliest.setDate(earliest.getDate() - (data?.apiMaxDays ?? 14) + 1);
      earliest.setHours(0, 0, 0, 0);
      if (next.getTime() < earliest.getTime()) return earliest;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (next.getTime() > today.getTime()) {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
      }
      return next;
    });
  };

  const jumpToToday = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setSelectedDay(t);
    setUiView("day");
  };

  const jumpToNow = () => {
    setUiView("now");
    setWindowEnd(new Date());
  };

  const drillToHour = (hour: number) => {
    setSelectedHour(hour);
    setUiView("hour");
  };

  const chart = data?.chartSamples ?? [];
  const bucketSec = data?.chartBucketSeconds ?? 40;
  const displayed = pinned ?? hovered;
  const viewMode = data?.viewMode ?? "window";

  const heroBpm =
    uiView === "now" && isLive
      ? data?.latest?.bpm
      : data?.windowStats?.avg ?? data?.latest?.bpm;

  const heroLabel =
    uiView === "now" && isLive
      ? "Latest synced"
      : uiView === "day"
        ? "Daily average"
        : uiView === "hour"
          ? `Hourly average (${formatHourLabel(selectedHour)})`
          : `Average over ${windowHours}h`;

  const maxBackMs = (data?.apiMaxDays ?? 14) * 24 * 60 * 60 * 1000;
  const canGoBackWindow =
    windowEnd.getTime() - windowHours * 60 * 60 * 1000 >
    Date.now() - maxBackMs;
  const earliestDay = new Date();
  earliestDay.setDate(earliestDay.getDate() - (data?.apiMaxDays ?? 14) + 1);
  earliestDay.setHours(0, 0, 0, 0);
  const canGoBackDay = selectedDay.getTime() > earliestDay.getTime();
  const canGoForwardDay = !isToday;

  return (
    <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 dark:border-teal-900 dark:from-teal-950 dark:to-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Live heart rate
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Up to {data?.apiMaxDays ?? 14} days · ~5s samples from Google Health
            {isLive ? " · refreshes every minute" : " · cached on server"}
          </p>
        </div>
        {data?.fetchedAt && (
          <p className="text-xs text-zinc-500">
            Checked {formatTime(data.fetchedAt)}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["now", "Now"],
            ["day", "Day"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setUiView(id);
              if (id === "day") jumpToToday();
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              uiView === id || (id === "day" && uiView === "hour")
                ? "bg-teal-600 text-white dark:bg-teal-400 dark:text-teal-950"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
        {uiView === "hour" && (
          <span className="self-center text-xs text-zinc-500">
            · {formatDayLabel(selectedDay)} · {formatHourLabel(selectedHour)}–
            {formatHourLabel((selectedHour + 1) % 24)}
          </span>
        )}
      </div>

      {loading && !data && (
        <p className="mt-6 text-sm text-zinc-500">Loading…</p>
      )}

      {error && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {heroBpm !== undefined && (
        <div className="mt-6">
          <p className="text-5xl font-semibold tabular-nums tracking-tight text-teal-700 dark:text-teal-300">
            {heroBpm}
            <span className="ml-2 text-2xl font-normal text-zinc-500">bpm</span>
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {heroLabel}
            {uiView === "now" && isLive && data?.latest
              ? ` · ${formatTime(data.latest.at, true)} (${formatAgo(data.latest.at)})`
              : data?.windowStats
                ? ` · min ${data.windowStats.min}, max ${data.windowStats.max}`
                : ""}
          </p>
        </div>
      )}

      {!loading && !error && !data?.latest && !data?.windowStats && (
        <p className="mt-6 text-sm text-zinc-500">
          No heart rate samples in this period. Open the Fitbit app to sync your
          watch, then try again.
        </p>
      )}

      {(data?.contextStats || data?.windowStats) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {data.windowStats && (
            <div className="rounded-lg border border-teal-200/80 bg-white/80 px-3 py-2 dark:border-teal-800 dark:bg-zinc-950/80">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {uiView === "day"
                  ? "This day"
                  : uiView === "hour"
                    ? "This hour"
                    : `This ${windowHours}h window`}
              </p>
              <p className="text-sm tabular-nums text-zinc-800 dark:text-zinc-200">
                avg {data.windowStats.avg} · min {data.windowStats.min} · max{" "}
                {data.windowStats.max}
              </p>
            </div>
          )}
          {data.contextStats &&
            uiView !== "day" &&
            data.contextStats !== data.windowStats && (
              <div className="rounded-lg border border-zinc-200 bg-white/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/80">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  {uiView === "hour" ? "Full day" : `Last ${data.contextHours}h`}
                </p>
                <p className="text-sm tabular-nums text-zinc-800 dark:text-zinc-200">
                  avg {data.contextStats.avg} · min {data.contextStats.min} · max{" "}
                  {data.contextStats.max}
                </p>
              </div>
            )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {uiView === "now" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">Window</span>
              {WINDOW_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setWindowHours(h)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    windowHours === h
                      ? "bg-teal-600 text-white dark:bg-teal-400 dark:text-teal-950"
                      : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => shiftWindow(-1)}
                disabled={!canGoBackWindow || loading}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
              >
                ← Earlier
              </button>
              <button
                type="button"
                onClick={() => shiftWindow(1)}
                disabled={isLive || loading}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
              >
                Later →
              </button>
              {!isLive && (
                <button
                  type="button"
                  onClick={jumpToNow}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 dark:bg-teal-400 dark:text-teal-950"
                >
                  Jump to now
                </button>
              )}
              {data?.windowStart && data?.windowEnd && (
                <p className="text-xs text-zinc-500">
                  {formatWindowRange(data.windowStart, data.windowEnd)}
                </p>
              )}
            </div>
          </>
        )}

        {(uiView === "day" || uiView === "hour") && (
          <div className="flex flex-wrap items-center gap-2">
            {uiView === "hour" && (
              <button
                type="button"
                onClick={() => setUiView("day")}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                ← Back to day
              </button>
            )}
            <button
              type="button"
              onClick={() => shiftDay(-1)}
              disabled={!canGoBackDay || loading}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              ← Prev day
            </button>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {formatDayLabel(selectedDay)}
            </p>
            <button
              type="button"
              onClick={() => shiftDay(1)}
              disabled={!canGoForwardDay || loading}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              Next day →
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={jumpToToday}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 dark:bg-teal-400 dark:text-teal-950"
              >
                Today
              </button>
            )}
          </div>
        )}
      </div>

      {chart.length > 1 && (
        <div className="mt-4">
          <HeartRateChart
            chart={chart}
            bucketSec={bucketSec}
            displayed={displayed}
            pinned={pinned}
            hoverCapable={hoverCapable}
            viewMode={viewMode}
            onPin={(s) => setPinned((prev) => (prev?.at === s.at ? null : s))}
            onHover={setHovered}
            onHoverClear={() => setHovered(null)}
            onHourSelect={uiView === "day" ? drillToHour : undefined}
          />

          {displayed ? (
            <div className="mt-3 rounded-lg border border-teal-200 bg-white px-4 py-3 dark:border-teal-800 dark:bg-zinc-950">
              <p className="text-lg font-semibold tabular-nums text-teal-700 dark:text-teal-300">
                {displayed.bpm} bpm
                {displayed.minBpm !== undefined &&
                  displayed.maxBpm !== undefined &&
                  displayed.minBpm !== displayed.maxBpm && (
                    <span className="ml-2 text-sm font-normal text-zinc-500">
                      ({displayed.minBpm}–{displayed.maxBpm} in bucket)
                    </span>
                  )}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {viewMode === "day"
                  ? formatBucketRange(displayed.at, bucketSec)
                  : formatDateTime(displayed.at)}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {viewMode === "day"
                  ? "Hourly average · tap bar to zoom into this hour"
                  : `~${bucketSec}s average for this bar`}
                {pinned?.at === displayed.at && uiView !== "day"
                  ? " · tap again to clear"
                  : uiView !== "day"
                    ? " · tap to pin"
                    : ""}
              </p>
            </div>
          ) : uiView === "day" ? (
            <p className="mt-3 text-xs text-zinc-500">
              Each bar is one hour. Tap an hour to see minute-level detail inside
              it — day data is cached ~15 min on the server.
            </p>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">
              Tap a bar for exact BPM and time (hover on desktop for a preview).
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        Day view uses hourly bars; hour zoom uses ~45s buckets. Past days cached
        ~15 min, today ~2 min — browsing history reuses cache without extra Google
        calls.
      </p>
    </div>
  );
}
