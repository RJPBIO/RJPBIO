"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN MARK — glifo + wordmark de la identidad
   ═══════════════════════════════════════════════════════════════
   El glifo es un "nodo neural con chispa": núcleo central + tres
   rayos asimétricos (30°, 150°, 270°) + halo sutil. Los rayos son
   asimétricos a propósito: transmite vida, no plantilla.
   El wordmark separa el peso tipográfico: "BIO" ligero, "—" color
   de señal, "IGNICIÓN" pesado. Un solo glifo, múltiples tamaños.
   ═══════════════════════════════════════════════════════════════ */

import { motion as m } from "framer-motion";
import { bioSignal, font } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";

/**
 * Neural spark glyph — el símbolo solo, sin wordmark.
 * Usado en: apple-touch-icon, PWA splash, nav, loading.
 */
export function BioGlyph({ size = 32, color = bioSignal.phosphorCyan, spark = bioSignal.ignition, animated = false }) {
  const reduced = useReducedMotion();
  const shouldAnimate = animated && !reduced;
  const c = size / 2;
  const rNode = size * 0.13;
  const rHalo = size * 0.42;
  const rayLen = size * 0.34;

  // Rayos asimétricos — 30°, 150°, 270° en radianes
  const rays = [
    { a: -Math.PI / 6 },        // 30° arriba-derecha
    { a: (7 * Math.PI) / 6 },   // 210° abajo-izquierda (opuesto a 30°)
    { a: Math.PI / 2 },         // 90° abajo (centro-abajo)
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="BIO-IGNICIÓN"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`bi-core-${size}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={spark} stopOpacity="1" />
          <stop offset="60%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`bi-halo-${size}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo difuso */}
      <circle cx={c} cy={c} r={rHalo} fill={`url(#bi-halo-${size})`} />

      {/* Anillo exterior punteado — sugiere "señal captada" */}
      <circle
        cx={c}
        cy={c}
        r={rHalo * 0.85}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.015}
        strokeDasharray={`${size * 0.02} ${size * 0.035}`}
        opacity="0.5"
      />

      {/* Rayos de chispa asimétricos */}
      {rays.map((r, i) => {
        const x2 = c + Math.cos(r.a) * rayLen;
        const y2 = c + Math.sin(r.a) * rayLen;
        return (
          <line
            key={i}
            x1={c}
            y1={c}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={size * 0.05}
            strokeLinecap="round"
            opacity={i === 0 ? 1 : i === 1 ? 0.7 : 0.85}
          />
        );
      })}

      {/* Núcleo con destello */}
      {shouldAnimate ? (
        <m.circle
          cx={c}
          cy={c}
          r={rNode}
          fill={`url(#bi-core-${size})`}
          animate={{ r: [rNode, rNode * 1.25, rNode], opacity: [1, 0.85, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <circle cx={c} cy={c} r={rNode} fill={`url(#bi-core-${size})`} />
      )}

      {/* Punto brillante central */}
      <circle cx={c} cy={c} r={rNode * 0.35} fill={spark} opacity="0.95" />
    </svg>
  );
}

/**
 * Wordmark completo — glifo + texto "BIO-IGNICIÓN".
 * Peso tipográfico dividido: BIO (300) · guión-señal · IGNICIÓN (800).
 * @param {"horizontal"|"stack"} layout
 * @param {number} glyphSize
 * @param {string} textColor
 * @param {string} signalColor  — color del guión y del glifo
 */
export default function BioIgnicionMark({
  layout = "horizontal",
  glyphSize = 28,
  textColor = "#E8ECF4",
  signalColor = bioSignal.phosphorCyan,
  animated = false,
  textSize,
  letterSpacing = 4,
}) {
  const isStack = layout === "stack";
  const tSize = textSize || Math.round(glyphSize * 0.42);
  const gap = isStack ? glyphSize * 0.28 : glyphSize * 0.42;

  return (
    <div
      role="img"
      aria-label="BIO-IGNICIÓN"
      style={{
        display: "inline-flex",
        flexDirection: isStack ? "column" : "row",
        alignItems: "center",
        gap,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      <BioGlyph size={glyphSize} color={signalColor} animated={animated} />
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: Math.max(2, tSize * 0.18),
          fontFamily: font.family,
          fontSize: tSize,
          letterSpacing,
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        <span style={{ fontWeight: font.weight.normal, color: textColor, opacity: 0.7 }}>
          BIO
        </span>
        <span style={{ color: signalColor, fontWeight: font.weight.bold, transform: "translateY(-0.08em)" }}>
          —
        </span>
        <span style={{ fontWeight: font.weight.black, color: textColor }}>
          IGNICIÓN
        </span>
      </span>
    </div>
  );
}
