"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeviceStatus } from "@/lib/google-health/device";

const POLL_MS = 10 * 60 * 1000;

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
      text: "text-zinc-600 dark:text-zinc-400",
      border: "border-zinc-200 dark:border-zinc-800",
      bg: "bg-white dark:bg-zinc-950",
    };
  }
  if (level <= 20) {
    return {
      bar: "bg-red-500",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-200 dark:border-red-900",
      bg: "bg-red-50 dark:bg-red-950/40",
    };
  }
  if (level <= 40) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-800 dark:text-amber-200",
      border: "border-amber-200 dark:border-amber-900",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    };
  }
  return {
    bar: "bg-teal-500",
    text: "text-teal-800 dark:text-teal-200",
    border: "border-teal-200 dark:border-teal-900",
    bg: "bg-teal-50 dark:bg-teal-950/40",
  };
}

export function DeviceBatteryBanner() {
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/health/device-status", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { device: DeviceStatus | null };
      setDevice(json.device);
      setHidden(json.device === null);
    } catch {
      // keep last known value
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (hidden || (!loading && !device)) return null;

  const level = device?.batteryLevel ?? null;
  const tone = batteryTone(level);
  const lowBattery = level !== null && level <= 20;

  return (
    <div
      className={`border-b ${tone.border} ${tone.bg}`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {loading && !device ? (
          <p className="text-sm text-zinc-500">Checking Fitbit battery…</p>
        ) : device ? (
          <>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${tone.text}`}>
                {device.deviceName}
                {level !== null ? ` · ${level}% battery` : ""}
                {device.batteryStatus ? ` (${device.batteryStatus})` : ""}
              </p>
              {device.lastSyncTime && (
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  Last synced {formatAgo(device.lastSyncTime)}
                  {lowBattery
                    ? " · charge soon or live HR may stop updating"
                    : " · if live HR stops, check battery or sync"}
                </p>
              )}
            </div>
            {level !== null && (
              <div
                className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                aria-hidden
              >
                <div
                  className={`h-full rounded-full transition-all ${tone.bar}`}
                  style={{ width: `${Math.max(4, level)}%` }}
                />
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
