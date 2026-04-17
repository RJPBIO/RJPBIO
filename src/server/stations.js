/* ═══════════════════════════════════════════════════════════════
   Tap-to-Ignite — orquestación server-side de taps.
   La criptografía pura vive en src/lib/stationSig.js (testeable).
   Aquí: consulta BD, aplica política de slot, registra auditoría.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { detectSlot, slotAllowed, SLOTS } from "@/lib/stationSlot";
import { buildTapUrl, verifyTapParams, generateSigningKey } from "@/lib/stationSig";

const TAP_COOLDOWN_MS = 90_000; // mismo identificador + estación + slot

export { buildTapUrl, generateSigningKey };

/**
 * Flujo completo server-side: verifica firma + política de slot + cooldown.
 * @returns {Promise<{ok:boolean, reason?:string, station?:any, slot?:string}>}
 */
export async function processTap({ stationId, t, n, sig, userId, anonId, timezone, ip, ua }) {
  const orm = await db();
  const station = await orm.station.findUnique({ where: { id: stationId } });
  if (!station || !station.active) return { ok: false, reason: "not_found" };

  const v = verifyTapParams({ stationId, t, n, sig, signingKey: station.signingKey });
  if (!v.ok) {
    await logTap(orm, station, { userId, anonId, slot: SLOTS.ADHOC, status: `rejected:${v.reason}`, nonce: n, ip, ua });
    return { ok: false, reason: v.reason, station };
  }

  // Replay guard: el mismo nonce no puede consumirse dos veces para la
  // misma estación. Si la inserción con UNIQUE(stationId, nonce) colisiona,
  // tratamos como replay (URL ya usada desde otro dispositivo).
  const existing = await orm.stationTap.findFirst({ where: { stationId, nonce: n } });
  if (existing) {
    await logTap(orm, station, { userId, anonId, slot: SLOTS.ADHOC, status: "rejected:replay", nonce: null, ip, ua });
    return { ok: false, reason: "replay", station };
  }

  const slot = detectSlot(new Date(), timezone || "America/Mexico_City");
  if (!slotAllowed(station.policy, slot)) {
    await logTap(orm, station, { userId, anonId, slot, status: "rejected:slot", nonce: n, ip, ua });
    return { ok: false, reason: "slot_not_allowed", station, slot };
  }

  const who = userId ? { userId } : anonId ? { anonId } : null;
  if (who) {
    const recent = await orm.stationTap.findFirst({
      where: { stationId, ...who, slot, status: "ok", ts: { gt: new Date(Date.now() - TAP_COOLDOWN_MS) } },
      orderBy: { ts: "desc" },
    });
    if (recent) {
      // nonce:null aquí — el cooldown no consume el nonce (que sigue bloqueado arriba).
      await logTap(orm, station, { userId, anonId, slot, status: "rejected:cooldown", nonce: null, ip, ua });
      return { ok: false, reason: "cooldown", station, slot };
    }
  }

  await logTap(orm, station, { userId, anonId, slot, status: "ok", nonce: n, ip, ua });
  await orm.station.update({ where: { id: station.id }, data: { lastTapAt: new Date() } });
  return { ok: true, station, slot };
}

async function logTap(orm, station, { userId, anonId, slot, status, nonce, ip, ua }) {
  try {
    await orm.stationTap.create({
      data: { orgId: station.orgId, stationId: station.id, userId, anonId, slot, status, nonce: nonce || null, ip, ua },
    });
  } catch {
    // No bloquear el flujo principal si el log falla (ej. colisión unique = replay).
  }
}

export const __internal = { TAP_COOLDOWN_MS };
