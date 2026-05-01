"use client";
/* ═══════════════════════════════════════════════════════════════
   CalibrationPlan — onboarding de datos para usuarios nuevos.

   Tres sesiones variando intent (calma/enfoque/energía) antes de
   mostrar el dashboard "real". ADN propio fijo (NO hereda ac que
   cambia con el protocolo seleccionado): signature trinity
   cyan→violet→amber + aurora ambient + state-color-aware plates.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { calibrationState } from "../lib/calibrationPlan";
import {
  resolveTheme,
  withAlpha,
  bioSignal,
} from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// SIGNATURE COLORS — fijos, NO heredan del ac global
const SIG = {
  calma: "#22D3EE",     // phosphorCyan — paso 1 / breath / baseline
  enfoque: "#A78BFA",   // neuralViolet — paso 2 / focus / deep
  energia: "#F59E0B",   // ignition — paso 3 / activation / amber
  primary: "#22D3EE",   // page-level signature (matches calma since es el primer paso)
};

// Custom intent SVG glyphs — siempre coloreados aunque pending
function CalmaGlyph({ active }) {
  const c = SIG.calma;
  const op = active ? 1 : 0.85;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="calmaWaveG" x1="0%" x2="100%">
          <stop offset="0%" stopColor={c} stopOpacity="0.35" />
          <stop offset="50%" stopColor={c} />
          <stop offset="100%" stopColor={c} stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="calmaCore" cx="50%" cy="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* Core glow halo */}
      <circle cx="24" cy="24" r="20" fill="url(#calmaCore)" opacity={op} />
      {/* 3 stacked breath waves */}
      <path d="M 4 14 Q 12 8, 20 14 T 36 14 T 44 14" fill="none" stroke="url(#calmaWaveG)" strokeWidth="1.6" strokeLinecap="round" opacity={op} />
      <path d="M 4 24 Q 12 18, 20 24 T 36 24 T 44 24" fill="none" stroke="url(#calmaWaveG)" strokeWidth="1.4" strokeLinecap="round" opacity={op * 0.85} />
      <path d="M 4 34 Q 12 29, 20 34 T 36 34 T 44 34" fill="none" stroke="url(#calmaWaveG)" strokeWidth="1.2" strokeLinecap="round" opacity={op * 0.65} />
      {/* Center pulse with white core */}
      <circle cx="24" cy="24" r="2.5" fill="#fff" opacity={op} />
      <circle cx="24" cy="24" r="4.5" fill="none" stroke={c} strokeWidth="0.8" opacity={op * 0.6} />
      <circle cx="24" cy="24" r="7" fill="none" stroke={c} strokeWidth="0.5" opacity={op * 0.3} strokeDasharray="1 2" />
    </svg>
  );
}

function EnfoqueGlyph({ active }) {
  const c = SIG.enfoque;
  const op = active ? 1 : 0.85;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id="enfoqueCore" cx="50%" cy="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.85" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Outer dashed scan ring */}
      <circle cx="24" cy="24" r="20" fill="none" stroke={withAlpha(c, 35)} strokeWidth="0.5" strokeDasharray="2 3" opacity={op} />
      <circle cx="24" cy="24" r="14" fill="none" stroke={withAlpha(c, 60)} strokeWidth="0.7" opacity={op} />
      {/* Glow core */}
      <circle cx="24" cy="24" r="9" fill="url(#enfoqueCore)" opacity={op} />
      <circle cx="24" cy="24" r="9" fill="none" stroke={c} strokeWidth="1" opacity={op} />
      {/* Crosshair extending out */}
      <line x1="24" y1="2" x2="24" y2="6" stroke={c} strokeWidth="1.1" strokeLinecap="round" opacity={op} />
      <line x1="24" y1="42" x2="24" y2="46" stroke={c} strokeWidth="1.1" strokeLinecap="round" opacity={op} />
      <line x1="2" y1="24" x2="6" y2="24" stroke={c} strokeWidth="1.1" strokeLinecap="round" opacity={op} />
      <line x1="42" y1="24" x2="46" y2="24" stroke={c} strokeWidth="1.1" strokeLinecap="round" opacity={op} />
      {/* Inner cross dots */}
      <circle cx="24" cy="24" r="2.8" fill="#fff" opacity={op} />
      <circle cx="24" cy="24" r="1" fill={c} opacity={op} />
    </svg>
  );
}

