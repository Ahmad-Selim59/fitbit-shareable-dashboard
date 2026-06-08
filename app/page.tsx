import Link from "next/link";
import { RecentlyVisited } from "./components/recently-visited";
import { SlugSearch } from "./components/slug-search";
import { listPublicProfiles } from "@/lib/profiles/store";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string }>;
}) {
  const params = await searchParams;
  const profiles = await listPublicProfiles();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Health dashboards
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Browse public dashboards or add your own via Google Health.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        {params.notfound === "1" && (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Profile not found.
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Find a dashboard
          </h2>
          <SlugSearch />
          <p className="text-xs text-zinc-500">
            Works for public and hidden profiles if you know the exact slug.
          </p>
        </section>

        <RecentlyVisited />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Public dashboards
            </h2>
            <Link
              href="/join"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
            >
              Add yours
            </Link>
          </div>

          {profiles.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No public dashboards yet.{" "}
              <Link href="/join" className="font-medium text-teal-600 underline">
                Be the first
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {profiles.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/p/${p.slug}`}
                    className="block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-teal-400 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {p.displayName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">/p/{p.slug}</p>
                    {p.hasViewerPassword && (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                        Password protected
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
