/* ═══════════════════════════════════════════════════════════════
   Maintenance windows — pure helpers para /status + admin scheduling.
   ═══════════════════════════════════════════════════════════════
   Distinto de incidents:
   - Programado con scheduledStart/End conocidos
   - No tiene severity (no es un fail)
   - Notify cadence proactiva: T-24h pre-aviso, T-0 inicio, T+done

   Status flow:
     scheduled → in_progress → completed
                            └→ cancelled (terminal)

   El tracking de actualStart/End permite mostrar "duración real" vs
   "estimada" — útil para post-mortem + transparency.
   ═══════════════════════════════════════════════════════════════ */

import { INCIDENT_COMPONENTS } from "./incidents";

export const MAINTENANCE_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"];

const STATUS_TRANSITIONS = {
  scheduled:    ["in_progress", "cancelled", "completed"], // completed sin in_progress = "no-op maintenance"
  in_progress:  ["completed", "cancelled"],
  completed:    [],
  cancelled:    [],
};

export const TITLE_MAX = 120;
export const BODY_MAX = 2_000;
// Anti-spam: solo se programan ventanas con T-start a futuro y duración razonable.
export const MIN_DURATION_MS = 60_000;          // 1 min
export const MAX_DURATION_MS = 30 * 86400_000;  // 30 días (cap defensivo)

export function isValidStatus(s) {
  return typeof s === "string" && MAINTENANCE_STATUSES.includes(s);
}

export function canTransitionStatus(from, to) {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  return (STATUS_TRANSITIONS[from] || []).includes(to);
}

/**
 * Valida input de creación.
 * @param {object} input
 * @param {Date} [now] reference para "scheduledStart > now"
 */
