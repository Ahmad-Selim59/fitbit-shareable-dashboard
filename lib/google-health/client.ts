import { GOOGLE_REVOKE_URL, HEALTH_API_BASE } from "./config";
import { refreshAccessToken } from "./oauth";
import {
  getConfiguredRefreshToken,
  isTokenExpired,
  loadTokens,
  saveTokens,
  type GoogleHealthTokens,
} from "./tokens";

async function getValidTokens(): Promise<GoogleHealthTokens | null> {
  const refreshToken = await getConfiguredRefreshToken();
  if (!refreshToken) return null;

  const cached = await loadTokens();
  if (
    cached?.refreshToken === refreshToken &&
    !isTokenExpired(cached)
  ) {
    return cached;
  }

  try {
    return await refreshAccessToken(refreshToken);
  } catch {
    return null;
  }
}

export async function isGoogleHealthConnected(): Promise<boolean> {
  if (!(await getConfiguredRefreshToken())) return false;
  const tokens = await getValidTokens();
  return tokens !== null;
}

export async function healthFetch<T>(path: string): Promise<T> {
  let tokens = await getValidTokens();
  if (!tokens) {
    throw new Error("NOT_CONNECTED");
  }

  const url = path.startsWith("http")
    ? path
    : `${HEALTH_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401 && tokens.refreshToken) {
    tokens = await refreshAccessToken(tokens.refreshToken);
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Health API error (${response.status}): ${detail}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchAndStoreIdentity(): Promise<void> {
  const identity = await healthFetch<{
    healthUserId?: string;
    legacyUserId?: string;
  }>("/v4/users/me/identity");

  const tokens = await loadTokens();
  if (!tokens) return;

  await saveTokens({
    ...tokens,
    healthUserId: identity.healthUserId,
  });
}

export async function disconnectGoogleHealth(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens?.refreshToken) {
    try {
      await fetch(
        `${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(tokens.refreshToken)}`,
        { method: "POST" },
      );
    } catch {
      // revoke is best-effort
    }
  }
  const { clearTokens } = await import("./tokens");
  await clearTokens();
}
