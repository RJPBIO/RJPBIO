/* ═══════════════════════════════════════════════════════════════
   Notifications — pure helpers para validación + UI rendering.
   ═══════════════════════════════════════════════════════════════
   Sprint 25: reemplaza el hack audit-log-with-notify-prefix con un
   modelo proper Notification {userId, level, title, body, href, readAt}.

   Pure module — testeable sin DB. Server usa estos validators antes
   de persistir; UI usa summarizeBadge para mostrar count en bell.
   ═══════════════════════════════════════════════════════════════ */

export const NOTIFICATION_LEVELS = ["info", "warn", "error", "success"];

export const TITLE_MAX = 160;
export const BODY_MAX = 400;
export const KIND_MAX = 60;

export function isValidLevel(s) {
  return typeof s === "string" && NOTIFICATION_LEVELS.includes(s);
}

/**
 * Valida input para crear una notification.
 *
 * @param {object} input { userId, orgId?, kind, level, title, body?, href? }
 */
export function validateNotification(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  const errors = [];
  const out = {};

  if (typeof input.userId !== "string" || !input.userId) {
    errors.push({ field: "userId", error: "required" });
  } else {
    out.userId = input.userId;
  }

  if (input.orgId !== undefined && input.orgId !== null) {
    if (typeof input.orgId !== "string") errors.push({ field: "orgId", error: "not_string" });
    else if (input.orgId) out.orgId = input.orgId;
    else out.orgId = null;
  } else {
    out.orgId = null;
  }

  if (typeof input.kind !== "string" || !input.kind.trim()) {
    errors.push({ field: "kind", error: "required" });
  } else if (input.kind.length > KIND_MAX) {
    errors.push({ field: "kind", error: "too_long" });
  } else {
    out.kind = input.kind.trim();
  }

  // Default level=info si missing
  const level = input.level || "info";
  if (!isValidLevel(level)) {
    errors.push({ field: "level", error: "invalid_level" });
  } else {
    out.level = level;
  }

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

  if (input.href !== undefined && input.href !== null && input.href !== "") {
    if (typeof input.href !== "string") {
      errors.push({ field: "href", error: "not_string" });
    } else if (input.href.length > 400) {
      errors.push({ field: "href", error: "too_long" });
    } else if (!input.href.startsWith("/") && !input.href.startsWith("https://")) {
      // Solo paths relativos o https — anti-phishing.
      errors.push({ field: "href", error: "invalid_href" });
    } else {
      out.href = input.href;
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

/**
 * ¿La notification está unread?
 */
export function isUnread(n) {
  if (!n) return false;
  return !n.readAt;
}

/**
 * Cuenta unread + breakdown by level — para badge UI con tone.
 *
 * @param {Array} list
 * @returns { unreadCount, byLevel: {info, warn, error, success}, tone }
 */
export function summarizeBadge(list) {
  const empty = { unreadCount: 0, byLevel: { info: 0, warn: 0, error: 0, success: 0 }, tone: "neutral" };
  if (!Array.isArray(list)) return empty;
  let unreadCount = 0;
  const byLevel = { info: 0, warn: 0, error: 0, success: 0 };
  for (const n of list) {
    if (!n || n.readAt) continue;
    unreadCount++;
    const lvl = isValidLevel(n.level) ? n.level : "info";
    byLevel[lvl] = (byLevel[lvl] || 0) + 1;
  }
  // Tone = peor level con count > 0.
  let tone = "neutral";
  if (byLevel.error > 0) tone = "danger";
  else if (byLevel.warn > 0) tone = "warn";
  else if (byLevel.success > 0) tone = "success";
  else if (byLevel.info > 0) tone = "soft";
  return { unreadCount, byLevel, tone };
}

/**
 * Formato relativo de tiempo. "ahora", "hace 5 min", "hace 2 h", "hace 3 d".
 */
export function formatTimeAgo(at, now = Date.now()) {
  if (!at) return "—";
  const t = at instanceof Date ? at.getTime() : new Date(at).getTime();
  if (Number.isNaN(t)) return "—";
  const diffMs = now - t;
  if (diffMs < 0) return "en futuro";
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  const months = Math.floor(d / 30);
  return `hace ${months} m`;
}

/**
 * Tone hex color para Badge — espejo del statusTone pattern.
 */
export const LEVEL_TONE_VARIANTS = Object.freeze({
  info: "soft",
  warn: "warn",
  error: "danger",
  success: "success",
});

/**
 * UI-friendly label es/en.
 */
export function levelLabel(level, locale = "es") {
  const map = {
    es: { info: "Info", warn: "Aviso", error: "Error", success: "OK" },
    en: { info: "Info", warn: "Warning", error: "Error", success: "Success" },
  };
  return (map[locale] || map.es)[level] || level;
}
