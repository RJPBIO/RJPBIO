/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Tap / NFC / Deep-Link Resolver
   ═══════════════════════════════════════════════════════════════
   Función pura: transforma URLSearchParams en un resultado que el
   caller aplica al estado (protocolo, nfcCtx, entryDone, error).
   Vive fuera de React para ser testable sin renderizar. */

import { parseDeepLink } from "./deeplink";

const ERROR_MESSAGES = {
  slot_not_allowed: "Fuera de ventana permitida para esta estación.",
  cooldown: "Ya registraste un tap reciente.",
  replay: "Este enlace ya fue usado.",
  expired: "El enlace firmado expiró.",
  not_found: "Estación desconocida o inactiva.",
  unknown: "No se pudo validar el tap.",
};

/**
 * Resuelve un tap / NFC / deep-link.
 *
 * @param {URLSearchParams} params
 * @param {object} opts
 * @param {Array} opts.protocols — catálogo P de protocolos
 * @param {number} opts.hour — hora local (0-23); controla el pool en modo legacy
 * @param {number} [opts.durationMultiplier=1]
 * @param {() => number} [opts.random=Math.random] — inyectable para tests
 * @returns {object} Resultado:
 *   { kind: "error",    reason, message }
 *   { kind: "tap",      context, protocol, seconds }
 *   { kind: "deeplink", context, protocol, seconds }
 *   { kind: null }  — no aplicar nada
 */
export function resolveTapEntry(params, opts) {
  const { protocols, hour, durationMultiplier = 1, random = Math.random } = opts;

  if (params.get("tap") === "error") {
    const reason = params.get("reason") || "unknown";
    return { kind: "error", reason, message: ERROR_MESSAGES[reason] || ERROR_MESSAGES.unknown };
  }

  if (params.get("source") === "tap") {
    const stationId = params.get("station") || "";
    const slot = params.get("slot") || "ADHOC";
    const isExit = slot === "EVENING";
    const type = slot === "MORNING" ? "entrada" : slot === "EVENING" ? "salida" : "tap";
    const pool = pickPool(protocols, { isExit, morning: slot === "MORNING" });
    const pick = pool[Math.floor(random() * pool.length)] || protocols[0];
    return {
      kind: "tap",
      context: { company: null, type, employee: null, station: stationId },
      protocol: pick,
      seconds: Math.round(pick.d * durationMultiplier),
    };
  }

  const link = parseDeepLink(params);
  // Dispara solo si hay evidencia real de un NFC/QR: company, employee, o t
  // explícito. parseDeepLink defaultea type a "entrada", así que checar
  // link.type directamente haría disparar el banner en toda carga normal.
  const hasRealParams = link && (link.company || link.employee || params.get("t"));
  if (hasRealParams) {
    const isExit = link.type === "salida" || link.type === "exit";
    const pool = pickPool(protocols, { isExit, morning: hour < 12 });
    const pick = pool[Math.floor(random() * pool.length)] || protocols[0];
    return {
      kind: "deeplink",
      context: { company: link.company, type: link.type, employee: link.employee },
      protocol: pick,
      seconds: Math.round(pick.d * durationMultiplier),
    };
  }

  return { kind: null };
}

function pickPool(protocols, { isExit, morning }) {
  if (isExit) return protocols.filter((p) => p.int === "calma" || p.int === "reset");
  if (morning) return protocols.filter((p) => p.int === "energia" || p.int === "enfoque");
  return protocols.filter((p) => p.int === "enfoque" || p.int === "reset");
}

export { ERROR_MESSAGES };
