"use client";
/* ═══════════════════════════════════════════════════════════════
   BREATH ORB — Visualización de respiración con framer-motion
   Orbe neural animado que responde al ciclo respiratorio
   Base neurocientífica: la sincronización visual con la respiración
   activa la ínsula anterior, mejorando la interocepción y la
   coherencia cardiorrespiratoria (Critchley et al., 2004)
   ═══════════════════════════════════════════════════════════════ */

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

// Mapeo de tipo de fase a configuración visual
const PHASE_CONFIGS = {
  breath: {
    gradient: (c) => [`${c}08`, `${c}20`, `${c}08`],
    innerGlow: true,
    particles: false,
    pulseRings: 3,
  },
  body: {
    gradient: (c) => [`${c}06`, `${c}18`, `${c}06`],
    innerGlow: false,
    particles: true,
    pulseRings: 2,
  },
  mind: {
    gradient: (c) => [`${c}04`, `${c}15`, `${c}04`],
    innerGlow: true,
    particles: true,
    pulseRings: 4,
  },
  focus: {
    gradient: (c) => [`${c}0A`, `${c}25`, `${c}0A`],
    innerGlow: true,
    particles: false,
    pulseRings: 2,
  },
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
  const mainRadius = size * 0.35;

  // Generar partículas estáticas para fase body/mind
  const particles = useMemo(() => {
    if (!config.particles) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * Math.PI * 2,
      distance: mainRadius * 0.6 + Math.random() * mainRadius * 0.4,
      size: 2 + Math.random() * 2,
      delay: i * 0.15,
    }));
  }, [config.particles, mainRadius]);

  if (!active) return null;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size * 0.7,
        margin: "0 auto 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Anillos de pulso exterior */}
      {Array.from({ length: config.pulseRings }).map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: mainRadius * 2 + i * 24,
            height: mainRadius * 2 + i * 24,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            x: "-50%",
            y: "-50%",
          }}
          animate={{
            opacity: [0.03 + i * 0.02, 0.08 + i * 0.02, 0.03 + i * 0.02],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Orbe principal — responde a breathScale */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: mainRadius * 2,
          height: mainRadius * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18, ${color}08, transparent)`,
          x: "-50%",
          y: "-50%",
        }}
        animate={{
          scale: breathScale,
        }}
        transition={{
          type: "spring",
          stiffness: 30,
          damping: 20,
          mass: 1.2,
        }}
      >
        {/* Núcleo interno brillante */}
        {config.innerGlow && (
          <motion.div
            style={{
              position: "absolute",
              inset: "25%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}25, ${color}08, transparent)`,
            }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Punto central (núcleo neural) */}
        <motion.div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            x: "-50%",
            y: "-50%",
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            boxShadow: [
              `0 0 8px ${color}40`,
              `0 0 20px ${color}60`,
              `0 0 8px ${color}40`,
            ],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Partículas orbitales (fases body/mind) */}
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

      {/* Label de respiración */}
      <AnimatePresence mode="wait">
        {breathLabel && (
          <motion.div
            key={breathLabel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              left: "50%",
              bottom: 4,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              zIndex: 2,
            }}
          >
            <span
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
            <span style={{ fontSize: 12, fontWeight: 800, color }}>
              {breathCount}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de progreso circular sutil */}
      {sessionProgress > 0 && (
        <svg
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
