import { NextResponse } from "next/server";
import { disconnectGoogleHealth } from "@/lib/google-health/client";

export async function POST() {
  await disconnectGoogleHealth();
  return NextResponse.json({ ok: true });
}
