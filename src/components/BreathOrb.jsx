"use client";
/* ═══════════════════════════════════════════════════════════════
   BREATH ORB — Interocepción visual
   ═══════════════════════════════════════════════════════════════
   DNA: neural-performance-first. El orbe ENTRENA la respiración
   (escala sincronizada al breathScale), todo lo demás es ruido
   visual que compite con la tarea. Sin partículas, sin anillos
   dashed decorativos; solo la escala respiratoria + 1–2 halos
   de entrenamiento y la etiqueta de fase.

   - `useReducedMotion` gate: sin motion, solo label estático.
   - Narrador aria-live que anuncia fases.
   - role="img" con aria-label dinámico.
   ═══════════════════════════════════════════════════════════════ */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useReducedMotion, announce } from "../lib/a11y";

const RING_COUNT = { breath: 1, body: 1, mind: 2, focus: 1 };

export default function BreathOrb({
  type = "breath",
  color = "#059669",
  breathScale = 1,
  breathLabel = "",
  breathCount = 0,
  active = false,
  size = 200,
}) {
  const reduced = useReducedMotion();
  const rings = RING_COUNT[type] || 1;
  const mainRadius = size * 0.35;
  const lastAnnounced = useRef("");

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
      {!reduced && Array.from({ length: rings }).map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          aria-hidden="true"
          style={{
            position: "absolute",
            insetInlineStart: "50%",
            insetBlockStart: "50%",
            inlineSize: mainRadius * 2 + i * 32,
            blockSize: mainRadius * 2 + i * 32,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            x: "-50%",
            y: "-50%",
          }}
          animate={{
            opacity: [0.04, 0.1, 0.04],
            scale: [1, 1.015, 1],
          }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
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
        {!reduced && (
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "25%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}20, ${color}08, transparent)`,
            }}
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {breathLabel && (
          <motion.div
            key={breathLabel}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            style={{
              position: "absolute",
              insetInlineStart: "50%",
              insetBlockEnd: 4,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              zIndex: 2,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color,
                letterSpacing: -0.1,
              }}
            >
              {breathLabel}
            </span>
            <span
              aria-hidden="true"
              style={{
                fontSize: 12,
                color,
                opacity: 0.7,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {breathCount}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
