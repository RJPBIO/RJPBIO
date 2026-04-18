/* ═══════════════════════════════════════════════════════════════
   Tap-to-Ignite — orquestación server-side de taps.
   La criptografía pura vive en src/lib/stationSig.js (testeable).
   Aquí: consulta BD, aplica política de slot, registra auditoría.

   Dos modos de entrada:
   - QR estático: `/q?s=<id>`. El servidor genera nonce fresco por scan.
     Es el único camino válido para tags físicos.
   - URL firmada efímera: `/q?s=<id>&t=&n=&sig=`. Email/shortlink con TTL.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { detectSlot, slotAllowed, SLOTS } from "@/lib/stationSlot";
import { buildTapUrl, buildSignedTapUrl, verifyTapParams, generateSigningKey } from "@/lib/stationSig";

const TAP_COOLDOWN_MS = 90_000; // mismo identificador + estación + slot

export { buildTapUrl, buildSignedTapUrl, generateSigningKey };

/**
 * Flujo completo server-side.
 * - Si viene `sig`, se exige también t/n y se verifica HMAC (flujo firmado).
 * - Si no viene `sig`, se asume QR estático: el servidor genera un nonce
 *   fresco internamente para la fila de auditoría (cada scan es único).
 * En ambos casos aplican política de slot y cooldown por usuario.
 */
export async function processTap({ stationId, t, n, sig, userId, anonId, timezone, ip, ua }) {
  if (!stationId) return { ok: false, reason: "missing_params" };
  const orm = await db();
  const station = await orm.station.findUnique({ where: { id: stationId } });
  if (!station || !station.active) return { ok: false, reason: "not_found" };

  let effectiveNonce;
  if (sig) {
    // Modo firmado (URL efímera): verificamos HMAC y dedupe del nonce recibido.
    const v = verifyTapParams({ stationId, t, n, sig, signingKey: station.signingKey });
    if (!v.ok) {
      await logTap(orm, station, { userId, anonId, slot: SLOTS.ADHOC, status: `rejected:${v.reason}`, nonce: n, ip, ua });
      return { ok: false, reason: v.reason, station };
    }
    const existing = await orm.stationTap.findFirst({ where: { stationId, nonce: n } });
    if (existing) {
      await logTap(orm, station, { userId, anonId, slot: SLOTS.ADHOC, status: "rejected:replay", nonce: null, ip, ua });
      return { ok: false, reason: "replay", station };
    }
    effectiveNonce = n;
  } else {
    // Modo QR estático: el servidor fabrica el nonce. Es único por request
    // (randomUUID → colisión probabilísticamente descartable) y sirve solo
    // como traza para auditoría y dedupe idempotente por si el browser
    // reintenta la redirección.
    effectiveNonce = crypto.randomUUID().replace(/-/g, "");
  }

  const slot = detectSlot(new Date(), timezone || "America/Mexico_City");
  if (!slotAllowed(station.policy, slot)) {
    await logTap(orm, station, { userId, anonId, slot, status: "rejected:slot", nonce: effectiveNonce, ip, ua });
    return { ok: false, reason: "slot_not_allowed", station, slot };
  }

  const who = userId ? { userId } : anonId ? { anonId } : null;
  if (who) {
    const recent = await orm.stationTap.findFirst({
      where: { stationId, ...who, slot, status: "ok", ts: { gt: new Date(Date.now() - TAP_COOLDOWN_MS) } },
      orderBy: { ts: "desc" },
    });
    if (recent) {
      // nonce:null para no consumir el nonce efectivo (irrelevante: aún no
      // lo insertamos, pero mantiene simetría con el flujo firmado).
      await logTap(orm, station, { userId, anonId, slot, status: "rejected:cooldown", nonce: null, ip, ua });
      return { ok: false, reason: "cooldown", station, slot };
    }
  }

  await logTap(orm, station, { userId, anonId, slot, status: "ok", nonce: effectiveNonce, ip, ua });
  await orm.station.update({ where: { id: station.id }, data: { lastTapAt: new Date() } });
  return { ok: true, station, slot };
}

async function logTap(orm, station, { userId, anonId, slot, status, nonce, ip, ua }) {
  try {
    await orm.stationTap.create({
      data: {
        orgId: station.orgId,
        stationId: station.id,
        userId,
        anonId,
        slot,
        status,
        nonce: nonce || null,
        // Trunca ip/ua para evitar filas desproporcionadas con UA largos (bots, dev tools).
        ip: ip ? String(ip).slice(0, 64) : null,
        ua: ua ? String(ua).slice(0, 256) : null,
      },
    });
  } catch {
    // No bloquear el flujo principal si el log falla (ej. colisión unique = replay).
  }
}

export const __internal = { TAP_COOLDOWN_MS };
