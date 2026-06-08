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
  hasViewerPassword: initialHasViewerPassword,
}: {
  slug: string;
  watchType: WatchType;
  capabilities: DashboardCapabilities | null;
  hasViewerPassword: boolean;
}) {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState("");
  const [watchType, setWatchType] = useState(initialWatchType);
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [hasViewerPassword, setHasViewerPassword] = useState(
    initialHasViewerPassword,
  );
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPasswordConfirm, setNewAdminPasswordConfirm] = useState("");
  const [newViewerPassword, setNewViewerPassword] = useState("");
  const [removeViewerPassword, setRemoveViewerPassword] = useState(false);
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

  async function changePasswords() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const changingAdmin = newAdminPassword.length > 0;
    const changingViewer =
      removeViewerPassword || newViewerPassword.length > 0;

    if (!changingAdmin && !changingViewer) {
      setError("Set a new password or choose to remove the viewer password.");
      setLoading(false);
      return;
    }

    if (changingAdmin) {
      if (newAdminPassword.length < 4) {
        setError("New admin password must be at least 4 characters.");
        setLoading(false);
        return;
      }
      if (newAdminPassword !== newAdminPasswordConfirm) {
        setError("New admin passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/profiles/${slug}/passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword,
          ...(changingAdmin ? { newAdminPassword } : {}),
          ...(removeViewerPassword
            ? { removeViewerPassword: true }
            : newViewerPassword
              ? { newViewerPassword }
              : {}),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

      if (changingAdmin) {
        setAdminPassword(newAdminPassword);
        setNewAdminPassword("");
        setNewAdminPasswordConfirm("");
      }
      if (removeViewerPassword) {
        setHasViewerPassword(false);
        setRemoveViewerPassword(false);
        setNewViewerPassword("");
      } else if (newViewerPassword) {
        setHasViewerPassword(true);
        setNewViewerPassword("");
      }
      setMessage("Passwords updated.");
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

      <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Change passwords
        </p>
        <p className="text-xs text-zinc-500">
          Current admin password required below. Viewer password is optional —
          {hasViewerPassword
            ? " currently set."
            : " currently open to everyone."}
        </p>

        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            New admin password
          </label>
          <input
            type="password"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            placeholder="Leave blank to keep current"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Confirm new admin password
          </label>
          <input
            type="password"
            value={newAdminPasswordConfirm}
            onChange={(e) => setNewAdminPasswordConfirm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            New viewer password
          </label>
          <input
            type="password"
            value={newViewerPassword}
            onChange={(e) => {
              setNewViewerPassword(e.target.value);
              if (e.target.value) setRemoveViewerPassword(false);
            }}
            disabled={removeViewerPassword}
            placeholder="Leave blank to keep current"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        {hasViewerPassword && (
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={removeViewerPassword}
              onChange={(e) => {
                setRemoveViewerPassword(e.target.checked);
                if (e.target.checked) setNewViewerPassword("");
              }}
            />
            Remove viewer password (open access)
          </label>
        )}

        <button
          type="button"
          onClick={changePasswords}
          disabled={loading || !adminPassword}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
        >
          Update passwords
        </button>
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
