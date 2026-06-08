import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/profiles/auth-cookies";
import { listAllProfiles } from "@/lib/profiles/store";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profiles = await listAllProfiles();
  return NextResponse.json({ profiles });
}
