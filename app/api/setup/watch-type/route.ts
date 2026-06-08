import { NextResponse } from "next/server";
import { isGoogleHealthConnected } from "@/lib/google-health/client";
import { parseWatchType } from "@/lib/watch-config";
import { updateWatchType } from "@/lib/watch-settings";

export async function POST(request: Request) {
  if (!(await isGoogleHealthConnected())) {
    return NextResponse.json(
      { error: "Connect Google Health first" },
      { status: 400 },
    );
  }

  let body: { watchType?: string };
  try {
    body = (await request.json()) as { watchType?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const watchType = parseWatchType(body.watchType);
  const settings = await updateWatchType(watchType);
  return NextResponse.json(settings);
}
