import { GOOGLE_REVOKE_URL, HEALTH_API_BASE } from "./config";
import { refreshAccessToken } from "./oauth";
import type { GoogleHealthTokens } from "./types";
import {
  getProfileBySlug,
  getTokensForProfile,
  saveTokensForProfile,
} from "@/lib/profiles/store";

function isTokenExpired(tokens: GoogleHealthTokens): boolean {
  return Date.now() >= tokens.expiresAt - 60_000;
}

export async function getValidTokensForProfile(
  slug: string,
): Promise<GoogleHealthTokens | null> {
  const profile = await getProfileBySlug(slug);
  if (!profile) return null;

  const stored = await getTokensForProfile(profile);
  if (!stored?.refreshToken) return null;

  if (stored.accessToken && !isTokenExpired(stored)) {
    return stored;
  }

  try {
    const refreshed = await refreshAccessToken(
      stored.refreshToken,
      stored.healthUserId,
    );
    await saveTokensForProfile(slug, refreshed);
    return refreshed;
  } catch {
    return null;
  }
}

export async function isProfileConnected(slug: string): Promise<boolean> {
  return (await getValidTokensForProfile(slug)) !== null;
}

export async function healthFetchForProfile<T>(
  slug: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let tokens = await getValidTokensForProfile(slug);
  if (!tokens) {
    throw new Error("NOT_CONNECTED");
  }

  const url = path.startsWith("http")
    ? path
    : `${HEALTH_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${tokens.accessToken}`,
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401 && tokens.refreshToken) {
    tokens = await refreshAccessToken(tokens.refreshToken, tokens.healthUserId);
    await saveTokensForProfile(slug, tokens);
    headers.Authorization = `Bearer ${tokens.accessToken}`;
    response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Health API error (${response.status}): ${detail}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchAndStoreIdentityForProfile(
  slug: string,
): Promise<void> {
  const identity = await healthFetchForProfile<{
    healthUserId?: string;
    legacyUserId?: string;
  }>(slug, "/v4/users/me/identity");

  const tokens = await getValidTokensForProfile(slug);
  if (!tokens) return;

  await saveTokensForProfile(slug, {
    ...tokens,
    healthUserId: identity.healthUserId,
  });
}

export async function disconnectProfile(slug: string): Promise<void> {
  const profile = await getProfileBySlug(slug);
  if (!profile) return;

  const tokens = await getTokensForProfile(profile);
  if (tokens?.refreshToken) {
    try {
      await fetch(
        `${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(tokens.refreshToken)}`,
        { method: "POST" },
      );
    } catch {
      // best-effort
    }
  }
}
