/* ═══════════════════════════════════════════════════════════════
   Email transactional templates — branding-aware HTML/text rendering.
   ═══════════════════════════════════════════════════════════════
   Plantilla envuelve contenido inner con header (logo si branding tiene)
   + footer con privacy link + branding/orgName. Usa colors del branding
   para CTAs si vienen, sino defaults BIO-IGN.

   Pure module — no networking ni server-only deps. Tests cubren shape
   estable del HTML, escape de chars peligrosos en variables, branding
   override fallback, y derivación de From address con custom domain.
   ═══════════════════════════════════════════════════════════════ */

import { mergeBrandingDefaults, BRANDING_DEFAULTS } from "./branding";

const DEFAULT_FROM = "BIO-IGNICIÓN <no-reply@bio-ignicion.app>";
const PRIVACY_URL = "https://bio-ignicion.app/privacy";

/**
 * Escape HTML — defensa contra inyección en variables (orgName,
 * inviterName, etc). NO debe usarse en URLs (esas son trusted output
 * de la app, no user input).
 */
export function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape para attribute (URL en href). Strict — sólo permite https://
 * y `/` paths relativos.
 */
export function safeUrl(url) {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("https://")) return escapeHtml(trimmed);
  if (trimmed.startsWith("/")) return escapeHtml(trimmed);
  return ""; // rechaza http://, javascript:, data:, etc.
}

/**
 * Sanitiza variables de usuario que se inyectan en plantillas.
 * @param {Record<string, any>} vars
 * @returns {Record<string, string>} mismo shape, todos string-escaped
 */
export function sanitizeVars(vars) {
  if (!vars || typeof vars !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(vars)) {
    out[k] = escapeHtml(v);
  }
  return out;
}

/**
 * Resuelve el "From" address con custom domain del branding si está
 * verified. Sino usa default global. Útil para que magic-links del
 * org de Acme vengan de "no-reply@app.acme.com" en vez de bio-ignicion.app.
 *
 * @param {object} args
 * @param {object} [args.branding]   merge de Org.branding
 * @param {string} [args.orgName]
 * @param {boolean} [args.customDomainVerified]
 * @param {string} [args.fallback]   default DEFAULT_FROM
 */
export function getBrandedFrom({ branding, orgName, customDomainVerified, fallback = DEFAULT_FROM } = {}) {
  if (!customDomainVerified || !branding?.customDomain) return fallback;
  const safeOrg = orgName ? orgName.replace(/[^\w\s-]/g, "").trim().slice(0, 60) : "BIO-IGNICIÓN";
  return `${safeOrg} <no-reply@${branding.customDomain}>`;
}

/**
 * Renderiza el HTML completo del email. `content` es el inner HTML
 * (debe venir ya con vars escaped). `branding` aplica logo + colors.
 * `footer` permite override del footer text.
 *
 * @param {object} args
 * @param {string} args.content      — inner HTML
 * @param {object} [args.branding]   — Org.branding merged
 * @param {string} [args.locale]     — "es" | "en"
 * @param {string} [args.footerText] — texto del footer (default i18n)
 * @param {string} [args.privacyUrl] — link to privacy
 */
export function renderEmailHTML({
  content,
  branding,
  locale = "es",
  footerText,
  privacyUrl = PRIVACY_URL,
} = {}) {
  const b = mergeBrandingDefaults(branding);
  const headerLogo = b.logoUrl
    ? `<img src="${safeUrl(b.logoUrl)}" alt="logo" style="max-height:36px;max-width:200px;display:block;margin:0 auto 16px"/>`
    : "";
  const accentBar = `<div style="height:4px;background:linear-gradient(90deg, ${b.primaryColor}, ${b.accentColor});margin:0 -24px 24px"></div>`;
  const footer = escapeHtml(footerText || (locale === "en"
    ? "BIO-IGNICIÓN — neural performance optimization"
    : "BIO-IGNICIÓN — optimización de desempeño neural"));
  const privacyLabel = locale === "en" ? "Privacy" : "Privacidad";
  const safePrivacyUrl = safeUrl(privacyUrl) || PRIVACY_URL;
  return `<html lang="${escapeHtml(locale)}"><body style="font-family:system-ui,-apple-system,sans-serif;color:#0F172A;background:#F8FAFC;margin:0;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
${accentBar}
${headerLogo}
${content}
<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
<p style="color:#64748B;font-size:12px;text-align:center;margin:0">
${footer} — <a href="${safePrivacyUrl}" style="color:${escapeHtml(b.accentColor)};text-decoration:none">${privacyLabel}</a>
</p>
</div>
</body></html>`;
}

/**
 * Renderiza CTA button con color del branding.
 * @param {object} args
 * @param {string} args.url    — URL HTTPS o path relativo
 * @param {string} args.label  — text del botón
 * @param {object} [args.branding]
 */
export function renderCtaButton({ url, label, branding } = {}) {
  const b = mergeBrandingDefaults(branding);
  const u = safeUrl(url);
  if (!u || !label) return "";
  const safeLabel = escapeHtml(label);
  return `<p style="text-align:center;margin:24px 0">
<a href="${u}" style="display:inline-block;background:linear-gradient(135deg, ${b.primaryColor}, ${b.accentColor});color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">${safeLabel}</a>
</p>`;
}

/**
 * Versión texto plano. Strip básico de HTML + URL fallback.
 */
export function renderEmailText({ contentText, footerText, locale = "es" } = {}) {
  const footer = footerText || (locale === "en"
    ? "— BIO-IGNICIÓN, neural performance optimization."
    : "— BIO-IGNICIÓN, optimización de desempeño neural.");
  return `${(contentText || "").trim()}\n\n${footer}\n${PRIVACY_URL}\n`;
}

/**
 * Helpers exportados para test introspection.
 */
export const _internals = {
  DEFAULT_FROM,
  PRIVACY_URL,
  BRANDING_DEFAULTS,
};
