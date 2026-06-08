import { NextResponse } from "next/server";
import {
  getConfiguredAdminPassword,
  verifySuperAdminPassword,
} from "@/lib/admin/config";
import { setAdminSession } from "@/lib/profiles/auth-cookies";

export async function POST(request: Request) {
  if (!getConfiguredAdminPassword()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not configured" },
      { status: 503 },
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifySuperAdminPassword(body.password ?? "")) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
