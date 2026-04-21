/* ═══════════════════════════════════════════════════════════════
   MFA — TOTP RFC 6238 (compatible Google Authenticator/1Password)
   + backup codes hasheados.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createHmac, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const STEP = 30;
const DIGITS = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf) {
  let bits = 0, value = 0, out = "";
  for (const b of buf) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(s) {
  s = s.replace(/=+$/, "").toUpperCase();
  let bits = 0, value = 0; const out = [];
  for (const c of s) {
    const i = ALPHABET.indexOf(c); if (i < 0) continue;
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

export function generateSecret() {
  return base32Encode(randomBytes(20));
}

export function otpauthURL(secret, account, issuer = "BIO-IGNICIÓN") {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=${DIGITS}&period=${STEP}`;
}

function hotp(secret, counter) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16)
             | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

export async function verifyTOTP(secret, token, window = 1) {
  if (!secret || !token) return false;
  const t = Math.floor(Date.now() / 1000 / STEP);
  for (let i = -window; i <= window; i++) {
    const expected = hotp(secret, t + i);
    if (expected.length === token.length &&
        timingSafeEqual(Buffer.from(expected), Buffer.from(token))) return true;
  }
  return false;
}

/* Backup codes — generate N human-readable codes (xxxx-xxxx). Plaintext is
   shown to the user exactly once at enrollment; only scrypt hashes are
   persisted. On verify, we hash the input and look for a match, then
   remove that hash from the user's list (single-use). */
export function generateBackupCodes(n = 10) {
  return Array.from({ length: n }, () => {
    const b = randomBytes(4).toString("hex"); // 8 hex chars
    const c = randomBytes(4).toString("hex");
    return `${b}-${c}`;
  });
}

/* scrypt hash — we include a per-code salt because the codes are short
   and we want offline resistance. Format: salt.hash (base64). */
export function hashBackupCode(code) {
  const salt = randomBytes(16);
  const key = scryptSync(normalizeBackup(code), salt, 32);
  return `${salt.toString("base64")}.${key.toString("base64")}`;
}

function normalizeBackup(code) {
  return String(code || "").toLowerCase().replace(/[\s-]+/g, "");
}

export function verifyBackupCode(code, hashes) {
  const input = normalizeBackup(code);
  if (input.length < 8) return { ok: false, remaining: hashes };
  for (const stored of hashes) {
    const [saltB64, keyB64] = stored.split(".");
    if (!saltB64 || !keyB64) continue;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(keyB64, "base64");
    const got = scryptSync(input, salt, expected.length);
    if (got.length === expected.length && timingSafeEqual(got, expected)) {
      return { ok: true, remaining: hashes.filter((h) => h !== stored) };
    }
  }
  return { ok: false, remaining: hashes };
}

/* Trusted-device token — random value given to the browser as a signed
   HTTP-only cookie; only sha256 is kept server-side. */
export function newTrustedDeviceToken() {
  return randomBytes(32).toString("base64url");
}

export function hashDeviceToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}
