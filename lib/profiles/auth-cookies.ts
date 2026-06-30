import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { PendingJoin } from "./types";

const PENDING_JOIN_COOKIE = "pending_join";
const PENDING_RECONNECT_COOKIE = "pending_reconnect";
const ADMIN_SESSION_COOKIE = "admin_session";
const PENDING_TTL_SEC = 600;
const UNLOCK_TTL_SEC = 60 * 60 * 24 * 30;
const ADMIN_TTL_SEC = 60 * 60 * 8;

function getSigningSecret(): string {
  const key = process.env.TOKEN_ENCRYPTION_KEY?.trim();
  if (!key) throw new Error("Missing TOKEN_ENCRYPTION_KEY");
  return key;
}

function sign(value: string): string {
  const sig = createHmac("sha256", getSigningSecret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

function verifySigned(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", getSigningSecret())
    .update(value)
    .digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return value;
}

function unlockCookieName(slug: string): string {
  return `profile_unlock_${slug}`;
}

export async function setPendingJoin(data: PendingJoin): Promise<void> {
  const cookieStore = await cookies();
  const payload = sign(
    JSON.stringify({ ...data, exp: Date.now() + PENDING_TTL_SEC * 1000 }),
  );
  cookieStore.set(PENDING_JOIN_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_TTL_SEC,
    path: "/",
  });
}

export async function getPendingJoin(): Promise<PendingJoin | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PENDING_JOIN_COOKIE)?.value;
  if (!raw) return null;
  const verified = verifySigned(raw);
  if (!verified) return null;
  try {
    const parsed = JSON.parse(verified) as PendingJoin & { exp: number };
    if (parsed.exp < Date.now()) return null;
    const { exp: _, ...join } = parsed;
    return join;
  } catch {
    return null;
  }
}

export async function clearPendingJoin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_JOIN_COOKIE);
}

export async function setPendingReconnect(slug: string): Promise<void> {
  const cookieStore = await cookies();
  const payload = sign(
    JSON.stringify({ slug, exp: Date.now() + PENDING_TTL_SEC * 1000 }),
  );
  cookieStore.set(PENDING_RECONNECT_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_TTL_SEC,
    path: "/",
  });
}

export async function getPendingReconnect(): Promise<{ slug: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PENDING_RECONNECT_COOKIE)?.value;
  if (!raw) return null;
  const verified = verifySigned(raw);
  if (!verified) return null;
  try {
    const parsed = JSON.parse(verified) as { slug: string; exp: number };
    if (parsed.exp < Date.now() || !parsed.slug) return null;
    return { slug: parsed.slug };
  } catch {
    return null;
  }
}

export async function clearPendingReconnect(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_RECONNECT_COOKIE);
}

export async function setProfileUnlock(slug: string): Promise<void> {
  const cookieStore = await cookies();
  const payload = sign(
    JSON.stringify({ slug, exp: Date.now() + UNLOCK_TTL_SEC * 1000 }),
  );
  cookieStore.set(unlockCookieName(slug), payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: UNLOCK_TTL_SEC,
    path: "/",
  });
}

export async function hasProfileUnlock(slug: string): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(unlockCookieName(slug))?.value;
  if (!raw) return false;
  const verified = verifySigned(raw);
  if (!verified) return false;
  try {
    const parsed = JSON.parse(verified) as { slug: string; exp: number };
    if (parsed.exp < Date.now() || parsed.slug !== slug) return false;
    return true;
  } catch {
    return false;
  }
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const payload = sign(JSON.stringify({ admin: true, exp: Date.now() + ADMIN_TTL_SEC * 1000 }));
  cookieStore.set(ADMIN_SESSION_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_TTL_SEC,
    path: "/",
  });
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return false;
  const verified = verifySigned(raw);
  if (!verified) return false;
  try {
    const parsed = JSON.parse(verified) as { admin: boolean; exp: number };
    return parsed.admin === true && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
