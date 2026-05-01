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

// Interpretación semántica por métrica — convierte el número en un estado legible.
function interpretRT(ms) {
  if (!ms) return "—";
  if (ms < 280) return "Ágil";
  if (ms < 380) return "Óptimo";
  if (ms < 500) return "Estable";
  return "Recuperando";
}
function interpretBreath(s) {
  if (!s) return "—";
  if (s >= 35) return "Tono vagal alto";
  if (s >= 25) return "Buen tono";
  if (s >= 15) return "Funcional";
  return "En desarrollo";
}
function interpretFocus(acc) {
  if (acc == null) return "—";
  if (acc >= 85) return "Foco sostenido";
  if (acc >= 65) return "Estable";
  if (acc >= 45) return "Disperso";
  return "Bajo control";
}
function interpretStress(lv) {
  if (!lv) return "—";
  if (lv >= 5) return "En calma";
  if (lv >= 4) return "Tranquilo";
  if (lv >= 3) return "Neutral";
  if (lv >= 2) return "Agitado";
  return "Tenso";
}

// Delta: diferencia vs calibración anterior. `betterWhen` indica si "mejor"
// significa valor más alto ("higher") o más bajo ("lower" — ej. reacción).
function computeDelta(curr, prev, betterWhen) {
  if (curr == null || prev == null || prev === 0) return null;
  const raw = curr - prev;
  const pct = Math.round((raw / Math.abs(prev)) * 100);
  if (Math.abs(pct) < 1) return { raw, pct, tone: "neutral" };
  const improved = betterWhen === "higher" ? raw > 0 : raw < 0;
  return { raw, pct, tone: improved ? "up" : "down" };
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

function DeltaBadge({ delta, unit, betterWhen }) {
  if (!delta || delta.tone === "neutral") return null;
  const color = delta.tone === "up" ? "#059669" : "#DC2626";
  const arrow = delta.tone === "up" ? "↑" : "↓";
  const absPct = Math.abs(delta.pct);
  return (
    <span
      aria-label={`Cambio ${delta.tone === "up" ? "mejoró" : "empeoró"} ${absPct} por ciento`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontSize: 9,
        fontWeight: 700,
        color,
        letterSpacing: 0.2,
        padding: "1px 5px",
        borderRadius: 4,
        background: delta.tone === "up" ? "rgba(5,150,105,0.10)" : "rgba(220,38,38,0.10)",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}
    >
      {arrow}{absPct}%
    </span>
  );
}

const MONO_BL = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// Metric bar — horizontal "lab reading" row: label + hero value + unit + interp + delta + progress fill
function MetricBar({ label, value, displayValue, unit, interp, delta, betterWhen, fillPct, color }) {
  const hasValue = value !== null && value !== undefined && value !== "—";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: MONO_BL,
          fontSize: 8.5,
          fontWeight: 500,
          color: hasValue ? color : "rgba(245,245,247,0.40)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          minInlineSize: 50,
          textShadow: hasValue ? `0 0 5px ${withAlpha(color, 40)}` : "none",
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: MONO_BL,
          fontSize: 20,
          fontWeight: 300,
          color: hasValue ? "rgba(245,245,247,0.96)" : "rgba(245,245,247,0.45)",
          letterSpacing: -0.4,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}>
          {displayValue}
        </span>
        {unit && (
          <span style={{
            fontFamily: MONO_BL,
            fontSize: 9.5,
            fontWeight: 500,
            color: "rgba(245,245,247,0.50)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            {unit}
          </span>
        )}
        {interp && (
          <span style={{
            fontFamily: MONO_BL,
            fontSize: 8,
            fontWeight: 500,
            color: hasValue ? "rgba(245,245,247,0.55)" : "rgba(245,245,247,0.30)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginInlineStart: 2,
          }}>
            · {interp}
          </span>
        )}
        <span style={{ marginInlineStart: "auto" }}>
          <DeltaBadge delta={delta} unit={unit} betterWhen={betterWhen} />
        </span>
      </div>
      {/* Progress bar fill — normalized to expected range */}
      <div style={{
        position: "relative",
        blockSize: 3,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 99,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          inlineSize: `${Math.max(0, Math.min(100, fillPct * 100))}%`,
          background: hasValue
            ? `linear-gradient(90deg, ${withAlpha(color, 50)} 0%, ${color} 100%)`
            : "rgba(245,245,247,0.10)",
          boxShadow: hasValue ? `0 0 6px ${withAlpha(color, 50)}` : "none",
          borderRadius: 99,
          transition: "inline-size 0.5s ease",
        }} />
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

  // Delta: comparamos el baseline actual vs el inmediatamente anterior en historial.
  // Sólo tiene sentido cuando hay ≥2 calibraciones completadas.
  const deltas = useMemo(() => {
    if (!baseline || history.length < 2) return null;
    const prev = history[history.length - 2];
    if (!prev) return null;
    return {
      rt:      computeDelta(baseline.avgRT, prev.avgRT, "lower"),
      breath:  computeDelta(baseline.breathHold, prev.breathHold, "higher"),
      focus:   computeDelta(baseline.focusAccuracy, prev.focusAccuracy, "higher"),
      stress:  computeDelta(baseline.stressLevel, prev.stressLevel, "higher"),
      comp:    computeDelta(baseline.composite, prev.composite, "higher"),
    };
  }, [baseline, history]);

  const capturedAt = baseline?.timestamp || history[history.length - 1]?.ts;
  const days = daysSince(capturedAt);
  const stale = days != null && days > STALE_DAYS;

  // Sin baseline todavía: prompt para calibrar — Neural Capture Plate
  if (!baseline) {
    return (
      <motion.button
        whileTap={reduced ? {} : { scale: 0.985 }}
        onClick={onRecalibrate}
        aria-label="Capturar tu baseline neural"
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          inlineSize: "100%",
          padding: "16px 16px 14px 16px",
          borderRadius: 18,
          border: `0.5px dashed ${withAlpha(ac, 40)}`,
          background: `radial-gradient(ellipse 70% 100% at 100% 50%, ${withAlpha(ac, 12)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          cursor: "pointer",
          textAlign: "start",
          marginBlockEnd: 10,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          columnGap: 12,
          alignItems: "center",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.26)`,
          fontFamily: "inherit",
          overflow: "hidden",
        }}
      >
        {/* Custom SVG: 3 calibrating concentric arcs (DNA scan vibe) */}
        <span aria-hidden="true" style={{ flexShrink: 0, filter: `drop-shadow(0 0 8px ${withAlpha(ac, 40)})` }}>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <defs>
              <radialGradient id="capCore" cx="50%" cy="50%">
                <stop offset="0%" stopColor={ac} stopOpacity="0.6" />
                <stop offset="100%" stopColor={ac} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* concentric scanning arcs */}
            <circle cx="24" cy="24" r="20" fill="none" stroke={withAlpha(ac, 25)} strokeWidth="0.5" strokeDasharray="2 3" />
            <circle cx="24" cy="24" r="14" fill="none" stroke={withAlpha(ac, 40)} strokeWidth="0.7" strokeDasharray="3 2" />
            <circle cx="24" cy="24" r="9" fill="url(#capCore)" />
            <circle cx="24" cy="24" r="9" fill="none" stroke={ac} strokeWidth="1" />
            {/* center ping */}
            <circle cx="24" cy="24" r="2.5" fill="#fff" />
            <circle cx="24" cy="24" r="4" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.5" />
          </svg>
        </span>
        <div style={{ minInlineSize: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: MONO_BL,
            fontSize: 8.5,
            fontWeight: 500,
            color: ac,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            textShadow: `0 0 6px ${withAlpha(ac, 50)}`,
          }}>
            <span aria-hidden="true" style={{ position: "relative", inlineSize: 4, blockSize: 4, display: "inline-block" }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: ac, animation: reduced ? "none" : "shimDot 2.4s ease-in-out infinite" }} />
            </span>
            Baseline · sin capturar
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(245,245,247,0.94)", letterSpacing: -0.3, lineHeight: 1.18 }}>
            Captura tu baseline neural
          </span>
          <span style={{ fontSize: 11, color: "rgba(245,245,247,0.50)", lineHeight: 1.35 }}>
            60 segundos · RT, respiración, foco, estado
          </span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ fontFamily: MONO_BL, fontSize: 9, fontWeight: 500, color: ac, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Iniciar
          </span>
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <path d="M3.5 1.5 L7.5 5.5 L3.5 9.5" stroke={ac} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
      </motion.button>
    );
  }

  const pColor = profileColor(baseline.profile);
  const composite = baseline.composite ?? 0;

  // Composite ring path math
  const ringR = 38;
  const ringCirc = 2 * Math.PI * ringR;
  const ringDash = (composite / 100) * ringCirc;

  // Metric fill normalizations (each ~0..1 mapped to expected ranges)
  const rtPct = baseline.avgRT ? Math.max(0, Math.min(1, 1 - (baseline.avgRT - 220) / 380)) : 0;
  const breathPct = baseline.breathHold ? Math.max(0, Math.min(1, baseline.breathHold / 50)) : 0;
  const focusPct = baseline.focusAccuracy != null ? Math.max(0, Math.min(1, baseline.focusAccuracy / 100)) : 0;
  const stressPct = baseline.stressLevel ? Math.max(0, Math.min(1, baseline.stressLevel / 5)) : 0;

  return (
    <motion.article
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Baseline neural"
      style={{
        position: "relative",
        background: `radial-gradient(ellipse 70% 100% at 100% 0%, ${withAlpha(pColor, 14)} 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)`,
        backdropFilter: "blur(22px) saturate(150%)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)",
        border: `0.5px solid rgba(255,255,255,0.10)`,
        borderRadius: 18,
        padding: 16,
        marginBlockEnd: 10,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${withAlpha(pColor, 18)}, 0 8px 24px rgba(0,0,0,0.30), 0 0 22px ${withAlpha(pColor, 10)}`,
        overflow: "hidden",
      }}
    >
      {/* Top eyebrow row + stale badge */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBlockEnd: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5, display: "inline-block" }}>
            <span style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, #fff 0%, ${pColor} 55%)`,
              boxShadow: `0 0 6px ${pColor}`,
              animation: reduced ? "none" : "shimDot 2.4s ease-in-out infinite",
            }} />
          </span>
          <span style={{
            fontFamily: MONO_BL,
            fontSize: 8.5,
            fontWeight: 500,
            color: pColor,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            textShadow: `0 0 6px ${withAlpha(pColor, 50)}`,
          }}>
            Baseline · capturado{days != null ? ` · ${days}d` : ""}
          </span>
        </span>
        {stale && (
          <span
            aria-label="Recalibración recomendada"
            style={{
              fontFamily: MONO_BL,
              fontSize: 8,
              fontWeight: 500,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "#F59E0B",
              background: "rgba(245,158,11,0.10)",
              border: `0.5px solid rgba(245,158,11,0.40)`,
              padding: "3px 8px",
              borderRadius: 99,
              textShadow: "0 0 6px rgba(245,158,11,0.5)",
            }}
          >
            Recalibrar
          </span>
        )}
      </header>

      {/* Composite hero — large dial + profile identity + sparkline */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 14, alignItems: "center", marginBlockEnd: 14 }}>
        {/* Composite dial SVG */}
        <span aria-hidden="true" style={{ flexShrink: 0, filter: `drop-shadow(0 0 12px ${withAlpha(pColor, 35)})` }}>
          <svg width="92" height="92" viewBox="0 0 92 92">
            <defs>
              <linearGradient id={`compRing-${baseline.profile || 'p'}`} x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor={pColor} />
                <stop offset="100%" stopColor={withAlpha(pColor, 60)} />
              </linearGradient>
              <radialGradient id={`compCore-${baseline.profile || 'p'}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={withAlpha(pColor, 22)} />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            {/* outer dashed ring */}
            <circle cx="46" cy="46" r="42" fill="none" stroke={withAlpha(pColor, 25)} strokeWidth="0.5" strokeDasharray="2 3" />
            {/* dim baseline ring */}
            <circle cx="46" cy="46" r={ringR} fill="none" stroke={withAlpha(pColor, 16)} strokeWidth="3" />
            {/* progress arc */}
            <circle
              cx="46"
              cy="46"
              r={ringR}
              fill="none"
              stroke={`url(#compRing-${baseline.profile || 'p'})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${ringDash} ${ringCirc}`}
              transform="rotate(-90 46 46)"
            />
            {/* radial glow core */}
            <circle cx="46" cy="46" r="32" fill={`url(#compCore-${baseline.profile || 'p'})`} />
            {/* tick marks at 25/50/75/100 */}
            {[0, 90, 180, 270].map((deg, i) => {
              const r = (deg - 90) * Math.PI / 180;
              return <line key={i} x1={46 + Math.cos(r) * 32} y1={46 + Math.sin(r) * 32} x2={46 + Math.cos(r) * 36} y2={46 + Math.sin(r) * 36} stroke={withAlpha(pColor, 50)} strokeWidth="0.7" strokeLinecap="round" />;
            })}
            {/* composite number centered (text-anchor middle, dominant-baseline central) */}
            <text x="46" y="46" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: MONO_BL, fontSize: 22, fontWeight: 300, fill: "rgba(245,245,247,0.96)", letterSpacing: -0.5 }}>
              {composite}
            </text>
            <text x="46" y="62" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: MONO_BL, fontSize: 7, fontWeight: 500, fill: withAlpha(pColor, 80), letterSpacing: 1.5, textTransform: "uppercase" }}>
              COMP
            </text>
          </svg>
        </span>
        {/* Identity stack */}
        <div style={{ minInlineSize: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}>
            <span style={{
              fontSize: 17,
              fontWeight: 400,
              color: "rgba(245,245,247,0.96)",
              letterSpacing: -0.5,
              lineHeight: 1.1,
            }}>
              {baseline.profileLabel || "Perfil"}
            </span>
            <DeltaBadge delta={deltas?.comp} betterWhen="higher" />
          </span>
          <span style={{
            fontFamily: MONO_BL,
            fontSize: 9,
            fontWeight: 500,
            color: "rgba(245,245,247,0.50)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}>
            {days === 0 ? "Capturado hoy" : days === 1 ? "Capturado ayer" : `Capturado hace ${days} días`}
          </span>
          {sparkValues && (
            <div style={{ marginBlockStart: 4 }}>
              <Sparkline values={sparkValues} color={pColor} width={120} height={22} />
            </div>
          )}
        </div>
      </div>

      {/* Hairline divider */}
      <span aria-hidden="true" style={{ display: "block", blockSize: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)", marginBlockEnd: 12 }} />

      {/* 4 metric bars stacked vertically */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBlockEnd: 12 }}>
        <MetricBar
          label="Reacción"
          value={baseline.avgRT}
          displayValue={baseline.avgRT ? Math.round(baseline.avgRT) : "—"}
          unit="ms"
          interp={interpretRT(baseline.avgRT)}
          delta={deltas?.rt}
          betterWhen="lower"
          fillPct={rtPct}
          color={pColor}
        />
        <MetricBar
          label="Respiración"
          value={baseline.breathHold}
          displayValue={baseline.breathHold ?? "—"}
          unit="s"
          interp={interpretBreath(baseline.breathHold)}
          delta={deltas?.breath}
          betterWhen="higher"
          fillPct={breathPct}
          color={pColor}
        />
        <MetricBar
          label="Foco"
          value={baseline.focusAccuracy}
          displayValue={baseline.focusAccuracy != null ? Math.round(baseline.focusAccuracy) : "—"}
          unit="/100"
          interp={interpretFocus(baseline.focusAccuracy)}
          delta={deltas?.focus}
          betterWhen="higher"
          fillPct={focusPct}
          color={pColor}
        />
        <MetricBar
          label="Estrés"
          value={baseline.stressLevel}
          displayValue={baseline.stressLevel ? `${baseline.stressLevel}/5` : "—"}
          unit=""
          interp={interpretStress(baseline.stressLevel)}
          delta={deltas?.stress}
          betterWhen="higher"
          fillPct={stressPct}
          color={pColor}
        />
      </div>

      {/* Composite formula footnote — mono caps */}
      <div style={{
        fontFamily: MONO_BL,
        fontSize: 8,
        fontWeight: 500,
        color: "rgba(245,245,247,0.40)",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        lineHeight: 1.5,
        marginBlockEnd: baseline.recommendations ? 10 : 0,
        textAlign: "center",
      }}>
        Composite {composite}/100 · RT · Respiración · Foco · Estrés ponderados 25% c/u
      </div>

      {/* Recomendación derivada */}
      {baseline.recommendations && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBlock: 8,
          paddingInline: 10,
          background: `linear-gradient(180deg, ${withAlpha(ac, 8)} 0%, ${withAlpha(ac, 3)} 100%)`,
          border: `0.5px solid ${withAlpha(ac, 22)}`,
          borderRadius: 10,
          fontSize: 11,
          color: "rgba(245,245,247,0.85)",
          lineHeight: 1.45,
          letterSpacing: -0.05,
        }}>
          <span aria-hidden="true" style={{ flexShrink: 0, filter: `drop-shadow(0 0 4px ${withAlpha(ac, 50)})` }}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="2" fill={ac} />
              <circle cx="6" cy="6" r="4" fill="none" stroke={ac} strokeWidth="0.6" opacity="0.55" />
              <circle cx="6" cy="6" r="5.5" fill="none" stroke={ac} strokeWidth="0.4" opacity="0.30" strokeDasharray="1 1.5" />
            </svg>
          </span>
          <span>
            Recomendación: <strong style={{ color: "rgba(245,245,247,0.96)", fontWeight: 500 }}>{baseline.recommendations.primaryIntent}</strong>
            {" · "}meta diaria <strong style={{ color: "rgba(245,245,247,0.96)", fontWeight: 500 }}>{baseline.recommendations.sessionGoal}</strong>
          </span>
        </div>
      )}
    </motion.article>
  );
}
