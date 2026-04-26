/* ═══════════════════════════════════════════════════════════════
   Compliance dashboard — SOC2 / ISO 27001 control mapping pure helpers.
   ═══════════════════════════════════════════════════════════════
   Mapea controls de marcos de seguridad (SOC2 Trust Services Criteria,
   ISO/IEC 27001:2022 Annex A) a features que ya construimos en Sprints
   1-22. Cada control resuelve a un status + tone + evidence detail.

   Pure module — testable sin DB. Server hace gatherSnapshot que llena
   los flags `evidence` (mfaEnforced, auditVerified, etc.) y este lib
   produce el doc final.

   No es un audit replacement (el audit real lo hace un assessor humano).
   Es un evidence collector que muestra "estos controls se cumplen
   técnicamente; aquí los logs/configs que lo prueban".
   ═══════════════════════════════════════════════════════════════ */

/**
 * SOC2 Trust Services Criteria (TSC 2017 + 2022 amendments).
 * Solo Common Criteria CC1-CC9 + Availability A1.* implementados.
 * Confidentiality C1.*, Privacy P1.*, Processing Integrity PI1.*
 * pueden añadirse en futuro polish.
 */
export const SOC2_CONTROLS = [
  {
    id: "CC6.1",
    name: "Logical access controls",
    summary: "Authentication, authorization, encryption in transit/rest.",
    requires: ["sso", "mfa", "encryption_in_transit"],
  },
  {
    id: "CC6.2",
    name: "User registration & deregistration",
    summary: "Provisioning + deprovisioning con audit trail.",
    requires: ["scim", "audit"],
  },
  {
    id: "CC6.3",
    name: "Access management lifecycle",
    summary: "Periodic review + role-based + offboarding.",
    requires: ["admin_sessions", "rbac"],
  },
  {
    id: "CC6.6",
    name: "Logical access security measures",
    summary: "Network/IP restrictions + session controls.",
    requires: ["ip_allowlist", "session_ttl"],
  },
  {
    id: "CC6.7",
    name: "Data transmission encryption",
    summary: "TLS 1.2+ enforced + HSTS.",
    requires: ["hsts", "https_only"],
  },
  {
    id: "CC6.8",
    name: "Malware / unauthorized changes prevention",
    summary: "Webhook signing + secret rotation + audit hash chain.",
    requires: ["webhook_signing", "audit_chain"],
  },
  {
    id: "CC7.1",
    name: "System monitoring",
    summary: "Status page + incident management + uptime probes.",
    requires: ["status_page", "incidents"],
  },
  {
    id: "CC7.2",
    name: "Anomalies detection / response",
    summary: "Audit logging + retention policy + verify-on-demand.",
    requires: ["audit", "audit_retention", "audit_verify"],
  },
  {
    id: "CC7.3",
    name: "Security incidents communication",
    summary: "Status subscribers + maintenance notifications.",
    requires: ["status_subscribers", "maintenance"],
  },
  {
    id: "CC9.1",
    name: "Risk identification & disclosure",
    summary: "DPA + subprocessors list + GDPR DSAR.",
    requires: ["dsar", "subprocessors"],
  },
  {
    id: "A1.2",
    name: "Capacity & availability",
    summary: "Rate limiting + per-key quotas + scheduled maintenance.",
    requires: ["rate_limit", "maintenance"],
  },
];

/**
 * ISO/IEC 27001:2022 Annex A — controls relevantes a un SaaS B2B.
 */
export const ISO_27001_CONTROLS = [
  {
    id: "A.5.15",
    name: "Access control",
    summary: "MFA, SSO federation, least privilege.",
    requires: ["sso", "mfa", "rbac"],
  },
  {
    id: "A.5.16",
    name: "Identity management",
    summary: "User lifecycle vía SCIM + audit trail.",
    requires: ["scim", "audit"],
  },
  {
    id: "A.5.17",
    name: "Authentication information",
    summary: "Password-less (magic link) + MFA + backup codes.",
    requires: ["magic_link", "mfa", "mfa_backup"],
  },
  {
    id: "A.5.18",
    name: "Access rights",
    summary: "RBAC con role gating + offboarding workflow.",
    requires: ["rbac", "admin_sessions"],
  },
  {
    id: "A.8.1",
    name: "User endpoint devices",
    summary: "Active sessions visible + remote revoke.",
    requires: ["sessions", "session_revoke"],
  },
  {
    id: "A.8.5",
    name: "Secure authentication",
    summary: "Token bucket rate limit + RFC 9239 headers.",
    requires: ["rate_limit"],
  },
  {
    id: "A.8.15",
    name: "Logging",
    summary: "Audit log inmutable (hash chain + HMAC seal) + retention configurable.",
    requires: ["audit", "audit_chain", "audit_retention"],
  },
  {
    id: "A.8.24",
    name: "Use of cryptography",
    summary: "HMAC-SHA256 webhook signing + secret rotation overlap.",
    requires: ["webhook_signing", "webhook_rotation"],
  },
  {
    id: "A.5.34",
    name: "Privacy & PII protection",
    summary: "DSAR self-service + GDPR Art. 15/17/20 + Recital 26 carve-out.",
    requires: ["dsar"],
  },
];

