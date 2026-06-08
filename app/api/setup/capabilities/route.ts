import { NextResponse } from "next/server";
import { probeDashboardCapabilities } from "@/lib/google-health/capabilities";
import { isGoogleHealthConnected } from "@/lib/google-health/client";
import { updateCapabilities } from "@/lib/watch-settings";

export async function GET() {
  if (!(await isGoogleHealthConnected())) {
    return NextResponse.json(
      { error: "Connect Google Health first" },
      { status: 400 },
    );
  }

  const capabilities = await probeDashboardCapabilities();
  return NextResponse.json({ capabilities });
}

export async function POST() {
  if (!(await isGoogleHealthConnected())) {
    return NextResponse.json(
      { error: "Connect Google Health first" },
      { status: 400 },
    );
  }

  const capabilities = await probeDashboardCapabilities();
  const settings = await updateCapabilities(capabilities);
  return NextResponse.json({ capabilities, settings });
}
