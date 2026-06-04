import {
  GOOGLE_AUTHORIZE_URL,
  GOOGLE_HEALTH_SCOPES,
  GOOGLE_TOKEN_URL,
  getGoogleClientId,
  getGoogleClientSecret,
  getGoogleRedirectUri,
} from "./config";
import { loadTokens, saveTokens, type GoogleHealthTokens } from "./tokens";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
};

async function fetchTokens(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google token request failed: ${detail}`);
  }

  return response.json() as Promise<TokenResponse>;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_HEALTH_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
}

function toStoredTokens(
  data: TokenResponse,
  fallbackRefreshToken?: string,
  healthUserId?: string,
): GoogleHealthTokens {
  const rt = data.refresh_token || fallbackRefreshToken;
  if (!rt) {
    throw new Error("No refresh token received. Try disconnecting and connecting again.");
  }

  return {
    accessToken: data.access_token,
    refreshToken: rt,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
    healthUserId,
  };
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleHealthTokens> {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getGoogleRedirectUri(),
    grant_type: "authorization_code",
  });

  const data = await fetchTokens(body);
  const previous = await loadTokens();
  const tokens = toStoredTokens(data, previous?.refreshToken, previous?.healthUserId);
  await saveTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<GoogleHealthTokens> {
  const body = new URLSearchParams({
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const data = await fetchTokens(body);
  const previous = await loadTokens();
  const tokens = toStoredTokens(data, refreshToken, previous?.healthUserId);
  await saveTokens(tokens);
  return tokens;
}
