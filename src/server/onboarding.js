/* ═══════════════════════════════════════════════════════════════
   Onboarding state gathering — multi-table query → evidence.
   ═══════════════════════════════════════════════════════════════
   Pure lib en lib/onboarding.js define los steps + evaluate. Aquí
   sólo SQL: lee de Org, Membership, ApiKey, Webhook, etc. y llena
   el evidence object que pasa a evaluateSteps.

   Sprint 27: cubre flags introducidos en Sprints 7-26 (mfa policy,
   IP allowlist, audit retention, custom domain verified, SCIM scope, etc.).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";

/**
 * Construye el evidence object para evaluateSteps. Best-effort por
 * cada query — si falla individual, ese flag queda false.
 */
export async function gatherOnboardingState(orgId) {
  if (!orgId) return null;
  try {
    const orm = await db();

    const [org, memberCount, hasApiKey, hasScimKey, hasWebhook] = await Promise.all([
      orm.org.findUnique({
        where: { id: orgId },
        select: {
          id: true, name: true, plan: true,
          ssoDomain: true, ssoProvider: true,
          // Sprint 7
          requireMfa: true,
          ipAllowlist: true, ipAllowlistEnabled: true,
          sessionMaxAgeMinutes: true,
          // Sprint 10
          auditRetentionDays: true,
          auditLastVerifiedAt: true,
          // Sprint 11/14
          branding: true,
          customDomainVerified: true,
        },
      }),
      orm.membership.count({ where: { orgId } }).catch(() => 0),
      orm.apiKey.count({ where: { orgId, revokedAt: null } })
        .then((n) => n > 0)
        .catch(() => false),
      // Sprint 12 — SCIM se habilita creando ApiKey con scope:scim
      orm.apiKey.count({
        where: { orgId, revokedAt: null, scopes: { has: "scim" } },
      }).then((n) => n > 0).catch(() => false),
      orm.webhook.count({ where: { orgId } })
        .then((n) => n > 0)
        .catch(() => false),
    ]);

    if (!org) return null;

    const branding = org.branding || {};
    const brandingConfigured = !!(branding.logoUrl ||
      (branding.primaryColor && branding.primaryColor !== "#059669") ||
      (branding.accentColor && branding.accentColor !== "#10B981"));

    const evidence = {
      // Team
      hasMultipleMembers: memberCount > 1,
      planUpgraded: org.plan !== "FREE",
      // Branding
      brandingConfigured,
      customDomainVerified: !!org.customDomainVerified,
      // Security
      ssoConfigured: !!(org.ssoDomain && org.ssoProvider),
      mfaRequired: !!org.requireMfa,
      ipAllowlistEnabled: !!org.ipAllowlistEnabled &&
        Array.isArray(org.ipAllowlist) && org.ipAllowlist.length > 0,
      sessionTtlSet: typeof org.sessionMaxAgeMinutes === "number" &&
        org.sessionMaxAgeMinutes > 0,
      // Compliance
      auditRetentionSet: typeof org.auditRetentionDays === "number" &&
        org.auditRetentionDays >= 30,
      auditVerified: !!org.auditLastVerifiedAt,
      // complianceReviewed: marker que el admin abrió /admin/compliance
      // Por ahora derivamos: si auditVerified está, asumimos que vio dashboard.
      complianceReviewed: !!org.auditLastVerifiedAt,
      // API
      hasApiKey,
      scimConfigured: hasScimKey,
      hasWebhook,
    };

    return { org, evidence };
  } catch {
    return null;
  }
}
