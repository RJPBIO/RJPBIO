"use client";
/* ═══════════════════════════════════════════════════════════════
   DASHBOARD VIEW — 4-tier architecture post-redesign
   ═══════════════════════════════════════════════════════════════
   Tier 0 — Header (eyebrow + title + caption)
   Tier 1 — Hero Composite (always visible, glance-able)
   Tier 2 — Coach Actionable (always visible, "próximo paso")
   Tier 3 — Telemetría modular (collapsibles: Salud · Tu Semana ·
            Patrones · Motor adaptativo)
   Tier 4 — Logros & footer (chips + historial CTA)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BioSparkline from "./BioSparkline";
import CalibrationPlan from "./CalibrationPlan";
import StreakCalendar from "./StreakCalendar";
import InstrumentDueCard from "./InstrumentDueCard";
import { MOODS, AM } from "../lib/constants";
import { P } from "../lib/protocols";
import {
  calcBioSignal, calcBurnoutIndex, calcProtoSensitivity,
  calcNeuralVariability,
  generateCoachingInsights, calcNeuralMomentum, estimateCognitiveLoad,
} from "../lib/neural";
import { topArms } from "../lib/neural/bandit";
import { buildCoachContext, summarizeContext } from "../lib/coachMemory";
import { withAlpha } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

import { Skeleton } from "./ui/Skeleton";

const ChartSkeleton = ({ height = 160 }) => (
  <div style={{ padding: 16 }}><Skeleton height={height} /></div>
);

const NeuralRadar = dynamic(() => import("./NeuralRadar"), {
  ssr: false,
  loading: () => <ChartSkeleton height={220} />,
});
// NeuralCoach removed — Brújula tile now uses inline CoachDetail with unified ADN
const TemporalCharts = dynamic(() => import("./TemporalCharts").then(mod => ({
  default: ({ type, ...props }) => {
    if (type === "mood") return <mod.MoodTrendChart {...props} />;
    if (type === "energy") return <mod.EnergyFlowChart {...props} />;
    if (type === "heatmap") return <mod.ActivityHeatmap {...props} />;
    if (type === "weekly") return <mod.WeeklyChart {...props} />;
    return null;
  }
})), {
  ssr: false,
  loading: () => <ChartSkeleton height={140} />,
});
const CorrelationMatrix = dynamic(() => import("./CorrelationMatrix"), {
  ssr: false,
  loading: () => <ChartSkeleton height={180} />,
});

const CALIBRATION_THRESHOLD = 3;
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// EXPERIMENT TOGGLE — flip to false to revert to dark canon
const LIGHT_PREVIEW = false;

// Theme tokens — switch via LIGHT_PREVIEW
const T = LIGHT_PREVIEW ? {
  surface: "#F5F5F7",
  textHi: "rgba(20,20,28,0.96)",
  textMd: "rgba(20,20,28,0.65)",
  textLo: "rgba(20,20,28,0.45)",
  borderHi: "rgba(0,0,0,0.10)",
  borderLo: "rgba(0,0,0,0.06)",
  glassBg: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,245,247,0.92) 100%)",
  glassInset: "rgba(255,255,255,0.95)",
  shadowDeep: "rgba(20,20,28,0.10)",
  shadowDrop: "rgba(20,20,28,0.16)",
  hairline: "rgba(0,0,0,0.08)",
} : {
  surface: "#08080A",
  textHi: "rgba(245,245,247,0.96)",
  textMd: "rgba(245,245,247,0.62)",
  textLo: "rgba(245,245,247,0.45)",
  borderHi: "rgba(255,255,255,0.10)",
  borderLo: "rgba(255,255,255,0.06)",
  glassBg: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)",
  glassInset: "rgba(255,255,255,0.10)",
  shadowDeep: "rgba(0,0,0,0.30)",
  shadowDrop: "rgba(0,0,0,0.36)",
  hairline: "rgba(255,255,255,0.10)",
};

// Trinity colors — fixed dashboard signature (no inheritance)
// In light mode, slightly deeper saturation for legibility on white
const SIG = LIGHT_PREVIEW ? {
  calma: "#0891B2",      // deeper cyan
  enfoque: "#7C3AED",    // deeper violet
  energia: "#D97706",    // deeper amber
  primary: "#0891B2",
  success: "#059669",
  danger: "#DC2626",
  rose: "#DB2777",
  ignition: "#D97706",
} : {
  calma: "#22D3EE",
  enfoque: "#A78BFA",
  energia: "#F59E0B",
  primary: "#22D3EE",
  success: "#34D399",
  danger: "#EF4444",
  rose: "#F472B6",
  ignition: "#F59E0B",
};

function colorForScore(score, goodThreshold = 70, mediumThreshold = 45) {
  if (score >= goodThreshold) return SIG.success;
  if (score >= mediumThreshold) return SIG.energia;
  return SIG.danger;
}

// ═══════════════════════════════════════════════════════════════
// AUXILIARY COMPONENTS
// ═══════════════════════════════════════════════════════════════

// CompositeRing — reusable hero ring with progress arc + composite number
function CompositeRing({ score = 0, color = SIG.primary, size = 140, label = "PERF" }) {
  const r = size * 0.39;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const tickR1 = r - 4;
  const tickR2 = r;
  const ringStroke = Math.max(3, size * 0.038);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <linearGradient id={`ringG-${color.replace('#', '')}`} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={withAlpha(color, 60)} />
        </linearGradient>
        <radialGradient id={`coreG-${color.replace('#', '')}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={withAlpha(color, 28)} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* outer dashed echo */}
      <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={withAlpha(color, 30)} strokeWidth="0.5" strokeDasharray="2 3" />
      {/* dim baseline ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={withAlpha(color, 18)} strokeWidth={ringStroke} />
      {/* progress arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={`url(#ringG-${color.replace('#', '')})`}
        strokeWidth={ringStroke + 0.5}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* radial core glow */}
      <circle cx={cx} cy={cy} r={r - 6} fill={`url(#coreG-${color.replace('#', '')})`} />
      {/* 4 quarter ticks */}
      {[0, 90, 180, 270].map((deg, i) => {
        const a = (deg - 90) * Math.PI / 180;
        return <line key={i} x1={cx + Math.cos(a) * tickR1} y1={cy + Math.sin(a) * tickR1} x2={cx + Math.cos(a) * tickR2} y2={cy + Math.sin(a) * tickR2} stroke={withAlpha(color, 50)} strokeWidth="0.7" strokeLinecap="round" />;
      })}
      {/* composite number */}
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: MONO, fontSize: size * 0.30, fontWeight: 250, fill: T.textHi, letterSpacing: -1 }}>
        {Math.round(score)}
      </text>
      <text x={cx} y={cy + size * 0.20} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: MONO, fontSize: size * 0.075, fontWeight: 500, fill: withAlpha(color, 80), letterSpacing: 1.5, textTransform: "uppercase" }}>
        {label}
      </text>
    </svg>
  );
}

// TrendDelta — colored badge with arrow + percentage
function TrendDelta({ value, suffix = "%" }) {
  if (!value || value === 0) return null;
  const positive = value > 0;
  const color = positive ? SIG.success : SIG.danger;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontFamily: MONO,
      fontSize: 8.5,
      fontWeight: 500,
      color,
      letterSpacing: "0.08em",
      paddingInline: 6,
      paddingBlock: 2,
      background: withAlpha(color, 14),
      border: `0.5px solid ${withAlpha(color, 35)}`,
      borderRadius: 99,
      textShadow: `0 0 5px ${withAlpha(color, 50)}`,
    }}>
      <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden="true">
        {positive
          ? <path d="M3.5 1.5 L3.5 5.5 M1.5 3 L3.5 1 L5.5 3" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          : <path d="M3.5 5.5 L3.5 1.5 M1.5 4 L3.5 6 L5.5 4" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      </svg>
      {Math.abs(value)}{suffix}
    </span>
  );
}

