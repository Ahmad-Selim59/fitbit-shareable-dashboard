import { NextResponse } from "next/server";
import { canViewProfile } from "./access";
import { getProfileBySlug } from "./store";

export async function resolveProfileHealthAccess(
  slug: string,
): Promise<{ profile: Awaited<ReturnType<typeof getProfileBySlug>> } | NextResponse> {
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  const allowed = await canViewProfile(profile);
  if (!allowed) {
    return NextResponse.json({ error: "Locked" }, { status: 403 });
  }
  return { profile };
}
