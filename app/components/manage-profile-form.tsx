"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CAPABILITY_LABELS,
  type DashboardCapabilities,
  watchTypeLabel,
  type WatchType,
} from "@/lib/watch-config";

export function ManageProfileForm({
  slug,
  watchType: initialWatchType,
  capabilities: initialCapabilities,
}: {
  slug: string;
  watchType: WatchType;
  capabilities: DashboardCapabilities | null;
}) {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState("");
  const [watchType, setWatchType] = useState(initialWatchType);
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function recheckFeatures() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/profiles/${slug}/capabilities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const json = (await res.json()) as {
        capabilities?: DashboardCapabilities;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setCapabilities(json.capabilities ?? null);
      setMessage("Features updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveWatchType() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/profiles/${slug}/watch-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword, watchType }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setMessage("Watch type saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProfile() {
    if (!confirm("Delete this profile permanently? This cannot be undone.")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${slug}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Admin password
        </label>
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Watch type
        </label>
        <select
          value={watchType}
          onChange={(e) => setWatchType(e.target.value as WatchType)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {(["fitbit", "samsung"] as WatchType[]).map((t) => (
            <option key={t} value={t}>
              {watchTypeLabel(t)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={saveWatchType}
          disabled={loading || !adminPassword}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
        >
          Save watch type
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Features
          </p>
          <button
            type="button"
            onClick={recheckFeatures}
            disabled={loading || !adminPassword}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            Re-check features
          </button>
        </div>
        {capabilities && (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {(Object.keys(CAPABILITY_LABELS) as (keyof DashboardCapabilities)[]).map(
              (key) => (
                <li
                  key={key}
                  className={`rounded px-2 py-1 ${
                    capabilities[key]
                      ? "bg-teal-50 text-teal-900 dark:bg-teal-950/50"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}
                >
                  {CAPABILITY_LABELS[key]}: {capabilities[key] ? "on" : "off"}
                </li>
              ),
            )}
          </ul>
        )}
      </div>

      {message && <p className="text-sm text-teal-700 dark:text-teal-300">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={deleteProfile}
        disabled={loading || !adminPassword}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
      >
        Delete profile
      </button>
    </div>
  );
}
