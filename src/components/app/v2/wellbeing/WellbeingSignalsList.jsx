/* WellbeingSignalsList — Phase 6F SP-F
   Lista server-renderable de signals activas con explicación humana.
   Server component (sin hooks). Usa v2 tokens.

   Marketing copy (D8): "patrones consistentes con agotamiento", NO
   "diagnóstico" ni "burnout score". Cada signal tiene title humano +
   description + métrica específica si aplica. */

import { colors, typography, spacing, radii, surfaces, withAlpha } from "../tokens";

const SIGNAL_EXPLANATIONS = {
  freqDrop: {
    title: "Frecuencia de sesiones declinó",
    description:
      "Tu frecuencia reciente es notablemente menor a tu baseline. " +
      "Considera retomar tu ritmo cuando puedas — la consistencia es valiosa.",
  },
  moodSlope: {
    title: "Mood pre-sesión muestra tendencia descendente",
    description:
      "Llegas a las sesiones con menor energía emocional que en semanas previas.",
  },
  effDrop: {
    title: "Efectividad de protocolos disminuyó",
    description:
      "Los protocolos producen menos lift de mood que en tu baseline. " +
      "Puede ser señal de que necesitas variar tu rutina.",
  },
  hrvDecline: {
    title: "Variabilidad cardíaca declinó",
    description:
      "Tu RMSSD reciente es menor a tu baseline 28 días. " +
      "HRV bajo se asocia con activación simpática sostenida.",
  },
  chronoDyssynchrony: {
    title: "Patrón sesión / cronotipo desalineado",
    description:
      "Tus sesiones recientes están consistentemente fuera de tu ventana fisiológica óptima. " +
      "Considera ajustar el horario al que coincide con tu cronotipo.",
  },
};

export default function WellbeingSignalsList({ signals, metrics }) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return (
      <p style={{
        margin: 0,
        fontFamily: typography.family,
        fontSize: typography.size.bodyMin,
        color: colors.text.secondary,
        lineHeight: 1.5,
      }}>
        No se detectaron señales en tu trayectoria reciente.
      </p>
    );
  }

  return (
    <ol
      data-v2-signals-list
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s8,
      }}
    >
      {signals.map((signal) => (
        <SignalRow key={signal} signal={signal} metrics={metrics} />
      ))}
    </ol>
  );
}

function SignalRow({ signal, metrics }) {
  const def = SIGNAL_EXPLANATIONS[signal] || {
    title: signal,
    description: "Detalle no disponible.",
  };

  return (
    <li
      data-v2-signal-row
      data-signal={signal}
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        borderInlineStart: `2px solid ${withAlpha(colors.semantic.warningRgb, 60)}`,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s8,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.semantic.warning,
          fontWeight: typography.weight.medium,
        }}
      >
        Señal · {signal}
      </div>
      <h4
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.medium,
          color: colors.text.strong,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
        }}
      >
        {def.title}
      </h4>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          fontWeight: typography.weight.regular,
          color: colors.text.secondary,
          lineHeight: 1.55,
        }}
      >
        {def.description}
      </p>
      <SignalMetric signal={signal} metrics={metrics} />
    </li>
  );
}

function SignalMetric({ signal, metrics }) {
  if (!metrics || typeof metrics !== "object") return null;

  if (signal === "hrvDecline") {
    const decline = metrics.hrvDeclinePct;
    const baseline = metrics.hrvBaseline28d;
    const recent = metrics.hrvRecent7d;
    if (typeof decline !== "number" || typeof baseline !== "number" || typeof recent !== "number") {
      return null;
    }
    return (
      <p style={metricStyle}>
        Decline {Math.round(decline * 100)}% · {baseline.toFixed(1)} ms baseline → {recent.toFixed(1)} ms reciente
      </p>
    );
  }

  // Sub-prompt example tenía field name incorrecto (chronoMisalignedDays).
  // Real field es chronoMisalignedSessions (per burnoutEnhanced.js metrics).
  if (signal === "chronoDyssynchrony") {
    const n = metrics.chronoMisalignedSessions;
    if (typeof n !== "number") return null;
    return (
      <p style={metricStyle}>
        {n} sesiones consecutivas fuera de tu ventana óptima
      </p>
    );
  }

  if (signal === "freqDrop" && typeof metrics.freqDrop === "number") {
    return (
      <p style={metricStyle}>
        Frecuencia reciente {Math.round((1 - metrics.freqDrop) * 100)}% del baseline
      </p>
    );
  }

  if (signal === "moodSlope" && typeof metrics.moodSlopePerWeek === "number") {
    return (
      <p style={metricStyle}>
        Pendiente: {metrics.moodSlopePerWeek.toFixed(2)} puntos/semana
      </p>
    );
  }

  if (signal === "effDrop" && typeof metrics.effectivenessDrop === "number") {
    return (
      <p style={metricStyle}>
        Effectiveness reciente {Math.round((1 - metrics.effectivenessDrop) * 100)}% del baseline
      </p>
    );
  }

  return null;
}

const metricStyle = {
  margin: 0,
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 11,
  letterSpacing: "0.04em",
  color: "rgba(245,245,247,0.5)",
  lineHeight: 1.4,
};
