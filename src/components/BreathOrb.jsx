"use client";
/* ═══════════════════════════════════════════════════════════════
   BREATH ORB — Interocepción visual
   ═══════════════════════════════════════════════════════════════
   - `useReducedMotion` gate: springs → fade instantáneo.
   - Narrador aria-live que anuncia fases (INHALA/EXHALA/MANTÉN).
   - role="img" con aria-label dinámico que describe el ciclo.
   - Contrato: si reducedMotion=true, NO se emiten animaciones
     de anillos, partículas ni spring; solo color/label estático.
   ═══════════════════════════════════════════════════════════════ */

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useEffect, useRef } from "react";
import { useReducedMotion, announce } from "../lib/a11y";

const PHASE_CONFIGS = {
  breath: { innerGlow: true,  particles: false, pulseRings: 3 },
  body:   { innerGlow: false, particles: true,  pulseRings: 2 },
  mind:   { innerGlow: true,  particles: true,  pulseRings: 4 },
  focus:  { innerGlow: true,  particles: false, pulseRings: 2 },
};

export default function BreathOrb({
  type = "breath",
  color = "#059669",
  breathScale = 1,
  breathLabel = "",
  breathCount = 0,
  active = false,
  sessionProgress = 0,
  size = 200,
}) {
  const reduced = useReducedMotion();
  const config = PHASE_CONFIGS[type] || PHASE_CONFIGS.breath;
  const center = size / 2;
  const mainRadius = size * 0.35;
  const lastAnnounced = useRef("");

  const particles = useMemo(() => {
    if (!config.particles || reduced) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * Math.PI * 2,
      distance: mainRadius * 0.6 + Math.random() * mainRadius * 0.4,
      size: 2 + Math.random() * 2,
      delay: i * 0.15,
    }));
  }, [config.particles, mainRadius, reduced]);

  useEffect(() => {
    if (!active || !breathLabel) return;
    if (breathLabel === lastAnnounced.current) return;
    lastAnnounced.current = breathLabel;
    announce(`${breathLabel.toLowerCase()}, ${breathCount} segundos`, "polite");
  }, [breathLabel, breathCount, active]);

  if (!active) return null;

  const ariaLabel = breathLabel
    ? `Orbe de respiración, fase ${breathLabel.toLowerCase()}, ${breathCount} segundos restantes`
    : "Orbe de respiración neural";

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      aria-live="polite"
      style={{
        position: "relative",
        inlineSize: size,
        blockSize: size * 0.7,
        marginInline: "auto",
        marginBlockEnd: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!reduced && Array.from({ length: config.pulseRings }).map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          aria-hidden="true"
          style={{
            position: "absolute",
            insetInlineStart: "50%",
            insetBlockStart: "50%",
            inlineSize: mainRadius * 2 + i * 24,
            blockSize: mainRadius * 2 + i * 24,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            x: "-50%",
            y: "-50%",
          }}
          animate={{
            opacity: [0.03 + i * 0.02, 0.08 + i * 0.02, 0.03 + i * 0.02],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        />
      ))}

      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInlineStart: "50%",
          insetBlockStart: "50%",
          inlineSize: mainRadius * 2,
          blockSize: mainRadius * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18, ${color}08, transparent)`,
          x: "-50%",
          y: "-50%",
        }}
        animate={reduced ? { scale: 1 } : { scale: breathScale }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 30, damping: 20, mass: 1.2 }}
      >
        {config.innerGlow && !reduced && (
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "25%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}25, ${color}08, transparent)`,
            }}
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <motion.div
          aria-hidden="true"
          style={{
            position: "absolute",
            insetInlineStart: "50%",
            insetBlockStart: "50%",
            inlineSize: 8,
            blockSize: 8,
            borderRadius: "50%",
            background: color,
            x: "-50%",
            y: "-50%",
          }}
          animate={reduced ? {} : {
            opacity: [0.3, 0.8, 0.3],
            boxShadow: [`0 0 8px ${color}40`, `0 0 20px ${color}60`, `0 0 8px ${color}40`],
          }}
          transition={reduced ? { duration: 0 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {!reduced && (
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              aria-hidden="true"
              style={{
                position: "absolute",
                insetInlineStart: "50%",
                insetBlockStart: "50%",
                inlineSize: p.size,
                blockSize: p.size,
                borderRadius: "50%",
                background: color,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0.1, 0.5, 0.1],
                scale: [0.5, 1, 0.5],
                x: Math.cos(p.angle) * p.distance * breathScale - p.size / 2,
                y: Math.sin(p.angle) * p.distance * breathScale - p.size / 2,
              }}
              transition={{
                opacity: { duration: 2, repeat: Infinity, delay: p.delay },
                scale: { duration: 2, repeat: Infinity, delay: p.delay },
                x: { type: "spring", stiffness: 30, damping: 20 },
                y: { type: "spring", stiffness: 30, damping: 20 },
              }}
            />
          ))}
        </AnimatePresence>
      )}

      <AnimatePresence mode="wait">
        {breathLabel && (
          <motion.div
            key={breathLabel}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            style={{
              position: "absolute",
              insetInlineStart: "50%",
              insetBlockEnd: 4,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              zIndex: 2,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 4,
                color,
                opacity: 0.85,
                textTransform: "uppercase",
              }}
            >
              {breathLabel}
            </span>
            <span aria-hidden="true" style={{ fontSize: 12, fontWeight: 800, color }}>
              {breathCount}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {sessionProgress > 0 && (
        <svg
          aria-hidden="true"
          width={size}
          height={size * 0.7}
          viewBox={`0 0 ${size} ${size * 0.7}`}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <circle
            cx={center}
            cy={size * 0.35}
            r={mainRadius + 18}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.06}
            strokeDasharray="3 6"
          />
        </svg>
      )}
    </div>
  );
}
