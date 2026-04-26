/* ═══════════════════════════════════════════════════════════════
   SSO — helpers para validación de domain + provider config.
   ═══════════════════════════════════════════════════════════════
   Pure functions extraídas para testing. Los providers soportados
   son los que tienen NextAuth provider configurado en server/auth.js.
   ═══════════════════════════════════════════════════════════════ */

// Provider IDs aceptados — match con NextAuth provider ids.
// Cada uno corresponde a un OAuth provider configurado server-side
// (vía env vars OKTA_*, AZURE_AD_*, GOOGLE_*, APPLE_*).
export const SUPPORTED_SSO_PROVIDERS = ["okta", "azure-ad", "google", "apple", "saml"];

// Pretty labels para UI (admin SSO config form).
export const SSO_PROVIDER_LABELS = {
  okta: "Okta",
  "azure-ad": "Microsoft Entra ID (Azure AD)",
  google: "Google Workspace",
  apple: "Apple Business Manager",
  saml: "SAML 2.0 genérico",
};

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/;

/**
 * Normaliza un dominio: lowercase, trim, elimina protocolos y paths
 * que el user pudiera haber pegado por error.
 *
 *   "  https://Acme.com/login  " → "acme.com"
 *   "Mail.ACME.CO.UK"             → "mail.acme.co.uk"
 */
export function normalizeDomain(input) {
  if (!input || typeof input !== "string") return "";
  let s = input.trim().toLowerCase();
  // Strip protocolo
  s = s.replace(/^https?:\/\//, "");
  // Strip path/query/fragment
  s = s.split(/[\/\?#]/)[0];
  // Strip puerto
  s = s.split(":")[0];
  // Strip trailing dot
  s = s.replace(/\.$/, "");
  return s;
}

/**
 * Valida un domain: shape + longitud razonable.
 *   { ok: true } | { ok: false, reason: 'empty'|'invalid'|'too_long' }
 */
export function validateDomain(input) {
  const d = normalizeDomain(input);
  if (!d) return { ok: false, reason: "empty" };
  if (d.length > 253) return { ok: false, reason: "too_long" };
  if (!DOMAIN_RE.test(d)) return { ok: false, reason: "invalid" };
  return { ok: true, normalized: d };
}

/**
 * Valida provider: debe estar en whitelist.
 */
export function isValidProvider(p) {
  return SUPPORTED_SSO_PROVIDERS.includes(p);
}

/**
 * Valida config completa SSO: domain + provider + (opt) metadata.
 * Devuelve {ok, errors: {domain, provider, metadata}} para que la UI
 * pueda mostrar errores por field.
 */
export function validateSsoConfig({ domain, provider, metadata } = {}) {
  const errors = {};
  const dCheck = validateDomain(domain);
  if (!dCheck.ok) errors.domain = dCheck.reason;
  if (!isValidProvider(provider)) errors.provider = "invalid_provider";
  // metadata: opcional, si presente debe ser objeto
  if (metadata != null && typeof metadata !== "object") {
    errors.metadata = "must_be_object";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    config: {
      domain: dCheck.normalized,
      provider,
      metadata: metadata || null,
    },
  };
}
