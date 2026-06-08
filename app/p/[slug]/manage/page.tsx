import Link from "next/link";
import { ManageProfileForm } from "@/app/components/manage-profile-form";
import { getProfileOrNull } from "@/lib/profiles/access";
import {
  getProfileCapabilities,
  getProfileWatchType,
} from "@/lib/profiles/store";
import { redirect } from "next/navigation";

export default async function ManageProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfileOrNull(slug);
  if (!profile) {
    redirect("/?notfound=1");
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-lg px-4 py-5 sm:px-6">
          <Link href={`/p/${slug}`} className="text-sm text-teal-600 hover:text-teal-500">
            ← {profile.display_name}
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Manage profile
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <ManageProfileForm
            slug={slug}
            watchType={getProfileWatchType(profile)}
            capabilities={getProfileCapabilities(profile)}
          />
        </div>
      </main>
    </div>
  );
}
