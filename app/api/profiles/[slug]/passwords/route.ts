import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/crypto/passwords";
import {
  getProfileBySlug,
  updateProfilePasswords,
  verifyAdminPassword,
} from "@/lib/profiles/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let body: {
    adminPassword?: string;
    newAdminPassword?: string;
    newViewerPassword?: string;
    removeViewerPassword?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ok = await verifyAdminPassword(profile, body.adminPassword ?? "");
  if (!ok) {
    return NextResponse.json({ error: "Incorrect admin password" }, { status: 401 });
  }

  const updates: {
    adminPasswordHash?: string;
    viewerPasswordHash?: string | null;
  } = {};

  if (body.newAdminPassword !== undefined && body.newAdminPassword !== "") {
    if (body.newAdminPassword.length < 4) {
      return NextResponse.json(
        { error: "New admin password must be at least 4 characters." },
        { status: 400 },
      );
    }
    updates.adminPasswordHash = await hashPassword(body.newAdminPassword);
  }

  if (body.removeViewerPassword) {
    updates.viewerPasswordHash = null;
  } else if (
    body.newViewerPassword !== undefined &&
    body.newViewerPassword !== ""
  ) {
    updates.viewerPasswordHash = await hashPassword(body.newViewerPassword);
  }

  if (
    updates.adminPasswordHash === undefined &&
    updates.viewerPasswordHash === undefined
  ) {
    return NextResponse.json(
      { error: "No password changes requested." },
      { status: 400 },
    );
  }

  await updateProfilePasswords(slug, updates);
  return NextResponse.json({ ok: true });
}
