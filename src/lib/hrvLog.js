/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN · HRV/RHR log reliability utilities
   ═══════════════════════════════════════════════════════════════
   Una sola fuente de verdad para "qué entrada es confiable" en
   hrvLog y rhrLog. Todos los consumers (useReadiness, prescriber,
   ReadinessScore, quarterlyReport, insight) DEBEN pasar por aquí.

   Si alguna parte de la app lee `st.hrvLog` o `st.rhrLog` directamente
   y deriva métricas de baseline sin filtrar, el motor neural recibe
   data corrupta y todas las recomendaciones quedan envenenadas.

   Reglas (alineadas con el threshold del SQI):
     — BLE / legacy (sin source): SIEMPRE confiable (compat retro)
     — source="camera" + sqi ≥ 60: confiable
     — source="camera" + sqi < 60 o ausente: rechazada
   ═══════════════════════════════════════════════════════════════ */

const MIN_SQI_FOR_RELIABLE = 60;

/**
 * @param {object} h  entrada del log
 * @returns {boolean}
 */
export function isReliableHrvEntry(h) {
  if (!h || typeof h.lnRmssd !== "number") return false;
  if (h.source === "camera") {
    if (typeof h.sqi !== "number") return false;
    return h.sqi >= MIN_SQI_FOR_RELIABLE;
  }
  return true;
}

/**
 * Variante para rhrLog. Mismas reglas; el campo de quality opcional
 * (source/sqi) lo agrega store.logHRV cuando origina la entrada.
 */
export function isReliableRhrEntry(h) {
  if (!h || typeof h.rhr !== "number") return false;
  if (h.source === "camera") {
    if (typeof h.sqi !== "number") return false;
    return h.sqi >= MIN_SQI_FOR_RELIABLE;
  }
  return true;
}

/**
 * Devuelve solo las entradas hrv confiables, normalizando lnRmssd
 * (acepta alias legacy `lnrmssd`).
 */
export function getReliableHrvEntries(hrvLog) {
  if (!Array.isArray(hrvLog)) return [];
  return hrvLog
    .map((h) => ({ ...h, lnRmssd: h.lnRmssd ?? h.lnrmssd ?? null }))
    .filter(isReliableHrvEntry);
}

/**
 * Devuelve solo las entradas rhr confiables.
 */
export function getReliableRhrEntries(rhrLog) {
  if (!Array.isArray(rhrLog)) return [];
  return rhrLog.filter(isReliableRhrEntry);
}

/**
 * Última lectura HRV CONFIABLE (no necesariamente la más reciente,
 * que podría ser cámara basura). Retorna {lnRmssd, rhr} o null.
 */
export function getCurrentReliableHrv(hrvLog) {
  const reliable = getReliableHrvEntries(hrvLog);
  if (reliable.length === 0) return null;
  const last = reliable[reliable.length - 1];
  return { lnRmssd: last.lnRmssd, rhr: last.rhr ?? null };
}

/**
 * Construye baseline en ventana temporal de N días con solo entradas
 * confiables. Devuelve array de lnRmssd (números).
 */
export function buildReliableHrvBaseline(hrvLog, days = 14) {
  if (!Array.isArray(hrvLog)) return [];
  const cutoff = Date.now() - days * 86400000;
  return getReliableHrvEntries(hrvLog)
    .filter((h) => h.ts >= cutoff)
    .map((h) => h.lnRmssd)
    .filter((v) => Number.isFinite(v));
}
