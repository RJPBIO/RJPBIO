/* ═══════════════════════════════════════════════════════════════
   Tap-to-Ignite — URLs de estación.

   Diseño:
   - QR/NFC impreso: URL estable `/q?s=<stationId>`. El servidor
     firma internamente en cada scan (nonce fresco). Único camino
     válido para tags físicos.
   - URL firmada efímera (email, shortlink): `buildSignedTapUrl`
     + `verifyTapParams`. Útil si alguna vez se comparte por canal
     digital con TTL controlado.

   La cripto pura vive aquí (sin server-only ni DB) para ser testeable.
   ═══════════════════════════════════════════════════════════════ */

import crypto from "node:crypto";

// TTL generoso para URLs firmadas efímeras (no aplica al QR estático).
// Margen por drift de NTP en móvil y por el tiempo entre emisión y apertura.
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

/**
 * URL estable para imprimir en QR o grabar en NFC.
 * No lleva timestamp ni firma: el servidor firma en cada scan con
 * nonce fresco. El signingKey JAMÁS viaja al cliente por este camino.
 */
export function buildTapUrl({ origin, stationId }) {
  if (!stationId) throw new Error("stationId required");
  const base = (origin || "").replace(/\/+$/, "");
  const qs = new URLSearchParams({ s: stationId });
  return `${base}/q?${qs.toString()}`;
}

/**
 * URL firmada efímera — solo para canales digitales (email, sms, shortlink).
 * TTL corto + nonce único. NO usar para tags físicos.
 */
export function buildSignedTapUrl({ origin, stationId, signingKey, ts = Math.floor(Date.now() / 1000) }) {
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
