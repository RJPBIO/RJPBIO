/* KpiHero — Phase 6F SP-D
   6 KPIs principales del reporte ejecutivo en grid 3 cols.
   ADN: big numbers Inter Tight 200, units mono cyan.
   Server component (sin hooks, sin recharts). */

import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";

const NIVEL_LABELS = {
  nulo: "Nulo / despreciable",
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  muy_alto: "Muy alto",
};

export default function KpiHero({ kpis }) {
  if (!kpis || typeof kpis !== "object") return null;

  const fmt = (v, decimals = 0) => {
    if (v == null || !Number.isFinite(v)) return "—";
    return decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
  };

  const fmtPct = (v) => {
    if (v == null || !Number.isFinite(v)) return "—";
    return Math.round(v * 100).toString();
  };

  return (
    <section
      data-v2-kpi-hero
      aria-label="Indicadores clave del reporte"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: space[3],
        marginBlockStart: space[5],
        marginBlockEnd: space[5],
      }}
    >
      <KpiCard
        label="Miembros activos"
        value={fmt(kpis.activeMembers)}
        suffix="personas"
      />
      <KpiCard
        label="Sesiones totales"
        value={fmt(kpis.sessionsTotal)}
        suffix="en periodo"
      />
      <KpiCard
        label="Sesiones / miembro"
        value={fmt(kpis.sessionsPerActiveMember, 1)}
      />
      <KpiCard
        label="Δ Coherencia HRV"
        value={fmt(kpis.hrvDeltaMean, 1)}
        suffix={kpis.hrvDeltaMean != null ? "score" : ""}
      />
      <KpiCard
        label="Δ Mood medio"
        value={fmt(kpis.moodDeltaMean, 2)}
        suffix={kpis.moodDeltaMean != null ? "puntos" : ""}
      />
      <KpiCard
        label="Adhesión programas"
        value={fmtPct(kpis.programCompletionRate)}
        suffix={kpis.programCompletionRate != null ? "%" : ""}
        tone={kpis.programCompletionRate != null && kpis.programCompletionRate >= 0.6 ? "success" : "neutral"}
      />
      {kpis.nom35Level && (
        <KpiCard
          label="NOM-035 nivel agregado"
          value={NIVEL_LABELS[kpis.nom35Level] || kpis.nom35Level}
          tone={
            kpis.nom35Level === "alto" || kpis.nom35Level === "muy_alto"
              ? "danger"
              : kpis.nom35Level === "medio"
                ? "warn"
                : "success"
          }
          isText
        />
      )}
    </section>
  );
}

function KpiCard({ label, value, suffix, tone = "neutral", isText = false }) {
  const accent =
    tone === "success" ? "#10B981" :
    tone === "warn" ? "#D97706" :
    tone === "danger" ? "#DC2626" :
    bioSignal.phosphorCyanInk;
  return (
    <article
      data-v2-kpi-card
      data-tone={tone}
      style={{
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        padding: `${space[4]}px ${space[4]}px`,
        display: "flex",
        flexDirection: "column",
        gap: space[2],
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: cssVar.fontMono,
          fontSize: font.size.xs,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: cssVar.textDim,
          fontWeight: font.weight.semibold,
        }}
      >
        <span aria-hidden="true" style={{
          width: 6, height: 6, borderRadius: "50%",
          background: accent,
        }} />
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontSize: isText ? font.size.lg : 36,
            // ADN ejecutivo: big numbers Inter Tight 200 (thin). El stack
            // local de tokens NO expone alias `thin`; usamos literal.
            fontWeight: 200,
            color: accent,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            fontFamily: cssVar.fontSans,
          }}
        >
          {value}
        </span>
        {suffix && (
          <span
            style={{
              fontFamily: cssVar.fontMono,
              fontSize: font.size.xs,
              color: bioSignal.phosphorCyanInk,
              letterSpacing: "0.06em",
              textTransform: "lowercase",
              fontWeight: font.weight.semibold,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </article>
  );
}