export function validateMaintenance(input, now = new Date()) {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  const errors = [];
  const out = {};

  if (typeof input.title !== "string" || !input.title.trim()) {
    errors.push({ field: "title", error: "required" });
  } else if (input.title.length > TITLE_MAX) {
    errors.push({ field: "title", error: "too_long" });
  } else {
    out.title = input.title.trim();
  }

  if (input.body !== undefined && input.body !== null && input.body !== "") {
    if (typeof input.body !== "string") errors.push({ field: "body", error: "not_string" });
    else if (input.body.length > BODY_MAX) errors.push({ field: "body", error: "too_long" });
    else out.body = input.body.trim();
  }

  // scheduledStart required y futuro
  const start = input.scheduledStart ? new Date(input.scheduledStart) : null;
  if (!start || Number.isNaN(start.getTime())) {
    errors.push({ field: "scheduledStart", error: "invalid_date" });
  } else if (start.getTime() <= now.getTime()) {
    errors.push({ field: "scheduledStart", error: "must_be_future" });
  } else {
    out.scheduledStart = start;
  }

  // scheduledEnd required, > start, dentro de cap
  const end = input.scheduledEnd ? new Date(input.scheduledEnd) : null;
  if (!end || Number.isNaN(end.getTime())) {
    errors.push({ field: "scheduledEnd", error: "invalid_date" });
  } else if (start && end.getTime() <= start.getTime()) {
    errors.push({ field: "scheduledEnd", error: "must_be_after_start" });
  } else if (start) {
    const dur = end.getTime() - start.getTime();
    if (dur < MIN_DURATION_MS) errors.push({ field: "scheduledEnd", error: "too_short" });
    else if (dur > MAX_DURATION_MS) errors.push({ field: "scheduledEnd", error: "too_long" });
    else out.scheduledEnd = end;
  }

  if (input.components !== undefined) {
    if (!Array.isArray(input.components)) {
      errors.push({ field: "components", error: "not_array" });
    } else {
      const cleaned = input.components.filter((c) =>
        typeof c === "string" && INCIDENT_COMPONENTS.includes(c)
      );
      out.components = Array.from(new Set(cleaned));
    }
  } else {
    out.components = [];
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

/**
 * ¿La ventana está programada para el futuro (no ha empezado)?
 */
export function isUpcoming(w, now = new Date()) {
  if (!w || w.status !== "scheduled") return false;
  const start = w.scheduledStart ? new Date(w.scheduledStart) : null;
  if (!start || Number.isNaN(start.getTime())) return false;
  return start.getTime() > now.getTime();
}

/**
 * ¿En curso? (status in_progress, o scheduled pero ya pasó startTime).
 */
export function isInProgress(w, now = new Date()) {
  if (!w) return false;
  if (w.status === "in_progress") return true;
  if (w.status === "scheduled") {
    const start = w.scheduledStart ? new Date(w.scheduledStart).getTime() : null;
    const end = w.scheduledEnd ? new Date(w.scheduledEnd).getTime() : null;
    if (start && start <= now.getTime() && end && end > now.getTime()) return true;
  }
  return false;
}

/**
 * ¿Terminó (completed/cancelled, o scheduled pero ya pasó endTime)?
 */
export function isFinished(w, now = new Date()) {
  if (!w) return false;
  if (w.status === "completed" || w.status === "cancelled") return true;
  const end = w.scheduledEnd ? new Date(w.scheduledEnd).getTime() : null;
  return !!(end && end <= now.getTime());
}

/**
 * Decide qué notificación enviar (si alguna). Pure — el caller persiste
 * "notified" flags en DB para no duplicar (cron lo hace al ver las que
 * no han sido notified al instante apropiado).
 *
 * @returns {"T24"|"T0"|"complete"|null}
 */
export function nextNotificationKind(w, now = new Date()) {
  if (!w) return null;
  // Status terminales chequeados primero (independiente de fechas) — para
  // que admin pueda marcar completed sin scheduledStart histórico y aún
  // emitir el complete-notify.
  if (w.status === "completed" && !w.notifiedComplete) return "complete";
  if (w.status === "cancelled") return null;
  const start = w.scheduledStart ? new Date(w.scheduledStart).getTime() : null;
  const end = w.scheduledEnd ? new Date(w.scheduledEnd).getTime() : null;
  if (!start) return null;
  const tNow = now.getTime();
  // T-0 (just started)
  if (w.status === "in_progress" && !w.notifiedT0) return "T0";
  if (w.status === "scheduled" && start <= tNow && (!end || tNow < end) && !w.notifiedT0) return "T0";
  // T-24h (24h pre-aviso)
  if (w.status === "scheduled" && tNow >= start - 86400_000 && tNow < start && !w.notifiedT24) return "T24";
  return null;
}

/**
 * Formato de duración estimada en formato humano.
 */
export function formatDuration(start, end, locale = "es") {
  if (!start || !end) return "";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "";
  const min = Math.round(ms / 60_000);
  if (min < 60) return locale === "en" ? `${min} min` : `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * UI tone para badge según estado real (calculado, no solo status field).
 */
export function statusTone(w, now = new Date()) {
  if (!w) return "neutral";
  if (w.status === "cancelled") return "soft";
  if (w.status === "completed") return "success";
  if (isInProgress(w, now)) return "warn"; // amarillo: maintenance happening
  if (isUpcoming(w, now)) return "soft";
  return "neutral";
}

export function statusLabel(status, locale = "es") {
  const map = {
    es: {
      scheduled: "Programado",
      in_progress: "En curso",
      completed: "Completado",
      cancelled: "Cancelado",
    },
    en: {
      scheduled: "Scheduled",
      in_progress: "In progress",
      completed: "Completed",
      cancelled: "Cancelled",
    },
  };
  return (map[locale] || map.es)[status] || status;
}

/**
 * Filtra upcoming + in-progress (los que importan al usuario), ordenados
 * por scheduledStart asc.
 */
export function activeMaintenances(rows, now = new Date()) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((w) => isUpcoming(w, now) || isInProgress(w, now))
    .sort((a, b) =>
      new Date(a.scheduledStart || 0).getTime() - new Date(b.scheduledStart || 0).getTime()
    );
}

/**
 * Recientemente completadas (últimos 14 días).
 */
export function recentCompletedMaintenances(rows, { days = 14, now = new Date() } = {}) {
  if (!Array.isArray(rows)) return [];
  const cutoff = now.getTime() - days * 86400_000;
  return rows
    .filter((w) => (w.status === "completed" || w.status === "cancelled") &&
      ((w.actualEnd && new Date(w.actualEnd).getTime() >= cutoff) ||
       (w.scheduledEnd && new Date(w.scheduledEnd).getTime() >= cutoff)))
    .sort((a, b) => {
      const ae = new Date(a.actualEnd || a.scheduledEnd || 0).getTime();
      const be = new Date(b.actualEnd || b.scheduledEnd || 0).getTime();
      return be - ae;
    });
}
