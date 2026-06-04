import { getEnvRefreshToken } from "./config";
import { mkdir, readFile, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import path from "path";

export type GoogleHealthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  healthUserId?: string;
};

const TOKEN_COOKIE = "google_health_tokens";
const TOKEN_FILE = path.join(
  process.cwd(),
  ".data",
  "google-health-tokens.json",
);

function useCookieStorage(): boolean {
  return process.env.VERCEL === "1";
}

async function loadFromCookie(): Promise<GoogleHealthTokens | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(TOKEN_COOKIE)?.value;
    if (!raw) return null;
    return JSON.parse(raw) as GoogleHealthTokens;
  } catch {
    return null;
  }
}

async function saveToCookie(tokens: GoogleHealthTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 400,
    path: "/",
  });
}

async function clearCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_COOKIE);
  } catch {
    // not in a request context
  }
}

export async function loadTokens(): Promise<GoogleHealthTokens | null> {
  if (useCookieStorage()) {
    return loadFromCookie();
  }

  try {
    const raw = await readFile(TOKEN_FILE, "utf8");
    return JSON.parse(raw) as GoogleHealthTokens;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: GoogleHealthTokens): Promise<void> {
  if (useCookieStorage()) {
    await saveToCookie(tokens);
    return;
  }

  await mkdir(path.dirname(TOKEN_FILE), { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf8");
}

export async function clearTokens(): Promise<void> {
  await clearCookie();
  try {
    const { unlink } = await import("fs/promises");
    await unlink(TOKEN_FILE);
  } catch {
    // no tokens file
  }
}

export function isTokenExpired(tokens: GoogleHealthTokens): boolean {
  return Date.now() >= tokens.expiresAt - 60_000;
}

/** Refresh token from .env (deploy) or saved cookie/file (local /setup). */
export async function getConfiguredRefreshToken(): Promise<string | null> {
  const fromEnv = getEnvRefreshToken();
  if (fromEnv) return fromEnv;
  const fromStore = await loadTokens();
  return fromStore?.refreshToken ?? null;
}

export async function hasRefreshTokenConfigured(): Promise<boolean> {
  return (await getConfiguredRefreshToken()) !== null;
}
