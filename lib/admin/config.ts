import { timingSafeEqual } from "crypto";
import { decryptSecret, encryptSecret } from "@/lib/crypto/tokens";

export function getConfiguredAdminPassword(): string | null {
  const encrypted = process.env.ADMIN_PASSWORD?.trim();
  if (!encrypted) return null;
  try {
    return decryptSecret(encrypted);
  } catch {
    return null;
  }
}

export function verifySuperAdminPassword(submitted: string): boolean {
  const expected = getConfiguredAdminPassword();
  if (!expected) return false;
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function encryptAdminPasswordForEnv(plaintext: string): string {
  return encryptSecret(plaintext);
}
