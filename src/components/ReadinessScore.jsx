"use client";
/* ═══════════════════════════════════════════════════════════════
   READINESS SCORE — composite diario (dashboard meta).
   Neural-DNA: números en mono+tabular, etiquetas en sentence case,
   sin halos en live-data, sin corner brackets, sin ▸ glyphs.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand, bioSignal } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";
import { calcReadiness } from "../lib/readiness";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

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

  if (r.insufficient) {
    return (
      <section
        aria-label="Readiness score no disponible"
        style={{
          background: cd,
          border: `1px solid ${bd}`,
          borderRadius: 16,
          padding: 16,
          marginBlockEnd: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBlockEnd: 8 }}>
          <Icon name="gauge" size={14} color={t3} aria-hidden="true" />
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: -0.05,
              color: t3,
              margin: 0,
            }}
          >
            Readiness · Calibrando
          </h3>
        </div>
        <p style={{ color: t2, fontSize: 13, margin: 0, marginBlockEnd: 12, lineHeight: 1.55 }}>
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
              borderRadius: 12,
              paddingBlock: 12,
              paddingInline: 16,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: -0.05,
              cursor: "pointer",
              minBlockSize: 44,
            }}
          >
            Iniciar medición HRV
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
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: 16,
        padding: 16,
        marginBlockEnd: 14,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="gauge" size={14} color={ringColor} aria-hidden="true" />
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: -0.05,
              color: ringColor,
              margin: 0,
            }}
          >
            Readiness
          </h3>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            color: t3,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: -0.05,
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
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {r.score}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 600,
                color: t3,
                marginBlockStart: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              /100
            </span>
          </div>
        </motion.div>

        <div style={{ flex: 1, minInlineSize: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: -0.05,
              color: withAlpha(ringColor, 80),
              marginBlockEnd: 2,
            }}
          >
            Estado
          </div>
          <div style={{ fontSize: 15, fontWeight: font.weight.black, color: ringColor, marginBlockEnd: 4, letterSpacing: -0.2 }}>
            {interp}
          </div>
          <p style={{ color: t2, fontSize: 12, margin: 0, lineHeight: 1.55 }}>
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
          }}
        />
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          color,
          lineHeight: 1,
          marginBlockEnd: 2,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: t3,
          letterSpacing: -0.05,
        }}
      >
        {label}
      </div>
    </div>
  );
}
