import { NextResponse } from "next/server";
import { isGoogleHealthConnected } from "@/lib/google-health/client";
import { fetchTodaySteps } from "@/lib/google-health/steps";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isGoogleHealthConnected())) {
    return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 401 });
  }

  try {
    const today = await fetchTodaySteps();
    return NextResponse.json({ today, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
