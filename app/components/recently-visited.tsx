"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRecentVisits, type RecentVisit } from "@/lib/recent-visits";

export function RecentlyVisited() {
  const [visits, setVisits] = useState<RecentVisit[]>([]);

  useEffect(() => {
    setVisits(getRecentVisits());
  }, []);

  if (visits.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Recently visited
      </h2>
      <p className="text-xs text-zinc-500">
        Saved in this browser only — not shared with other devices.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {visits.map((v) => (
          <li key={v.slug}>
            <Link
              href={`/p/${v.slug}`}
              className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-teal-400 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {v.displayName}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">/p/{v.slug}</p>
              {v.hasViewerPassword && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Password protected
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
