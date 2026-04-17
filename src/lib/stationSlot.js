/* ═══════════════════════════════════════════════════════════════
   Tap-to-Ignite — lógica pura de slot temporal
   Sin dependencias de server/DOM; testable en aislamiento.
   ═══════════════════════════════════════════════════════════════ */

export const SLOTS = Object.freeze({ MORNING: "MORNING", EVENING: "EVENING", ADHOC: "ADHOC" });
export const POLICIES = Object.freeze({
  ANY: "ANY",
  ENTRY_EXIT: "ENTRY_EXIT",
  MORNING_ONLY: "MORNING_ONLY",
  EVENING_ONLY: "EVENING_ONLY",
});

// Ventanas por defecto en hora local del usuario.
// Cambiables por org en el futuro (policy.customHours).
export const DEFAULT_WINDOWS = Object.freeze({
  morning: [5, 11],   // [05:00, 11:00)
  evening: [16, 22],  // [16:00, 22:00)
});

/**
 * Hora local en la zona horaria dada. Usa Intl para evitar drift por DST.
 * Devuelve un entero 0..23.
 */
export function hourIn(date, timezone) {
  if (!(date instanceof Date)) date = new Date(date);
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "numeric", hour12: false, timeZone: timezone || "UTC",
    });
    const parts = fmt.formatToParts(date);
    const h = parts.find((p) => p.type === "hour");
    return h ? (parseInt(h.value, 10) % 24) : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
}

/** Detecta el slot que corresponde al tap, según la hora local. */
export function detectSlot(date = new Date(), timezone = "America/Mexico_City", windows = DEFAULT_WINDOWS) {
  const h = hourIn(date, timezone);
  const [mStart, mEnd] = windows.morning;
  const [eStart, eEnd] = windows.evening;
  if (h >= mStart && h < mEnd) return SLOTS.MORNING;
  if (h >= eStart && h < eEnd) return SLOTS.EVENING;
  return SLOTS.ADHOC;
}

/** ¿La política de la estación acepta este slot? */
export function slotAllowed(policy, slot) {
  if (!policy || policy === POLICIES.ANY) return true;
  if (policy === POLICIES.ENTRY_EXIT) return slot === SLOTS.MORNING || slot === SLOTS.EVENING;
  if (policy === POLICIES.MORNING_ONLY) return slot === SLOTS.MORNING;
  if (policy === POLICIES.EVENING_ONLY) return slot === SLOTS.EVENING;
  return false;
}

/**
 * Cumplimiento del día: verifica si el usuario ya completó los slots obligatorios.
 * @param {Array<{slot: string, ts: Date|string}>} todaysTaps
 * @returns {{morning: boolean, evening: boolean, minimumMet: boolean, count: number}}
 */
export function dailyCompliance(todaysTaps = []) {
  const has = { morning: false, evening: false, count: todaysTaps.length };
  for (const t of todaysTaps) {
    if (t.slot === SLOTS.MORNING) has.morning = true;
    else if (t.slot === SLOTS.EVENING) has.evening = true;
  }
  return { ...has, minimumMet: has.morning && has.evening };
}

/**
 * Protocolo recomendado por slot — el motor neural puede sobrescribir,
 * esto es el default cuando no hay señal personalizada.
 */
export function protocolForSlot(slot) {
  if (slot === SLOTS.MORNING) return { id: "ignite-478", minutes: 3, label: "Ignición" };
  if (slot === SLOTS.EVENING) return { id: "downshift-extended-exhale", minutes: 4, label: "Descarga" };
  return { id: "physiological-sigh", minutes: 2, label: "Reset" };
}
