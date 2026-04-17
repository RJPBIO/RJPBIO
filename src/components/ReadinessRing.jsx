"use client";
/* ═══════════════════════════════════════════════════════════════
   READINESS RING — Oura-style single-glance summary
   ═══════════════════════════════════════════════════════════════
   Combina Enfoque + Calma + Energía en un solo score 0–100 y lo
   representa con tres aros concéntricos superpuestos.
   - role="img" con aria-label que lee score + interpretación.
   - Reduced-motion: sin spring, sin pulso del aura.
   - Tokens + resolveTheme, nada hardcoded.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { useMemo } from "react";
import { resolveTheme, withAlpha, ty, font, space, radius, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

function interpret(score) {
  if (score >= 85) return { label: "Óptimo", color: semantic.success, tone: "Hoy puedes exigir más." };
  if (score >= 70) return { label: "Buen ritmo", color: brand.primary, tone: "Sistema balanceado." };
  if (score >= 50) return { label: "Moderado", color: semantic.warning, tone: "Dosifica la carga." };
  return { label: "Recuperación", color: semantic.danger, tone: "Prioriza descanso y calma." };
}

export default function ReadinessRing({
  focusScore = 0,
  calmScore = 0,
  energyScore = 0,
  isDark = false,
  size = 168,
}) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const overall = Math.round((focusScore + calmScore + energyScore) / 3);
  const meta = interpret(overall);

  const rings = useMemo(() => [
    { score: focusScore, color: "#3B82F6", label: "Enfoque", r: size * 0.44 },
    { score: calmScore,  color: "#8B5CF6", label: "Calma",   r: size * 0.35 },
    { score: energyScore,color: "#6366F1", label: "Energía", r: size * 0.26 },
  ], [focusScore, calmScore, energyScore, size]);

  const ariaLabel =
    `Readiness neural: ${overall}%, estado ${meta.label}. ` +
    `Enfoque ${focusScore}%, calma ${calmScore}%, energía ${energyScore}%. ${meta.tone}`;

  return (
    <article
      role="img"
      aria-label={ariaLabel}
      style={{
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: radius.xl,
        padding: space[5],
        display: "flex",
        gap: space[5],
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          insetBlockStart: "-30%",
          insetInlineEnd: "-20%",
          inlineSize: "50%",
          blockSize: "50%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${meta.color}14, transparent 70%)`,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", inlineSize: size, blockSize: size, flexShrink: 0 }}>
        <svg
          aria-hidden="true"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {rings.map((ring, i) => {
            const circ = 2 * Math.PI * ring.r;
            const pct = Math.max(0, Math.min(100, ring.score)) / 100;
            return (
              <g key={i}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={ring.r}
                  fill="none"
                  stroke={withAlpha(ring.color, 8)}
                  strokeWidth={7}
                />
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: circ * (1 - pct) }}
                  transition={{ duration: reduced ? 0 : 1 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                />
              </g>
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ ...ty.label(t3), fontSize: font.size.xs }}>READINESS</div>
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.4 }}
            style={{ ...ty.metric(meta.color, font.size["4xl"]), lineHeight: 1 }}
          >
            {overall}
          </motion.div>
          <div style={{ ...ty.caption(meta.color), fontWeight: font.weight.bold, marginBlockStart: 2 }}>
            {meta.label}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minInlineSize: 0 }}>
        <div style={{ ...ty.body(t2), marginBlockEnd: space[3] }}>{meta.tone}</div>
        <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: space[1.5] }}>
          {rings.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: space[2] }}>
              <span aria-hidden="true" style={{
                inlineSize: 10, blockSize: 10, borderRadius: "50%", background: r.color,
              }} />
              <dt style={{ ...ty.caption(t3), fontWeight: font.weight.bold, inlineSize: 64 }}>{r.label}</dt>
              <dd style={{ ...ty.metric(t1, font.size.md), margin: 0 }}>{r.score}%</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
