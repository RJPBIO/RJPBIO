/* ═══════════════════════════════════════════════════════════════
   MFA — TOTP RFC 6238 (compatible Google Authenticator/1Password)
   + backup codes hasheados.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

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

export function generateBackupCodes(n = 10) {
  return Array.from({ length: n }, () => randomBytes(5).toString("hex"));
}
