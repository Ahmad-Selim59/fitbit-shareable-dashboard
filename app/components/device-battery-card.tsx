"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeviceFetchResult, DeviceStatus } from "@/lib/google-health/device";
import { deviceCardLabel, type WatchType } from "@/lib/watch-config";

const POLL_MS = 60 * 60 * 1000;

function formatAgo(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function batteryTone(level: number | null): {
  bar: string;
  text: string;
  border: string;
  bg: string;
} {
  if (level === null) {
    return {
      bar: "bg-zinc-400",
      text: "text-zinc-700 dark:text-zinc-300",
      border: "border-zinc-200 dark:border-zinc-800",
      bg: "bg-white dark:bg-zinc-950",
    };
  }
  if (level <= 20) {
    return {
      bar: "bg-red-500",
      text: "text-red-800 dark:text-red-200",
      border: "border-red-200 dark:border-red-900",
      bg: "bg-red-50 dark:bg-red-950/40",
    };
  }
  if (level <= 40) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-900 dark:text-amber-100",
      border: "border-amber-200 dark:border-amber-900",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    };
  }
  return {
    bar: "bg-teal-500",
    text: "text-teal-900 dark:text-teal-100",
    border: "border-teal-200 dark:border-teal-900",
    bg: "bg-teal-50 dark:bg-teal-950/40",
  };
}

function needsReauth(error?: string): boolean {
  if (!error) return false;
  return (
    error.includes("403") ||
    error.includes("PERMISSION_DENIED") ||
    error.includes("insufficient") ||
    error.includes("scope")
  );
}

export function DeviceBatteryCard({
  profileSlug,
  initial,
  watchType = "fitbit",
}: {
  profileSlug: string;
  initial: DeviceFetchResult;
  watchType?: WatchType;
}) {
  const [device, setDevice] = useState<DeviceStatus | null>(initial.device);
  const [error, setError] = useState<string | undefined>(initial.error);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/profiles/${profileSlug}/health/device-status`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as DeviceFetchResult & { error?: string };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setDevice(json.device);
      setError(json.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [profileSlug]);

  useEffect(() => {
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const level = device?.batteryLevel ?? null;
  const tone = batteryTone(level);
  const lowBattery = level !== null && level <= 20;
  const reauth = needsReauth(error);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${tone.border} ${tone.bg}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {deviceCardLabel(watchType)}
          </p>
          {device ? (
            <>
              <p className={`mt-1 text-base font-semibold ${tone.text}`}>
                {device.deviceName}
                {level !== null ? ` · ${level}% battery` : ""}
                {device.batteryStatus ? ` (${device.batteryStatus})` : ""}
              </p>
              {device.lastSyncTime && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Last synced {formatAgo(device.lastSyncTime)}
                  {lowBattery
                    ? " · charge soon or live HR may stop"
                    : " · if live HR stops, check battery or sync"}
                </p>
              )}
            </>
          ) : (
            <>
              <p className={`mt-1 text-base font-semibold ${tone.text}`}>
                {loading ? "Checking battery…" : "Battery unavailable"}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {reauth ? (
                  <>
                    Re-connect Google Health from{" "}
                    <a href="/join" className="font-medium underline">
                      /join
                    </a>{" "}
                    — needs the Google Health <strong>settings</strong> scope for
                    paired devices.
                  </>
                ) : error ? (
                  error
                ) : (
                  "No paired tracker returned from Google Health yet."
                )}
              </p>
            </>
          )}
        </div>
        {level !== null && (
          <div
            className="h-2.5 w-32 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            aria-hidden
          >
            <div
              className={`h-full rounded-full transition-all ${tone.bar}`}
              style={{ width: `${Math.max(4, level)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
