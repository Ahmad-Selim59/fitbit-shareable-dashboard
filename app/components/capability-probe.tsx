"use client";

import { useState } from "react";
import {
  CAPABILITY_LABELS,
  type DashboardCapabilities,
} from "@/lib/watch-config";

export function CapabilityProbe({
  initial,
  probedAt,
}: {
  initial: DashboardCapabilities | null;
  probedAt?: string;
}) {
  const [capabilities, setCapabilities] =
    useState<DashboardCapabilities | null>(initial);
  const [probedAtState, setProbedAtState] = useState(probedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runProbe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/capabilities", {
        method: "POST",
      });
      const json = (await res.json()) as {
        capabilities?: DashboardCapabilities;
        settings?: { capabilitiesProbedAt?: string };
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setCapabilities(json.capabilities ?? null);
      setProbedAtState(json.settings?.capabilitiesProbedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Probe failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Available features
        </p>
        <button
          type="button"
          onClick={runProbe}
          disabled={loading}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {loading ? "Checking…" : "Re-check features"}
        </button>
      </div>
      {probedAtState && (
        <p className="text-xs text-zinc-500">
          Last checked {new Date(probedAtState).toLocaleString()}
        </p>
      )}
      {!capabilities && !loading && (
        <p className="text-xs text-zinc-500">
          Run a feature check to see which dashboard sections your account
          supports. Sections without data are hidden automatically.
        </p>
      )}
      {capabilities && (
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {(Object.keys(CAPABILITY_LABELS) as (keyof DashboardCapabilities)[]).map(
            (key) => (
              <li
                key={key}
                className={`rounded-lg px-3 py-2 ${
                  capabilities[key]
                    ? "bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {CAPABILITY_LABELS[key]}
                <span className="ml-2 text-xs">
                  {capabilities[key] ? "available" : "hidden"}
                </span>
              </li>
            ),
          )}
        </ul>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
