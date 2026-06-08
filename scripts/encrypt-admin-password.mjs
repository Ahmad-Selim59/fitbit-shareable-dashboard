/**
 * Encrypt ADMIN_PASSWORD for .env / Vercel.
 * Usage: TOKEN_ENCRYPTION_KEY=... node scripts/encrypt-admin-password.mjs "your-password"
 */
import { createCipheriv, randomBytes } from "crypto";

const keyHex = process.env.TOKEN_ENCRYPTION_KEY?.trim();
const password = process.argv[2];

if (!keyHex || keyHex.length !== 64) {
  console.error("Set TOKEN_ENCRYPTION_KEY (64 hex chars) in the environment.");
  process.exit(1);
}
if (!password) {
  console.error('Usage: node scripts/encrypt-admin-password.mjs "your-password"');
  process.exit(1);
}

const key = Buffer.from(keyHex, "hex");
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([
  cipher.update(password, "utf8"),
  cipher.final(),
]);
const tag = cipher.getAuthTag();
const payload = `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;

console.log("Add to .env.local or Vercel:");
console.log(`ADMIN_PASSWORD_ENC=${payload}`);
