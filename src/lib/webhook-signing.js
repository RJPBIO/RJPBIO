/* ═══════════════════════════════════════════════════════════════
   Webhook signing — Standard Webhooks v1 compatible.
   ═══════════════════════════════════════════════════════════════
   Pure functions extraídas de server/webhooks.js para testing.
   El server wrapper aplica `"server-only"` y orquesta delivery.

   Signing: HMAC-SHA256 sobre `${id}.${timestamp}.${body}`, output
   prefijo "v1," + base64. Compatible con Standard Webhooks (Svix)
   para que cualquier consumer del ecosystem pueda verificar.

   Verification: timing-safe constant-time compare. Soporta múltiples
   firmas en el header (rotación de secrets). Maneja header ausente
   o malformado retornando false en lugar de lanzar.
   ═══════════════════════════════════════════════════════════════ */

import { createHmac, timingSafeEqual as _timingSafeEqual } from "node:crypto";

/**
 * Firma el payload según Standard Webhooks v1.
 * @param {string} secret — base64-encoded HMAC key
 * @param {string} body — JSON string del payload
 * @param {number|string} timestamp — unix seconds
 * @param {string} id — message id único (msg_xxx)
 * @returns {string} signature en formato "v1,base64..."
 */
export function sign(secret, body, timestamp, id) {
  const h = createHmac("sha256", Buffer.from(secret, "base64"));
  h.update(`${id}.${timestamp}.${body}`);
  return `v1,${h.digest("base64")}`;
}

/**
 * Constant-time string comparison defensa contra timing attacks.
 * Pads strings al max length para que el early-return por length
 * NO filtre información sobre el valor esperado.
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  const len = Math.max(ab.length, bb.length);
  if (len === 0) return ab.length === bb.length; // both empty
  const pa = Buffer.alloc(len);
  ab.copy(pa);
  const pb = Buffer.alloc(len);
  bb.copy(pb);
  // node:crypto.timingSafeEqual con buffers padded al max length —
  // longitud iguales requeridas, pero el contenido extra es 0x00.
  // Final check de length asegura que solo strings idénticos pasen.
  let eq;
  try {
    eq = _timingSafeEqual(pa, pb);
  } catch {
    return false;
  }
  return eq && ab.length === bb.length;
}

/**
 * Verifica una firma entrante contra el secret y el payload reconstruido.
 * Soporta múltiples firmas en el header (separadas por espacio) para
 * rotación de secrets sin downtime.
 *
 * @param {object} args
 * @param {string} args.secret — base64 HMAC key
 * @param {string} args.body — body raw
 * @param {number|string} args.timestamp — unix seconds (header webhook-timestamp)
 * @param {string} args.id — message id (header webhook-id)
 * @param {string} args.signatureHeader — valor del header webhook-signature
 *                  Puede contener múltiples firmas separadas por espacio
 *                  para soporte de rotación.
 * @returns {boolean} true si AT LEAST UNA firma matchea
 */
export function verifyIncomingSignature({ secret, body, timestamp, id, signatureHeader }) {
  if (!secret || !body || !id || !signatureHeader) return false;
  const expected = sign(secret, body, timestamp, id);
  const provided = String(signatureHeader).split(" ").filter(Boolean);
  if (!provided.length) return false;
  return provided.some((p) => timingSafeEqual(p, expected));
}
