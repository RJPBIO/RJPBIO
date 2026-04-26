/* ═══════════════════════════════════════════════════════════════
   Org branding — pure helpers para white-label B2B.
   ═══════════════════════════════════════════════════════════════
   Validación + defaults + plan-gating. La data vive en Org.branding
   (Json) — schema no necesita columnas nuevas. UI/server consumen
   estos helpers para no duplicar reglas.

   Plan-gating:
   - FREE / PRO / STARTER → read-only (preview only, upgrade CTA)
   - GROWTH                → logo + colors + coachPersona
   - ENTERPRISE            → además customDomain (DNS verification flow)
   ═══════════════════════════════════════════════════════════════ */

export const BRANDING_DEFAULTS = Object.freeze({
  logoUrl: "",
  primaryColor: "#059669",
  accentColor: "#10B981",
  customDomain: "",
  coachPersona: "",
});

export const BRANDING_FIELDS = ["logoUrl", "primaryColor", "accentColor", "customDomain", "coachPersona"];

// Plans que pueden editar branding (no solo verlo).
export const BRANDING_EDIT_PLANS = ["GROWTH", "ENTERPRISE"];
export const CUSTOM_DOMAIN_PLANS = ["ENTERPRISE"];

export const COLOR_HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
// Domain: labels alfanuméricos con guiones, separados por puntos. Sin
// scheme. Acepta ASCII; IDN se valida en el flujo de DNS verification.
export const DOMAIN_RE = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
export const URL_HTTPS_RE = /^https:\/\/[^\s<>"'`]{4,2048}$/;
export const COACH_PERSONA_MAX = 240;

export function isValidColor(s) {
  return typeof s === "string" && COLOR_HEX_RE.test(s.trim());
}

export function normalizeColor(s) {
  if (!isValidColor(s)) return null;
  const t = s.trim().toLowerCase();
  // Expand 3-char shorthand a 6-char.
  if (t.length === 4) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
  }
  return t;
}

export function isValidLogoUrl(s) {
  if (typeof s !== "string" || !s) return false;
  return URL_HTTPS_RE.test(s.trim());
}

export function isValidDomain(s) {
  if (typeof s !== "string" || !s) return false;
  const t = s.trim().toLowerCase();
  return DOMAIN_RE.test(t);
}

export function canEditBranding(plan) {
  return BRANDING_EDIT_PLANS.includes(plan);
}

export function canSetCustomDomain(plan) {
  return CUSTOM_DOMAIN_PLANS.includes(plan);
}

/**
 * Valida un objeto de branding. Retorna:
 *  - { ok: true, value } con campos limpiados
 *  - { ok: false, errors: [{field, error}] }
 *
 * Plan-gating: si `plan` se pasa y NO permite custom domain pero el input
 * lo trae, error "plan_required". Si plan no edita → error "plan_required"
 * para todos los campos non-default.
 */
export function validateBranding(input, { plan = null } = {}) {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  const errors = [];
  const out = {};

  // Plan gating global — si pasaron plan y NO permite editar, rechazamos
  // CUALQUIER campo non-default. (Pero un input vacío {} pasa: "reset").
  const editAllowed = plan === null || canEditBranding(plan);
  const hasAnyValue = BRANDING_FIELDS.some(
    (f) => input[f] !== undefined && input[f] !== null && input[f] !== ""
  );
  if (!editAllowed && hasAnyValue) {
    return { ok: false, errors: [{ field: "_plan", error: "plan_required" }] };
  }

  // logoUrl
  if (input.logoUrl !== undefined) {
    const v = input.logoUrl;
    if (v === null || v === "") out.logoUrl = "";
    else if (typeof v !== "string") errors.push({ field: "logoUrl", error: "not_string" });
    else if (!isValidLogoUrl(v)) errors.push({ field: "logoUrl", error: "invalid_https_url" });
    else out.logoUrl = v.trim();
  }

  // primaryColor
  if (input.primaryColor !== undefined) {
    const v = input.primaryColor;
    if (v === null || v === "") out.primaryColor = BRANDING_DEFAULTS.primaryColor;
    else if (!isValidColor(v)) errors.push({ field: "primaryColor", error: "invalid_hex" });
    else out.primaryColor = normalizeColor(v);
  }

  // accentColor
  if (input.accentColor !== undefined) {
    const v = input.accentColor;
    if (v === null || v === "") out.accentColor = BRANDING_DEFAULTS.accentColor;
    else if (!isValidColor(v)) errors.push({ field: "accentColor", error: "invalid_hex" });
    else out.accentColor = normalizeColor(v);
  }

  // customDomain
  if (input.customDomain !== undefined) {
    const v = input.customDomain;
    if (v === null || v === "") out.customDomain = "";
    else if (typeof v !== "string") errors.push({ field: "customDomain", error: "not_string" });
    else if (!isValidDomain(v)) errors.push({ field: "customDomain", error: "invalid_domain" });
    else if (plan !== null && !canSetCustomDomain(plan)) {
      errors.push({ field: "customDomain", error: "plan_required" });
    } else {
      out.customDomain = v.trim().toLowerCase();
    }
  }

  // coachPersona
  if (input.coachPersona !== undefined) {
    const v = input.coachPersona;
    if (v === null || v === "") out.coachPersona = "";
    else if (typeof v !== "string") errors.push({ field: "coachPersona", error: "not_string" });
    else if (v.length > COACH_PERSONA_MAX) errors.push({ field: "coachPersona", error: "too_long" });
    else out.coachPersona = v.trim();
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

/**
 * Mezcla branding stored con defaults — UI y emails consumen esto
 * para no tener que checar campo por campo.
 */
export function mergeBrandingDefaults(branding) {
  const merged = { ...BRANDING_DEFAULTS };
  if (branding && typeof branding === "object") {
    for (const f of BRANDING_FIELDS) {
      if (typeof branding[f] === "string" && branding[f]) {
        merged[f] = branding[f];
      }
    }
  }
  return merged;
}

/**
 * Selecciona el branding "primario" del usuario — primer org no-personal
 * con role OWNER/ADMIN/MEMBER. Retorna null si solo tiene personal-org
 * (no aplica branding en ese caso).
 */
export function getPrimaryBranding(memberships) {
  if (!Array.isArray(memberships)) return null;
  for (const m of memberships) {
    if (m?.org && !m.org.personal && m.org.branding) {
      const merged = mergeBrandingDefaults(m.org.branding);
      // Si todos los campos siguen iguales a default, no hay branding "real".
      const hasCustom = BRANDING_FIELDS.some((f) => merged[f] !== BRANDING_DEFAULTS[f]);
      if (hasCustom) return { orgId: m.orgId, orgName: m.org.name, ...merged };
    }
  }
  return null;
}

/**
 * String CSS para gradient primary→accent. Útil para botones / hero.
 */
export function gradientFromBranding(branding) {
  const b = mergeBrandingDefaults(branding);
  return `linear-gradient(135deg, ${b.primaryColor}, ${b.accentColor})`;
}