function EnergiaGlyph({ active }) {
  const c = SIG.energia;
  const op = active ? 1 : 0.85;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id="energiaCore" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFE0A5" stopOpacity="0.95" />
          <stop offset="60%" stopColor={c} stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* Outer halo */}
      <circle cx="24" cy="24" r="22" fill="none" stroke={withAlpha(c, 25)} strokeWidth="0.5" strokeDasharray="2 3" opacity={op} />
      {/* 8-ray ignition burst */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        const isMajor = i % 2 === 0;
        const r1 = isMajor ? 9 : 8;
        const r2 = isMajor ? 19 : 15;
        const x1 = 24 + Math.cos(rad) * r1;
        const y1 = 24 + Math.sin(rad) * r1;
        const x2 = 24 + Math.cos(rad) * r2;
        const y2 = 24 + Math.sin(rad) * r2;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={c}
            strokeWidth={isMajor ? 1.6 : 1}
            strokeLinecap="round"
            opacity={isMajor ? op : op * 0.6}
          />
        );
      })}
      {/* Glow core */}
      <circle cx="24" cy="24" r="10" fill="url(#energiaCore)" opacity={op} />
      {/* Core */}
      <circle cx="24" cy="24" r="6" fill={c} opacity={op} />
      <circle cx="24" cy="24" r="3.5" fill="#fff" opacity={op * 0.95} />
      <circle cx="24" cy="24" r="9" fill="none" stroke={withAlpha(c, 60)} strokeWidth="0.7" opacity={op} />
    </svg>
  );
}

const INTENT_GLYPHS = {
  calma: { Component: CalmaGlyph, tone: SIG.calma },
  enfoque: { Component: EnfoqueGlyph, tone: SIG.enfoque },
  energia: { Component: EnergiaGlyph, tone: SIG.energia },
};

// Trinity glyph for header — 3 connected nodes (calma · enfoque · energia)
function TrinityGlyph({ reduced }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="trinityCenter" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* Outer ring dashed */}
      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" strokeDasharray="2 3" />
      {/* Center field glow */}
      <circle cx="32" cy="32" r="18" fill="url(#trinityCenter)" />
      {/* Connecting triangle lines (3 sides) */}
      <line x1="32" y1="10" x2="14" y2="44" stroke={withAlpha(SIG.calma, 50)} strokeWidth="0.7" />
      <line x1="32" y1="10" x2="50" y2="44" stroke={withAlpha(SIG.energia, 50)} strokeWidth="0.7" />
      <line x1="14" y1="44" x2="50" y2="44" stroke={withAlpha(SIG.enfoque, 50)} strokeWidth="0.7" />
      {/* 3 corner nodes — calma top, enfoque bottom-left, energia bottom-right */}
      {/* Calma node (top, cyan) */}
      <circle cx="32" cy="10" r="5" fill={SIG.calma} opacity="0.9" />
      <circle cx="32" cy="10" r="5" fill="none" stroke="#fff" strokeWidth="0.6" />
      <motion.circle
        cx="32" cy="10" r="7"
        fill="none" stroke={SIG.calma} strokeWidth="0.6"
        animate={reduced ? {} : { r: [5, 9, 5], opacity: [0.6, 0, 0.6] }}
        transition={reduced ? {} : { duration: 2.6, repeat: Infinity, ease: "easeOut" }}
      />
      {/* Enfoque node (bottom-left, violet) */}
      <circle cx="14" cy="44" r="4.5" fill={SIG.enfoque} opacity="0.9" />
      <circle cx="14" cy="44" r="4.5" fill="none" stroke="#fff" strokeWidth="0.6" />
      <motion.circle
        cx="14" cy="44" r="6.5"
        fill="none" stroke={SIG.enfoque} strokeWidth="0.6"
        animate={reduced ? {} : { r: [4.5, 8, 4.5], opacity: [0.6, 0, 0.6] }}
        transition={reduced ? {} : { duration: 2.6, repeat: Infinity, ease: "easeOut", delay: 0.85 }}
      />
      {/* Energia node (bottom-right, amber) */}
      <circle cx="50" cy="44" r="4.5" fill={SIG.energia} opacity="0.9" />
      <circle cx="50" cy="44" r="4.5" fill="none" stroke="#fff" strokeWidth="0.6" />
      <motion.circle
        cx="50" cy="44" r="6.5"
        fill="none" stroke={SIG.energia} strokeWidth="0.6"
        animate={reduced ? {} : { r: [4.5, 8, 4.5], opacity: [0.6, 0, 0.6] }}
        transition={reduced ? {} : { duration: 2.6, repeat: Infinity, ease: "easeOut", delay: 1.7 }}
      />
      {/* Center pulse */}
      <circle cx="32" cy="32" r="1.6" fill="#fff" />
    </svg>
  );
}

