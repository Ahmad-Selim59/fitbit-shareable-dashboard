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

export type ConnectionStatus = {
  configured: boolean;
  working: boolean;
  tokenSource: "env" | "cookie" | "none";
  dashboardPasswordRequired: boolean;
  refreshError?: string;
};

/** For /setup diagnostics — does not expose secrets. */
export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const { getEnvRefreshToken } = await import("./config");
  const envRefresh = getEnvRefreshToken();
  const stored = await loadTokens();
  const configured = Boolean(envRefresh || stored?.refreshToken);

  let working = false;
  let refreshError: string | undefined;

  if (configured) {
    working = (await getValidTokens()) !== null;
    if (!working) {
      const refreshToken = await getConfiguredRefreshToken();
      if (refreshToken) {
        try {
          await refreshAccessToken(refreshToken);
          working = true;
        } catch (err) {
          refreshError =
            err instanceof Error ? err.message : "Token refresh failed";
        }
      }
    }
  }

  return {
    configured,
    working,
    tokenSource: envRefresh ? "env" : stored?.refreshToken ? "cookie" : "none",
    dashboardPasswordRequired: Boolean(process.env.DASHBOARD_PASSWORD),
    refreshError,
  };
}

export async function healthFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let tokens = await getValidTokens();
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
    tokens = await refreshAccessToken(tokens.refreshToken);
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

export async function disconnectGoogleHealth(): Promise<{
  envTokenStillSet: boolean;
}> {
  const refreshToken = await getConfiguredRefreshToken();
  if (refreshToken) {
    try {
      await fetch(
        `${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(refreshToken)}`,
        { method: "POST" },
      );
    } catch {
      // revoke is best-effort
    }
  }
  const { clearTokens } = await import("./tokens");
  await clearTokens();
  const { getEnvRefreshToken } = await import("./config");
  return { envTokenStillSet: Boolean(getEnvRefreshToken()) };
}
