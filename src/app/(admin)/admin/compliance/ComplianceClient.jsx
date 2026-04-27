"use client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/admin/PageHeader";
import SegmentedNav from "@/components/admin/SegmentedNav";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const COMPLIANCE_NAV = [
  { href: "/admin/compliance", label: "SOC 2 · ISO 27001" },
  { href: "/admin/compliance/dsar", label: "DSAR" },
  { href: "/admin/audit", label: "Audit log" },
];

const TONE_VARIANT = {
  success: "success",
  warn: "warn",
  danger: "danger",
  soft: "soft",
  neutral: "neutral",
};

function CoverageRing({ coverage }) {
  const tone = coverage >= 90 ? "#10B981"
    : coverage >= 70 ? "#F59E0B"
    : "#EF4444";
  return (
    <div style={{
      width: 88, height: 88,
      borderRadius: "50%",
      background: `conic-gradient(${tone} ${coverage * 3.6}deg, ${cssVar.surface2} 0)`,
      display: "grid", placeItems: "center",
      flexShrink: 0,
    }}>
      <div style={{
        width: 70, height: 70,
        borderRadius: "50%",
        background: cssVar.surface,
        display: "grid", placeItems: "center",
        fontWeight: font.weight.black,
        fontSize: font.size.lg,
        color: cssVar.text,
      }}>
        {coverage}%
      </div>
    </div>
  );
}

function ControlCard({ control }) {
  return (
    <li style={{
      padding: space[3],
      background: cssVar.surface,
      border: `1px solid ${cssVar.border}`,
      borderRadius: radius.sm,
      borderLeft: `3px solid ${
        control.tone === "success" ? "#10B981" :
        control.tone === "warn" ? "#F59E0B" :
        control.tone === "danger" ? "#EF4444" : "#94A3B8"
      }`,
    }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space[2] }}>
        <div>
          <code style={{ fontFamily: cssVar.fontMono, fontSize: font.size.xs, color: cssVar.textDim }}>
            {control.id}
          </code>
          <strong style={{ marginInlineStart: space[2], color: cssVar.text }}>{control.name}</strong>
        </div>
        <Badge variant={TONE_VARIANT[control.tone] || "soft"} size="sm">
          {control.status === "satisfied" ? "✓" : "⚠"} {control.status}
        </Badge>
      </header>
      <p style={{ margin: `${space[1]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.sm }}>
        {control.summary}
      </p>
      {control.missing.length > 0 && (
        <p style={{
          margin: `${space[1]}px 0 0`,
          fontSize: font.size.xs,
          color: cssVar.textDim,
          fontFamily: cssVar.fontMono,
        }}>
          Falta: {control.missing.join(", ")}
        </p>
      )}
    </li>
  );
}

export default function ComplianceClient({ orgId, orgName, pack }) {
  const downloadUrl = (format) => `/api/v1/orgs/${orgId}/compliance/export?format=${format}`;

  return (
    <article>
      <PageHeader
        eyebrow="Compliance · evidence pack"
        italic="Auditable"
        title="por diseño."
        subtitle={`SOC 2 Trust Services Criteria + ISO/IEC 27001:2022 Annex A · ${orgName}`}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: space[3] }}>
            <CoverageRing coverage={pack.summary.coverage} />
            <div style={{ fontSize: font.size.sm }}>
              <div style={{ color: cssVar.text, fontWeight: font.weight.bold }}>
                {pack.summary.totalSatisfied}/{pack.summary.totalControls} controls
              </div>
              <div style={{ color: cssVar.textMuted, fontSize: font.size.xs }}>
                SOC 2: {pack.summary.soc2.satisfied}/{pack.summary.soc2.total}<br />
                ISO 27001: {pack.summary.iso27001.satisfied}/{pack.summary.iso27001.total}
              </div>
            </div>
          </div>
        }
      />
      <SegmentedNav items={COMPLIANCE_NAV} ariaLabel="Sub-navegación de compliance" />

      <div style={{
        display: "flex", gap: space[2], flexWrap: "wrap",
        marginBlockEnd: space[5],
        padding: space[4],
        background: cssVar.surface2,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
      }}>
        <div style={{ flex: "1 1 360px", minWidth: 240 }}>
          <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text }}>
            Evidence pack
          </h2>
          <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, margin: `${space[1]}px 0 0` }}>
            Auto-generado del state técnico actual. Para auditor SOC 2 / ISO 27001
            externo o pre-sales review. NO sustituye un audit licenciado.
          </p>
        </div>
        <div style={{ display: "flex", gap: space[2], flexWrap: "wrap" }}>
          <Button href={downloadUrl("markdown")} variant="primary">
            Descargar Markdown
          </Button>
          <Button href={downloadUrl("json")} variant="secondary">
            Descargar JSON
          </Button>
        </div>
      </div>

      <section style={{ marginBlockEnd: space[5] }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: space[3] }}>
          <h2 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>
            SOC 2 Trust Services Criteria
          </h2>
          <Badge variant="success" size="sm">
            {pack.summary.soc2.satisfied} / {pack.summary.soc2.total}
          </Badge>
        </header>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: space[2] }}>
          {pack.soc2.map((c) => <ControlCard key={c.id} control={c} />)}
        </ul>
      </section>

      <section style={{ marginBlockEnd: space[5] }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: space[3] }}>
          <h2 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>
            ISO/IEC 27001:2022 Annex A
          </h2>
          <Badge variant="success" size="sm">
            {pack.summary.iso27001.satisfied} / {pack.summary.iso27001.total}
          </Badge>
        </header>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: space[2] }}>
          {pack.iso27001.map((c) => <ControlCard key={c.id} control={c} />)}
        </ul>
      </section>

      <Alert kind="info" style={{ marginBlockStart: space[5] }}>
        <strong>Cómo cerrar gaps:</strong> activa SSO en <a href="/admin/sso" style={{ color: cssVar.accent }}>/admin/sso</a>,
        require-MFA + IP allowlist + session TTL en <a href="/admin/security/policies" style={{ color: cssVar.accent }}>/admin/security/policies</a>,
        retention + verify chain en <a href="/admin/audit/settings" style={{ color: cssVar.accent }}>/admin/audit/settings</a>,
        crea API key con scope:scim en <a href="/admin/api-keys" style={{ color: cssVar.accent }}>/admin/api-keys</a>,
        rota webhook secrets en <a href="/admin/webhooks" style={{ color: cssVar.accent }}>/admin/webhooks</a>.
      </Alert>

      <Alert kind="warn" style={{ marginBlockStart: space[3] }}>
        <strong>Disclaimer.</strong> Este dashboard refleja state técnico actual del org. No sustituye un audit
        SOC 2 Type II o ISO 27001 hecho por un assessor licenciado (Drata, Vanta, Tugboat, etc.). Es evidence
        para la sección "Information Security" de tu security review form.
      </Alert>
    </article>
  );
}
