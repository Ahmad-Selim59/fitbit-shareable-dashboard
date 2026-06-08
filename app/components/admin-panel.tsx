"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ProfilePublic } from "@/lib/profiles/types";

export function AdminPanel({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(loggedIn);
  const [password, setPassword] = useState("");
  const [profiles, setProfiles] = useState<ProfilePublic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfiles = useCallback(async () => {
    const res = await fetch("/api/admin/profiles");
    if (!res.ok) {
      setAuthed(false);
      return;
    }
    const json = (await res.json()) as { profiles: ProfilePublic[] };
    setProfiles(json.profiles);
    setAuthed(true);
  }, []);

  useEffect(() => {
    if (loggedIn) {
      void loadProfiles();
    }
  }, [loggedIn, loadProfiles]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProfile(slug: string) {
    if (!confirm(`Delete profile /p/${slug}?`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/profiles/${slug}/delete`, {
        method: "POST",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      await loadProfiles();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <form onSubmit={login} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {profiles.length} profile(s)
      </p>
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {profiles.map((p) => (
          <li
            key={p.slug}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {p.displayName}
              </p>
              <p className="text-xs text-zinc-500">
                /p/{p.slug} · {p.visibility}
                {p.hasViewerPassword ? " · locked" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => deleteProfile(p.slug)}
              disabled={loading}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
