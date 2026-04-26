/* ═══════════════════════════════════════════════════════════════
   Session tracking — pure helpers para active sessions UI.
   ═══════════════════════════════════════════════════════════════
   Heurísticas ligeras de UA parsing (no full ua-parser-js dep).
   Detecta browser + OS + device class para que el usuario reconozca
   visualmente sus sesiones ("Chrome on Mac · 1 hora atrás").

   NO es identificación forense — sólo UX. El UA es spoofeable;
   nunca usar como auth signal.
   ═══════════════════════════════════════════════════════════════ */

export const SESSION_LABEL_MAX = 80;
export const SESSION_DEFAULT_TTL_HOURS = 8;
// Cache window para lazy validation en jwt callback. Muy bajo = DB hammered;
// muy alto = revoke con lag. 60s es el sweet spot enterprise.
export const SESSION_VALIDATION_INTERVAL_MS = 60_000;

/**
 * Heurística minimal de browser detection. Orden importa — Edge antes
 * de Chrome porque Edge UA contiene "Chrome".
 */
export function detectBrowser(ua) {
  if (typeof ua !== "string" || !ua) return "Unknown";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Firefox\//i.test(ua)) return "Firefox";
  // Safari UA contiene "Safari" pero también "Chrome" no — distinguimos.
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Chromium/i.test(ua)) return "Chromium";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Unknown";
}

/**
 * OS detection. iPad-on-iOS-13+ envía macOS UA, así que checamos token
 * "Macintosh" + Touch detection no posible aquí — buena suficiencia.
 */
export function detectOS(ua) {
  if (typeof ua !== "string" || !ua) return "Unknown";
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Android/i.test(ua)) return "Android";
  // iOS antes que macOS — iPhone/iPad UA contiene "Mac OS X" en algunos
  // casos pero "iPhone" o "iPad" debe ganar.
  if (/iPhone/i.test(ua)) return "iOS";
  if (/iPad/i.test(ua)) return "iPadOS";
  if (/Mac OS X/i.test(ua) || /Macintosh/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  return "Unknown";
}

export function detectDeviceClass(ua) {
  if (typeof ua !== "string" || !ua) return "desktop";
  // iPad antes que Mobile — iPad UA contiene "Mobile" como token quirk de iOS.
  if (/iPad/i.test(ua) || /Tablet/i.test(ua)) return "tablet";
  if (/Mobile/i.test(ua) || /iPhone/i.test(ua) || /Android.*Mobile/i.test(ua)) return "mobile";
  return "desktop";
}

/**
 * Etiqueta legible para mostrar en UI. Trunca a SESSION_LABEL_MAX.
 * Ejemplo: "Chrome · macOS · 8.8.8.8"
 */
export function formatSessionLabel({ userAgent, ip } = {}) {
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);
  const parts = [];
  if (browser !== "Unknown") parts.push(browser);
  if (os !== "Unknown") parts.push(os);
  if (ip) parts.push(ip);
  const label = parts.length ? parts.join(" · ") : "Sesión";
  return label.length > SESSION_LABEL_MAX
    ? label.slice(0, SESSION_LABEL_MAX - 1) + "…"
    : label;
}

/**
 * Genera un JTI (JWT ID) — random base64url 16 bytes (128 bits).
 * Defensive: usa crypto.randomUUID si está disponible, fallback a
 * Math.random sólo en entornos sin crypto (NUNCA en producción).
 */
export function generateJti() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().replace(/-/g, "");
  }
  // Fallback non-crypto — sólo para tests sin globalThis.crypto.
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Calcula expiresAt para una sesión nueva.
 * @param {number} hours TTL en horas (default SESSION_DEFAULT_TTL_HOURS)
 * @param {Date} now      Reference time (testing)
 */
export function calculateExpiresAt(hours = SESSION_DEFAULT_TTL_HOURS, now = new Date()) {
  const safe = Number.isFinite(hours) && hours > 0 ? hours : SESSION_DEFAULT_TTL_HOURS;
  return new Date(now.getTime() + safe * 3600_000);
}

/**
 * ¿La sesión está válida? Pure check — chequea revokedAt + expiresAt.
 */
export function isSessionActive(sess, now = new Date()) {
  if (!sess) return false;
  if (sess.revokedAt) return false;
  if (sess.expiresAt && new Date(sess.expiresAt).getTime() <= now.getTime()) return false;
  return true;
}

/**
 * Filtra a sesiones activas + ordena por lastSeenAt desc.
 */
export function activeSessions(rows, now = new Date()) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((s) => isSessionActive(s, now))
    .sort((a, b) => new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime());
}

/**
 * Marca una sesión como "current" si su jti coincide.
 */
export function markCurrent(rows, currentJti) {
  if (!Array.isArray(rows)) return [];
  return rows.map((s) => ({ ...s, current: !!currentJti && s.jti === currentJti }));
}

/**
 * ¿El JWT necesita revalidación contra DB? Pure check usado en jwt callback.
 * - Si token sin jti/sub → no podemos validar, no revalidar (siginin nuevo).
 * - Si último validate hace >SESSION_VALIDATION_INTERVAL_MS → sí.
 *
 * Trigger="update" externamente: caller decide forzar bypass de cache.
 */
export function shouldRevalidate(token, now = Date.now()) {
  if (!token || typeof token !== "object") return false;
  if (!token.jti || !token.sub) return false;
  const last = typeof token.lastValidatedAt === "number" ? token.lastValidatedAt : 0;
  return (now - last) > SESSION_VALIDATION_INTERVAL_MS;
}
