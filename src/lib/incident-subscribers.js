/* ═══════════════════════════════════════════════════════════════
   Incident subscribers — pure helpers para el flow de subscribe/notify.
   ═══════════════════════════════════════════════════════════════
   Customer subscribe en /status. Dos canales:
   - email      → verify magic link + auto-notify en cada incident
   - webhookUrl → POST con incident payload + secret HMAC

   Component filter opcional: si subscriber especifica components=["api"],
   solo recibe incidents que afecten ese componente. Default: all.

   Tokens:
   - verifyToken      → email verification (one-shot, consumido al GET)
   - unsubscribeToken → permanente, one-click unsubscribe sin auth

   Pure module — testable sin DB. Server usa randomBytes para entropy real;
   este module sólo valida formatos y semántica.
   ═══════════════════════════════════════════════════════════════ */

import { INCIDENT_COMPONENTS } from "./incidents";

// Email regex pragmático (no full RFC 5322; cubre 99% real-world).
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const WEBHOOK_URL_RE = /^https:\/\/[^\s<>"'`]{4,2048}$/;
export const TOKEN_LENGTH = 32;

/**
 * ¿Es un email-shape válido?
 */
export function isValidEmail(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (t.length > 254) return false; // RFC 5321 max
  return EMAIL_RE.test(t);
}

/**
 * ¿Webhook URL https-only, max 2048 chars?
 */
export function isValidWebhookUrl(s) {
  if (typeof s !== "string") return false;
  return WEBHOOK_URL_RE.test(s.trim());
}

/**
 * ¿Token formato válido (hex de TOKEN_LENGTH * 2)?
 * Útil para verificar tokens que llegan via query param antes de DB lookup.
 */
export function isValidToken(s) {
  if (typeof s !== "string") return false;
  if (s.length !== TOKEN_LENGTH * 2) return false;
  return /^[0-9a-f]+$/i.test(s);
}

/**
 * Filtra components a sólo los conocidos. Empty = "all" (no filter).
 */
export function sanitizeComponents(input) {
  if (!Array.isArray(input)) return [];
  const cleaned = input.filter((c) =>
    typeof c === "string" && INCIDENT_COMPONENTS.includes(c)
  );
  return Array.from(new Set(cleaned));
}

/**
 * Valida input de subscribe (POST /api/v1/status/subscribe).
 * Exactamente UN canal: email OR webhookUrl.
 */
export function validateSubscribeInput(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  const errors = [];
  const out = {};
  const hasEmail = !!input.email;
  const hasWebhook = !!input.webhookUrl;
  if (hasEmail && hasWebhook) {
    errors.push({ field: "_channel", error: "exactly_one" });
  } else if (!hasEmail && !hasWebhook) {
    errors.push({ field: "_channel", error: "exactly_one" });
  } else if (hasEmail) {
    if (!isValidEmail(input.email)) errors.push({ field: "email", error: "invalid_email" });
    else out.email = input.email.trim().toLowerCase();
  } else if (hasWebhook) {
    if (!isValidWebhookUrl(input.webhookUrl)) errors.push({ field: "webhookUrl", error: "invalid_https_url" });
    else out.webhookUrl = input.webhookUrl.trim();
  }
  if (input.components !== undefined) {
    if (!Array.isArray(input.components)) {
      errors.push({ field: "components", error: "not_array" });
    } else {
      out.components = sanitizeComponents(input.components);
    }
  } else {
    out.components = [];
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

/**
 * ¿El subscriber debe ser notificado de este incident?
 * Lógica:
 * - Si subscriber.components vacío → all incidents (default).
 * - Si tiene components, debe haber intersección con incident.components.
 *   Si incident no tiene components (raro), notificamos a "all" subscribers
 *   (default empty-list) pero NO a los que tienen filter activo (porque
 *   no sabemos si les aplica).
 */
export function shouldNotifyForIncident(subscriber, incident) {
  if (!subscriber || !incident) return false;
  // Sin verificar → no notificar (anti-spam de subscribers fake).
  if (!subscriber.verified) return false;
  const subComps = subscriber.components || [];
  if (subComps.length === 0) return true; // all
  const incComps = incident.components || [];
  if (incComps.length === 0) return false; // filter activo pero incident sin info
  return subComps.some((c) => incComps.includes(c));
}

/**
 * URL para one-click unsubscribe — caller construye con su baseUrl.
 */
export function buildUnsubscribeUrl(unsubscribeToken, baseUrl) {
  if (!unsubscribeToken || !baseUrl) return null;
  return `${baseUrl.replace(/\/$/, "")}/api/status/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
}

/**
 * URL para email verification — caller construye con su baseUrl.
 */
export function buildVerifyUrl(verifyToken, baseUrl) {
  if (!verifyToken || !baseUrl) return null;
  return `${baseUrl.replace(/\/$/, "")}/api/status/verify?token=${encodeURIComponent(verifyToken)}`;
}

/**
 * Subject line para email de verificación.
 */
export function formatVerifySubject(locale = "es") {
  return locale === "en"
    ? "Confirm your status page subscription"
    : "Confirma tu suscripción al status page";
}

/**
 * Subject line para incident notification (con severity prefix).
 */
export function formatNotificationSubject(incident, locale = "es") {
  if (!incident) return "";
  const sev = (incident.severity || "").toUpperCase();
  const status = incident.status || "";
  if (status === "resolved") {
    return locale === "en"
      ? `[RESOLVED] ${incident.title || "Incident"}`
      : `[RESUELTO] ${incident.title || "Incidente"}`;
  }
  return `[${sev}] ${incident.title || (locale === "en" ? "Incident update" : "Actualización")}`;
}

/**
 * UI estado del subscriber para mostrar en admin list (Sprint 20 polish).
 */
export function summarizeSubscriber(s) {
  if (!s) return { tone: "neutral", label: "—" };
  const channel = s.email ? `email:${s.email}` : (s.webhookUrl ? `webhook` : "—");
  if (!s.verified) {
    return { tone: "warn", label: "Pendiente verificación", channel };
  }
  return {
    tone: "success",
    label: "Activa",
    channel,
    components: s.components || [],
  };
}
