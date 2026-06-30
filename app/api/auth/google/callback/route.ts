import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/google-health/config";
import { fetchAndStoreIdentityForProfile } from "@/lib/google-health/client";
import { probeDashboardCapabilities } from "@/lib/google-health/capabilities";
import { exchangeCodeForTokens } from "@/lib/google-health/oauth";
import {
  clearPendingJoin,
  clearPendingReconnect,
  getPendingJoin,
  getPendingReconnect,
} from "@/lib/profiles/auth-cookies";
import {
  createProfileFromJoin,
  getProfileBySlug,
  saveTokensForProfile,
  updateProfileCapabilities,
} from "@/lib/profiles/store";

const STATE_COOKIE = "google_oauth_state";

function redirectToJoin(
  appUrl: string,
  params: Record<string, string>,
): NextResponse {
  const url = new URL("/join", appUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

function redirectToManage(
  appUrl: string,
  slug: string,
  params: Record<string, string>,
): NextResponse {
  const url = new URL(`/p/${slug}/manage`, appUrl);
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
  const pendingReconnect = await getPendingReconnect();

  if (error) {
    if (pendingReconnect) {
      await clearPendingReconnect();
      return redirectToManage(appUrl, pendingReconnect.slug, { error });
    }
    return redirectToJoin(appUrl, { error });
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    if (pendingReconnect) {
      await clearPendingReconnect();
      return redirectToManage(appUrl, pendingReconnect.slug, {
        error: "invalid_oauth_state",
      });
    }
    return redirectToJoin(appUrl, { error: "invalid_oauth_state" });
  }

  if (pendingReconnect) {
    const profile = await getProfileBySlug(pendingReconnect.slug);
    if (!profile) {
      await clearPendingReconnect();
      return redirectToJoin(appUrl, { error: "session_expired" });
    }

    try {
      const tokens = await exchangeCodeForTokens(code);
      await saveTokensForProfile(pendingReconnect.slug, tokens);
      await clearPendingReconnect();

      try {
        await fetchAndStoreIdentityForProfile(pendingReconnect.slug);
      } catch {
        // optional
      }

      const capabilities = await probeDashboardCapabilities(
        pendingReconnect.slug,
      );
      await updateProfileCapabilities(pendingReconnect.slug, capabilities);

      return NextResponse.redirect(
        `${appUrl}/p/${pendingReconnect.slug}?reconnected=1`,
      );
    } catch (err) {
      await clearPendingReconnect();
      const detail =
        err instanceof Error ? err.message : "Unknown token exchange error";
      return redirectToManage(appUrl, pendingReconnect.slug, {
        error: "token_exchange_failed",
        detail: detail.slice(0, 300),
      });
    }
  }

  const pending = await getPendingJoin();
  if (!pending) {
    return redirectToJoin(appUrl, { error: "session_expired" });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await createProfileFromJoin(pending, tokens);
    await clearPendingJoin();

    try {
      await fetchAndStoreIdentityForProfile(pending.slug);
    } catch {
      // optional
    }

    const capabilities = await probeDashboardCapabilities(pending.slug);
    await updateProfileCapabilities(pending.slug, capabilities);

    return NextResponse.redirect(
      `${appUrl}/p/${pending.slug}?joined=1`,
    );
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "Unknown token exchange error";
    return redirectToJoin(appUrl, {
      error: "token_exchange_failed",
      detail: detail.slice(0, 300),
    });
  }
}
