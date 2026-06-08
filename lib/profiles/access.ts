import { redirect } from "next/navigation";
import { hasProfileUnlock } from "./auth-cookies";
import { getProfileBySlug, profileRequiresViewerPassword } from "./store";
import type { ProfileRow } from "./types";

export async function getProfileOrNull(
  slug: string,
): Promise<ProfileRow | null> {
  return getProfileBySlug(slug);
}

export async function canViewProfile(profile: ProfileRow): Promise<boolean> {
  if (!profileRequiresViewerPassword(profile)) return true;
  return hasProfileUnlock(profile.slug);
}

export async function requireProfileForView(
  slug: string,
): Promise<ProfileRow> {
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    redirect("/?notfound=1");
  }
  if (profileRequiresViewerPassword(profile)) {
    const unlocked = await hasProfileUnlock(slug);
    if (!unlocked) {
      redirect(`/p/${slug}/unlock`);
    }
  }
  return profile;
}
