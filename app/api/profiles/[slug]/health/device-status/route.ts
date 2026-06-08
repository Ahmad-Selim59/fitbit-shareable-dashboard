import { NextResponse } from "next/server";
import { fetchDeviceStatusCached } from "@/lib/google-health/device";
import { resolveProfileHealthAccess } from "@/lib/profiles/health-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const access = await resolveProfileHealthAccess(slug);
  if (access instanceof NextResponse) return access;

  const data = await fetchDeviceStatusCached(slug);
  return NextResponse.json(data);
}
