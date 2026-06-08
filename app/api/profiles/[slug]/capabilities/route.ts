import { NextResponse } from "next/server";
import { probeDashboardCapabilities } from "@/lib/google-health/capabilities";
import { getProfileBySlug, updateProfileCapabilities, verifyAdminPassword } from "@/lib/profiles/store";

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

  const capabilities = await probeDashboardCapabilities(slug);
  await updateProfileCapabilities(slug, capabilities);
  return NextResponse.json({ capabilities });
}
