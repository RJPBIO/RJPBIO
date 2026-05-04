/* OrgExecutiveReport — Phase 6F SP-D
   ═══════════════════════════════════════════════════════════════
   Portada DNA Nom35PersonalReport: eyebrow + nombre org + italic +
   meta (periodo + miembros + generated). Renderiza los 11 secciones
   del shape ExecutiveReport (SP-C):
     · suppressed (k<5 top-level): mensaje + footer
     · KpiHero (6 KPIs)
     · Nom35TrendsPanel (10 dominios)
     · HrvTrendsPanel (RMSSD weekly)
     · ProgramsCohortPanel (pre/post)
     · CorrelationPanel (HRV ↔ NOM-035 Pearson r)
     · TopProtocolsPanel (top 5 effectiveness)
     · ComplianceFooter (k≥5 + LFPDPPP/GDPR)

   Server component (orchestrator) — los panels con recharts son client.
   PrintButton es client-only. ZERO JS para el resto del árbol.

   Soporte BORRADOR watermark cuando NEXT_PUBLIC_NOM35_DOF_VERIFIED ≠ "true"
   (consistente con CLAUDE.md `nom035TextValidatedByLawyer = false`).
   ═══════════════════════════════════════════════════════════════ */

import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";
import KpiHero from "./reports/KpiHero";
import Nom35TrendsPanel from "./reports/Nom35TrendsPanel";
import HrvTrendsPanel from "./reports/HrvTrendsPanel";
import ProgramsCohortPanel from "./reports/ProgramsCohortPanel";
import CorrelationPanel from "./reports/CorrelationPanel";
import TopProtocolsPanel from "./reports/TopProtocolsPanel";
import PrintButton from "./reports/PrintButton";

export default function OrgExecutiveReport({ report, isPrintMode = false }) {
  if (!report) return null;

  const dofVerified = process.env.NEXT_PUBLIC_NOM35_DOF_VERIFIED === "true";
  const showBorrador = !dofVerified;

  // Branch suppressed top-level (org < 5 members)
  if (report.suppressed) {
    return (
      <article data-v2-executive-report data-suppressed="true">
        {showBorrador && <BorradorWatermark />}
        <ReportHeader report={report} />
        <section
          aria-label="Reporte suprimido por k-anonimato"
          style={{
            marginBlockStart: space[6],
            marginBlockEnd: space[6],
            padding: space[5],
            background: cssVar.surface,
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.md,
            display: "flex",
            flexDirection: "column",
            gap: space[3],
          }}
        >
          <div style={{
            fontFamily: cssVar.fontMono,
            fontSize: font.size.xs,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: bioSignal.phosphorCyanInk,
            fontWeight: font.weight.semibold,
          }}>
            K-anonimato
          </div>
          <p style={{
            margin: 0,
            fontSize: font.size.lg,
            fontWeight: font.weight.bold,
            color: cssVar.text,
            letterSpacing: font.tracking.tight,
            lineHeight: 1.3,
          }}>
            {report.message || "Reporte requiere mínimo 5 miembros activos."}
          </p>
          <p style={{
            margin: 0,
            fontSize: font.size.sm,
            color: cssVar.textMuted,
            lineHeight: 1.5,
          }}>
            Para preservar la privacidad individual, el reporte agregado solo se genera
            cuando hay al menos 5 personas activas. Conforme tu equipo crezca y use la
            plataforma, el reporte se mostrará automáticamente.
          </p>
        </section>
        <ComplianceFooter snapshot={report.snapshot} />
      </article>
    );
  }

  return (
    <article
      data-v2-executive-report
      data-org-id={report.org?.id}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: space[5],
      }}
    >
      {showBorrador && <BorradorWatermark />}

      <ReportHeader report={report} />

      <KpiHero kpis={report.kpis} />

      <Nom35TrendsPanel
        summary={report.nom35?.summary}
        trends={report.nom35?.trends}
      />

      <HrvTrendsPanel hrv={report.hrv} />

      <ProgramsCohortPanel programs={report.programs} />

      <CorrelationPanel correlation={report.correlation} />

      <TopProtocolsPanel topProtocols={report.topProtocols} />

      <ComplianceFooter snapshot={report.snapshot} />

      {!isPrintMode && (
        <div
          data-v2-print-actions
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingBlockStart: space[3],
            borderBlockStart: `1px solid ${cssVar.border}`,
          }}
        >
          <PrintButton />
        </div>
      )}
    </article>
  );
}

