/* ProgramsCohortPanel — Phase 6F SP-D
   Pre/post per programId con PSS-4 + RMSSD delta. Server component.
   Inverted=true para PSS-4 (lower is better); RMSSD higher is better. */

import { PROGRAMS } from "@/lib/programs";
import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";
import SectionHeader from "./SectionHeader";

const PROGRAM_NAMES = Object.fromEntries(PROGRAMS.map((p) => [p.id, p.n]));

export default function ProgramsCohortPanel({ programs }) {
  if (!programs) return null;

  if (programs.suppressed) {
    return (
      <section data-v2-programs-cohort data-suppressed="true" style={{ marginBlockStart: space[6] }}>
        <SectionHeader
          eyebrow="Programas · cohort"
          italic="Pre / post."
          title="Comparativa no disponible"
          subtitle={`Mínimo 5 programas completados — actual: ${programs.n || 0}`}
        />
      </section>
    );
  }

  const cohortEntries = Object.entries(programs.cohorts || {});
  const completionPct =
    typeof programs.completionRate === "number"
      ? Math.round(programs.completionRate * 100)
      : null;

  if (cohortEntries.length === 0) {
    return (
      <section data-v2-programs-cohort-empty style={{ marginBlockStart: space[6] }}>
        <SectionHeader
          eyebrow="Programas · cohort"
          italic="Pre / post."
          title="Sin programas con cohort suficiente"
          subtitle={completionPct != null ? `Completion ${completionPct}% en periodo` : undefined}
        />
      </section>
    );
  }

  return (
    <section
      data-v2-programs-cohort
      style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
    >
      <SectionHeader
        eyebrow="Programas · cohort"
        italic="Pre / post."
        title={
          completionPct != null
            ? `${completionPct}% completion · ${programs.n} programas terminados`
            : `${programs.n} programas terminados`
        }
        subtitle="Cambio en PSS-4 (estrés) y RMSSD (HRV) tras completar el programa"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: space[3],
        }}
      >
        {cohortEntries.map(([programId, cohort]) => (
          <CohortCard key={programId} programId={programId} cohort={cohort} />
        ))}
      </div>
    </section>
  );
}

function CohortCard({ programId, cohort }) {
  const programName = PROGRAM_NAMES[programId] || programId;
  if (cohort.suppressed) {
    return (
      <article
        data-v2-cohort-card
        data-suppressed="true"
        style={{
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          padding: space[4],
          display: "flex",
          flexDirection: "column",
          gap: space[2],
        }}
      >
        <div style={cohortHeaderStyle}>
          <span style={cohortNameStyle}>{programName}</span>
          <span style={cohortMutedStyle}>n = {cohort.n}</span>
        </div>
        <p style={{
          color: cssVar.textMuted,
          fontSize: font.size.sm,
          margin: 0,
          lineHeight: 1.4,
        }}>
          {cohort.reason === "program_not_in_catalog"
            ? "Programa no encontrado en catálogo"
            : "Muestra insuficiente para mostrar comparativa"}
        </p>
      </article>
    );
  }

  return (
    <article
      data-v2-cohort-card
      data-program-id={programId}
      style={{
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        padding: space[4],
        display: "flex",
        flexDirection: "column",
        gap: space[3],
      }}
    >
      <div style={cohortHeaderStyle}>
        <span style={cohortNameStyle}>{programName}</span>
        <span style={cohortMutedStyle}>n = {cohort.n} · {cohort.duration}d</span>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: space[3],
      }}>
        <CohortMetric
          label="PSS-4 estrés"
          metric={cohort.pss4}
          inverted
          unit=""
        />
        <CohortMetric
          label="RMSSD (HRV)"
          metric={cohort.hrv}
          unit="ms"
        />
      </div>
    </article>
  );
}

function CohortMetric({ label, metric, unit, inverted = false }) {
  if (!metric || metric.suppressed) {
    return (
      <div data-v2-cohort-metric data-suppressed="true">
        <div style={metricLabelStyle}>{label}</div>
        <p style={{ color: cssVar.textMuted, fontSize: font.size.xs, margin: 0 }}>
          Sin pares pre/post suficientes
        </p>
      </div>
    );
  }

  const { preMean, postMean, delta } = metric;
  const improved = inverted ? delta < 0 : delta > 0;
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  const accent = improved
    ? bioSignal.phosphorCyanInk
    : "#D97706";

  return (
    <div data-v2-cohort-metric data-improved={improved}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBlockStart: 4 }}>
        <span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.lg, color: cssVar.textDim }}>
          {preMean.toFixed(1)}
        </span>
        <span style={{ color: cssVar.textMuted, fontSize: font.size.xs }}>→</span>
        <span style={{
          fontFamily: cssVar.fontMono,
          fontSize: font.size["2xl"],
          color: accent,
          fontWeight: 200,
          letterSpacing: "-0.02em",
        }}>
          {postMean.toFixed(1)}
        </span>
        {unit && (
          <span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.xs, color: cssVar.textMuted }}>
            {unit}
          </span>
        )}
      </div>
      <div style={{
        marginBlockStart: 4,
        fontFamily: cssVar.fontMono,
        fontSize: font.size.xs,
        color: accent,
        letterSpacing: "0.04em",
      }}>
        {arrow} {Math.abs(delta).toFixed(2)} {improved ? "(mejor)" : "(retrocedió)"}
      </div>
      <div style={{
        marginBlockStart: 2,
        fontSize: font.size.xs,
        color: cssVar.textMuted,
      }}>
        {metric.n} pares con pre+post
      </div>
    </div>
  );
}

const cohortHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: space[3],
  paddingBlockEnd: space[2],
  borderBlockEnd: `1px solid ${cssVar.border}`,
};
const cohortNameStyle = {
  fontSize: font.size.lg,
  fontWeight: font.weight.bold,
  color: cssVar.text,
  letterSpacing: font.tracking.tight,
};
const cohortMutedStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: cssVar.textMuted,
  letterSpacing: "0.06em",
};
const metricLabelStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
};