/**
 * Mapa de feature flags a status — el server gathered llena esto.
 * Cada flag es boolean (true = control satisfecho).
 *
 * Default values (no reflejan org-específicos hasta server fill).
 */
export const DEFAULT_EVIDENCE = Object.freeze({
  // Auth
  sso: false,                    // SSO configurado para este org (Sprint 5)
  mfa: false,                    // requireMfa true (Sprint 7 policies)
  mfa_backup: true,              // mfa.js implementado (Sprint pre-existing)
  magic_link: true,              // auth.js Email provider (existing)
  rbac: true,                    // Role enum + checks (existing)
  // Sessions
  sessions: true,                // UserSession tracking (Sprint 8)
  session_revoke: true,          // self-service + admin (Sprint 8/9)
  session_ttl: false,            // sessionMaxAgeMinutes set (Sprint 7 policies)
  ip_allowlist: false,           // ipAllowlistEnabled (Sprint 7)
  admin_sessions: true,          // org-level admin (Sprint 9)
  // Provisioning
  scim: false,                   // API key con scope:scim creada (Sprint 12)
  // Data
  audit: true,                   // Audit log infrastructure (existing)
  audit_chain: true,             // SHA-256 + HMAC seal (existing pre-Sprint 10)
  audit_retention: false,        // auditRetentionDays set (Sprint 10)
  audit_verify: false,           // auditLastVerifiedAt populated (Sprint 10 polish)
  // Network
  https_only: true,              // middleware HSTS + redirect (existing)
  hsts: true,                    // header set (existing)
  encryption_in_transit: true,   // TLS via Vercel + HSTS
  // Webhooks
  webhook_signing: true,         // Standard Webhooks v1 (Sprint 6)
  webhook_rotation: false,       // rotation con overlap (Sprint 17 — bool si tiene rotaciones recientes)
  // Compliance
  dsar: true,                    // Self-service flow (Sprint 13)
  subprocessors: true,           // /trust/subprocessors public (existing)
  // Operations
  status_page: true,             // /status público (existing)
  incidents: true,               // DB-driven (Sprint 19)
  status_subscribers: true,      // email/webhook (Sprint 20)
  maintenance: true,             // ventanas (Sprint 22)
  rate_limit: true,              // token bucket SCIM (Sprint 16)
});

/**
 * ¿El control se satisface con la evidencia disponible? Pure check.
 * Returns { ok, missing }.
 */
export function evaluateControl(control, evidence) {
  if (!control || !Array.isArray(control.requires)) {
    return { ok: false, missing: [] };
  }
  const missing = control.requires.filter((flag) => !evidence?.[flag]);
  return { ok: missing.length === 0, missing };
}

/**
 * UI summary per-control: status + tone + detail.
 */
export function summarizeControl(control, evidence, locale = "es") {
  const { ok, missing } = evaluateControl(control, evidence);
  if (ok) {
    return {
      id: control.id,
      name: control.name,
      summary: control.summary,
      status: "satisfied",
      tone: "success",
      detail: locale === "en" ? "All required features active" : "Todos los requisitos activos",
      missing: [],
    };
  }
  return {
    id: control.id,
    name: control.name,
    summary: control.summary,
    status: "partial",
    tone: missing.length === control.requires.length ? "danger" : "warn",
    detail: locale === "en"
      ? `Missing: ${missing.join(", ")}`
      : `Falta: ${missing.join(", ")}`,
    missing,
  };
}

/**
 * Construye el evidence pack completo — used por API export y UI render.
 *
 * @param {object} args
 * @param {object} [args.evidence]       Mezcla con DEFAULT_EVIDENCE
 * @param {object} [args.org]            { id, name, plan, ... }
 * @param {string} [args.generatedAt]    ISO timestamp
 */
