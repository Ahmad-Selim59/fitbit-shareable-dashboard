"use client";

import { useState } from "react";
import { watchTypeLabel, type WatchType } from "@/lib/watch-config";

export function JoinForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      slug: String(data.get("slug") ?? ""),
      displayName: String(data.get("displayName") ?? ""),
      visibility: String(data.get("visibility") ?? "public"),
      watchType: String(data.get("watchType") ?? "fitbit"),
      viewerPassword: String(data.get("viewerPassword") ?? ""),
      adminPassword: String(data.get("adminPassword") ?? ""),
      adminPasswordConfirm: String(data.get("adminPasswordConfirm") ?? ""),
    };

    if (body.adminPassword !== body.adminPasswordConfirm) {
      setError("Admin passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/join/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      if (json.redirect) {
        window.location.href = json.redirect;
        return;
      }
      throw new Error("No redirect returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start join");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Profile slug
        </label>
        <input
          name="slug"
          required
          pattern="[a-z0-9-]{3,32}"
          placeholder="alice"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Your URL will be /p/alice — lowercase letters, numbers, hyphens.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Display name
        </label>
        <input
          name="displayName"
          required
          maxLength={64}
          placeholder="Alice"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Visibility
        </label>
        <select
          name="visibility"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="public">Public — listed on home page</option>
          <option value="hidden">Hidden — slug search / direct link only</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Watch type
        </label>
        <select
          name="watchType"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {(["fitbit", "samsung"] as WatchType[]).map((t) => (
            <option key={t} value={t}>
              {watchTypeLabel(t)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Viewer password (optional)
        </label>
        <input
          type="password"
          name="viewerPassword"
          placeholder="Leave blank for open access"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Admin password (required)
        </label>
        <input
          type="password"
          name="adminPassword"
          required
          minLength={4}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Used to delete your profile. Save it — we cannot recover it.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Confirm admin password
        </label>
        <input
          type="password"
          name="adminPasswordConfirm"
          required
          minLength={4}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-60"
      >
        {loading ? "Starting…" : "Connect Google Health"}
      </button>
    </form>
  );
}
