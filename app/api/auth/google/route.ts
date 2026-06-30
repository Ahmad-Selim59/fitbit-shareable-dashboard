import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/google-health/oauth";
import {
  getPendingJoin,
  getPendingReconnect,
} from "@/lib/profiles/auth-cookies";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");

  if (mode === "join") {
    const pending = await getPendingJoin();
    if (!pending) {
      return NextResponse.redirect(
        new URL("/join?error=session_expired", request.url),
      );
    }
  }

  if (mode === "reconnect") {
    const pending = await getPendingReconnect();
    if (!pending) {
      return NextResponse.redirect(
        new URL("/?error=reconnect_session_expired", request.url),
      );
    }
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
