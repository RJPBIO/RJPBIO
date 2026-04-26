/* ═══════════════════════════════════════════════════════════════
   API key quotas + lifecycle — pure helpers.
   ═══════════════════════════════════════════════════════════════
   Define quotas por plan (revenue lever para upsell) y helpers para:
   - Detectar expiry / revoke
   - Resumir status para UI con tone
   - Formatear last-used (relative time + IP)
   - Validar expiry input al crear keys

   La aplicación real del rate-limit vive en src/server/api-keys.js
   (Redis token bucket). Aquí sólo política/UI.
   ═══════════════════════════════════════════════════════════════ */

export const PLANS = ["FREE", "PRO", "STARTER", "GROWTH", "ENTERPRISE"];

/**
 * Quotas por plan. perMinute = burst cap (rate-limit window 60s).
 * perDay = total cap (otra window). Inspirado en patrones de Stripe API
 * (read 100 r/s lectura, write 100 r/s escritura) ajustado a tier B2B.
 *
 * Cambio aquí impacta enforcement; hacer rollout con feature flag.
 */
export const QUOTAS_BY_PLAN = Object.freeze({
  FREE:       { perMinute: 60,    perDay: 5_000 },
  PRO:        { perMinute: 120,   perDay: 20_000 },
  STARTER:    { perMinute: 300,   perDay: 50_000 },
  GROWTH:     { perMinute: 600,   perDay: 200_000 },
  ENTERPRISE: { perMinute: 2_000, perDay: 1_000_000 },
});

export const API_KEY_EXPIRY_MIN_DAYS = 1;
export const API_KEY_EXPIRY_MAX_DAYS = 3_650; // ~10 years (NIST cap razonable)

/**
 * Devuelve quotas para un plan — fallback FREE si plan unknown.
 */
export function getRateLimitForPlan(plan) {
  return QUOTAS_BY_PLAN[plan] || QUOTAS_BY_PLAN.FREE;
}

/**
 * ¿La key tiene fecha de expiry vencida?
 */
export function isKeyExpired(key, now = new Date()) {
  if (!key) return false;
  if (!key.expiresAt) return false;
  return new Date(key.expiresAt).getTime() <= now.getTime();
}

/**
 * Active = no revocada y no expirada.
 */
export function isKeyActive(key, now = new Date()) {
  if (!key) return false;
  if (key.revokedAt) return false;
  return !isKeyExpired(key, now);
}

/**
 * Status para UI con tone (matching Badge variants existentes).
 */
export function summarizeKey(key, now = new Date()) {
  if (!key) return { status: "unknown", label: "—", tone: "neutral" };
  if (key.revokedAt) {
    return {
      status: "revoked",
      label: "Revocada",
      tone: "danger",
      detail: `Revocada el ${new Date(key.revokedAt).toLocaleDateString()}`,
    };
  }
  if (isKeyExpired(key, now)) {
    return {
      status: "expired",
      label: "Expirada",
      tone: "warn",
      detail: `Expiró el ${new Date(key.expiresAt).toLocaleDateString()}`,
    };
  }
  if (key.expiresAt) {
    const days = Math.ceil(
      (new Date(key.expiresAt).getTime() - now.getTime()) / 86400_000
    );
    return {
      status: "active",
      label: "Activa",
      tone: "success",
      detail: `Expira en ${days} día${days !== 1 ? "s" : ""}`,
      daysUntilExpiry: days,
    };
  }
  return {
    status: "active",
    label: "Activa",
    tone: "success",
    detail: "Sin fecha de expiración",
  };
}

/**
 * UI string para "último uso" — combina timestamp relativo + IP si existe.
 */
export function formatLastUsed(lastUsedAt, lastUsedIp, now = new Date()) {
  if (!lastUsedAt) return { text: "Nunca usada", tone: "neutral" };
  const ms = now.getTime() - new Date(lastUsedAt).getTime();
  const m = Math.floor(ms / 60_000);
  let when;
  if (m < 1) when = "ahora";
  else if (m < 60) when = `hace ${m} min`;
  else if (m < 1440) when = `hace ${Math.floor(m / 60)} h`;
  else when = `hace ${Math.floor(m / 1440)} d`;
  const ipPart = lastUsedIp ? ` · ${lastUsedIp}` : "";
  return { text: when + ipPart, tone: "default" };
}

/**
 * Valida días de expiry para input UI (al crear key).
 */
export function validateExpiryDays(n) {
  if (n === null || n === undefined || n === "") {
    return { ok: true, value: null }; // null = sin expiry (legítimo)
  }
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isInteger(num)) return { ok: false, error: "not_integer" };
  if (num < API_KEY_EXPIRY_MIN_DAYS) return { ok: false, error: "too_small" };
  if (num > API_KEY_EXPIRY_MAX_DAYS) return { ok: false, error: "too_large" };
  return { ok: true, value: num };
}

/**
 * Calcula expiresAt desde now + days.
 */
export function computeExpiresAt(days, now = new Date()) {
  if (days === null || days === undefined) return null;
  if (typeof days !== "number" || !Number.isFinite(days) || days <= 0) return null;
  return new Date(now.getTime() + days * 86400_000);
}

/**
 * Pretty print de quota — para mostrar en UI sin exponer enforcement details.
 */
export function describeQuota(plan) {
  const q = getRateLimitForPlan(plan);
  return {
    plan,
    perMinute: q.perMinute,
    perDay: q.perDay,
    text: `${q.perMinute.toLocaleString()} req/min · ${q.perDay.toLocaleString()} req/día`,
  };
}