// Hero glyphs — each represents what the tile measures, animated to feel ALIVE
function FocoGlyph({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      <motion.circle
        cx="21" cy="21" r="16" fill="none"
        stroke={withAlpha(color, 35)} strokeWidth="0.7" strokeDasharray="2 3"
        animate={reduced ? {} : { rotate: 360 }}
        transition={reduced ? {} : { duration: 28, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "21px 21px" }}
      />
      <circle cx="21" cy="21" r="11" fill="none" stroke={withAlpha(color, 70)} strokeWidth="1" />
      <motion.circle
        cx="21" cy="21" r="6" fill="none"
        stroke={color} strokeWidth="1.4"
        animate={reduced ? {} : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={reduced ? {} : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "21px 21px" }}
      />
      <line x1="21" y1="2" x2="21" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="36" x2="21" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="21" x2="6" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="36" y1="21" x2="40" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <motion.circle
        cx="21" cy="21" r="2.5" fill={color}
        animate={reduced ? {} : { scale: [1, 0.85, 1] }}
        transition={reduced ? {} : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "21px 21px" }}
      />
    </svg>
  );
}
function CalmaGlyph2({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      {/* Expanding ripple animation — emanation from center */}
      {[0, 1.4, 2.8].map((delay, i) => (
        <motion.circle
          key={i}
          cx="21" cy="21"
          fill="none" stroke={color} strokeWidth="1"
          animate={reduced ? { r: 9, opacity: 0.6 } : { r: [4, 19, 19], opacity: [0.85, 0, 0] }}
          transition={reduced ? {} : { duration: 4.2, repeat: Infinity, ease: "easeOut", delay }}
          style={{ transformOrigin: "21px 21px" }}
        />
      ))}
      <circle cx="21" cy="21" r="4" fill="none" stroke={color} strokeWidth="1.6" />
      <motion.path
        d="M 21 17 Q 18 20, 18 22.5 A 3 3 0 0 0 24 22.5 Q 24 20, 21 17 Z"
        fill={color}
        animate={reduced ? {} : { y: [0, -1, 0] }}
        transition={reduced ? {} : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
function PulsoGlyph({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      <circle cx="21" cy="21" r="18" fill="none" stroke={withAlpha(color, 30)} strokeWidth="0.6" strokeDasharray="2 3" />
      <motion.g
        animate={reduced ? {} : { rotate: 360 }}
        transition={reduced ? {} : { duration: 50, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "21px 21px" }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const a = (deg - 90) * Math.PI / 180;
          const isMajor = i % 2 === 0;
          const r1 = isMajor ? 7.5 : 7;
          const r2 = isMajor ? 16 : 13;
          return (
            <line
              key={i}
              x1={21 + Math.cos(a) * r1} y1={21 + Math.sin(a) * r1}
              x2={21 + Math.cos(a) * r2} y2={21 + Math.sin(a) * r2}
              stroke={color}
              strokeWidth={isMajor ? 1.6 : 1}
              strokeLinecap="round"
              opacity={isMajor ? 1 : 0.6}
            />
          );
        })}
      </motion.g>
      <motion.circle
        cx="21" cy="21" r="5.5" fill={withAlpha(color, 35)}
        animate={reduced ? {} : { scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "21px 21px" }}
      />
      <circle cx="21" cy="21" r="3.5" fill={color} />
    </svg>
  );
}
function BrujulaGlyph({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      <circle cx="21" cy="21" r="17" fill="none" stroke={withAlpha(color, 35)} strokeWidth="0.7" strokeDasharray="2 3" />
      <circle cx="21" cy="21" r="13" fill="none" stroke={withAlpha(color, 70)} strokeWidth="1" />
      {[0, 90, 180, 270].map((deg, i) => {
        const a = (deg - 90) * Math.PI / 180;
        return <line key={i} x1={21 + Math.cos(a) * 13} y1={21 + Math.sin(a) * 13} x2={21 + Math.cos(a) * 16} y2={21 + Math.sin(a) * 16} stroke={color} strokeWidth="1.4" strokeLinecap="round" />;
      })}
      <motion.path
        d="M 21 7 L 25 24 L 21 21 L 17 24 Z" fill={color}
        animate={reduced ? {} : { rotate: [-12, 12, -12] }}
        transition={reduced ? {} : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "21px 21px" }}
      />
      <circle cx="21" cy="21" r="2" fill={color} />
    </svg>
  );
}
function SistemaGlyph({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      <motion.path
        d="M 6 14 H 11 L 14 9 L 18 21 L 22 7 L 26 19 L 28 14 H 36"
        fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        animate={reduced ? {} : { opacity: [0.95, 0.55, 0.95, 0.95] }}
        transition={reduced ? {} : { duration: 1.4, repeat: Infinity, ease: "easeOut", times: [0, 0.15, 0.3, 1] }}
      />
      <path d="M 6 28 H 36" fill="none" stroke={withAlpha(color, 30)} strokeWidth="0.6" strokeDasharray="2 3" />
      <motion.path
        d="M 6 28 H 11 L 14 23 L 18 35 L 22 21 L 26 33 L 28 28 H 36"
        fill="none" stroke={withAlpha(color, 65)} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        animate={reduced ? {} : { opacity: [0.65, 0.30, 0.65, 0.65] }}
        transition={reduced ? {} : { duration: 1.4, repeat: Infinity, ease: "easeOut", times: [0, 0.15, 0.3, 1], delay: 0.4 }}
      />
    </svg>
  );
}
function RitmoGlyph({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const x = 5 + i * 5.4;
        const y = 21 + Math.sin(i * 0.9) * 5.5;
        const isToday = i === 5;
        return (
          <g key={i}>
            {i < 6 && (
              <line
                x1={x} y1={y}
                x2={5 + (i + 1) * 5.4} y2={21 + Math.sin((i + 1) * 0.9) * 5.5}
                stroke={i < 5 ? withAlpha(color, 70) : withAlpha(color, 25)}
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeDasharray={i >= 5 ? "2 2" : ""}
              />
            )}
            <circle
              cx={x} cy={y}
              r={isToday ? 3.2 : 2.2}
              fill={i <= 5 ? color : withAlpha(color, 30)}
            />
            {isToday && (
              <motion.circle
                cx={x} cy={y}
                fill="none" stroke={color} strokeWidth="0.7"
                animate={reduced ? { r: 5, opacity: 0.55 } : { r: [3.2, 8, 8], opacity: [0.7, 0, 0] }}
                transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
function AnimoGlyph({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      <path d="M 4 23 Q 9 14, 14 19 T 24 16 T 34 19 L 38 21" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 4 31 Q 9 25, 14 28 T 24 25 T 34 27 L 38 28" fill="none" stroke={withAlpha(color, 40)} strokeWidth="0.9" strokeLinecap="round" strokeDasharray="2 3" />
      <circle cx="9" cy="17" r="1.8" fill={color} />
      <circle cx="24" cy="16" r="2.2" fill={color} />
      <motion.circle
        cx="24" cy="16"
        fill="none" stroke={color} strokeWidth="0.7"
        animate={reduced ? { r: 3.8, opacity: 0.6 } : { r: [2.2, 7, 7], opacity: [0.7, 0, 0] }}
        transition={reduced ? {} : { duration: 2.6, repeat: Infinity, ease: "easeOut" }}
      />
      <circle cx="34" cy="19" r="1.6" fill={withAlpha(color, 70)} />
    </svg>
  );
}
function InteligenciaGlyph({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      {[
        [9, 11, 21, 16], [9, 11, 21, 26], [9, 31, 21, 16], [9, 31, 21, 26],
        [9, 21, 21, 16], [9, 21, 21, 26], [21, 16, 33, 21], [21, 26, 33, 21],
      ].map(([x1, y1, x2, y2], i) => (
        <motion.line
          key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth="0.7"
          animate={reduced ? { opacity: 0.45 } : { opacity: [0.20, 0.85, 0.20] }}
          transition={reduced ? {} : { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
        />
      ))}
      <circle cx="9" cy="11" r="2" fill={color} />
      <circle cx="9" cy="21" r="2" fill={color} />
      <circle cx="9" cy="31" r="2" fill={color} />
      <motion.circle
        cx="21" cy="16" r="2.6" fill={color}
        animate={reduced ? {} : { scale: [1, 1.18, 1] }}
        transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "21px 16px" }}
      />
      <circle cx="21" cy="16" r="4.5" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />
      <motion.circle
        cx="21" cy="26" r="2.6" fill={color}
        animate={reduced ? {} : { scale: [1, 1.18, 1] }}
        transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        style={{ transformOrigin: "21px 26px" }}
      />
      <circle cx="33" cy="21" r="2.4" fill={color} />
    </svg>
  );
}
function EstadoGlyph({ color, score = 0 }) {
  const reduced = useReducedMotion();
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" overflow="visible">
      <motion.circle
        cx="21" cy="21" r="19" fill="none"
        stroke={withAlpha(color, 30)} strokeWidth="0.6" strokeDasharray="2 3"
        animate={reduced ? {} : { rotate: 360 }}
        transition={reduced ? {} : { duration: 35, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "21px 21px" }}
      />
      <circle cx="21" cy="21" r={r} fill="none" stroke={withAlpha(color, 25)} strokeWidth="2" />
      <circle
        cx="21" cy="21" r={r}
        fill="none" stroke={color} strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 21 21)"
      />
      <motion.circle
        cx="21" cy="21" r="9" fill={withAlpha(color, 25)}
        animate={reduced ? {} : { scale: [1, 1.10, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={reduced ? {} : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "21px 21px" }}
      />
      <circle cx="21" cy="21" r="4" fill={color} />
    </svg>
  );
}

// CoachDetail — custom recommendation card for Brújula expanded (replaces legacy NeuralCoach)
function CoachDetail({ st, onSelectProtocol, color }) {
  const reduced = useReducedMotion();

  const insights = generateCoachingInsights(st) || [];
  const momentum = calcNeuralMomentum(st);
  const load = estimateCognitiveLoad(st);
  const memoryCtx = buildCoachContext(st);
  const memorySummary = summarizeContext(memoryCtx);

  // Pick top insight (priority 1) with optional protocol action
  const topInsight = insights[0];
  const recommendedProto = topInsight?.action?.protocol || (P || []).find(p => p.int === (st.neuralBaseline?.recommendations?.primaryIntent || "calma"));
  const intent = recommendedProto?.int || "calma";
  const intentColor = intent === "calma" ? SIG.calma : intent === "enfoque" ? SIG.enfoque : intent === "energia" ? SIG.energia : color;

  // Intent glyph component
  const IntentGlyph = intent === "calma" ? CalmaGlyph2 : intent === "enfoque" ? FocoGlyph : intent === "energia" ? PulsoGlyph : BrujulaGlyph;

  // Momentum + Load + Memory chip data
  const chips = [
    {
      l: "Momentum",
      v: momentum.direction === "ascendente" ? "Subiendo" : momentum.direction === "descendente" ? "Bajando" : "Estable",
      c: momentum.direction === "ascendente" ? SIG.success : momentum.direction === "descendente" ? SIG.danger : T.textMd,
      sub: momentum.delta > 0 ? `+${momentum.delta.toFixed(1)}` : momentum.delta < 0 ? `${momentum.delta.toFixed(1)}` : "—",
    },
    {
      l: "Carga",
      v: load.level === "alta" ? "Alta" : load.level === "moderada" ? "Media" : "Baja",
      c: load.level === "alta" ? SIG.danger : load.level === "moderada" ? SIG.energia : SIG.success,
      sub: `${load.score || 0}%`,
    },
    {
      l: "Memoria",
      v: memoryCtx?.totalSessions ? `${memoryCtx.totalSessions} ses` : "Reciente",
      c: SIG.calma,
      sub: memorySummary?.split(".")[0]?.slice(0, 14) || "ok",
    },
  ];

  return (
    <>
      {/* Top recommendation block — intent IconTile + reason + protocol pill + CTA */}
      <div style={{
        position: "relative",
        paddingBlock: 14, paddingInline: 14,
        background: `radial-gradient(ellipse 70% 100% at 0% 0%, ${withAlpha(intentColor, 16)} 0%, transparent 60%), ${T.glassBg}`,
        border: `0.5px solid ${withAlpha(intentColor, 35)}`,
        borderRadius: 16,
        marginBlockEnd: 14,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha(intentColor, 18)}, 0 0 14px ${withAlpha(intentColor, 12)}`,
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBlockEnd: 12 }}>
          <IconTile color={intentColor} glyph={<IntentGlyph color={intentColor} />} size={56} radius={14} />
          <div style={{ flex: 1, minInlineSize: 0 }}>
            <div style={{
              fontFamily: MONO, fontSize: 8, fontWeight: 500,
              color: intentColor, letterSpacing: "0.24em", textTransform: "uppercase",
              textShadow: `0 0 5px ${withAlpha(intentColor, 50)}`,
              marginBlockEnd: 3,
            }}>
              Próximo paso · {intent}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: T.textHi, letterSpacing: -0.25, lineHeight: 1.2 }}>
              {topInsight?.title || `Sesión de ${intent}`}
            </div>
          </div>
        </div>

        {/* Reason */}
        {topInsight?.message && (
          <p style={{ fontSize: 12.5, color: T.textMd, lineHeight: 1.5, margin: 0, marginBlockEnd: 12 }}>
            {topInsight.message}
          </p>
        )}

        {/* Protocol pill + CTA */}
        {recommendedProto && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBlockStart: 10, borderBlockStart: `0.5px solid ${withAlpha(intentColor, 22)}` }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: MONO, fontSize: 9, fontWeight: 500,
              color: intentColor, letterSpacing: "0.16em", textTransform: "uppercase",
              paddingInline: 9, paddingBlock: 4,
              background: `linear-gradient(180deg, ${withAlpha(intentColor, 18)} 0%, ${withAlpha(intentColor, 6)} 100%)`,
              border: `0.5px solid ${withAlpha(intentColor, 38)}`,
              borderRadius: 99,
              textShadow: `0 0 5px ${withAlpha(intentColor, 50)}`,
            }}>
              {recommendedProto.n}
              <span style={{ color: T.textMd, fontWeight: 400 }}>· {Math.round((recommendedProto.d || 600) / 60)}m</span>
            </span>
            <motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelectProtocol?.(recommendedProto); }}
              whileTap={reduced ? {} : { scale: 0.96 }}
              aria-label={`Empezar ${recommendedProto.n}`}
              style={{
                marginInlineStart: "auto",
                display: "inline-flex", alignItems: "center", gap: 5,
                paddingBlock: 8, paddingInline: 14,
                background: `linear-gradient(180deg, ${intentColor} 0%, ${withAlpha(intentColor, 88)} 100%)`,
                color: "#08080A",
                border: "none",
                borderRadius: 99,
                fontSize: 12, fontWeight: 600,
                letterSpacing: 0.05,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: `inset 0 1.2px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.20), 0 0 0 1px ${withAlpha(intentColor, 60)}, 0 4px 12px ${withAlpha(intentColor, 40)}`,
              }}
            >
              Empezar
              <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
                <path d="M2 5.5 L8 5.5 M5.5 3 L8 5.5 L5.5 8" stroke="#08080A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </motion.button>
          </div>
        )}
      </div>

      {/* 3 micro chips: Momentum · Carga · Memoria */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBlockEnd: 14 }}>
        {chips.map((m, i) => (
          <div key={i} style={{
            paddingBlock: 10, paddingInline: 10,
            background: `radial-gradient(circle at 50% 0%, ${withAlpha(m.c, 12)} 0%, transparent 70%), ${T.glassBg}`,
            border: `0.5px solid ${withAlpha(m.c, 22)}`,
            borderRadius: 12,
            textAlign: "center",
          }}>
            <div style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 500, color: m.c, letterSpacing: "0.20em", textTransform: "uppercase", textShadow: `0 0 4px ${withAlpha(m.c, 50)}`, marginBlockEnd: 4 }}>
              {m.l}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.textHi, letterSpacing: -0.2, lineHeight: 1.1 }}>
              {m.v}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 400, color: T.textMd, letterSpacing: 0.05, marginBlockStart: 3, fontVariantNumeric: "tabular-nums" }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Other insights (max 3 más) */}
      {insights.length > 1 && (
        <div>
          <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 8 }}>
            Otras señales
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {insights.slice(1, 4).map((ins, i) => (
              <div key={i} style={{
                paddingBlock: 8, paddingInline: 10,
                background: "rgba(255,255,255,0.025)",
                border: `0.5px solid ${withAlpha(ins.color || color, 18)}`,
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.textHi, letterSpacing: -0.1, marginBlockEnd: 2 }}>
                  {ins.title}
                </div>
                <div style={{ fontSize: 11, color: T.textMd, lineHeight: 1.4 }}>
                  {ins.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// MetricDetail — rich expanded content for trinity tiles (Foco/Calma/Pulso)
function MetricDetail({ history, dataKey, value, delta, color, description, protoSens, milestone }) {
  const last14 = (history || []).slice(-14);
  const values = last14.map(h => h[dataKey] || 0).filter(v => v > 0);
  const best = values.length ? Math.max(...values) : 0;
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const today = value;
  const trend = values;

  const boosters = Object.entries(protoSens || {})
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.avgDelta - a.avgDelta)
    .slice(0, 3)
    .filter(p => p.avgDelta > 0);

  // Milestone math
  const milestones = [50, 70, 85, 95];
  const nextMilestone = milestones.find(m => m > today) || 100;
  const toNext = nextMilestone - today;

  return (
    <>
      {/* Hero number + delta + description */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBlockEnd: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 48, fontWeight: 200, color: T.textHi, letterSpacing: -1.5, fontVariantNumeric: "tabular-nums", textShadow: `0 0 18px ${withAlpha(color, 35)}` }}>{value}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: T.textMd }}>/100</span>
        {delta !== 0 && <span style={{ marginInlineStart: 8 }}><TrendDelta value={delta} /></span>}
      </div>
      <p style={{ fontSize: 13, color: T.textMd, lineHeight: 1.5, margin: 0, marginBlockEnd: 14 }}>
        {description}
      </p>

      {/* 3 mini stats: best / avg / hoy */}
      {values.length >= 2 && (
        <>
          <span aria-hidden="true" style={{ display: "block", blockSize: 1, background: `linear-gradient(90deg, ${withAlpha(color, 25)} 0%, ${withAlpha(color, 5)} 100%)`, marginBlockEnd: 12 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBlockEnd: 14 }}>
            {[
              { l: "Récord 14d", v: best, c: SIG.success },
              { l: "Promedio", v: avg, c: color },
              { l: "Hoy", v: today, c: SIG.calma },
            ].map((m, i) => (
              <div key={i} style={{
                paddingBlock: 10, paddingInline: 8,
                background: `radial-gradient(circle at 50% 0%, ${withAlpha(m.c, 12)} 0%, transparent 70%), ${T.glassBg}`,
                border: `0.5px solid ${withAlpha(m.c, 22)}`,
                borderRadius: 12,
                textAlign: "center",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 500, color: m.c, letterSpacing: "0.20em", textTransform: "uppercase", textShadow: `0 0 4px ${withAlpha(m.c, 50)}`, marginBlockEnd: 4 }}>
                  {m.l}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 250, color: T.textHi, letterSpacing: -0.4, fontVariantNumeric: "tabular-nums", textShadow: `0 0 8px ${withAlpha(m.c, 30)}` }}>
                  {m.v}
                </div>
              </div>
            ))}
          </div>

          {/* Sparkline trend */}
          <div style={{ paddingBlock: 12, paddingInline: 12, background: T.glassBg, border: `0.5px solid ${withAlpha(color, 18)}`, borderRadius: 12, marginBlockEnd: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBlockEnd: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Trayectoria · {values.length} sesiones
              </span>
              <TrendDelta value={today - avg} />
            </div>
            <BioSparkline data={trend} width={300} height={36} color={color} ariaLabel="Trayectoria reciente" />
          </div>
        </>
      )}

      {/* Milestone progress */}
      {today < 100 && nextMilestone > today && (
        <div style={{ paddingBlock: 10, paddingInline: 12, background: T.glassBg, border: `0.5px solid ${withAlpha(color, 18)}`, borderRadius: 12, marginBlockEnd: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBlockEnd: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: color, letterSpacing: "0.22em", textTransform: "uppercase", textShadow: `0 0 5px ${withAlpha(color, 50)}` }}>
              Próximo umbral
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 400, color: T.textHi, fontVariantNumeric: "tabular-nums" }}>
              {today} → {nextMilestone}
            </span>
          </div>
          <div style={{ position: "relative", blockSize: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              position: "absolute", insetBlockStart: 0, insetInlineStart: 0, blockSize: "100%",
              inlineSize: `${Math.max(0, Math.min(100, (today / nextMilestone) * 100))}%`,
              background: `linear-gradient(90deg, ${withAlpha(color, 50)} 0%, ${color} 100%)`,
              boxShadow: `0 0 6px ${withAlpha(color, 60)}`,
              borderRadius: 99,
            }} />
          </div>
          <div style={{ fontSize: 11, color: T.textMd, marginBlockStart: 6 }}>
            Te faltan <strong style={{ color: T.textHi, fontWeight: 500 }}>{toNext} puntos</strong> para alcanzar el siguiente umbral
          </div>
        </div>
      )}

      {/* Top boosters */}
      {boosters.length > 0 && (
        <div>
          <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 8 }}>
            Sesiones que más te ayudan
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {boosters.map((b, i) => (
              <div key={b.name} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto", columnGap: 10,
                alignItems: "center",
                paddingBlock: 8, paddingInline: 10,
                background: "rgba(255,255,255,0.025)",
                border: `0.5px solid ${withAlpha(SIG.success, 18)}`,
                borderRadius: 10,
              }}>
                <span style={{
                  inlineSize: 22, blockSize: 22, borderRadius: 7,
                  background: `linear-gradient(140deg, ${withAlpha(SIG.success, 28)} 0%, ${withAlpha(SIG.success, 10)} 100%)`,
                  border: `0.5px solid ${withAlpha(SIG.success, 40)}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontFamily: MONO, fontSize: 9, fontWeight: 500, color: SIG.success,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 12, color: T.textHi, letterSpacing: -0.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 400, color: SIG.success, letterSpacing: -0.2, fontVariantNumeric: "tabular-nums", textShadow: `0 0 6px ${withAlpha(SIG.success, 40)}` }}>+{b.avgDelta}</span>
                  <span style={{ fontFamily: MONO, fontSize: 8, color: T.textLo }}>{b.sessions}x</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// IconTile — squircle accent-tinted icon tile (Menu Strip /perfil pattern + Vision Pro dimensional shimmer)
function IconTile({ color, glyph, size = 76, radius = 18 }) {
  return (
    <span style={{
      position: "relative",
      flexShrink: 0,
      inlineSize: size, blockSize: size,
      borderRadius: radius,
      // Multi-stop dimensional gradient — top highlight + mid color + bottom shadow
      background: `
        radial-gradient(circle at 28% 22%, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0) 50%),
        radial-gradient(circle at 75% 80%, ${withAlpha(color, 22)} 0%, transparent 60%),
        linear-gradient(145deg, ${withAlpha(color, 38)} 0%, ${withAlpha(color, 18)} 50%, ${withAlpha(color, 8)} 100%)
      `,
      border: `0.5px solid ${withAlpha(color, 55)}`,
      boxShadow: `
        inset 0 1.5px 0 rgba(255,255,255,0.30),
        inset 0 -1px 0 rgba(0,0,0,0.25),
        inset 0 0 0 0.5px ${withAlpha(color, 40)},
        0 0 18px ${withAlpha(color, 35)},
        0 4px 12px rgba(0,0,0,0.30),
        0 0 0 1px rgba(0,0,0,0.18)
      `,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      filter: `drop-shadow(0 0 10px ${withAlpha(color, 30)})`,
      overflow: "hidden",
    }}>
      {/* Top-edge sheen — premium gleam (Vision Pro signature) */}
      <span aria-hidden="true" style={{
        position: "absolute",
        insetBlockStart: 0,
        insetInlineStart: "12%",
        insetInlineEnd: "12%",
        blockSize: 1,
        background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)`,
        pointerEvents: "none",
      }} />
      {/* Inner depth shadow at bottom */}
      <span aria-hidden="true" style={{
        position: "absolute",
        insetBlockEnd: 0,
        insetInlineStart: "20%",
        insetInlineEnd: "20%",
        blockSize: 1,
        background: `linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.30) 50%, transparent 100%)`,
        pointerEvents: "none",
      }} />
      {typeof glyph === "function" ? glyph(color) : glyph}
    </span>
  );
}

// BentoTile — glass dark card + squircle IconTile + bottom labels (Menu Strip pattern at bento scale)
function BentoTile({
  id, color = SIG.primary, name, status, subtitle, glyph,
  expanded, onToggle, children, expandedTitle, accentStrip = false,
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={`${expanded ? 'Cerrar' : 'Expandir'} ${name}`}
      whileTap={reduced || expanded ? {} : { scale: 0.985 }}
      layout
      transition={reduced ? { duration: 0 } : { layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
      style={{
        position: "relative",
        gridColumn: expanded ? "1 / -1" : "auto",
        aspectRatio: expanded ? "auto" : "1 / 1.08",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        textAlign: "start",
        padding: 16,
        // Glass dark base (Menu Strip /perfil canon — NO solid color halo)
        background: expanded
          ? `radial-gradient(ellipse 70% 100% at 0% 0%, ${withAlpha(color, 16)} 0%, transparent 55%), ${T.glassBg}`
          : `radial-gradient(ellipse 75% 100% at 0% 0%, ${withAlpha(color, 13)} 0%, transparent 60%), ${T.glassBg}`,
        backdropFilter: "blur(22px) saturate(150%)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)",
        border: `0.5px solid ${T.borderHi}`,
        borderRadius: 22,
        boxShadow: expanded
          ? `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(color, 28)}, 0 8px 26px rgba(0,0,0,0.30), 0 0 22px ${withAlpha(color, 16)}`
          : `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${withAlpha(color, 18)}, 0 6px 20px rgba(0,0,0,0.26), 0 0 16px ${withAlpha(color, 10)}`,
        overflow: "hidden",
        cursor: "pointer",
        color: "inherit",
        fontFamily: "inherit",
        transition: "box-shadow 0.4s ease, background 0.4s ease",
      }}
    >
      {/* Vertical accent strip on left edge (Evaluación pattern, optional) */}
      {(accentStrip || expanded) && (
        <span aria-hidden="true" style={{
          position: "absolute",
          insetBlockStart: 14, insetBlockEnd: 14,
          insetInlineStart: 0,
          inlineSize: 3,
          borderStartEndRadius: 99, borderEndEndRadius: 99,
          background: `linear-gradient(180deg, ${color} 0%, ${withAlpha(color, 60)} 100%)`,
          boxShadow: `0 0 10px ${color}, 0 0 4px ${color}`,
          zIndex: 1,
        }} />
      )}

      {/* Status chip top-right (collapsed) */}
      {!expanded && status && (
        <span style={{ position: "absolute", insetBlockStart: 14, insetInlineEnd: 14, zIndex: 2 }}>
          {status}
        </span>
      )}

      {/* Squircle IconTile top-left (collapsed) */}
      {!expanded && glyph && (
        <div style={{ position: "relative", zIndex: 1 }}>
          <IconTile color={color} glyph={glyph} size={76} radius={18} />
        </div>
      )}

      {/* Bottom labels (collapsed) */}
      {!expanded && (
        <div style={{ position: "relative", zIndex: 1, marginBlockStart: "auto" }}>
          <div style={{
            fontSize: 17, fontWeight: 500,
            color: T.textHi,
            letterSpacing: -0.3, lineHeight: 1.15,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {name}
          </div>
          {subtitle && (
            <div style={{
              fontFamily: MONO,
              fontSize: 9.5, fontWeight: 500,
              color: withAlpha(color, 75),
              letterSpacing: "0.16em", textTransform: "uppercase",
              marginBlockStart: 4,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              textShadow: `0 0 5px ${withAlpha(color, 40)}`,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.35, delay: 0.12 }}
            style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 14 }}
          >
            {/* Header row when expanded */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {glyph && <IconTile color={color} glyph={glyph} size={56} radius={14} />}
                <div>
                  <div style={{
                    fontSize: 17, fontWeight: 500,
                    color: T.textHi,
                    letterSpacing: -0.3, lineHeight: 1.15,
                  }}>
                    {expandedTitle || name}
                  </div>
                  {subtitle && (
                    <div style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 500,
                      color: withAlpha(color, 80), letterSpacing: "0.18em", textTransform: "uppercase",
                      lineHeight: 1.3, marginBlockStart: 4,
                      textShadow: `0 0 5px ${withAlpha(color, 50)}`,
                    }}>
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>
              <span aria-hidden="true" style={{
                inlineSize: 30, blockSize: 30,
                borderRadius: "50%",
                background: `linear-gradient(180deg, ${withAlpha(color, 18)} 0%, ${withAlpha(color, 6)} 100%)`,
                border: `0.5px solid ${withAlpha(color, 35)}`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="11" height="11" viewBox="0 0 11 11">
                  <path d="M2.5 2.5 L8.5 8.5 M8.5 2.5 L2.5 8.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
            </div>
            <span aria-hidden="true" style={{ display: "block", blockSize: 1, background: `linear-gradient(90deg, ${withAlpha(color, 30)} 0%, ${withAlpha(color, 5)} 100%)` }} />
            <div style={{ pointerEvents: "auto" }} onClick={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Module glyphs — distinct SVG per module
function GlyphHealth({ color }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <path d="M 16 5 L 25 9 V 16 Q 25 23, 16 27 Q 7 23, 7 16 V 9 Z" fill={withAlpha(color, 18)} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M 11 16 L 14 19 L 21 12" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
function GlyphWeek({ color }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <rect x="5" y="8" width="22" height="19" rx="2" fill="none" stroke={color} strokeWidth="1" />
      <line x1="5" y1="13" x2="27" y2="13" stroke={color} strokeWidth="1" />
      <line x1="11" y1="5" x2="11" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="21" y1="5" x2="21" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* day dots */}
      {[0, 1, 2, 3, 4].map(d => <circle key={d} cx={9 + d * 4} cy="20" r="1" fill={color} opacity={d < 3 ? 1 : 0.3} />)}
      <circle cx="13" cy="24" r="1.5" fill={color} />
    </svg>
  );
}
function GlyphPatterns({ color }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <path d="M 4 22 Q 10 12, 16 18 T 28 14" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 4 26 Q 10 20, 16 24 T 28 22" fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.45" strokeDasharray="1 2" />
      <circle cx="10" cy="16" r="1.6" fill={color} />
      <circle cx="22" cy="16.5" r="1.6" fill={color} />
    </svg>
  );
}
function GlyphMotor({ color }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="11" fill="none" stroke={withAlpha(color, 35)} strokeWidth="0.5" strokeDasharray="2 3" />
      {[0, 60, 120, 180, 240, 300].map((d, i) => {
        const a = (d - 90) * Math.PI / 180;
        const r1 = i % 2 === 0 ? 4 : 6;
        const r2 = 11;
        return <line key={i} x1={16 + Math.cos(a) * r1} y1={16 + Math.sin(a) * r1} x2={16 + Math.cos(a) * r2} y2={16 + Math.sin(a) * r2} stroke={color} strokeWidth={i % 2 === 0 ? 1.2 : 0.7} strokeLinecap="round" />;
      })}
      <circle cx="16" cy="16" r="3" fill={color} />
      <circle cx="16" cy="16" r="1.5" fill="#fff" />
    </svg>
  );
}
function GlyphTrophy({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" overflow="visible">
      <path d="M 12 7 H 24 V 16 Q 24 22, 18 22 Q 12 22, 12 16 Z" fill={withAlpha(color, 25)} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M 12 9 Q 7 9, 7 14 Q 7 18, 10 18" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 24 9 Q 29 9, 29 14 Q 29 18, 26 18" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="14" y1="25" x2="22" y2="25" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="29" x2="24" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <motion.circle
        cx="18" cy="14" r="2" fill={color}
        animate={reduced ? {} : { scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] }}
        transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "18px 14px" }}
      />
    </svg>
  );
}
function ClockGlyph({ color }) {
  const reduced = useReducedMotion();
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" overflow="visible">
      <circle cx="18" cy="18" r="15" fill="none" stroke={withAlpha(color, 30)} strokeWidth="0.6" strokeDasharray="2 3" />
      <circle cx="18" cy="18" r="11" fill="none" stroke={color} strokeWidth="1.4" />
      {/* Hour ticks 12,3,6,9 */}
      {[0, 90, 180, 270].map((deg, i) => {
        const a = (deg - 90) * Math.PI / 180;
        return <line key={i} x1={18 + Math.cos(a) * 11} y1={18 + Math.sin(a) * 11} x2={18 + Math.cos(a) * 13} y2={18 + Math.sin(a) * 13} stroke={color} strokeWidth="1.1" strokeLinecap="round" />;
      })}
      {/* Hour hand (rotates slowly) */}
      <motion.line
        x1="18" y1="18" x2="18" y2="11"
        stroke={color} strokeWidth="1.6" strokeLinecap="round"
        animate={reduced ? {} : { rotate: 360 }}
        transition={reduced ? {} : { duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "18px 18px" }}
      />
      {/* Minute hand (rotates faster) */}
      <motion.line
        x1="18" y1="18" x2="22" y2="14"
        stroke={color} strokeWidth="1.2" strokeLinecap="round"
        animate={reduced ? {} : { rotate: 360 }}
        transition={reduced ? {} : { duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "18px 18px" }}
      />
      <circle cx="18" cy="18" r="1.8" fill={color} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════

export default function DashboardView({ st, isDark, ac, switchTab, sp, onShowHist, bp = "mobile" }) {
  const reduced = useReducedMotion();
  const [expandedTile, setExpandedTile] = useState(null);
  const toggleTile = (id) => setExpandedTile(prev => prev === id ? null : id);

  const enterCascade = (idx) => ({
    initial: reduced ? { opacity: 1 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: reduced ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.04 + idx * 0.045 },
  });

  const perf = Math.round(((st.coherencia || 0) + (st.resiliencia || 0) + (st.capacidad || 0)) / 3);
  const weeklyTotal = (st.weeklyData || []).reduce((a, b) => a + (b || 0), 0);
  const bioSig = useMemo(() => calcBioSignal(st), [st.coherencia, st.resiliencia, st.capacidad, st.moodLog, st.weeklyData, st.history]);
  const burnout = useMemo(() => calcBurnoutIndex(st.moodLog, st.history), [st.moodLog, st.history]);
  const learnedArms = useMemo(() => topArms(st.banditArms || {}, 3), [st.banditArms]);
  const protoSens = useMemo(() => calcProtoSensitivity(st.moodLog), [st.moodLog]);
  const neuralVar = useMemo(() => calcNeuralVariability(st.history), [st.history]);
  const moodTrend = useMemo(() => (st.moodLog || []).slice(-14).map(m => m.mood), [st.moodLog]);
  const avgMood = useMemo(() => {
    const ml = st.moodLog || [];
    if (!ml.length) return 0;
    return +(ml.slice(-7).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 7)).toFixed(1);
  }, [st.moodLog]);
  const rD = useMemo(() => {
    const h = st.history || [];
    if (h.length < 2) return { c: 0, r: 0, e: 0 };
    return {
      c: h.slice(-1)[0].c - (h.length >= 5 ? h[h.length - 5] : h[0]).c,
      r: h.slice(-1)[0].r - (h.length >= 5 ? h[h.length - 5] : h[0]).r,
      e: (h.slice(-1)[0].e || 0) - ((h.length >= 5 ? h[h.length - 5].e : h[0].e) || 0),
    };
  }, [st.history]);
  const perfTrend = useMemo(() => {
    const h = (st.history || []).slice(-14);
    if (h.length < 3) return [];
    return h.map((s) => Math.round(((s.c ?? 50) + (s.r ?? 50)) / 2));
  }, [st.history]);
  const calibrating = (st.totalSessions || 0) < CALIBRATION_THRESHOLD;
  const perfColor = perf >= 70 ? SIG.success : perf >= 50 ? SIG.energia : SIG.danger;
  const burnoutColor = burnout.risk === "bajo" ? SIG.success : burnout.risk === "moderado" ? SIG.energia : SIG.danger;

  if (calibrating) {
    return (
      <CalibrationPlan
        totalSessions={st.totalSessions || 0}
        isDark={isDark}
        ac={ac}
        onStart={(intent) => {
          switchTab("ignicion");
          if (typeof sp === "function") {
            const proto = (P || []).find((p) => p.int === intent);
            if (proto) sp(proto);
          }
        }}
      />
    );
  }

  // Hero satellites — 3 trinity metrics (focus/calm/energy)
  const satellites = [
    { key: "enfoque", label: "Enfoque", value: st.coherencia || 0, color: SIG.calma, delta: rD.c },
    { key: "calma", label: "Calma", value: st.resiliencia || 0, color: SIG.enfoque, delta: rD.r },
    { key: "energia", label: "Energía", value: st.capacidad || 0, color: SIG.energia, delta: rD.e },
  ];

  return (
    <section
      role="region"
      aria-label="Dashboard neural"
      style={{
        position: "relative",
        paddingBlock: "14px 220px",
        paddingInline: 20,
        // Light preview: full-bleed white surface to override global dark atmosphere
        ...(LIGHT_PREVIEW ? {
          background: T.surface,
          marginInline: -20,
          paddingInline: 20,
          minBlockSize: "100dvh",
        } : {}),
      }}
    >
      {/* Trinity Aurora removed — fondo uniforme deep black canónico para consistencia con /perfil
          y para que los halos de cada tile sean los únicos puntos de luz (Vision Pro convention) */}

      {/* ════════ TIER 0 · HEADER ════════ */}
      <motion.header {...enterCascade(0)} style={{ position: "relative", zIndex: 1, marginBlockEnd: 18 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBlockEnd: 8 }}>
          <span aria-hidden="true" style={{ position: "relative", inlineSize: 6, blockSize: 6 }}>
            <motion.span
              animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
              transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              style={{ position: "absolute", inset: 0, borderRadius: "50%", background: SIG.primary }}
            />
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${SIG.primary} 55%)`, boxShadow: `0 0 8px ${SIG.primary}` }} />
          </span>
          <span style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 500,
            color: SIG.primary, letterSpacing: "0.30em", textTransform: "uppercase",
            textShadow: `0 0 6px ${withAlpha(SIG.primary, 50)}`,
          }}>
            Dashboard · semana <span style={{ color: T.textHi, letterSpacing: "0.12em" }}>{String(st.weekNum || 17).padStart(2, "0")}</span>
          </span>
        </span>
        <h2 style={{
          fontSize: 30, fontWeight: 250,
          backgroundImage: `linear-gradient(135deg, ${SIG.calma} 0%, ${SIG.enfoque} 50%, ${SIG.energia} 100%)`,
          WebkitBackgroundClip: "text", backgroundClip: "text",
          WebkitTextFillColor: "transparent", color: "transparent",
          letterSpacing: -0.9, lineHeight: 1.05, margin: 0,
          filter: `drop-shadow(0 0 18px ${withAlpha(SIG.primary, 16)})`,
        }}>
          Tu motor neural
        </h2>
        <p style={{
          fontSize: 13, fontWeight: 400, color: T.textMd,
          lineHeight: 1.45, letterSpacing: -0.05, margin: 0, marginBlockStart: 6,
          maxInlineSize: 480,
        }}>
          {perf >= 70
            ? "Vas brutal. Tu sistema responde y se adapta — sigue así."
            : perf >= 50
              ? "Estado funcional. Una sesión más eleva tu rendimiento."
              : "Tu sistema necesita atención. Prioriza un reset."}
        </p>
      </motion.header>

      {/* InstrumentDueCard */}
      <motion.div {...enterCascade(1)} style={{ position: "relative", zIndex: 1 }}>
        <InstrumentDueCard isDark={isDark} ac={ac} />
      </motion.div>

      {/* ════════ TIER 1 · HERO ESTADO (full-width Menu Strip pattern, scaled) ════════ */}
      <motion.button
        type="button"
        {...enterCascade(2)}
        onClick={() => toggleTile("estado")}
        aria-expanded={expandedTile === "estado"}
        aria-label={`Tu estado: ${perf >= 70 ? "óptimo" : perf >= 50 ? "funcional" : "atención"}`}
        whileTap={reduced ? {} : { scale: 0.99 }}
        layout
        transition={reduced ? { duration: 0 } : { layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        style={{
          position: "relative", zIndex: 1,
          inlineSize: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          textAlign: "start",
          background: `radial-gradient(ellipse 75% 100% at 0% 0%, ${withAlpha(perfColor, 16)} 0%, transparent 60%), ${T.glassBg}`,
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          border: `0.5px solid ${T.borderHi}`,
          borderRadius: 22,
          padding: "16px 16px 16px 18px",
          marginBlockEnd: 12,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(perfColor, 28)}, 0 8px 26px rgba(0,0,0,0.30), 0 0 22px ${withAlpha(perfColor, 16)}`,
          overflow: "hidden",
          cursor: "pointer",
          color: "inherit",
          fontFamily: "inherit",
        }}
      >
        {/* Vertical accent strip on left edge — Evaluación pattern (always visible on hero) */}
        <span aria-hidden="true" style={{
          position: "absolute",
          insetBlockStart: 14, insetBlockEnd: 14,
          insetInlineStart: 0,
          inlineSize: 3,
          borderStartEndRadius: 99, borderEndEndRadius: 99,
          background: `linear-gradient(180deg, ${perfColor} 0%, ${withAlpha(perfColor, 60)} 100%)`,
          boxShadow: `0 0 10px ${perfColor}, 0 0 4px ${perfColor}`,
          zIndex: 1,
        }} />

        {/* Status chip top-right (collapsed) */}
        {expandedTile !== "estado" && (
          <span style={{ position: "absolute", insetBlockStart: 14, insetInlineEnd: 14, zIndex: 2 }}>
            <span style={{
              fontFamily: MONO, fontSize: 8, fontWeight: 500,
              color: perfColor, letterSpacing: "0.20em", textTransform: "uppercase",
              paddingInline: 8, paddingBlock: 3,
              background: withAlpha(perfColor, 14),
              border: `0.5px solid ${withAlpha(perfColor, 35)}`,
              borderRadius: 99,
              textShadow: `0 0 5px ${withAlpha(perfColor, 50)}`,
            }}>
              {rD.c + rD.r > 0 ? `↑ subiendo` : rD.c + rD.r < 0 ? `↓ bajando` : "estable"}
            </span>
          </span>
        )}

        {/* Collapsed: horizontal Menu Strip — IconTile big + identity stack */}
        {expandedTile !== "estado" && (
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
            <motion.div
              animate={reduced ? {} : { scale: [1, 1.025, 1] }}
              transition={reduced ? {} : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ flexShrink: 0 }}
            >
              <IconTile color={perfColor} glyph={<EstadoGlyph color={perfColor} score={perf} />} size={92} radius={22} />
            </motion.div>
            <div style={{ flex: 1, minInlineSize: 0 }}>
              <div style={{
                fontFamily: MONO, fontSize: 8.5, fontWeight: 500,
                color: perfColor, letterSpacing: "0.26em", textTransform: "uppercase",
                textShadow: `0 0 6px ${withAlpha(perfColor, 50)}`,
                marginBlockEnd: 4,
              }}>
                Tu estado
              </div>
              <div style={{
                fontSize: 26, fontWeight: 350,
                color: T.textHi,
                letterSpacing: -0.6, lineHeight: 1.05,
                marginBlockEnd: 6,
              }}>
                {perf >= 70 ? "Óptimo" : perf >= 50 ? "Funcional" : "Atención"}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 400,
                color: T.textMd,
                lineHeight: 1.4,
                maxInlineSize: 280,
              }}>
                {perf >= 70 ? "Tu sistema responde y se adapta." : perf >= 50 ? "Camino estable. Sigue así." : "Tu sistema pide pausa."}
              </div>
            </div>
          </div>
        )}

        {/* Expanded content for estado */}
        <AnimatePresence>
          {expandedTile === "estado" && (
            <motion.div
              key="estado-expanded"
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.35, delay: 0.12 }}
              style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <IconTile color={perfColor} glyph={<EstadoGlyph color={perfColor} score={perf} />} size={56} radius={14} />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: perfColor, letterSpacing: "0.24em", textTransform: "uppercase", textShadow: `0 0 5px ${withAlpha(perfColor, 50)}` }}>Tu estado</div>
                    <div style={{ fontSize: 17, fontWeight: 500, color: T.textHi, letterSpacing: -0.3, lineHeight: 1.15, marginBlockStart: 4 }}>{perf >= 70 ? "Óptimo · Tu motor está cocinando" : perf >= 50 ? "Funcional · Camino estable" : "Atención · Necesitas reset"}</div>
                  </div>
                </div>
                <span aria-hidden="true" style={{ inlineSize: 30, blockSize: 30, borderRadius: "50%", background: `linear-gradient(180deg, ${withAlpha(perfColor, 18)} 0%, ${withAlpha(perfColor, 6)} 100%)`, border: `0.5px solid ${withAlpha(perfColor, 35)}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 11 11">
                    <path d="M2.5 2.5 L8.5 8.5 M8.5 2.5 L2.5 8.5" stroke={perfColor} strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <span aria-hidden="true" style={{ display: "block", blockSize: 1, background: `linear-gradient(90deg, ${withAlpha(perfColor, 30)} 0%, ${withAlpha(perfColor, 5)} 100%)` }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 64, fontWeight: 200, color: T.textHi, letterSpacing: -2, fontVariantNumeric: "tabular-nums", textShadow: `0 0 22px ${withAlpha(perfColor, 35)}` }}>{perf}</span>
                <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 500, color: T.textMd }}>/100</span>
                <span style={{ marginInlineStart: 8 }}><TrendDelta value={Math.round(rD.c + rD.r)} suffix="%" /></span>
              </div>

              {/* 3-bar breakdown by dimension */}
              <div style={{ paddingBlock: 12, paddingInline: 12, background: T.glassBg, border: `0.5px solid ${withAlpha(perfColor, 18)}`, borderRadius: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 10 }}>
                  Composición · 3 dimensiones neurales
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {[
                    { l: "Foco", v: st.coherencia || 0, c: SIG.calma, d: rD.c },
                    { l: "Calma", v: st.resiliencia || 0, c: SIG.enfoque, d: rD.r },
                    { l: "Pulso", v: st.capacidad || 0, c: SIG.energia, d: rD.e },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", columnGap: 10, alignItems: "center" }}>
                      <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: m.c, letterSpacing: "0.20em", textTransform: "uppercase", textShadow: `0 0 5px ${withAlpha(m.c, 50)}` }}>
                        {m.l}
                      </span>
                      <div style={{ position: "relative", blockSize: 6, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          position: "absolute", insetBlockStart: 0, insetInlineStart: 0, blockSize: "100%",
                          inlineSize: `${m.v}%`,
                          background: `linear-gradient(90deg, ${withAlpha(m.c, 50)} 0%, ${m.c} 100%)`,
                          boxShadow: `0 0 6px ${withAlpha(m.c, 60)}`,
                          borderRadius: 99,
                        }} />
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4, minInlineSize: 56, justifyContent: "flex-end" }}>
                        <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 300, color: T.textHi, letterSpacing: -0.3, fontVariantNumeric: "tabular-nums", textShadow: `0 0 8px ${withAlpha(m.c, 35)}` }}>
                          {m.v}
                        </span>
                        {m.d !== 0 && <TrendDelta value={m.d} />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {perfTrend.length >= 3 && (
                <div style={{ paddingBlock: 12, paddingInline: 12, background: T.glassBg, border: `0.5px solid ${withAlpha(perfColor, 18)}`, borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBlockEnd: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase" }}>Trayectoria · {perfTrend.length} sesiones</span>
                    <TrendDelta value={Math.round(rD.c + rD.r)} suffix="%" />
                  </div>
                  <BioSparkline data={perfTrend} width={300} height={36} color={perfColor} ariaLabel={`Trayectoria últimas ${perfTrend.length} sesiones`} />
                </div>
              )}

              <p style={{ fontSize: 13, color: T.textMd, lineHeight: 1.5, margin: 0 }}>
                Tu Estado es el promedio compuesto de tus 3 dimensiones neurales: <strong style={{ color: SIG.calma }}>Foco</strong>, <strong style={{ color: SIG.enfoque }}>Calma</strong> y <strong style={{ color: SIG.energia }}>Pulso</strong>. Refleja qué tan bien tu sistema responde y se adapta.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ════════ TIER 2-3 · BENTO GRID (volumetric pills, tap-to-expand) ════════ */}
      <motion.div
        {...enterCascade(3)}
        style={{
          position: "relative", zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBlockEnd: 12,
        }}
      >
        {/* Helper: status pill component */}
        {(() => null)()}

        {/* FOCO — coherencia neural (atención sostenida) */}
        <BentoTile
          id="enfoque"
          color={SIG.calma}
          name="Foco"
          subtitle="Atención sostenida"
          status={
            <span style={{
              fontFamily: MONO, fontSize: 7.5, fontWeight: 500,
              color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
              paddingInline: 7, paddingBlock: 3,
              background: "rgba(255,255,255,0.20)",
              border: "0.5px solid rgba(255,255,255,0.30)",
              borderRadius: 99,
              backdropFilter: "blur(8px)",
            }}>{rD.c > 0 ? `↑ alto` : rD.c < 0 ? `↓ baja` : "estable"}</span>
          }
          glyph={<FocoGlyph color={SIG.calma} />}
          expanded={expandedTile === "enfoque"}
          onToggle={() => toggleTile("enfoque")}
          expandedTitle="Foco · Coherencia neural"
        >
          <MetricDetail
            history={st.history}
            dataKey="c"
            value={st.coherencia || 0}
            delta={rD.c}
            color={SIG.calma}
            description="Tu capacidad de mantener atención sostenida sin dispersión. Mide qué tan bien tu sistema neural sincroniza foco bajo carga cognitiva."
            protoSens={protoSens}
          />
        </BentoTile>

        {/* CALMA — resiliencia neural (regulación autónoma) */}
        <BentoTile
          id="calma"
          color={SIG.enfoque}
          name="Calma"
          subtitle="Regulación autónoma"
          status={
            <span style={{
              fontFamily: MONO, fontSize: 7.5, fontWeight: 500,
              color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
              paddingInline: 7, paddingBlock: 3,
              background: "rgba(255,255,255,0.20)",
              border: "0.5px solid rgba(255,255,255,0.30)",
              borderRadius: 99,
              backdropFilter: "blur(8px)",
            }}>{rD.r > 0 ? `↑ alta` : rD.r < 0 ? `↓ baja` : "estable"}</span>
          }
          glyph={<CalmaGlyph2 color={SIG.enfoque} />}
          expanded={expandedTile === "calma"}
          onToggle={() => toggleTile("calma")}
          expandedTitle="Calma · Resiliencia neural"
        >
          <MetricDetail
            history={st.history}
            dataKey="r"
            value={st.resiliencia || 0}
            delta={rD.r}
            color={SIG.enfoque}
            description="Tu capacidad de regular el sistema autónomo bajo presión. Mide tono vagal, recuperación post-estrés y modulación parasimpática."
            protoSens={protoSens}
          />
        </BentoTile>

        {/* PULSO — capacidad metabólica (activación adaptativa) */}
        <BentoTile
          id="energia"
          color={SIG.energia}
          name="Pulso"
          subtitle="Energía adaptativa"
          status={
            <span style={{
              fontFamily: MONO, fontSize: 7.5, fontWeight: 500,
              color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
              paddingInline: 7, paddingBlock: 3,
              background: "rgba(255,255,255,0.20)",
              border: "0.5px solid rgba(255,255,255,0.30)",
              borderRadius: 99,
              backdropFilter: "blur(8px)",
            }}>{rD.e > 0 ? `↑ activo` : rD.e < 0 ? `↓ bajo` : "estable"}</span>
          }
          glyph={<PulsoGlyph color={SIG.energia} />}
          expanded={expandedTile === "energia"}
          onToggle={() => toggleTile("energia")}
          expandedTitle="Pulso · Capacidad metabólica"
        >
          <MetricDetail
            history={st.history}
            dataKey="e"
            value={st.capacidad || 0}
            delta={rD.e}
            color={SIG.energia}
            description="Tu disponibilidad de recursos energéticos para activación. Mide capacidad metabólica para sostener intensidad sin agotamiento."
            protoSens={protoSens}
          />
        </BentoTile>

        {/* BRÚJULA — recomendación adaptativa */}
        <BentoTile
          id="coach"
          color={SIG.rose}
          name="Brújula"
          subtitle="Próximo paso · IA"
          status={
            <span style={{
              fontFamily: MONO, fontSize: 7.5, fontWeight: 500,
              color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
              paddingInline: 7, paddingBlock: 3,
              background: "rgba(255,255,255,0.20)",
              border: "0.5px solid rgba(255,255,255,0.30)",
              borderRadius: 99,
              backdropFilter: "blur(8px)",
            }}>activa</span>
          }
          glyph={<BrujulaGlyph color={SIG.rose} />}
          expanded={expandedTile === "coach"}
          onToggle={() => toggleTile("coach")}
          expandedTitle="Brújula · Próximo paso"
        >
          <CoachDetail st={st} onSelectProtocol={(proto) => { sp?.(proto); switchTab?.("ignicion"); }} color={SIG.rose} />
        </BentoTile>

        {/* SISTEMA — salud (BioSignal + Burnout + Variabilidad) */}
        <BentoTile
          id="salud"
          color={burnoutColor}
          name="Sistema"
          subtitle={burnout.risk === "bajo" ? "Vital saludable" : `Riesgo ${burnout.risk}`}
          status={
            <span style={{
              fontFamily: MONO, fontSize: 7.5, fontWeight: 500,
              color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
              paddingInline: 7, paddingBlock: 3,
              background: "rgba(255,255,255,0.20)",
              border: "0.5px solid rgba(255,255,255,0.30)",
              borderRadius: 99,
              backdropFilter: "blur(8px)",
            }}>{burnout.risk === "bajo" ? "ok" : burnout.risk}</span>
          }
          glyph={<SistemaGlyph color={burnoutColor} />}
          expanded={expandedTile === "salud"}
          onToggle={() => toggleTile("salud")}
          expandedTitle="Sistema · Salud vital"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBlockEnd: 12 }}>
            {[
              { l: "BioSignal", v: bioSig.score, sfx: "/100", c: colorForScore(bioSig.score), interp: bioSig.score >= 70 ? "Rendimiento alto" : bioSig.score >= 45 ? "Funcional" : "Intervención" },
              { l: "Burnout", v: burnout.index, sfx: "", c: burnoutColor, interp: `Riesgo ${burnout.risk}` },
            ].map((m, i) => (
              <div key={i} style={{
                paddingBlock: 10, paddingInline: 12,
                background: `radial-gradient(circle at 50% 60%, ${withAlpha(m.c, 22)} 0%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
                border: `0.5px solid ${withAlpha(m.c, 30)}`, borderRadius: 14,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: m.c, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 4, textShadow: `0 0 5px ${withAlpha(m.c, 50)}` }}>{m.l}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 250, color: T.textHi, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums", textShadow: `0 0 10px ${withAlpha(m.c, 40)}` }}>{m.v}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: T.textMd }}>{m.sfx}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textMd, marginBlockStart: 3, lineHeight: 1.3 }}>{m.interp}</div>
              </div>
            ))}
          </div>
          {neuralVar && (
            <div style={{ paddingBlock: 10, paddingInline: 12, background: "rgba(255,255,255,0.025)", borderRadius: 12, marginBlockEnd: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBlockEnd: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: SIG.enfoque, letterSpacing: "0.22em", textTransform: "uppercase" }}>Variabilidad neural</span>
                <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 300, color: colorForScore(100 - neuralVar.index, 90, 80), letterSpacing: -0.3, fontVariantNumeric: "tabular-nums" }}>{neuralVar.index}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMd, lineHeight: 1.4 }}>{neuralVar.interpretation}</div>
            </div>
          )}
          {burnout.components && (burnout.components.exhaustion?.value > 0 || burnout.components.disengage?.value > 0) && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 8 }}>Desglose Maslach</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { k: "exhaustion", label: "Agotamiento", v: burnout.components.exhaustion?.value ?? 0 },
                  { k: "disengage", label: "Despersonal.", v: burnout.components.disengage?.value ?? 0 },
                  { k: "efficacy", label: "Baja eficacia", v: burnout.components.efficacy?.value ?? 0 },
                ].map((row) => {
                  const v = Math.max(0, Math.min(100, Math.round(row.v)));
                  const c = v >= 60 ? SIG.danger : v >= 35 ? SIG.energia : SIG.success;
                  return (
                    <div key={row.k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontFamily: MONO, fontSize: 7.5, color: T.textMd, letterSpacing: "0.18em", textTransform: "uppercase" }}>{row.label}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                        <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 300, color: c, letterSpacing: -0.3, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                        <span style={{ fontFamily: MONO, fontSize: 8, color: T.textLo }}>/100</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, width: `${v}%`, background: `linear-gradient(90deg, ${withAlpha(c, 60)} 0%, ${c} 100%)`, borderRadius: 99, boxShadow: `0 0 5px ${withAlpha(c, 50)}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </BentoTile>

        {/* RITMO — consistencia semanal (sesiones + racha + heatmap) */}
        <BentoTile
          id="semana"
          color="#34D399"
          name="Ritmo"
          subtitle="Constancia · racha"
          status={
            <span style={{
              fontFamily: MONO, fontSize: 7.5, fontWeight: 500,
              color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
              paddingInline: 7, paddingBlock: 3,
              background: "rgba(255,255,255,0.20)",
              border: "0.5px solid rgba(255,255,255,0.30)",
              borderRadius: 99,
              backdropFilter: "blur(8px)",
            }}>{(st.streak || 0) > 0 ? `${st.streak}d activo` : "pausa"}</span>
          }
          glyph={<RitmoGlyph color="#34D399" />}
          expanded={expandedTile === "semana"}
          onToggle={() => toggleTile("semana")}
          expandedTitle="Ritmo · Tu constancia"
        >
          <div style={{ marginBlockEnd: 14 }}>
            <StreakCalendar history={st.history} isDark={isDark} accent={SIG.calma} weeks={12} />
          </div>
          <div style={{ marginBlockEnd: 14 }}>
            <TemporalCharts type="weekly" weeklyData={st.weeklyData} isDark={isDark} ac={SIG.calma} />
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 8 }}>Actividad · 28 días</div>
            <TemporalCharts type="heatmap" history={st.history} isDark={isDark} ac={SIG.calma} />
          </div>
        </BentoTile>

        {/* ÁNIMO — patrones emocionales (mood trend + flujo energía) */}
        <BentoTile
          id="patrones"
          color={MOODS[Math.round(avgMood) - 1]?.color || SIG.enfoque}
          name="Ánimo"
          subtitle={avgMood > 0 ? `${MOODS[Math.round(avgMood) - 1]?.label || "—"}` : "Sin datos"}
          status={
            <span style={{
              fontFamily: MONO, fontSize: 7.5, fontWeight: 500,
              color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
              paddingInline: 7, paddingBlock: 3,
              background: "rgba(255,255,255,0.20)",
              border: "0.5px solid rgba(255,255,255,0.30)",
              borderRadius: 99,
              backdropFilter: "blur(8px)",
            }}>{avgMood > 0 ? "registrado" : "vacío"}</span>
          }
          glyph={<AnimoGlyph color={MOODS[Math.round(avgMood) - 1]?.color || SIG.enfoque} />}
          expanded={expandedTile === "patrones"}
          onToggle={() => toggleTile("patrones")}
          expandedTitle="Ánimo · Patrones emocionales"
        >
          {moodTrend.length >= 2 && (
            <div style={{ marginBlockEnd: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 8 }}>Tendencia emocional</div>
              <TemporalCharts type="mood" moodLog={st.moodLog} isDark={isDark} />
            </div>
          )}
          {st.history?.length >= 3 && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 8 }}>Flujo de energía</div>
              <TemporalCharts type="energy" history={st.history} isDark={isDark} ac={SIG.enfoque} />
            </div>
          )}
        </BentoTile>

        {/* INTELIGENCIA — motor adaptativo (radar + bandit + correlations) */}
        <BentoTile
          id="motor"
          color="#A78BFA"
          name="Inteligencia"
          subtitle="Lo que aprende de ti"
          status={
            <span style={{
              fontFamily: MONO, fontSize: 7.5, fontWeight: 500,
              color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
              paddingInline: 7, paddingBlock: 3,
              background: "rgba(255,255,255,0.20)",
              border: "0.5px solid rgba(255,255,255,0.30)",
              borderRadius: 99,
              backdropFilter: "blur(8px)",
            }}>activa</span>
          }
          glyph={<InteligenciaGlyph color="#A78BFA" />}
          expanded={expandedTile === "motor"}
          onToggle={() => toggleTile("motor")}
          expandedTitle="Inteligencia · Motor adaptativo"
        >
          <div style={{ marginBlockEnd: 14 }}>
            <NeuralRadar st={st} isDark={isDark} />
          </div>
          {learnedArms.length >= 2 && (
            <div style={{ marginBlockEnd: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 8 }}>Top señales aprendidas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {learnedArms.map((arm) => {
                  const pos = arm.mean > 0;
                  const c = pos ? SIG.success : arm.mean < -0.2 ? SIG.danger : T.textMd;
                  return (
                    <div key={arm.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", paddingBlock: 8, paddingInline: 10, background: "rgba(255,255,255,0.025)", borderRadius: 12 }}>
                      <div style={{ minInlineSize: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: T.textHi, letterSpacing: -0.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{arm.id}</div>
                        <div style={{ fontFamily: MONO, fontSize: 8, color: T.textLo, letterSpacing: "0.10em", marginBlockStart: 2 }}>{arm.n} obs</div>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 300, color: c, fontVariantNumeric: "tabular-nums", letterSpacing: -0.2, textShadow: `0 0 8px ${withAlpha(c, 35)}` }}>{pos ? "+" : ""}{arm.mean}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {Object.keys(protoSens).length >= 2 && (
            <div style={{ marginBlockEnd: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: T.textMd, letterSpacing: "0.22em", textTransform: "uppercase", marginBlockEnd: 8 }}>Sensibilidad por protocolo</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(protoSens).sort((a, b) => b[1].avgDelta - a[1].avgDelta).slice(0, 5).map(([name, data], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBlock: 6 }}>
                    <span style={{ fontSize: 11.5, color: T.textMd }}>{name}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 300, color: data.avgDelta > 0 ? SIG.success : SIG.danger, letterSpacing: -0.2, fontVariantNumeric: "tabular-nums" }}>
                        {data.avgDelta > 0 ? "+" : ""}{data.avgDelta}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: T.textLo }}>{data.sessions}x</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <CorrelationMatrix st={st} isDark={isDark} onSelectProtocol={(p) => { sp(p); switchTab("ignicion"); }} />
        </BentoTile>
      </motion.div>


      {/* ════════ TIER 4 · LOGROS & FOOTER (Menu Strip /perfil pattern + IconTile) ════════ */}

      {(st.achievements || []).length > 0 && (
        <motion.article
          {...enterCascade(8)}
          aria-label={`Logros: ${(st.achievements || []).length}`}
          style={{
            position: "relative", zIndex: 1,
            background: `radial-gradient(ellipse 75% 100% at 0% 0%, ${withAlpha(SIG.ignition, 16)} 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 100% 100%, ${withAlpha(SIG.rose, 9)} 0%, transparent 55%), ${T.glassBg}`,
            backdropFilter: "blur(22px) saturate(150%)",
            WebkitBackdropFilter: "blur(22px) saturate(150%)",
            border: `0.5px solid ${T.borderHi}`,
            borderRadius: 22,
            padding: "16px 16px 14px 18px",
            marginBlockEnd: 10,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(SIG.ignition, 22)}, 0 8px 24px rgba(0,0,0,0.30), 0 0 18px ${withAlpha(SIG.ignition, 12)}`,
            overflow: "hidden",
          }}
        >
          {/* Vertical accent strip on left edge — celebration pulse */}
          <span aria-hidden="true" style={{
            position: "absolute",
            insetBlockStart: 14, insetBlockEnd: 14,
            insetInlineStart: 0,
            inlineSize: 3,
            borderStartEndRadius: 99, borderEndEndRadius: 99,
            background: `linear-gradient(180deg, ${SIG.ignition} 0%, ${SIG.rose} 100%)`,
            boxShadow: `0 0 10px ${SIG.ignition}, 0 0 4px ${SIG.ignition}`,
            zIndex: 1,
          }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14, marginBlockEnd: 14 }}>
            <IconTile color={SIG.ignition} glyph={<GlyphTrophy color={SIG.ignition} />} size={64} radius={16} />
            <div style={{ flex: 1, minInlineSize: 0 }}>
              <div style={{
                fontFamily: MONO, fontSize: 8.5, fontWeight: 500,
                color: SIG.ignition, letterSpacing: "0.24em", textTransform: "uppercase",
                textShadow: `0 0 5px ${withAlpha(SIG.ignition, 50)}`,
              }}>
                Logros · {(st.achievements || []).length} desbloqueadas
              </div>
              <div style={{ fontSize: 17, fontWeight: 500, color: T.textHi, letterSpacing: -0.3, marginBlockStart: 4 }}>
                Progreso del operador
              </div>
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(st.achievements || []).map((a) => (
              <span key={a} style={{
                fontFamily: MONO, fontSize: 9, fontWeight: 500,
                color: SIG.ignition, letterSpacing: "0.12em",
                paddingInline: 10, paddingBlock: 5,
                background: `linear-gradient(180deg, ${withAlpha(SIG.ignition, 18)} 0%, ${withAlpha(SIG.ignition, 8)} 100%)`,
                border: `0.5px solid ${withAlpha(SIG.ignition, 35)}`,
                borderRadius: 99,
                textShadow: `0 0 5px ${withAlpha(SIG.ignition, 50)}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}>
                {AM[a] || a}
              </span>
            ))}
          </div>
        </motion.article>
      )}

      {/* Historial CTA — full-width Menu Strip pattern with IconTile */}
      <motion.button
        {...enterCascade(9)}
        whileTap={reduced ? {} : { scale: 0.985 }}
        onClick={onShowHist}
        aria-label={`Abrir historial con ${(st.history || []).length} sesiones`}
        style={{
          position: "relative", zIndex: 1,
          inlineSize: "100%",
          display: "grid", gridTemplateColumns: "auto 1fr auto",
          columnGap: 14, alignItems: "center",
          paddingBlock: 14, paddingInline: "14px 18px",
          borderRadius: 22,
          border: `0.5px solid ${T.borderHi}`,
          background: `radial-gradient(ellipse 75% 100% at 0% 0%, ${withAlpha(SIG.primary, 14)} 0%, transparent 60%), ${T.glassBg}`,
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(SIG.primary, 18)}, 0 6px 20px rgba(0,0,0,0.26), 0 0 14px ${withAlpha(SIG.primary, 10)}`,
          cursor: "pointer",
          textAlign: "start",
          fontFamily: "inherit",
        }}
      >
        <IconTile color={SIG.primary} glyph={<ClockGlyph color={SIG.primary} />} size={56} radius={14} />
        <span style={{ minInlineSize: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: T.textHi, letterSpacing: -0.3, lineHeight: 1.15 }}>
            Toda tu trayectoria
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, color: SIG.primary, letterSpacing: "0.18em", textTransform: "uppercase", textShadow: `0 0 5px ${withAlpha(SIG.primary, 50)}` }}>
            Historial · {(st.history || []).length} sesiones
          </span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: SIG.primary, letterSpacing: "0.18em", textTransform: "uppercase" }}>Abrir</span>
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <path d="M3.5 1.5 L7.5 5.5 L3.5 9.5" stroke={SIG.primary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
      </motion.button>
    </section>
  );
}
