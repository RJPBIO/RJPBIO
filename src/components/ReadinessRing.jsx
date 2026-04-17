"use client";
/* ═══════════════════════════════════════════════════════════════
   READINESS RING — Oura-style single-glance summary
   ═══════════════════════════════════════════════════════════════
   Combina Enfoque + Calma + Energía en un solo score 0–100 y lo
   representa con tres aros concéntricos superpuestos.
   - role="img" con aria-label que lee score + interpretación.
   - Hover/tap en un anillo o en la leyenda lateral: el centro
     revela el score específico de ese canal, el anillo engrosa.
   - Reduced-motion: sin spring, sin pulso del aura.
   ═══════════════════════════════════════════════════════════════ */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [activeRing, setActiveRing] = useState(null);

  const overall = Math.round((focusScore + calmScore + energyScore) / 3);
  const meta = interpret(overall);

  const rings = useMemo(() => [
    { score: focusScore, color: "#3B82F6", label: "Enfoque", r: size * 0.44 },
    { score: calmScore,  color: "#8B5CF6", label: "Calma",   r: size * 0.35 },
    { score: energyScore,color: "#6366F1", label: "Energía", r: size * 0.26 },
  ], [focusScore, calmScore, energyScore, size]);

  const active = activeRing != null ? rings[activeRing] : null;

  const ariaLabel =
    `Readiness neural: ${overall}%, estado ${meta.label}. ` +
    `Enfoque ${focusScore}%, calma ${calmScore}%, energía ${energyScore}%. ${meta.tone}`;

  const lastTier = useRef(meta.label);
  const [liveMsg, setLiveMsg] = useState("");
  useEffect(() => {
    if (lastTier.current !== meta.label) {
      lastTier.current = meta.label;
      setLiveMsg(`Readiness ${meta.label.toLowerCase()}: ${overall}%. ${meta.tone}`);
    }
  }, [meta.label, overall, meta.tone]);

  const centerColor = active ? active.color : meta.color;
  const centerScore = active ? active.score : overall;
  const centerKicker = active ? active.label.toUpperCase() : "READINESS";
  const centerSub = active ? `${active.label}` : meta.label;

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
          background: `radial-gradient(circle, ${centerColor}14, transparent 70%)`,
          filter: "blur(30px)",
          pointerEvents: "none",
          transition: "background 0.35s ease",
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
            const isActive = activeRing === i;
            const isDim = activeRing != null && activeRing !== i;
            return (
              <g
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`${ring.label}: ${ring.score}%`}
                onPointerEnter={() => setActiveRing(i)}
                onPointerLeave={() => setActiveRing(null)}
                onPointerDown={() => setActiveRing(i)}
                onFocus={() => setActiveRing(i)}
                onBlur={() => setActiveRing(null)}
                style={{ cursor: "pointer", outline: "none" }}
              >
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
                  strokeWidth={isActive ? 10 : 7}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  opacity={isDim ? 0.35 : 1}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: circ * (1 - pct) }}
                  transition={{ duration: reduced ? 0 : 1 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transition: "stroke-width 0.2s ease, opacity 0.2s ease" }}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={ring.r}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth={14}
                  pointerEvents="stroke"
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
          <div style={{ ...ty.label(t3), fontSize: font.size.xs }}>{centerKicker}</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active ? `ring-${activeRing}` : "overall"}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: reduced ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{ ...ty.metric(centerColor, font.size["4xl"]), lineHeight: 1 }}
            >
              {centerScore}
            </motion.div>
          </AnimatePresence>
          <div style={{ ...ty.caption(centerColor), fontWeight: font.weight.bold, marginBlockStart: 2 }}>
            {centerSub}
          </div>
        </div>
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {liveMsg}
      </div>

      <div style={{ flex: 1, minInlineSize: 0 }}>
        <div style={{ ...ty.body(t2), marginBlockEnd: space[3] }}>{active ? `Canal ${active.label.toLowerCase()}.` : meta.tone}</div>
        <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: space[1.5] }}>
          {rings.map((r, i) => {
            const isActive = activeRing === i;
            return (
              <div
                key={r.label}
                onPointerEnter={() => setActiveRing(i)}
                onPointerLeave={() => setActiveRing(null)}
                onPointerDown={() => setActiveRing(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: space[2],
                  paddingBlock: 2,
                  paddingInline: 4,
                  marginInline: -4,
                  borderRadius: radius.sm,
                  background: isActive ? withAlpha(r.color, 8) : "transparent",
                  cursor: "pointer",
                  transition: "background 0.18s ease",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    inlineSize: 10,
                    blockSize: 10,
                    borderRadius: "50%",
                    background: r.color,
                    boxShadow: isActive ? `0 0 0 3px ${withAlpha(r.color, 20)}` : "none",
                    transition: "box-shadow 0.18s ease",
                  }}
                />
                <dt style={{ ...ty.caption(isActive ? r.color : t3), fontWeight: font.weight.bold, inlineSize: 64, transition: "color 0.18s ease" }}>
                  {r.label}
                </dt>
                <dd style={{ ...ty.metric(t1, font.size.md), margin: 0 }}>{r.score}%</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </article>
  );
}
