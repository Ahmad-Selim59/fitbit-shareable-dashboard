import Link from "next/link";
import { redirect } from "next/navigation";
import { UnlockForm } from "@/app/components/unlock-form";
import { canViewProfile, getProfileOrNull } from "@/lib/profiles/access";
import { profileRequiresViewerPassword } from "@/lib/profiles/store";

export default async function UnlockPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfileOrNull(slug);
  if (!profile) {
    redirect("/?notfound=1");
  }
  if (!profileRequiresViewerPassword(profile)) {
    redirect(`/p/${slug}`);
  }
  if (await canViewProfile(profile)) {
    redirect(`/p/${slug}`);
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/" className="text-sm text-teal-600 hover:text-teal-500">
          ← Dashboards
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {profile.display_name}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This dashboard is password-protected.
        </p>
        <UnlockForm slug={slug} />
      </div>
    </div>
  );
}
