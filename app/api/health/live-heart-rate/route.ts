import { NextResponse } from "next/server";
import { isGoogleHealthConnected } from "@/lib/google-health/client";
import { fetchLiveHeartRate } from "@/lib/google-health/heart-rate-live";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isGoogleHealthConnected())) {
    return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 401 });
  }

  try {
    const data = await fetchLiveHeartRate();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
