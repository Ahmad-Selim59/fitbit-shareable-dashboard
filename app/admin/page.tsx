import Link from "next/link";
import { AdminPanel } from "../components/admin-panel";
import { hasAdminSession } from "@/lib/profiles/auth-cookies";

export default async function AdminPage() {
  const loggedIn = await hasAdminSession();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-lg px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm text-teal-600 hover:text-teal-500">
            ← Home
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Admin
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <AdminPanel loggedIn={loggedIn} />
        </div>
      </main>
    </div>
  );
}
