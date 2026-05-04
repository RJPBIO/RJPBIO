/* CorrelationPanel — Phase 6F SP-D
   HRV ↔ NOM-035 Pearson r + interpretation semántico. Server component. */

import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";
import SectionHeader from "./SectionHeader";

const INTERPRET_COPY = {
  no_correlation: {
    label: "Sin correlación detectable",
    body:
      "No se observa relación significativa entre la variabilidad cardíaca de tu equipo y los niveles de riesgo psicosocial NOM-035 en este periodo.",
  },
  weak: {
    label: "Correlación leve",
    body:
      "Hay una relación leve entre HRV y riesgo psicosocial. Una muestra mayor podría clarificar la tendencia.",
  },
  moderate: {
    label: "Correlación moderada",
    body:
      "Existe una relación moderada: la biometría neural respalda la evaluación NOM-035. Útil para triangulación con instrumentos auto-reportados.",
  },
  strong: {
    label: "Correlación fuerte",
    body:
      "Relación fuerte: HRV bajo se asocia consistentemente con NOM-035 alto en tu equipo. La biometría neural confirma el patrón observado por el instrumento.",
  },
};

export default function CorrelationPanel({ correlation }) {
  if (!correlation) return null;

  if (correlation.suppressed) {
    return (
      <section
        data-v2-correlation
        data-suppressed="true"
        style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
      >
        <SectionHeader
          eyebrow="Correlación · HRV ↔ NOM-035"
          italic="Triangulación."
          title="Sin muestra suficiente"
          subtitle={`Mínimo 5 personas con ambas mediciones — actual: ${correlation.n || 0}`}
        />
      </section>
    );
  }

  const r = correlation.pearsonR;
  const interpret = INTERPRET_COPY[correlation.interpretation] || INTERPRET_COPY.no_correlation;
  const direction = r < 0 ? "negativa" : r > 0 ? "positiva" : "nula";

  return (
    <section
      data-v2-correlation
      style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
    >
      <SectionHeader
        eyebrow="Correlación · HRV ↔ NOM-035"
        italic="Triangulación biometría +"
        title={`r = ${r.toFixed(3)} (${direction})`}
        subtitle={`${correlation.n} miembros con ambas mediciones · ${interpret.label}`}
      />
      <article
        style={{
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          padding: space[4],
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: space[4],
          alignItems: "center",
        }}
      >
        <CorrelationDial r={r} />
        <p style={{
          margin: 0,
          fontSize: font.size.base,
          color: cssVar.text,
          lineHeight: 1.55,
        }}>
          {interpret.body}
        </p>
      </article>
      <p style={{
        marginBlockStart: space[2],
        fontSize: font.size.xs,
        color: cssVar.textMuted,
        lineHeight: 1.5,
      }}>
        Pearson r entre RMSSD medio y NOM-035 total cross-section · k-anon ≥ 5 ·
        valores extremos próximos a ±1 indican relación lineal fuerte.
      </p>
    </section>
  );
}

function CorrelationDial({ r }) {
  // Map r [-1, 1] → angle [-90deg, 90deg]
  const clamped = Math.max(-1, Math.min(1, Number(r) || 0));
  const angle = clamped * 90;
  const accent = Math.abs(clamped) >= 0.5
    ? bioSignal.phosphorCyan
    : Math.abs(clamped) >= 0.3
      ? bioSignal.phosphorCyanInk
      : "#94A3B8";

  return (
    <svg
      role="img"
      aria-label={`Correlación r = ${clamped.toFixed(3)}`}
      width="80"
      height="80"
      viewBox="0 0 80 80"
      style={{ flexShrink: 0 }}
    >
      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bi-border)" strokeWidth="2" />
      <line x1="40" y1="40" x2="40" y2="10" stroke="var(--bi-border)" strokeWidth="1" strokeDasharray="2 3" />
      <line
        x1="40"
        y1="40"
        x2={40 + 28 * Math.sin((angle * Math.PI) / 180)}
        y2={40 - 28 * Math.cos((angle * Math.PI) / 180)}
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="40" cy="40" r="3" fill={accent} />
      <text
        x="40"
        y="68"
        fontSize="9"
        fontFamily="var(--font-mono)"
        textAnchor="middle"
        fill="var(--bi-text-muted)"
        letterSpacing="1"
      >
        {clamped.toFixed(2)}
      </text>
    </svg>
  );
}
