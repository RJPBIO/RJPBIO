/* ═══════════════════════════════════════════════════════════════
   CSRF — double-submit cookie pattern (RFC 6749 §10.12 aligned).
   Emit token on GET via cookie + header echo; verify on mutating
   requests. Stateless; HMAC-signed with AUTH_SECRET.
   ═══════════════════════════════════════════════════════════════ */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE = "bio-csrf";
const HEADER = "x-csrf-token";
const TTL_MS = 8 * 3600_000;

function sign(value) {
  const secret = process.env.AUTH_SECRET || "dev-only-secret";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function issueToken() {
  const nonce = randomBytes(16).toString("base64url");
  const exp = Date.now() + TTL_MS;
  const payload = `${nonce}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string") return false;
  const [nonce, expStr, sig] = token.split(".");
  if (!nonce || !expStr || !sig) return false;
  if (Date.now() > Number(expStr)) return false;
  const expected = sign(`${nonce}.${expStr}`);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function requireCsrf(request) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return null;
  // Bearer API keys are exempt (server-to-server)
  if (request.headers.get("authorization")?.startsWith("Bearer ")) return null;
  const headerTok = request.headers.get(HEADER);
  const cookieTok = request.cookies?.get?.(COOKIE)?.value || parseCookie(request.headers.get("cookie"))[COOKIE];
  if (!headerTok || !cookieTok || headerTok !== cookieTok || !verifyToken(headerTok)) {
    return new Response("CSRF validation failed", { status: 403 });
  }
  return null;
}

function parseCookie(raw) {
  if (!raw) return {};
  // Split solo en el primer '=' — los valores base64 terminan en '=' de padding
  // y partirían mal si hacemos split sin límite.
  const out = {};
  for (const p of raw.split(";")) {
    const s = p.trim();
    const i = s.indexOf("=");
    if (i <= 0) continue;
    try {
      out[decodeURIComponent(s.slice(0, i))] = decodeURIComponent(s.slice(i + 1));
    } catch {
      out[s.slice(0, i)] = s.slice(i + 1);
    }
  }
  return out;
}

export const CSRF = { COOKIE, HEADER };
