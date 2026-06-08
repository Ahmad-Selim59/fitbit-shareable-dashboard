import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/crypto/passwords";
import { setPendingJoin } from "@/lib/profiles/auth-cookies";
import { slugExists } from "@/lib/profiles/store";
import { normalizeSlugInput, validateSlug } from "@/lib/profiles/slug";
import type { ProfileVisibility } from "@/lib/profiles/types";
import { parseWatchType } from "@/lib/watch-config";
export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  try {
    body = (await request.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = normalizeSlugInput(body.slug ?? "");
  const slugError = validateSlug(slug);
  if (slugError) {
    return NextResponse.json({ error: slugError }, { status: 400 });
  }

  if (await slugExists(slug)) {
    return NextResponse.json({ error: "That slug is already taken." }, { status: 409 });
  }

  const displayName = (body.displayName ?? "").trim();
  if (displayName.length < 1 || displayName.length > 64) {
    return NextResponse.json(
      { error: "Display name must be 1–64 characters." },
      { status: 400 },
    );
  }

  const visibility = body.visibility === "hidden" ? "hidden" : "public";
  const watchType = parseWatchType(body.watchType);
  const adminPassword = body.adminPassword ?? "";
  if (adminPassword.length < 4) {
    return NextResponse.json(
      { error: "Admin password must be at least 4 characters." },
      { status: 400 },
    );
  }

  const viewerPassword = (body.viewerPassword ?? "").trim();
  const viewerPasswordHash = viewerPassword
    ? await hashPassword(viewerPassword)
    : null;
  const adminPasswordHash = await hashPassword(adminPassword);

  await setPendingJoin({
    slug,
    displayName,
    visibility: visibility as ProfileVisibility,
    watchType,
    viewerPasswordHash,
    adminPasswordHash,
  });

  return NextResponse.json({
    ok: true,
    redirect: "/api/auth/google?mode=join",
  });
}
