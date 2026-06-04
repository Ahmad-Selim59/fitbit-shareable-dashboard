import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/google-health/config";
import { fetchAndStoreIdentity } from "@/lib/google-health/client";
import { exchangeCodeForTokens } from "@/lib/google-health/oauth";

const STATE_COOKIE = "google_oauth_state";

function redirectToSetup(
  appUrl: string,
  params: Record<string, string>,
): NextResponse {
  const url = new URL("/setup", appUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = getAppUrl();

  if (error) {
    return redirectToSetup(appUrl, { error });
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return redirectToSetup(appUrl, { error: "invalid_oauth_state" });
  }

  try {
    await exchangeCodeForTokens(code);
    try {
      await fetchAndStoreIdentity();
    } catch {
      // identity is optional; tokens are enough for health data
    }
    return redirectToSetup(appUrl, { connected: "1" });
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "Unknown token exchange error";
    return redirectToSetup(appUrl, {
      error: "token_exchange_failed",
      detail: detail.slice(0, 300),
    });
  }
}
