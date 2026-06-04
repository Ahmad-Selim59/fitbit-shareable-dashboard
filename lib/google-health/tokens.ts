import { getEnvRefreshToken } from "./config";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type GoogleHealthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  healthUserId?: string;
};

const TOKEN_FILE = path.join(
  process.cwd(),
  ".data",
  "google-health-tokens.json",
);

export async function loadTokens(): Promise<GoogleHealthTokens | null> {
  try {
    const raw = await readFile(TOKEN_FILE, "utf8");
    return JSON.parse(raw) as GoogleHealthTokens;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: GoogleHealthTokens): Promise<void> {
  await mkdir(path.dirname(TOKEN_FILE), { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf8");
}

export async function clearTokens(): Promise<void> {
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

/** Refresh token from .env (deploy) or saved file (local one-time /setup). */
export async function getConfiguredRefreshToken(): Promise<string | null> {
  const fromEnv = getEnvRefreshToken();
  if (fromEnv) return fromEnv;
  const fromFile = await loadTokens();
  return fromFile?.refreshToken ?? null;
}

export async function hasRefreshTokenConfigured(): Promise<boolean> {
  return (await getConfiguredRefreshToken()) !== null;
}
