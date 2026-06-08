import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/profiles/auth-cookies";
import { deleteProfileAndRevoke } from "@/lib/profiles/delete";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const ok = await deleteProfileAndRevoke(slug);
  if (!ok) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
