import Link from "next/link";
import { ProfileDashboard } from "@/app/components/profile-dashboard";
import { GoogleHealthDisconnectedNotice } from "@/app/components/google-health-disconnected-notice";
import { GoogleOAuthTestingNotice } from "@/app/components/google-oauth-testing-notice";
import { RecordProfileVisit } from "@/app/components/record-profile-visit";
import { isProfileConnected } from "@/lib/google-health/client";
import { requireProfileForView } from "@/lib/profiles/access";
import { profileRequiresViewerPassword } from "@/lib/profiles/store";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ joined?: string; reconnected?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await requireProfileForView(slug);
  const connected = await isProfileConnected(slug);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm text-teal-600 hover:text-teal-500">
            ← All dashboards
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {profile.display_name}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            /p/{profile.slug}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
        <RecordProfileVisit
          slug={profile.slug}
          displayName={profile.display_name}
          hasViewerPassword={profileRequiresViewerPassword(profile)}
        />
        {query.joined === "1" && (
          <div className="rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            Dashboard created. Save your admin password — you need it to manage
            or delete this profile at{" "}
            <Link href={`/p/${slug}/manage`} className="font-medium underline">
              manage
            </Link>
            .
          </div>
        )}
        {query.reconnected === "1" && (
          <div className="rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            Google Health reconnected. Your dashboard should load data again.
          </div>
        )}
        {!connected && <GoogleHealthDisconnectedNotice slug={slug} />}
        <GoogleOAuthTestingNotice />
        <ProfileDashboard profile={profile} connected={connected} />
        <p className="text-xs text-zinc-500">
          <Link href={`/p/${slug}/manage`} className="underline">
            Manage profile
          </Link>
        </p>
      </main>
    </div>
  );
}
