"use client";
/* ═══════════════════════════════════════════════════════════════
   READINESS RING — instrumento biométrico single-glance
   ═══════════════════════════════════════════════════════════════
   Tres canales (Enfoque/Calma/Energía) en anillos concéntricos,
   frame con ticks cardinales + corner brackets, lattice micro-DNA
   detrás, endpoint markers en el anillo activo. Identidad
   BIO-IGNICIÓN presente vía emerald accent, lattice y brackets.

   - role="img" con aria-label que lee score + interpretación.
   - Hover/focus en anillo o leyenda: centro revela canal, anillo
     engrosa con endpoint marker cinemático y glow filter.
   - Reduced-motion: sin spring, sin pulso del aura.

   NOTA: colores de canal (#3B82F6/#8B5CF6/#6366F1) son decisión
   ratificada por el usuario y NO deben cambiar aquí.
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

  // Cardinal ticks around the outer frame (12 positions, 4 major at 0/3/6/9)
  const frameTicks = useMemo(() => {
    const frameR = size * 0.48;
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const major = i % 3 === 0;
      const tickLen = major ? 5 : 2.5;
      return {
        x1: size / 2 + Math.cos(angle) * (frameR - tickLen),
        y1: size / 2 + Math.sin(angle) * (frameR - tickLen),
        x2: size / 2 + Math.cos(angle) * frameR,
        y2: size / 2 + Math.sin(angle) * frameR,
        major,
      };
    });
  }, [size]);

  // Lattice plus-marks — 5×5 subtle DNA layer (clipped inside ring area)
  const lattice = useMemo(() => {
    const marks = [];
    const cols = 5;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < cols; r++) {
        const x = ((c + 0.5) / cols) * size;
        const y = ((r + 0.5) / cols) * size;
        marks.push({ id: `${c}-${r}`, x, y });
      }
    }
    return marks;
  }, [size]);

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

  const emerald = brand.primary;
  const cornerStroke = withAlpha(emerald, isDark ? 30 : 22);

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
      {/* Corner brackets — brand DNA */}
      <CornerBrackets color={cornerStroke} />

      {/* Ambient glow behind ring */}
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
        {/* Lattice micro-DNA (behind ring) */}
        <svg
          aria-hidden="true"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}
        >
          <defs>
            <radialGradient id="ring-lattice-mask">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="70%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="ring-lattice-mask-apply">
              <rect width={size} height={size} fill="url(#ring-lattice-mask)" />
            </mask>
          </defs>
          <g mask="url(#ring-lattice-mask-apply)">
            {lattice.map((m) => (
              <path
                key={m.id}
                d={`M${m.x - 2} ${m.y} L${m.x + 2} ${m.y} M${m.x} ${m.y - 2} L${m.x} ${m.y + 2}`}
                stroke={emerald}
                strokeWidth="0.8"
                opacity={isDark ? 0.35 : 0.22}
              />
            ))}
          </g>
        </svg>

        <svg
          aria-hidden="true"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <filter id="active-ring-glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Outer gauge frame with cardinal ticks */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.48}
            fill="none"
            stroke={emerald}
            strokeWidth="1"
            opacity={isDark ? 0.18 : 0.12}
          />
          {frameTicks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={emerald}
              strokeWidth={t.major ? 1.5 : 1}
              opacity={t.major ? (isDark ? 0.55 : 0.4) : (isDark ? 0.28 : 0.2)}
            />
          ))}

          {/* Rings (rotated -90° so 0% starts at top) */}
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {rings.map((ring, i) => {
              const circ = 2 * Math.PI * ring.r;
              const pct = Math.max(0, Math.min(100, ring.score)) / 100;
              const isActive = activeRing === i;
              const isDim = activeRing != null && activeRing !== i;
              // Endpoint marker position (at progress end) — cinematic instrument detail
              const endAngle = pct * Math.PI * 2;
              const markerX = size / 2 + Math.cos(endAngle) * ring.r;
              const markerY = size / 2 + Math.sin(endAngle) * ring.r;
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveRing(activeRing === i ? null : i);
                    }
                  }}
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
                    filter={isActive ? "url(#active-ring-glow)" : undefined}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ * (1 - pct) }}
                    transition={{ duration: reduced ? 0 : 1 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transition: "stroke-width 0.2s ease, opacity 0.2s ease" }}
                  />
                  {/* Endpoint marker — cinematic instrument */}
                  {pct > 0.02 && pct < 1 && (
                    <motion.circle
                      cx={markerX}
                      cy={markerY}
                      r={isActive ? 4 : 2.5}
                      fill="#F0FDF4"
                      stroke={ring.color}
                      strokeWidth={isActive ? 2 : 1.5}
                      opacity={isDim ? 0.35 : 1}
                      style={{
                        filter: `drop-shadow(0 0 ${isActive ? 6 : 3}px ${ring.color})`,
                        transition: "r 0.2s ease, stroke-width 0.2s ease",
                      }}
                    />
                  )}
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
          </g>
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
          <div
            style={{
              ...ty.label(t3),
              fontSize: font.size.xs,
              fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
              letterSpacing: 4,
            }}
          >
            ▸ {centerKicker}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active ? `ring-${activeRing}` : "overall"}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: reduced ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                ...ty.metric(centerColor, font.size["4xl"]),
                lineHeight: 1,
                textShadow: `0 0 20px ${withAlpha(centerColor, 30)}`,
              }}
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
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`${r.label}: ${r.score}%`}
                onPointerEnter={() => setActiveRing(i)}
                onPointerLeave={() => setActiveRing(null)}
                onPointerDown={() => setActiveRing(i)}
                onFocus={() => setActiveRing(i)}
                onBlur={() => setActiveRing(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveRing(activeRing === i ? null : i);
                  }
                }}
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
                  outline: "none",
                  minBlockSize: 28,
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

function CornerBrackets({ color }) {
  const style = { position: "absolute", inlineSize: 14, blockSize: 14, pointerEvents: "none" };
  const stroke = color;
  return (
    <>
      <svg aria-hidden="true" style={{ ...style, insetBlockStart: 10, insetInlineStart: 10 }} viewBox="0 0 14 14">
        <path d="M0 14 L0 0 L14 0" stroke={stroke} strokeWidth="1.5" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockStart: 10, insetInlineEnd: 10 }} viewBox="0 0 14 14">
        <path d="M0 0 L14 0 L14 14" stroke={stroke} strokeWidth="1.5" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockEnd: 10, insetInlineStart: 10 }} viewBox="0 0 14 14">
        <path d="M14 14 L0 14 L0 0" stroke={stroke} strokeWidth="1.5" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockEnd: 10, insetInlineEnd: 10 }} viewBox="0 0 14 14">
        <path d="M0 14 L14 14 L14 0" stroke={stroke} strokeWidth="1.5" fill="none" />
      </svg>
    </>
  );
}
