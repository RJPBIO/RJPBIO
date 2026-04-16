"use client";
/* ═══════════════════════════════════════════════════════════════
   BREATH ORB — Atmospheric breathing visualization
   Calm-inspired depth with layered gradients and glass-morphism
   Base: visual-respiratory synchronization activates the anterior
   insula, improving interoception and cardiorespiratory coherence
   (Critchley et al., 2004)
   ═══════════════════════════════════════════════════════════════ */

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { font, space } from "../lib/theme";

const PHASE_CONFIGS = {
  breath: { innerGlow: true, particles: false, pulseRings: 3, hue: 0 },
  body:   { innerGlow: false, particles: true, pulseRings: 2, hue: 10 },
  mind:   { innerGlow: true, particles: true, pulseRings: 4, hue: -10 },
  focus:  { innerGlow: true, particles: false, pulseRings: 2, hue: 5 },
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
  const config = PHASE_CONFIGS[type] || PHASE_CONFIGS.breath;
  const center = size / 2;
  const mainRadius = size * 0.34;

  const particles = useMemo(() => {
    if (!config.particles) return [];
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      angle: (i / 10) * Math.PI * 2,
      distance: mainRadius * 0.55 + Math.random() * mainRadius * 0.5,
      size: 1.5 + Math.random() * 2.5,
      delay: i * 0.12,
    }));
  }, [config.particles, mainRadius]);

  if (!active) return null;

  const orbHeight = size * 0.75;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: orbHeight,
        margin: `0 auto ${space[3]}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Atmospheric background glow — deepest layer */}
      <motion.div
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: mainRadius * 3.2,
          height: mainRadius * 3.2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}12, ${color}06, transparent 70%)`,
          x: "-50%",
          y: "-50%",
          filter: "blur(20px)",
        }}
      />

      {/* Pulse rings — glass-morphism style */}
      {Array.from({ length: config.pulseRings }).map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: mainRadius * 2 + i * 28,
            height: mainRadius * 2 + i * 28,
            borderRadius: "50%",
            border: `${i === 0 ? 1.5 : 1}px solid ${color}`,
            x: "-50%",
            y: "-50%",
          }}
          animate={{
            opacity: [0.04 + i * 0.015, 0.1 + i * 0.02, 0.04 + i * 0.015],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 3.5 + i * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}

      {/* Main orb — responds to breathScale with layered gradients */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: mainRadius * 2,
          height: mainRadius * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle at 40% 35%, ${color}20, ${color}0C 50%, transparent 80%)`,
          boxShadow: `inset 0 0 ${mainRadius * 0.4}px ${color}08, 0 0 ${mainRadius * 0.6}px ${color}10`,
          x: "-50%",
          y: "-50%",
        }}
        animate={{ scale: breathScale }}
        transition={{
          type: "spring",
          stiffness: 25,
          damping: 18,
          mass: 1.4,
        }}
      >
        {/* Inner glow — secondary gradient layer */}
        {config.innerGlow && (
          <motion.div
            style={{
              position: "absolute",
              inset: "20%",
              borderRadius: "50%",
              background: `radial-gradient(circle at 45% 40%, ${color}28, ${color}0A, transparent)`,
            }}
            animate={{
              opacity: [0.3, 0.65, 0.3],
              scale: [0.93, 1.07, 0.93],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Core nucleus — bright center */}
        <motion.div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
            x: "-50%",
            y: "-50%",
          }}
          animate={{
            opacity: [0.25, 0.75, 0.25],
            boxShadow: [
              `0 0 10px ${color}30, 0 0 25px ${color}15`,
              `0 0 20px ${color}50, 0 0 45px ${color}25`,
              `0 0 10px ${color}30, 0 0 25px ${color}15`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Orbital particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: color,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.08, 0.4, 0.08],
              scale: [0.4, 1, 0.4],
              x: Math.cos(p.angle) * p.distance * breathScale - p.size / 2,
              y: Math.sin(p.angle) * p.distance * breathScale - p.size / 2,
            }}
            transition={{
              opacity: { duration: 2.5, repeat: Infinity, delay: p.delay },
              scale: { duration: 2.5, repeat: Infinity, delay: p.delay },
              x: { type: "spring", stiffness: 25, damping: 18 },
              y: { type: "spring", stiffness: 25, damping: 18 },
            }}
          />
        ))}
      </AnimatePresence>

      {/* Breathing label — centered below orb */}
      <AnimatePresence mode="wait">
        {breathLabel && (
          <motion.div
            key={breathLabel}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              zIndex: 2,
            }}
          >
            <span
              style={{
                fontSize: font.size.base,
                fontWeight: font.weight.black,
                letterSpacing: 5,
                color,
                opacity: 0.8,
                textTransform: "uppercase",
              }}
            >
              {breathLabel}
            </span>
            <span style={{ fontSize: font.size.md, fontWeight: font.weight.black, color, opacity: 0.6 }}>
              {breathCount}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle circular progress track */}
      {sessionProgress > 0 && (
        <svg
          width={size}
          height={orbHeight}
          viewBox={`0 0 ${size} ${orbHeight}`}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <circle
            cx={center}
            cy={orbHeight / 2}
            r={mainRadius + 22}
            fill="none"
            stroke={color}
            strokeWidth={0.8}
            opacity={0.04}
            strokeDasharray="2 8"
          />
        </svg>
      )}
    </div>
  );
}
