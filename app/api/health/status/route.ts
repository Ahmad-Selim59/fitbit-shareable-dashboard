import { NextResponse } from "next/server";
import { isGoogleHealthConnected } from "@/lib/google-health/client";

export async function GET() {
  const connected = await isGoogleHealthConnected();
  return NextResponse.json({ connected });
}
