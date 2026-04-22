"use client";
/* ═══════════════════════════════════════════════════════════════
   BaselineCard — visualiza el baseline neural del usuario.

   Expone el snapshot capturado en onboarding (NeuralCalibration) +
   evolución a lo largo del historial. Cierra el loop "tu sistema se
   adapta a ti" — sin visibilidad, la calibración era ceremonia muda.

   Estados:
     - Sin baseline: prompt para calibrar por primera vez.
     - Con baseline: tarjeta con composite + 4 métricas + sparkline.
     - > 30 días: badge de "re-calibrar recomendado" (pasivo).
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, ty, space, radius } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_DAYS = 30;

function daysSince(ts) {
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / DAY_MS);
}

function profileColor(profile) {
  switch (profile) {
    case "alto_rendimiento": return "#059669";
    case "funcional":        return "#0D9488";
    case "en_desarrollo":    return "#D97706";
    case "recuperación":     return "#8B5CF6";
    default:                 return "#64748B";
  }
}

function Sparkline({ values, color, width = 120, height = 28 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const last = values[values.length - 1];
  const lastX = (values.length - 1) * step;
  const lastY = height - ((last - min) / range) * height;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

function Metric({ label, value, unit, color, t1, t3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 10, color: t3, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: color || t1, letterSpacing: -0.3, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 10, color: t3, fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function BaselineCard({ st, isDark, ac, onRecalibrate }) {
  const reduced = useReducedMotion();
  const { card: cd, surface: sf, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const baseline = st.neuralBaseline;
  const history = st.calibrationHistory || [];

  const sparkValues = useMemo(() => {
    if (history.length < 2) return null;
    return history.map(h => h.composite ?? 0);
  }, [history]);

  const capturedAt = baseline?.timestamp || history[history.length - 1]?.ts;
  const days = daysSince(capturedAt);
  const stale = days != null && days > STALE_DAYS;

  // Sin baseline todavía: prompt para calibrar
  if (!baseline) {
    return (
      <motion.button
        whileTap={reduced ? {} : { scale: 0.98 }}
        onClick={onRecalibrate}
        aria-label="Capturar tu baseline neural"
        style={{
          inlineSize: "100%",
          padding: 14,
          borderRadius: 16,
          border: `1.5px dashed ${withAlpha(ac, 35)}`,
          background: `linear-gradient(135deg, ${withAlpha(ac, 6)}, ${withAlpha(ac, 2)})`,
          cursor: "pointer",
          textAlign: "start",
          marginBlockEnd: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{
          inlineSize: 38, blockSize: 38, borderRadius: "50%",
          background: withAlpha(ac, 12), display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="radar" size={18} color={ac} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...ty.title(t1), marginBlockEnd: 2 }}>Captura tu baseline neural</div>
          <div style={ty.caption(t3)}>60 segundos · RT, respiración, foco, estado</div>
        </div>
        <Icon name="chevron" size={12} color={t3} />
      </motion.button>
    );
  }

  const pColor = profileColor(baseline.profile);
  const composite = baseline.composite ?? 0;

  return (
    <motion.article
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4 }}
      aria-label="Baseline neural"
      style={{
        background: cd,
        borderRadius: 16,
        padding: 14,
        marginBlockEnd: 10,
        border: `1px solid ${bd}`,
        position: "relative",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[2] }}>
        <Icon name="radar" size={12} color={t3} aria-hidden="true" />
        <h3 style={{ fontSize: 12, fontWeight: 600, color: t3, letterSpacing: -0.05, margin: 0, flex: 1 }}>
          Baseline Neural
        </h3>
        {stale && (
          <span
            aria-label="Recalibración recomendada"
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "#D97706",
              background: "rgba(217,119,6,0.12)",
              border: "1px solid rgba(217,119,6,0.32)",
              padding: "2px 7px",
              borderRadius: 99,
            }}
          >
            Recalibrar
          </span>
        )}
      </header>

      {/* Profile + composite hero */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px", marginBlockEnd: 12,
        background: withAlpha(pColor, isDark ? 8 : 4),
        border: `1px solid ${withAlpha(pColor, 22)}`,
        borderRadius: 12,
      }}>
        <div style={{
          inlineSize: 44, blockSize: 44, borderRadius: "50%",
          background: `radial-gradient(circle, ${withAlpha(pColor, 32)}, ${withAlpha(pColor, 10)} 70%, transparent)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          border: `1.5px solid ${withAlpha(pColor, 48)}`,
        }}>
          <span style={{
            fontSize: 16, fontWeight: 800, color: pColor,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: -0.5,
          }}>
            {composite}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: pColor,
            letterSpacing: -0.2, marginBlockEnd: 2,
          }}>
            {baseline.profileLabel || "Perfil"}
          </div>
          <div style={{ fontSize: 10, color: t3, letterSpacing: 0.2 }}>
            {days === 0 ? "Capturado hoy" : days === 1 ? "Capturado ayer" : `Capturado hace ${days} días`}
          </div>
        </div>
        {sparkValues && (
          <div style={{ flexShrink: 0 }}>
            <Sparkline values={sparkValues} color={pColor} width={70} height={24} />
          </div>
        )}
      </div>

      {/* 4 métricas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 10,
        padding: "10px 12px",
        background: sf,
        borderRadius: 12,
        border: `1px solid ${bd}`,
        marginBlockEnd: 10,
      }}>
        <Metric
          label="Reacción"
          value={baseline.avgRT ? Math.round(baseline.avgRT) : "—"}
          unit="ms"
          t1={t1}
          t3={t3}
        />
        <Metric
          label="Respiración"
          value={baseline.breathHold ?? "—"}
          unit="s"
          t1={t1}
          t3={t3}
        />
        <Metric
          label="Foco"
          value={baseline.focusAccuracy != null ? Math.round(baseline.focusAccuracy) : "—"}
          unit="/100"
          t1={t1}
          t3={t3}
        />
        <Metric
          label="Estrés"
          value={baseline.stressLevel ? `${baseline.stressLevel}/5` : "—"}
          unit=""
          t1={t1}
          t3={t3}
        />
      </div>

      {/* Recomendación derivada */}
      {baseline.recommendations && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 11, color: t2, lineHeight: 1.5,
        }}>
          <Icon name="mind" size={11} color={ac} aria-hidden="true" />
          <span>
            Recomendación: <strong style={{ color: t1, fontWeight: 700 }}>{baseline.recommendations.primaryIntent}</strong>
            {" · "}meta diaria <strong style={{ color: t1, fontWeight: 700 }}>{baseline.recommendations.sessionGoal}</strong>
          </span>
        </div>
      )}
    </motion.article>
  );
}
