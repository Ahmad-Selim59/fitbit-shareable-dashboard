import {
  type DashboardCapabilities,
  getEnvWatchType,
  parseWatchType,
  type WatchType,
} from "./watch-config";
import { mkdir, readFile, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import path from "path";

export type WatchSettings = {
  watchType: WatchType;
  capabilities?: DashboardCapabilities;
  capabilitiesProbedAt?: string;
};

const SETTINGS_COOKIE = "watch_settings";
const SETTINGS_FILE = path.join(
  process.cwd(),
  ".data",
  "watch-settings.json",
);

function useCookieStorage(): boolean {
  return process.env.VERCEL === "1";
}

async function loadFromCookie(): Promise<WatchSettings | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SETTINGS_COOKIE)?.value;
    if (!raw) return null;
    return JSON.parse(raw) as WatchSettings;
  } catch {
    return null;
  }
}

async function saveToCookie(settings: WatchSettings): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SETTINGS_COOKIE, JSON.stringify(settings), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
    });
  } catch {
    console.warn("[watch-settings] Could not save settings to cookie.");
  }
}

export async function loadWatchSettings(): Promise<WatchSettings | null> {
  const fromEnv = getEnvWatchType();
  if (fromEnv) {
    const stored = await loadWatchSettingsFromStore();
    return {
      watchType: fromEnv,
      capabilities: stored?.capabilities,
      capabilitiesProbedAt: stored?.capabilitiesProbedAt,
    };
  }

  return loadWatchSettingsFromStore();
}

async function loadWatchSettingsFromStore(): Promise<WatchSettings | null> {
  if (useCookieStorage()) {
    return loadFromCookie();
  }

  try {
    const raw = await readFile(SETTINGS_FILE, "utf8");
    return JSON.parse(raw) as WatchSettings;
  } catch {
    return null;
  }
}

export async function saveWatchSettings(
  settings: WatchSettings,
): Promise<void> {
  if (useCookieStorage()) {
    await saveToCookie(settings);
    return;
  }

  await mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}

export async function getWatchType(): Promise<WatchType> {
  const env = getEnvWatchType();
  if (env) return env;

  const stored = await loadWatchSettingsFromStore();
  return parseWatchType(stored?.watchType);
}

export async function updateWatchType(
  watchType: WatchType,
): Promise<WatchSettings> {
  const current = (await loadWatchSettings()) ?? { watchType: "fitbit" };
  const next: WatchSettings = {
    ...current,
    watchType,
  };
  await saveWatchSettings(next);
  return next;
}

export async function updateCapabilities(
  capabilities: DashboardCapabilities,
): Promise<WatchSettings> {
  const current = (await loadWatchSettings()) ?? {
    watchType: await getWatchType(),
  };
  const next: WatchSettings = {
    ...current,
    capabilities,
    capabilitiesProbedAt: new Date().toISOString(),
  };
  await saveWatchSettings(next);
  return next;
}
