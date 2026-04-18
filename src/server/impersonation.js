/* ═══════════════════════════════════════════════════════════════
   Admin impersonation — platform staff asume identidad de un
   usuario para debugging/soporte.
   - Acceso: solo usuarios listados en PLATFORM_ADMINS (email CSV).
   - Duración: cap server-side de 60 min.
   - Siempre audita actor + target + motivo en Impersonation model
     y AuditLog (con hash chain).
   - Consume token: HMAC-firmado, un solo uso (DB marca endedAt).
   ═══════════════════════════════════════════════════════════════ */
import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const MAX_MINUTES = 60;

function impKey() {
  const k = process.env.IMPERSONATION_KEY || process.env.AUTH_SECRET;
  if (!k) throw new Error("IMPERSONATION_KEY or AUTH_SECRET required");
  return k;
}

export function isPlatformAdmin(email) {
  if (!email) return false;
  const csv = process.env.PLATFORM_ADMINS || "";
  return csv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export function clampMinutes(m) {
  const n = Number(m);
  if (!Number.isFinite(n) || n <= 0) return 15;
  return Math.min(Math.max(1, Math.round(n)), MAX_MINUTES);
}

export function signToken(impersonationId, expiresAtMs) {
  const payload = `${impersonationId}.${expiresAtMs}`;
  const sig = createHmac("sha256", impKey()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(tok) {
  if (typeof tok !== "string" || tok.length > 256) return null;
  const parts = tok.split(".");
  if (parts.length !== 3) return null;
  const [id, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = createHmac("sha256", impKey()).update(`${id}.${exp}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  try { if (!timingSafeEqual(a, b)) return null; } catch { return null; }
  return { id, expiresAt: exp };
}

export function newSessionToken() {
  return randomBytes(48).toString("base64url");
}
