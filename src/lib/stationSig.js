/* ═══════════════════════════════════════════════════════════════
   Tap-to-Ignite — firma HMAC de URLs de estación.
   Módulo puro: sin server-only ni DB. Testeable aislado.
   ═══════════════════════════════════════════════════════════════ */

import crypto from "node:crypto";

// 10 min: 180s era demasiado agresivo para clocks desincronizados (móviles
// con ntp drift, modo avión reciente) y para la ventana entre que el usuario
// obtiene la URL y la abre. La réplica sigue bloqueada por el UNIQUE(stationId,nonce).
export const SIG_TTL_SEC = 600;
export const SIG_LEN = 32;

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function hmacShort(key, msg) {
  return b64url(crypto.createHmac("sha256", key).update(msg).digest()).slice(0, SIG_LEN);
}

function timingSafeEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function generateSigningKey() {
  return b64url(crypto.randomBytes(32));
}

export function buildTapUrl({ origin, stationId, signingKey, ts = Math.floor(Date.now() / 1000) }) {
  if (!stationId || !signingKey) throw new Error("stationId and signingKey required");
  const n = b64url(crypto.randomBytes(9));
  const sig = hmacShort(signingKey, `${stationId}|${ts}|${n}`);
  const base = (origin || "").replace(/\/+$/, "");
  const qs = new URLSearchParams({ s: stationId, t: String(ts), n, sig });
  return `${base}/q?${qs.toString()}`;
}

export function verifyTapParams({ stationId, t, n, sig, signingKey, nowSec = Math.floor(Date.now() / 1000) }) {
  if (!stationId || !t || !n || !sig || !signingKey) return { ok: false, reason: "missing_params" };
  const ts = parseInt(t, 10);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_ts" };
  if (Math.abs(nowSec - ts) > SIG_TTL_SEC) return { ok: false, reason: "expired" };
  const expected = hmacShort(signingKey, `${stationId}|${ts}|${n}`);
  if (!timingSafeEq(expected, sig)) return { ok: false, reason: "bad_sig" };
  return { ok: true, ts, nonce: n };
}