export default function CalibrationPlan({
  totalSessions,
  isDark,
  // ac removed from destructuring intentionally — color propio fijo
  onStart,
}) {
  const reduced = useReducedMotion();
  resolveTheme(isDark); // touch theme to remain consistent
  const plan = calibrationState(totalSessions);

  return (
    <section
      role="region"
      aria-label="Plan de calibración inicial"
      style={{ position: "relative", paddingBlock: "14px 220px", paddingInline: 20 }}
    >
      {/* TRINITY AURORA — 3 radial gradients layered (cyan top-left + violet center + amber bottom-right), subtle ambient inmersive */}
      <div aria-hidden="true" style={{
        position: "absolute",
        insetBlockStart: -20,
        insetInlineStart: -20,
        insetInlineEnd: -20,
        blockSize: "60vh",
        pointerEvents: "none",
        zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 80% at 15% 20%, ${withAlpha(SIG.calma, 14)} 0%, transparent 55%),
          radial-gradient(ellipse 70% 60% at 85% 15%, ${withAlpha(SIG.enfoque, 10)} 0%, transparent 55%),
          radial-gradient(ellipse 80% 70% at 50% 70%, ${withAlpha(SIG.energia, 8)} 0%, transparent 60%)
        `,
        filter: "blur(20px)",
      }} />

      {/* Header — eyebrow + title gradient + caption + Trinity glyph signature */}
      <motion.header
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 1, marginBlockEnd: 18 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", columnGap: 12, alignItems: "start", marginBlockEnd: 12 }}>
          <div>
            {/* Eyebrow with pulse + step counter mono caps */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBlockEnd: 10 }}>
              <span aria-hidden="true" style={{ position: "relative", inlineSize: 6, blockSize: 6, display: "inline-block" }}>
                <motion.span
                  animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
                  transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                  style={{ position: "absolute", inset: 0, borderRadius: "50%", background: SIG.primary }}
                />
                <span style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 30%, #fff 0%, ${SIG.primary} 55%)`,
                  boxShadow: `0 0 8px ${SIG.primary}`,
                }} />
              </span>
              <span style={{
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 500,
                color: SIG.primary,
                letterSpacing: "0.30em",
                textTransform: "uppercase",
                textShadow: `0 0 6px ${withAlpha(SIG.primary, 50)}`,
              }}>
                Calibración · paso{" "}
                <span style={{ color: "rgba(245,245,247,0.96)", letterSpacing: "0.12em", textShadow: `0 0 6px ${withAlpha(SIG.primary, 30)}` }}>
                  {String(plan.currentStep).padStart(2, "0")}/03
                </span>
              </span>
            </span>
            {/* Title with tri-color gradient (calma cyan → enfoque violet → energia amber) */}
            <h2 style={{
              fontSize: 34,
              fontWeight: 250,
              backgroundImage: `linear-gradient(135deg, ${SIG.calma} 0%, ${SIG.enfoque} 50%, ${SIG.energia} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              letterSpacing: -1.0,
              lineHeight: 1.05,
              margin: 0,
              filter: `drop-shadow(0 0 18px ${withAlpha(SIG.primary, 18)})`,
            }}>
              Calibra tu motor neural
            </h2>
          </div>
          {/* Trinity glyph signature */}
          <span aria-hidden="true" style={{ flexShrink: 0, marginBlockStart: 4, filter: `drop-shadow(0 0 12px ${withAlpha(SIG.primary, 30)})` }}>
            <TrinityGlyph reduced={reduced} />
          </span>
        </div>
        <p style={{
          fontSize: 13.5,
          fontWeight: 400,
          color: "rgba(245,245,247,0.66)",
          lineHeight: 1.45,
          letterSpacing: -0.1,
          margin: 0,
          maxInlineSize: 480,
        }}>
          Tres sesiones cortas para que el sistema aprenda cómo respondes. Después, tus
          recomendaciones se adaptan a ti — no al promedio.
        </p>
      </motion.header>

      {/* Custom 3-segment progress bar with intent-color gradient */}
      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
        role="progressbar"
        aria-valuenow={plan.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de calibración"
        style={{
          position: "relative",
          zIndex: 1,
          inlineSize: "100%",
          blockSize: 4,
          background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.18) 100%)",
          borderRadius: 99,
          overflow: "visible",
          marginBlockEnd: 22,
          boxShadow: `inset 0 0.5px 0 rgba(0,0,0,0.40), 0 0 0 0.5px rgba(255,255,255,0.06)`,
        }}
      >
        <motion.div
          initial={reduced ? { width: `${plan.percent}%` } : { width: 0 }}
          animate={{ width: `${plan.percent}%` }}
          transition={reduced ? { duration: 0 } : { duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            blockSize: "100%",
            background: `linear-gradient(90deg, ${SIG.calma} 0%, ${SIG.enfoque} 50%, ${SIG.energia} 100%)`,
            borderRadius: 99,
            boxShadow: `0 0 10px ${withAlpha(SIG.primary, 60)}, 0 0 4px ${withAlpha(SIG.primary, 80)}, inset 0 0.5px 0 rgba(255,255,255,0.40)`,
          }}
        />
        {/* Tick markers at 33% (cyan→violet) and 66% (violet→amber) */}
        {[
          { pct: 33.33, color: SIG.calma },
          { pct: 66.66, color: SIG.enfoque },
        ].map((tick) => (
          <span
            key={tick.pct}
            aria-hidden="true"
            style={{
              position: "absolute",
              insetInlineStart: `${tick.pct}%`,
              insetBlockStart: -2,
              inlineSize: 1.5,
              blockSize: 8,
              background: `linear-gradient(180deg, ${tick.color} 0%, ${withAlpha(tick.color, 50)} 100%)`,
              borderRadius: 0.5,
              boxShadow: `0 0 4px ${tick.color}`,
            }}
          />
        ))}
      </motion.div>

      {/* 3 calibration step plates — each with own signature color (visible even when pending) */}
      <ol
        aria-label="Pasos de calibración"
        style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}
      >
        {plan.steps.map((step, i) => {
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          const intent = INTENT_GLYPHS[step.intent];
          const tone = isDone ? semantic.success : intent.tone;
          const stateLabel = isDone ? "Completado" : isCurrent ? "Actual" : "Pendiente";
          const stepNum = String(i + 1).padStart(2, "0");

          // ALL plates show their intent color — solo varía la INTENSIDAD según estado
          const intensityBg = isCurrent ? 16 : isDone ? 12 : 9;
          const intensityRing = isCurrent ? 28 : isDone ? 22 : 16;
          const intensityGlow = isCurrent ? 14 : isDone ? 10 : 6;

          return (
            <motion.li
              key={step.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.55, delay: 0.12 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "relative",
                background: `radial-gradient(ellipse 70% 100% at 0% 50%, ${withAlpha(intent.tone, intensityBg)} 0%, transparent 60%), radial-gradient(ellipse 50% 80% at 100% 50%, ${withAlpha(intent.tone, intensityBg / 2)} 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`,
                backdropFilter: "blur(20px) saturate(150%)",
                WebkitBackdropFilter: "blur(20px) saturate(150%)",
                border: `0.5px solid ${withAlpha(intent.tone, isCurrent ? 35 : 18)}`,
                borderRadius: 16,
                padding: "14px 16px 14px 14px",
                boxShadow: isCurrent
                  ? `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(intent.tone, intensityRing)}, 0 6px 22px rgba(0,0,0,0.30), 0 0 22px ${withAlpha(intent.tone, intensityGlow)}`
                  : `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha(intent.tone, intensityRing)}, 0 4px 14px rgba(0,0,0,0.24), 0 0 14px ${withAlpha(intent.tone, intensityGlow)}`,
                overflow: "hidden",
                transition: "background 0.3s ease, box-shadow 0.3s ease",
              }}
            >
              {/* Vertical accent strip on left edge — solo current */}
              {isCurrent && (
                <span aria-hidden="true" style={{
                  position: "absolute",
                  insetBlockStart: 12,
                  insetBlockEnd: 12,
                  insetInlineStart: 0,
                  inlineSize: 3,
                  borderStartEndRadius: 99,
                  borderEndEndRadius: 99,
                  background: `linear-gradient(180deg, ${intent.tone} 0%, ${withAlpha(intent.tone, 60)} 100%)`,
                  boxShadow: `0 0 10px ${intent.tone}, 0 0 4px ${intent.tone}`,
                }} />
              )}

              {/* Top row — step number squircle + state eyebrow + custom intent glyph */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBlockEnd: 12 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {/* Step number squircle — siempre con intent color */}
                  <span aria-hidden="true" style={{
                    inlineSize: 30,
                    blockSize: 30,
                    borderRadius: 9,
                    background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${withAlpha(intent.tone, isCurrent ? 32 : 22)} 0%, ${withAlpha(intent.tone, isCurrent ? 12 : 8)} 100%)`,
                    border: `0.5px solid ${withAlpha(intent.tone, isCurrent ? 60 : 35)}`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 ${isCurrent ? 10 : 6}px ${withAlpha(intent.tone, isCurrent ? 40 : 22)}`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                        <path d="M3 7 L6 10 L11 4" stroke={semantic.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    ) : (
                      <span style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        fontWeight: 500,
                        color: tone,
                        letterSpacing: -0.2,
                        fontVariantNumeric: "tabular-nums",
                        textShadow: `0 0 5px ${withAlpha(tone, 50)}`,
                      }}>
                        {stepNum}
                      </span>
                    )}
                  </span>
                  {/* State eyebrow */}
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 8.5,
                    fontWeight: 500,
                    color: tone,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    textShadow: `0 0 5px ${withAlpha(tone, 50)}`,
                  }}>
                    {stateLabel}
                  </span>
                </div>
                {/* Intent custom glyph (right) */}
                <span aria-hidden="true" style={{
                  flexShrink: 0,
                  filter: `drop-shadow(0 0 ${isCurrent ? 10 : 6}px ${withAlpha(intent.tone, isCurrent ? 50 : 30)})`,
                }}>
                  <intent.Component active={isCurrent || isDone} />
                </span>
              </div>

              {/* Title + subtitle */}
              <div style={{ marginBlockEnd: isCurrent ? 14 : 0 }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 400,
                  color: "rgba(245,245,247,0.96)",
                  letterSpacing: -0.4,
                  lineHeight: 1.15,
                  marginBlockEnd: 4,
                  textShadow: `0 0 12px ${withAlpha(intent.tone, isCurrent ? 22 : 10)}`,
                }}>
                  {step.title}
                </div>
                <p style={{
                  fontSize: 12.5,
                  fontWeight: 400,
                  color: "rgba(245,245,247,0.62)",
                  lineHeight: 1.45,
                  letterSpacing: -0.05,
                  margin: 0,
                  maxInlineSize: 460,
                }}>
                  {step.subtitle}
                </p>
              </div>

              {/* CTA glass primary — solo current. Color del intent */}
              {isCurrent && (
                <motion.button
                  whileTap={reduced ? {} : { scale: 0.985 }}
                  onClick={() => onStart?.(step.intent)}
                  aria-label={`Iniciar ${step.title}`}
                  style={{
                    position: "relative",
                    inlineSize: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingBlock: 13,
                    paddingInline: 18,
                    background: `linear-gradient(180deg, ${intent.tone} 0%, ${withAlpha(intent.tone, 88)} 100%)`,
                    color: "#08080A",
                    border: "none",
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: 0.05,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    minBlockSize: 44,
                    boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.20), 0 0 0 1px ${withAlpha(intent.tone, 60)}, 0 4px 16px ${withAlpha(intent.tone, 45)}, 0 0 22px ${withAlpha(intent.tone, 25)}`,
                    overflow: "hidden",
                  }}
                >
                  <span aria-hidden="true" style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)`, pointerEvents: "none" }} />
                  <span style={{ position: "relative", textShadow: "0 0 8px rgba(255,255,255,0.30), 0 1px 1px rgba(0,0,0,0.18)" }}>
                    Empezar ahora
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 6 L9 6 M6.5 3 L9 6 L6.5 9" stroke="#08080A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </motion.button>
              )}
            </motion.li>
          );
        })}
      </ol>

      {/* Tip footer — mono caps tracked + custom calendar SVG, tinted with primary signature */}
      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.45 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          inlineSize: "100%",
          marginBlockStart: 18,
          paddingBlock: 8,
          paddingInline: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true" style={{ filter: `drop-shadow(0 0 4px ${withAlpha(SIG.primary, 35)})` }}>
          <rect x="1.5" y="2.5" width="8" height="7" rx="1" fill="none" stroke={withAlpha(SIG.primary, 70)} strokeWidth="0.8" />
          <line x1="1.5" y1="4.5" x2="9.5" y2="4.5" stroke={withAlpha(SIG.primary, 70)} strokeWidth="0.8" />
          <line x1="3.5" y1="1" x2="3.5" y2="3" stroke={withAlpha(SIG.primary, 70)} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="7.5" y1="1" x2="7.5" y2="3" stroke={withAlpha(SIG.primary, 70)} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="5.5" cy="6.8" r="0.7" fill={SIG.primary} />
        </svg>
        <span style={{
          fontFamily: MONO,
          fontSize: 8.5,
          fontWeight: 500,
          color: withAlpha(SIG.primary, 70),
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          textShadow: `0 0 5px ${withAlpha(SIG.primary, 30)}`,
        }}>
          Tip · Hazlas en días distintos para tu ritmo circadiano
        </span>
      </motion.div>
    </section>
  );
}
