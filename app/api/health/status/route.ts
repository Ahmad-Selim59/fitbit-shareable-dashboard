import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/lib/google-health/client";

export async function GET() {
  const status = await getConnectionStatus();
  return NextResponse.json(status);
}
