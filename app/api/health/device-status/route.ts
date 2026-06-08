import { NextResponse } from "next/server";
import { isGoogleHealthConnected } from "@/lib/google-health/client";
import { fetchDeviceStatusCached } from "@/lib/google-health/device";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isGoogleHealthConnected())) {
    return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 401 });
  }

  try {
    const device = await fetchDeviceStatusCached();
    return NextResponse.json({ device, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
