"use client";
/* ═══════════════════════════════════════════════════════════════
   BREATH ORB — Clinical precision indicator
   A single pulsing form. No particles. No halos. No gradient stacks.
   Linear scaling synced to phase timing. The only long animation.
   ═══════════════════════════════════════════════════════════════ */

import { motion, AnimatePresence } from "framer-motion";

export default function BreathOrb({
  color = "#0F766E",
  breathScale = 1,
  breathLabel = "",
  breathCount = 0,
  active = false,
  size = 200,
}) {
  if (!active) return null;

  const orbHeight = size * 0.85;
  const mainRadius = size * 0.32;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: orbHeight,
        margin: "0 auto 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Static reference ring — clinical baseline */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: mainRadius * 2.6,
          height: mainRadius * 2.6,
          borderRadius: "50%",
          border: `0.5px solid ${color}20`,
          transform: "translate(-50%,-50%)",
        }}
      />

      {/* Breathing form — the single active element */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: mainRadius * 2,
          height: mainRadius * 2,
          borderRadius: "50%",
          border: `1px solid ${color}`,
          background: `${color}08`,
          transform: "translate(-50%,-50%)",
        }}
        animate={{ scale: breathScale }}
        transition={{
          type: "tween",
          duration: 0.6,
          ease: "easeInOut",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
          }}
        />
      </motion.div>

      {/* Phase label — clinical typography */}
      <AnimatePresence mode="wait">
        {breathLabel && (
          <motion.div
            key={breathLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.24em",
                color,
                textTransform: "uppercase",
              }}
            >
              {breathLabel}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                color,
                opacity: 0.6,
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
