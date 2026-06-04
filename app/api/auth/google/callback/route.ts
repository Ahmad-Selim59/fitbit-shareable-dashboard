import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/google-health/config";
import { fetchAndStoreIdentity } from "@/lib/google-health/client";
import { exchangeCodeForTokens } from "@/lib/google-health/oauth";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = getAppUrl();
  const home = new URL("/", appUrl);

  if (error) {
    home.searchParams.set("error", error);
    return NextResponse.redirect(home);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    home.searchParams.set("error", "invalid_oauth_state");
    return NextResponse.redirect(home);
  }

  try {
    await exchangeCodeForTokens(code);
    await fetchAndStoreIdentity();
    home.searchParams.set("connected", "1");
  } catch {
    home.searchParams.set("error", "token_exchange_failed");
  }

  return NextResponse.redirect(home);
}
