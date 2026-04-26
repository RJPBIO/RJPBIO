/* ═══════════════════════════════════════════════════════════════
   Onboarding wizard — canonical steps + evaluation pure helpers.
   ═══════════════════════════════════════════════════════════════
   Cubre features construidos en Sprints 1-26. Cada step tiene:
   - id, label, href, category, importance
   - check(state) → boolean, lee state.evidence.{flag}

   Categorías:
   - branding   : white-label visible (Sprint 11/14)
   - security   : MFA, IP allowlist, session policies (Sprint 7-9)
   - compliance : audit retention, DSAR, SOC2 dashboard (Sprint 10/13/23)
   - api        : API keys, webhooks, SCIM (Sprint 5-17)
   - team       : invitar, plan
   ═══════════════════════════════════════════════════════════════ */

export const ONBOARDING_CATEGORIES = ["branding", "security", "compliance", "api", "team"];
export const IMPORTANCE_LEVELS = ["critical", "recommended", "optional"];

/**
 * Lista canónica de steps. ESTABLE — cambiar shape rompe UI/tests.
 *
 * `requires` (boolean key sobre evidence) determina done.
 */
export const ONBOARDING_STEPS = Object.freeze([
  // ─── Team ───────────────────────────────────────────────
  {
    id: "team-invite",
    category: "team",
    importance: "critical",
    label: "Invita a tu equipo",
    href: "/admin/members",
    requires: "hasMultipleMembers",
  },
  {
    id: "team-plan",
    category: "team",
    importance: "critical",
    label: "Confirma tu plan y facturación",
    href: "/admin/billing",
    requires: "planUpgraded",
  },

  // ─── Branding ────────────────────────────────────────────
  {
    id: "branding-logo",
    category: "branding",
    importance: "recommended",
    label: "Configura logo + colores",
    href: "/admin/branding",
    requires: "brandingConfigured",
  },
  {
    id: "branding-domain",
    category: "branding",
    importance: "optional",
    label: "Custom domain verificado",
    href: "/admin/branding",
    requires: "customDomainVerified",
  },

  // ─── Security ────────────────────────────────────────────
  {
    id: "security-sso",
    category: "security",
    importance: "critical",
    label: "Conecta SSO (Okta / Azure AD / Google / SAML)",
    href: "/admin/sso",
    requires: "ssoConfigured",
  },
  {
    id: "security-mfa",
    category: "security",
    importance: "critical",
    label: "MFA obligatorio para el org",
    href: "/admin/security/policies",
    requires: "mfaRequired",
  },
  {
    id: "security-ip-allowlist",
    category: "security",
    importance: "optional",
    label: "IP allowlist (CIDR)",
    href: "/admin/security/policies",
    requires: "ipAllowlistEnabled",
  },
  {
    id: "security-session-ttl",
    category: "security",
    importance: "optional",
    label: "TTL de sesión personalizado",
    href: "/admin/security/policies",
    requires: "sessionTtlSet",
  },

  // ─── Compliance ──────────────────────────────────────────
  {
    id: "compliance-audit-retention",
    category: "compliance",
    importance: "critical",
    label: "Retention policy del audit log",
    href: "/admin/audit/settings",
    requires: "auditRetentionSet",
  },
  {
    id: "compliance-audit-verify",
    category: "compliance",
    importance: "recommended",
    label: "Verifica integridad del audit chain",
    href: "/admin/audit/settings",
    requires: "auditVerified",
  },
  {
    id: "compliance-soc2",
    category: "compliance",
    importance: "recommended",
    label: "Revisa SOC 2 / ISO 27001 dashboard",
    href: "/admin/compliance",
    requires: "complianceReviewed",
  },

  // ─── API & Integrations ──────────────────────────────────
  {
    id: "api-key",
    category: "api",
    importance: "recommended",
    label: "Crea una API key",
    href: "/admin/api-keys",
    requires: "hasApiKey",
  },
  {
    id: "api-scim",
    category: "api",
    importance: "optional",
    label: "Habilita SCIM 2.0 (provisioning Okta/Azure AD)",
    href: "/admin/api-keys",
    requires: "scimConfigured",
  },
  {
    id: "api-webhook",
    category: "api",
    importance: "recommended",
    label: "Registra un webhook",
    href: "/admin/webhooks",
    requires: "hasWebhook",
  },
]);

/**
 * Evalúa todos los steps contra el evidence state.
 *
 * @param {object} evidence  { hasApiKey: boolean, ssoConfigured: boolean, ... }
 * @returns array de steps con field `done` agregado
 */
export function evaluateSteps(evidence) {
  if (!evidence || typeof evidence !== "object") {
    return ONBOARDING_STEPS.map((s) => ({ ...s, done: false }));
  }
  return ONBOARDING_STEPS.map((s) => ({
    ...s,
    done: !!evidence[s.requires],
  }));
}

/**
 * Resumen agregado: total done, by category, by importance.
 *
 * @param {Array} steps  output de evaluateSteps()
 */
export function summarizeProgress(steps) {
  if (!Array.isArray(steps)) {
    return {
      total: 0, done: 0, percent: 0,
      byCategory: {}, byImportance: {},
    };
  }
  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  const byCategory = {};
  const byImportance = {};
  for (const cat of ONBOARDING_CATEGORIES) {
    const inCat = steps.filter((s) => s.category === cat);
    byCategory[cat] = {
      total: inCat.length,
      done: inCat.filter((s) => s.done).length,
    };
  }
  for (const lvl of IMPORTANCE_LEVELS) {
    const inLvl = steps.filter((s) => s.importance === lvl);
    byImportance[lvl] = {
      total: inLvl.length,
      done: inLvl.filter((s) => s.done).length,
    };
  }
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, percent, byCategory, byImportance };
}

/**
 * UI labels per category — es por defecto.
 */
export function categoryLabel(cat, locale = "es") {
  const map = {
    es: {
      branding: "Branding",
      security: "Seguridad",
      compliance: "Cumplimiento",
      api: "API & Integraciones",
      team: "Equipo & Plan",
    },
    en: {
      branding: "Branding",
      security: "Security",
      compliance: "Compliance",
      api: "API & Integrations",
      team: "Team & Plan",
    },
  };
  return (map[locale] || map.es)[cat] || cat;
}

export function importanceLabel(level, locale = "es") {
  const map = {
    es: { critical: "Crítico", recommended: "Recomendado", optional: "Opcional" },
    en: { critical: "Critical", recommended: "Recommended", optional: "Optional" },
  };
  return (map[locale] || map.es)[level] || level;
}

/**
 * Tone para badge importance.
 */
export const IMPORTANCE_TONE = Object.freeze({
  critical: "danger",
  recommended: "warn",
  optional: "soft",
});

/**
 * ¿El onboarding está "completo a critical-level"? Más útil que 100%
 * porque optional steps no son bloqueante para production-ready.
 */
export function isCriticalComplete(steps) {
  if (!Array.isArray(steps)) return false;
  const critical = steps.filter((s) => s.importance === "critical");
  return critical.length > 0 && critical.every((s) => s.done);
}

/**
 * Filtro por categoría — para render por sección.
 */
export function stepsForCategory(steps, category) {
  if (!Array.isArray(steps)) return [];
  return steps.filter((s) => s.category === category);
}