function ReportHeader({ report }) {
  const start = formatDate(report.period?.start);
  const end = formatDate(report.period?.end);
  const generated = formatDateTime(report.snapshot?.generatedAt);
  const days = report.period?.days;
  const activeMembers = report.org?.activeMembers ?? null;

  return (
    <header data-v2-report-header style={{
      display: "flex",
      flexDirection: "column",
      gap: space[2],
      paddingBlockEnd: space[4],
      borderBlockEnd: `1px solid ${cssVar.border}`,
    }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: cssVar.fontMono,
        fontSize: font.size.xs,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: bioSignal.phosphorCyanInk,
        fontWeight: font.weight.semibold,
      }}>
        <span aria-hidden="true" style={{
          width: 6, height: 6, borderRadius: "50%",
          background: bioSignal.phosphorCyan,
          boxShadow: `0 0 8px ${bioSignal.phosphorCyan}`,
        }} />
        Reporte ejecutivo · NOM-035 + Biometría neural
      </div>
      <h1 style={{
        margin: 0,
        fontSize: font.size["3xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
        lineHeight: 1.05,
        color: cssVar.text,
      }}>
        <span className="bi-admin-h1-italic" style={{ marginInlineEnd: ".25em" }}>
          Tu organización:
        </span>
        {report.org?.name || "—"}
      </h1>
      <p style={{
        margin: 0,
        fontSize: font.size.sm,
        color: cssVar.textMuted,
        lineHeight: 1.55,
      }}>
        Periodo: {start} – {end} ({days} días)
        {activeMembers != null && ` · ${activeMembers} miembros activos`}
        {generated && ` · Generado ${generated}`}
      </p>
    </header>
  );
}

function ComplianceFooter({ snapshot }) {
  const k = snapshot?.kAnonThreshold ?? 5;
  const version = snapshot?.version ?? "v1";
  return (
    <footer
      data-v2-report-footer
      style={{
        marginBlockStart: space[6],
        paddingBlockStart: space[4],
        borderBlockStart: `1px solid ${cssVar.border}`,
        display: "flex",
        flexDirection: "column",
        gap: space[2],
        color: cssVar.textMuted,
        fontSize: font.size.xs,
        lineHeight: 1.55,
      }}
    >
      <p style={{ margin: 0 }}>
        Datos agregados con k-anonimato ≥ {k} · LFPDPPP / GDPR Art-89 compliant ·
        Bio-Ignición no es dispositivo médico ni sustituye atención profesional.
      </p>
      <p style={{ margin: 0, color: cssVar.textDim }}>
        Versión {version} · Cohen 1983 (PSS-4) · Stewart-Brown 2009 (SWEMWBS-7) ·
        Kroenke 2003 (PHQ-2) · NOM-035-STPS-2018 (10 dominios oficiales DOF).
      </p>
    </footer>
  );
}

function BorradorWatermark() {
  return (
    <div
      data-v2-borrador-watermark
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        padding: "4px 12px",
        background: "rgba(245, 158, 11, 0.12)",
        border: "1px solid rgba(245, 158, 11, 0.4)",
        borderRadius: 4,
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#FBBF24",
        fontFamily: cssVar.fontMono,
        fontWeight: font.weight.semibold,
        pointerEvents: "none",
        zIndex: 90,
      }}
    >
      Borrador · No verificado DOF
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
