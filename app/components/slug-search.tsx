"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SlugSearch() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      setError("Enter a slug");
      return;
    }
    setError(null);
    router.push(`/p/${normalized}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="Find by slug (e.g. alice)"
        className="min-w-[12rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900"
      >
        Go
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
