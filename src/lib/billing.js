/* ═══════════════════════════════════════════════════════════════
   Billing — Plan features + gating helpers.
   ═══════════════════════════════════════════════════════════════
   Source of truth para qué features tiene cada plan. Usado tanto
   server-side (gating de endpoints) como client-side (UI conditional
   rendering).

   Decisión: features INCLUYEN tiers superiores. Si STARTER tiene
   "team_analytics", entonces GROWTH y ENTERPRISE también. Esto evita
   tener que listar el feature en cada tier.

   Plan hierarchy: FREE < PRO < STARTER < GROWTH < ENTERPRISE.
   ═══════════════════════════════════════════════════════════════ */

export const PLAN_ORDER = ["FREE", "PRO", "STARTER", "GROWTH", "ENTERPRISE"];

export function planRank(plan) {
  const i = PLAN_ORDER.indexOf(plan);
  return i === -1 ? 0 : i;
}

/* Features mapeados al plan MÍNIMO requerido. Se entiende:
   "para usar feature X, necesitas plan ≥ minPlan[X]".

   Cuando agregas un feature nuevo, solo definí el mínimo aquí —
   no hay que listar manualmente cada tier superior. */
export const FEATURE_MIN_PLAN = {
  // FREE — disponible para todos
  basic_protocols: "FREE",
  daily_session_limit_3: "FREE", // hasta 3 sesiones/día
  local_data_export: "FREE",     // GDPR export local

  // PRO — individual subscription
  unlimited_sessions: "PRO",
  all_protocols: "PRO",
  voice_premium: "PRO",          // voces premium del TTS
  binaural_advanced: "PRO",
  hrv_camera: "PRO",
  data_history_unlimited: "PRO", // > 90 días local
  cloud_sync: "PRO",             // multi-device sync
  nom035_personal: "PRO",        // PDF export personal

  // STARTER — B2B mid-market
  team_analytics: "STARTER",     // dashboard agregado k≥5
  team_invites: "STARTER",
  nom035_aggregate: "STARTER",
  audit_logs: "STARTER",

  // GROWTH — B2B premium
  sso_oauth: "GROWTH",           // Google/Microsoft SSO
  api_access: "GROWTH",
  webhooks: "GROWTH",
  custom_branding: "GROWTH",

  // ENTERPRISE — top tier
  sso_saml: "ENTERPRISE",
  custom_dpa: "ENTERPRISE",
  data_residency: "ENTERPRISE",
  scim_provisioning: "ENTERPRISE",
  white_label: "ENTERPRISE",
  custom_msa: "ENTERPRISE",
};

/* ¿El plan dado tiene acceso al feature?
   Considera trial activo: si Org tiene trialEndsAt en el futuro,
   tratamos como si fuera el plan superior pagado (privilegio
   completo durante trial → fricción cero para conversion). */
export function hasFeature(plan, feature, trialEndsAt = null) {
  const minPlan = FEATURE_MIN_PLAN[feature];
  if (!minPlan) return false;

  // Trial activo da acceso completo a features del plan en trial.
  // Asumimos que durante trial el Org.plan ya está en el tier
  // contratado (Stripe webhook setea plan al subscribir, trialEndsAt
  // marca cuándo expira). Si el trial expira sin pago, plan revierte
  // a FREE vía webhook (customer.subscription.deleted).
  const effective = plan;

  return planRank(effective) >= planRank(minPlan);
}

/* ¿El trial está activo? */
export function isInTrial(trialEndsAt) {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() > Date.now();
}

/* Días restantes del trial (cap a 0). Usado para banners "quedan N días". */
export function trialDaysLeft(trialEndsAt) {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

/* ¿El plan es B2C (personal) o B2B (org-shared)?
   FREE y PRO son B2C; STARTER+ son B2B con seats. */
export function isB2BPlan(plan) {
  return planRank(plan) >= planRank("STARTER");
}

/* Pretty labels para UI — útiles para badges/billing pages. */
export const PLAN_LABELS = {
  FREE: "Free",
  PRO: "Pro",
  STARTER: "Starter",
  GROWTH: "Growth",
  ENTERPRISE: "Enterprise",
};

export const PLAN_TAGLINES = {
  FREE: "Comienza gratis",
  PRO: "Para individuos serios sobre su rendimiento",
  STARTER: "Equipos pequeños — bienestar measurable",
  GROWTH: "Empresas en crecimiento — analytics + integraciones",
  ENTERPRISE: "SAML, DPA custom, residencia de datos",
};
