import Link from "next/link";
import { ManageProfileForm } from "@/app/components/manage-profile-form";
import { GoogleOAuthTestingNotice } from "@/app/components/google-oauth-testing-notice";
import { getProfileOrNull } from "@/lib/profiles/access";
import {
  getProfileCapabilities,
  getProfileWatchType,
  profileRequiresViewerPassword,
} from "@/lib/profiles/store";
import { redirect } from "next/navigation";

export default async function ManageProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
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

      <main className="mx-auto max-w-lg space-y-4 px-4 py-8 sm:px-6">
        <GoogleOAuthTestingNotice />
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <ManageProfileForm
            slug={slug}
            watchType={getProfileWatchType(profile)}
            capabilities={getProfileCapabilities(profile)}
            hasViewerPassword={profileRequiresViewerPassword(profile)}
            oauthError={query.error}
            oauthErrorDetail={query.detail}
          />
        </div>
      </main>
    </div>
  );
}
