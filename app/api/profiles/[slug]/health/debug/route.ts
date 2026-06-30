import { NextResponse } from "next/server";
import { probeGoogleHealthData } from "@/lib/google-health/probe";
import { getProfileBySlug, verifyAdminPassword } from "@/lib/profiles/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let body: { adminPassword?: string };
  try {
    body = (await request.json()) as { adminPassword?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ok = await verifyAdminPassword(profile, body.adminPassword ?? "");
  if (!ok) {
    return NextResponse.json({ error: "Incorrect admin password" }, { status: 401 });
  }

  try {
    const probe = await probeGoogleHealthData(slug);
    return NextResponse.json(probe);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Probe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
