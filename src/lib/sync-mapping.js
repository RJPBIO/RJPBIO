/* ═══════════════════════════════════════════════════════════════
   Sync mapping — outbox entry payload → Prisma row data
   ═══════════════════════════════════════════════════════════════
   Phase 6B SP3. Extraído de /api/sync/outbox/route.js para que el
   field mapping sea testable en isolation (sin auth, db, csrf).

   Contrato: cada función recibe un `entry` validado por
   sync-validation.validateEntry y un `ctx` con userId + orgId
   resueltos. Retorna el objeto `data` listo para
   `prisma.<table>.upsert({create: data})`.

   Defensa en profundidad: aplicamos coerciones explícitas + caps
   numéricos para que un cliente comprometido no pueda inyectar
   NaN, Infinity, valores fuera de rango fisiológico, ni strings
   demasiado largos en columnas TEXT.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Mapea entry kind:"hrv" → data para HrvMeasurement.create.
 *
 * @param {object} entry  outbox entry validada (id + payload)
 * @param {{userId:string, orgId:string}} ctx
 * @returns {object} data shape para Prisma
 */
export function mapHrvEntry(entry, ctx) {
  const p = entry?.payload || {};
  const measuredAt = typeof p.ts === "number" ? new Date(p.ts) : new Date();
  return {
    id: entry.id,
    userId: ctx.userId,
    orgId: ctx.orgId,
    rmssd: numberOrZero(p.rmssd),
    lnRmssd: numberOrZero(p.lnRmssd),
    sdnn: numberOrNull(p.sdnn),
    pnn50: numberOrNull(p.pnn50),
    // El cliente envía meanHR (legacy camelCase con HR mayúsculas) o
    // meanHr (nuevo). Aceptamos ambos para no romper migration.
    meanHr: numberOrZero(p.meanHR ?? p.meanHr),
    rhr: numberOrNull(p.rhr),
    durationSec: clampInt(p.durationSec, 0, 7200),
    n: clampInt(p.n, 0, 100000),
    source: p.source === "ble" ? "ble" : "camera",
    sqi: typeof p.sqi === "number" ? Math.round(p.sqi) : null,
    sqiBand: typeof p.sqiBand === "string" ? p.sqiBand.slice(0, 32) : null,
    measuredAt,
  };
}

/**
 * Mapea entry kind:"instrument" → data para Instrument.create.
 *
 * @param {object} entry
 * @param {{userId:string, orgId:string}} ctx
 * @returns {object} data shape para Prisma
 */
export function mapInstrumentEntry(entry, ctx) {
  const p = entry?.payload || {};
  const takenAt = typeof p.ts === "number" ? new Date(p.ts) : new Date();
  return {
    id: entry.id,
    userId: ctx.userId,
    orgId: ctx.orgId,
    instrumentId: String(p.instrumentId || "unknown").slice(0, 64),
    score: clampInt(p.score, 0, 1000),
    level: String(p.level || "unknown").slice(0, 32),
    answers: p.answers ?? {},
    takenAt,
  };
}

function numberOrZero(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function numberOrNull(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function clampInt(v, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(lo, Math.min(hi, n | 0));
}
