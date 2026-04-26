/* ═══════════════════════════════════════════════════════════════
   Compliance — gather evidence snapshot por org desde múltiples tablas.
   ═══════════════════════════════════════════════════════════════
   Pure logic en lib/compliance.js (controls map + builders). Aquí
   sólo SQL: leer Org config, contar SCIM keys con scope, audit verify
   timestamps, etc.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";
import { buildEvidencePack } from "@/lib/compliance";

/**
 * Junta todos los flags evidence para un org específico.
 * Returns { evidence, org } pasable a buildEvidencePack.
 */
export async function gatherSnapshot(orgId) {
  if (!orgId) return null;
  try {
    const orm = await db();

    const org = await orm.org.findUnique({
      where: { id: orgId },
      select: {
        id: true, name: true, plan: true,
        ssoDomain: true, ssoProvider: true,
        // Sprint 7 policies
        requireMfa: true,
        sessionMaxAgeMinutes: true,
        ipAllowlist: true,
        ipAllowlistEnabled: true,
        // Sprint 10 audit
        auditRetentionDays: true,
        auditLastVerifiedAt: true,
        auditLastVerifiedStatus: true,
        // Sprint 14 custom domain
        customDomainVerified: true,
      },
    });
    if (!org) return null;

    const [scimKeyCount, recentRotations] = await Promise.all([
      // SCIM API key con scope='scim' configurada (Sprint 12)
      orm.apiKey.count({
        where: {
          orgId,
          revokedAt: null,
          scopes: { has: "scim" },
        },
      }).catch(() => 0),
      // Webhook con secret rotado en últimos 90 días (Sprint 17)
      orm.webhook.count({
        where: {
          orgId,
          secretRotatedAt: { gte: new Date(Date.now() - 90 * 86400_000) },
        },
      }).catch(() => 0),
    ]);

    const evidence = {
      // Auth
      sso: !!(org.ssoDomain && org.ssoProvider),
      mfa: !!org.requireMfa,
      // Default true (infra-level — no per-org)
      mfa_backup: true,
      magic_link: true,
      rbac: true,
      // Sessions / network
      sessions: true,
      session_revoke: true,
      session_ttl: typeof org.sessionMaxAgeMinutes === "number" && org.sessionMaxAgeMinutes > 0,
      ip_allowlist: !!org.ipAllowlistEnabled && Array.isArray(org.ipAllowlist) && org.ipAllowlist.length > 0,
      admin_sessions: true,
      // Provisioning
      scim: scimKeyCount > 0,
      // Audit
      audit: true,
      audit_chain: true,
      audit_retention: typeof org.auditRetentionDays === "number" && org.auditRetentionDays >= 30,
      audit_verify: !!org.auditLastVerifiedAt,
      // Network defaults (infra)
      https_only: true,
      hsts: true,
      encryption_in_transit: true,
      // Webhooks
      webhook_signing: true,
      webhook_rotation: recentRotations > 0,
      // Compliance
      dsar: true,
      subprocessors: true,
      // Status
      status_page: true,
      incidents: true,
      status_subscribers: true,
      maintenance: true,
      rate_limit: true,
    };

    return { org, evidence };
  } catch {
    return null;
  }
}

/**
 * Build pack + audit log el export.
 */
export async function getCompliancePackForOrg(orgId, { actorUserId } = {}) {
  const snap = await gatherSnapshot(orgId);
  if (!snap) return null;
  const pack = buildEvidencePack({
    evidence: snap.evidence,
    org: snap.org,
  });

  await auditLog({
    orgId,
    actorId: actorUserId || null,
    action: "org.compliance.viewed",
    payload: { coverage: pack.summary.coverage },
  }).catch(() => {});

  return pack;
}
