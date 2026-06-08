import { NextResponse } from "next/server";
import { getProfileBySlug, updateProfileWatchType, verifyAdminPassword } from "@/lib/profiles/store";
import { parseWatchType } from "@/lib/watch-config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let body: { adminPassword?: string; watchType?: string };
  try {
    body = (await request.json()) as { adminPassword?: string; watchType?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ok = await verifyAdminPassword(profile, body.adminPassword ?? "");
  if (!ok) {
    return NextResponse.json({ error: "Incorrect admin password" }, { status: 401 });
  }

  const watchType = parseWatchType(body.watchType);
  await updateProfileWatchType(slug, watchType);
  return NextResponse.json({ watchType });
}
