import { NextResponse } from "next/server";
import { setProfileUnlock } from "@/lib/profiles/auth-cookies";
import { getProfileBySlug, verifyViewerPassword } from "@/lib/profiles/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!profile.viewer_password_hash) {
    return NextResponse.json({ ok: true });
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ok = await verifyViewerPassword(profile, body.password ?? "");
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await setProfileUnlock(slug);
  return NextResponse.json({ ok: true });
}
