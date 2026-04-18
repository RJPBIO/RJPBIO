/* ═══════════════════════════════════════════════════════════════
   CSRF — double-submit cookie pattern (RFC 6749 §10.12 aligned).
   Token aleatorio opaco (sin firma): la seguridad del patrón viene
   del browser same-origin policy — un atacante no puede leer la
   cookie víctima, por lo tanto no puede replicar el header echo.
   Edge-compatible: solo Web Crypto API (getRandomValues). Sin
   node:crypto para que el middleware Edge pueda importarlo.
   ═══════════════════════════════════════════════════════════════ */

const COOKIE = "bio-csrf";
const HEADER = "x-csrf-token";
const TOKEN_BYTES = 32;

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function issueToken() {
  const buf = new Uint8Array(TOKEN_BYTES);
  globalThis.crypto.getRandomValues(buf);
  return b64url(buf);
}

export function verifyToken(token) {
  // Un token opaco solo se valida por forma: presente, longitud esperada,
  // charset base64url. La frescura la da el maxAge del cookie.
  if (!token || typeof token !== "string") return false;
  if (token.length < 40 || token.length > 64) return false;
  return /^[A-Za-z0-9_-]+$/.test(token);
}

function constantTimeEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function requireCsrf(request) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return null;
  // Bearer API keys exento (server-to-server).
  if (request.headers.get("authorization")?.startsWith("Bearer ")) return null;
  const headerTok = request.headers.get(HEADER);
  const cookieTok =
    request.cookies?.get?.(COOKIE)?.value ||
    parseCookie(request.headers.get("cookie"))[COOKIE];
  if (!headerTok || !cookieTok || !verifyToken(headerTok) || !constantTimeEq(headerTok, cookieTok)) {
    return new Response("CSRF validation failed", { status: 403 });
  }
  return null;
}

function parseCookie(raw) {
  if (!raw) return {};
  // Split solo en el primer '=' — los valores base64 pueden terminar en '='
  // de padding, y partirían mal si hacemos split sin límite.
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
