"use client";
/* ═══════════════════════════════════════════════════════════════
   READINESS SCORE — composite diario con identidad BIO-IGNICIÓN:
   corner brackets, lattice sutil, tick cardinales en el anillo,
   endpoint marker con halo y tipografía mono blueprint.

   Paleta unificada a tokens bio-signal para coherencia con
   ReadinessRing: emerald → phosphorCyan → ignition → plasmaPink.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand, bioSignal } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";
import { calcReadiness } from "../lib/readiness";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function CornerBrackets({ color }) {
  const L = 10;
  const common = {
    position: "absolute",
    inlineSize: L,
    blockSize: L,
    pointerEvents: "none",
  };
  return (
    <>
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 6, insetBlockStart: 6, borderInlineStart: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 6, insetBlockStart: 6, borderInlineEnd: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 6, insetBlockEnd: 6, borderInlineStart: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 6, insetBlockEnd: 6, borderInlineEnd: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
    </>
  );
}

export default function ReadinessScore({ st, isDark, onOpenHRV }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const r = useMemo(() => calcReadiness({
    hrvHistory: st.hrvLog || [],
    rhrHistory: st.rhrLog || [],
    sleepHours: st.lastSleepHours || null,
    sleepTarget: st.sleepTargetHours || 7.5,
    moodLog: st.moodLog || [],
    sessions: st.history || [],
    currentHRV: (st.hrvLog || []).slice(-1)[0] || null,
  }), [st.hrvLog, st.rhrLog, st.lastSleepHours, st.sleepTargetHours, st.moodLog, st.history]);

  const cornerStroke = withAlpha(brand.primary, isDark ? 30 : 24);

  if (r.insufficient) {
    return (
      <section
        aria-label="Readiness score no disponible"
        style={{
          position: "relative",
          background: cd,
          border: `1px solid ${bd}`,
          borderRadius: 16,
          padding: 16,
          marginBlockEnd: 14,
          overflow: "hidden",
        }}
      >
        <CornerBrackets color={cornerStroke} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBlockEnd: 8 }}>
          <Icon name="gauge" size={12} color={t3} aria-hidden="true" />
          <h3
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            ▸ Readiness · Calibrando
          </h3>
        </div>
        <p style={{ color: t2, fontSize: 12, margin: 0, marginBlockEnd: 10, lineHeight: 1.5 }}>
          Todavía no hay datos suficientes. Necesitamos medir tu HRV en reposo al menos 7 días, o bien registrar sueño y ánimo diario.
        </p>
        {onOpenHRV && (
          <button
            onClick={onOpenHRV}
            aria-label="Comenzar medición de HRV"
            style={{
              background: "transparent",
              color: brand.primary,
              border: `1px solid ${withAlpha(brand.primary, 40)}`,
              borderRadius: 10,
              paddingBlock: 10,
              paddingInline: 14,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
              minBlockSize: 40,
            }}
          >
            ▸ Iniciar medición HRV
          </button>
        )}
      </section>
    );
  }

  const ringColor =
    r.score >= 80 ? brand.primary :
    r.score >= 65 ? bioSignal.phosphorCyan :
    r.score >= 45 ? bioSignal.ignition :
    bioSignal.plasmaPink;

  const interp =
    r.interpretation === "primed" ? "Recursos elevados" :
    r.interpretation === "ready" ? "Estado estable" :
    r.interpretation === "caution" ? "Precaución" :
    "Prioriza recuperación";

  const ariaLabel = `Readiness ${r.score} de 100. ${interp}. ${r.recommendation?.reason || ""}`;

  const R = 30;
  const CIRC = 2 * Math.PI * R;
  const progress = r.score / 100;
  const endpointAngle = -Math.PI / 2 + progress * 2 * Math.PI;
  const endX = 36 + R * Math.cos(endpointAngle);
  const endY = 36 + R * Math.sin(endpointAngle);

  return (
    <section
      aria-label={ariaLabel}
      style={{
        position: "relative",
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: 16,
        padding: 16,
        marginBlockEnd: 14,
        overflow: "hidden",
      }}
    >
      <CornerBrackets color={withAlpha(ringColor, isDark ? 32 : 26)} />

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="gauge" size={12} color={ringColor} aria-hidden="true" />
          <h3
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: ringColor,
              textTransform: "uppercase",
              margin: 0,
              opacity: 0.9,
            }}
          >
            ▸ Readiness
          </h3>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 1.5,
            color: t3,
            textTransform: "uppercase",
          }}
        >
          baseline · {r.baselineDays}d
        </span>
      </header>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBlockEnd: 14 }}>
        <motion.div
          initial={reduced ? { scale: 1 } : { scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={reduced ? {} : { duration: 0.5 }}
          style={{ position: "relative", inlineSize: 80, blockSize: 80, flexShrink: 0 }}
        >
          <svg viewBox="0 0 72 72" style={{ inlineSize: "100%", blockSize: "100%" }} aria-hidden="true">
            <defs>
              <filter id="rs-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg - 90) * Math.PI / 180;
              const x1 = 36 + 34 * Math.cos(rad);
              const y1 = 36 + 34 * Math.sin(rad);
              const x2 = 36 + 38 * Math.cos(rad);
              const y2 = 36 + 38 * Math.sin(rad);
              return (
                <line
                  key={deg}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={withAlpha(ringColor, 38)}
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              );
            })}

            <circle cx="36" cy="36" r={R} fill="none" stroke={bd} strokeWidth="6" />
            <motion.circle
              cx="36" cy="36" r={R}
              fill="none" stroke={ringColor} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={reduced ? { strokeDashoffset: CIRC * (1 - progress) } : { strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: CIRC * (1 - progress) }}
              transition={reduced ? { duration: 0 } : { duration: 0.8 }}
              transform="rotate(-90 36 36)"
              filter="url(#rs-glow)"
            />

            <circle
              cx={endX}
              cy={endY}
              r={4}
              fill={ringColor}
              opacity={0.3}
            />
            <circle
              cx={endX}
              cy={endY}
              r={2.2}
              fill="#FFFFFF"
              stroke={ringColor}
              strokeWidth="1"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 24,
                fontWeight: 700,
                color: t1,
                lineHeight: 1,
                letterSpacing: -0.5,
                textShadow: `0 0 14px ${withAlpha(ringColor, 35)}`,
              }}
            >
              {r.score}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 8,
                color: t3,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBlockStart: 1,
              }}
            >
              /100
            </span>
          </div>
        </motion.div>

        <div style={{ flex: 1, minInlineSize: 0 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: 2,
              color: withAlpha(ringColor, 80),
              textTransform: "uppercase",
              marginBlockEnd: 2,
            }}
          >
            ▸ Estado
          </div>
          <div style={{ fontSize: 14, fontWeight: font.weight.black, color: ringColor, marginBlockEnd: 4, letterSpacing: -0.2 }}>
            {interp}
          </div>
          <p style={{ color: t2, fontSize: 11, margin: 0, lineHeight: 1.5 }}>
            {r.recommendation?.reason}
          </p>
        </div>
      </div>

      <div
        role="group"
        aria-label="Componentes de readiness"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))",
          gap: 8,
          paddingBlockStart: 10,
          borderBlockStart: `1px dashed ${withAlpha(ringColor, isDark ? 22 : 16)}`,
        }}
      >
        {r.components.hrv && <Bar label="HRV" score={r.components.hrv.score} t3={t3} />}
        {r.components.rhr && <Bar label="RHR" score={r.components.rhr.score} t3={t3} />}
        {r.components.sleep && <Bar label="Sueño" score={r.components.sleep.score} t3={t3} />}
        {r.components.subjective && <Bar label="Subj." score={r.components.subjective.score} t3={t3} />}
        {r.components.load && <Bar label="Carga" score={r.components.load.score} t3={t3} />}
      </div>
    </section>
  );
}

function Bar({ label, score, t3 }) {
  const color =
    score >= 70 ? brand.primary :
    score >= 50 ? bioSignal.phosphorCyan :
    score >= 30 ? bioSignal.ignition :
    bioSignal.plasmaPink;
  return (
    <div
      role="group"
      aria-label={`${label}: ${score} de 100`}
      style={{ textAlign: "center" }}
    >
      <div
        style={{
          blockSize: 4,
          background: "rgba(127,127,127,.14)",
          borderRadius: 2,
          marginBlockEnd: 4,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            blockSize: "100%",
            inlineSize: `${score}%`,
            background: color,
            boxShadow: `0 0 8px ${withAlpha(color, 40)}`,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          fontWeight: 700,
          color,
          lineHeight: 1,
          marginBlockEnd: 1,
        }}
      >
        {score}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 8,
          color: t3,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