export function buildEvidencePack({ evidence = {}, org = null, generatedAt = null } = {}) {
  const merged = { ...DEFAULT_EVIDENCE, ...evidence };
  const soc2 = SOC2_CONTROLS.map((c) => summarizeControl(c, merged));
  const iso = ISO_27001_CONTROLS.map((c) => summarizeControl(c, merged));
  const totalControls = soc2.length + iso.length;
  const satisfiedSoc2 = soc2.filter((c) => c.status === "satisfied").length;
  const satisfiedIso = iso.filter((c) => c.status === "satisfied").length;
  const totalSatisfied = satisfiedSoc2 + satisfiedIso;
  return {
    generatedAt: generatedAt || new Date().toISOString(),
    org: org ? { id: org.id, name: org.name, plan: org.plan } : null,
    summary: {
      totalControls,
      totalSatisfied,
      coverage: totalControls > 0 ? Math.round((totalSatisfied / totalControls) * 100) : 0,
      soc2: { total: soc2.length, satisfied: satisfiedSoc2 },
      iso27001: { total: iso.length, satisfied: satisfiedIso },
    },
    soc2,
    iso27001: iso,
    evidence: merged,
  };
}

/**
 * Markdown formatting — para download por auditor humano.
 */
export function formatPackAsMarkdown(pack, locale = "es") {
  if (!pack) return "";
  const lines = [];
  const t = (es, en) => locale === "en" ? en : es;

  lines.push(`# ${t("Compliance Evidence Pack", "Compliance Evidence Pack")}`);
  if (pack.org?.name) lines.push(`**Org:** ${pack.org.name} (${pack.org.plan || "—"})`);
  lines.push(`**${t("Generado", "Generated")}:** ${pack.generatedAt}`);
  lines.push("");
  lines.push(`## ${t("Resumen", "Summary")}`);
  lines.push(`- **${t("Cobertura", "Coverage")}:** ${pack.summary.totalSatisfied}/${pack.summary.totalControls} (${pack.summary.coverage}%)`);
  lines.push(`- **SOC 2:** ${pack.summary.soc2.satisfied}/${pack.summary.soc2.total}`);
  lines.push(`- **ISO 27001:** ${pack.summary.iso27001.satisfied}/${pack.summary.iso27001.total}`);
  lines.push("");

  lines.push(`## ${t("SOC 2 Trust Services Criteria", "SOC 2 Trust Services Criteria")}`);
  for (const c of pack.soc2) {
    lines.push(`### ${c.id} — ${c.name}`);
    lines.push(`**${t("Estado", "Status")}:** ${c.status === "satisfied" ? "✅" : "⚠️"} ${c.status}`);
    lines.push(`${c.summary}`);
    if (c.missing.length) lines.push(`**${t("Falta", "Missing")}:** ${c.missing.join(", ")}`);
    lines.push("");
  }

  lines.push(`## ${t("ISO/IEC 27001:2022 Annex A", "ISO/IEC 27001:2022 Annex A")}`);
  for (const c of pack.iso27001) {
    lines.push(`### ${c.id} — ${c.name}`);
    lines.push(`**${t("Estado", "Status")}:** ${c.status === "satisfied" ? "✅" : "⚠️"} ${c.status}`);
    lines.push(`${c.summary}`);
    if (c.missing.length) lines.push(`**${t("Falta", "Missing")}:** ${c.missing.join(", ")}`);
    lines.push("");
  }

  lines.push(`## ${t("Disclaimer", "Disclaimer")}`);
  lines.push(t(
    "Este evidence pack es auto-generado del state técnico actual. NO sustituye un audit externo SOC 2 / ISO 27001 hecho por un assessor licenciado.",
    "This evidence pack is auto-generated from current technical state. It does NOT replace an external SOC 2 / ISO 27001 audit by a licensed assessor."
  ));
  return lines.join("\n");
}

/**
 * JSON formatting — para tooling de auditor (Drata, Vanta, etc.).
 */
export function formatPackAsJson(pack) {
  if (!pack) return "{}";
  return JSON.stringify(pack, null, 2);
}

/**
 * Util — count satisfied per framework.
 */
export function frameworkCoverage(pack) {
  if (!pack) return { soc2: 0, iso27001: 0 };
  return {
    soc2: pack.summary.soc2.satisfied,
    iso27001: pack.summary.iso27001.satisfied,
  };
}
