import { NextResponse } from "next/server";
import { disconnectGoogleHealth } from "@/lib/google-health/client";

export async function POST() {
  const result = await disconnectGoogleHealth();
  return NextResponse.json({ ok: true, ...result });
}
