"use client";
/* ═══════════════════════════════════════════════════════════════
   ILLUSTRATED EMPTY — estados vacíos narrativos con ilustración
   ═══════════════════════════════════════════════════════════════
   Los estados vacíos del elite (Apple, Oura, Linear) no son texto
   + icono. Son ilustraciones propias que enseñan el próximo paso
   sin que el usuario se sienta "sin contenido". Usan el
   vocabulario visual del producto: aquí, el osciloscopio + spark
   + field. Cada variante es una escena distinta, no el mismo
   placeholder.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { BioGlyph } from "./BioIgnicionMark";
import { bioSignal, font, space, radius } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";

function FlatSignalField({ reduced }) {
  return (
    <svg width="180" height="100" viewBox="0 0 180 100" role="img" aria-label="Señal biométrica en espera">
      <defs>
        <linearGradient id="ie-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={bioSignal.phosphorCyan} stopOpacity="0" />
          <stop offset="50%" stopColor={bioSignal.phosphorCyan} stopOpacity="0.7" />
          <stop offset="100%" stopColor={bioSignal.phosphorCyan} stopOpacity="0" />
        </linearGradient>
        <filter id="ie-glow">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line x1="0" y1="50" x2="180" y2="50" stroke="url(#ie-fade)" strokeWidth="1.2" strokeDasharray="2 4" opacity="0.6" />
      {reduced ? (
        <>
          <circle cx="90" cy="50" r="3.5" fill={bioSignal.phosphorCyan} opacity="0.25" />
          <circle cx="90" cy="50" r="1.8" fill={bioSignal.ignition} />
        </>
      ) : (
        <motion.g
          animate={{ x: [0, 160, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="10" cy="50" r="4.5" fill={bioSignal.phosphorCyan} opacity="0.18" filter="url(#ie-glow)" />
          <circle cx="10" cy="50" r="2" fill={bioSignal.ignition} />
        </motion.g>
      )}
      <motion.circle
        cx="30"
        cy="50"
        r="1.2"
        fill={bioSignal.phosphorCyan}
        opacity="0.35"
        animate={reduced ? {} : { opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="150"
        cy="50"
        r="1.2"
        fill={bioSignal.phosphorCyan}
        opacity="0.35"
        animate={reduced ? {} : { opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: 0.3 }}
      />
    </svg>
  );
}

function HistoryConstellation({ reduced }) {
  const nodes = [
    { x: 30, y: 70, r: 3, d: 0 },
    { x: 60, y: 45, r: 4, d: 0.15 },
    { x: 95, y: 55, r: 3.5, d: 0.3 },
    { x: 130, y: 35, r: 5, d: 0.45 },
    { x: 160, y: 60, r: 3, d: 0.6 },
  ];
  return (
    <svg width="180" height="100" viewBox="0 0 180 100" role="img" aria-label="Constelación de sesiones por empezar">
      <defs>
        <filter id="ie-hc-glow">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {nodes.slice(0, -1).map((n, i) => (
        <line
          key={i}
          x1={n.x}
          y1={n.y}
          x2={nodes[i + 1].x}
          y2={nodes[i + 1].y}
          stroke={bioSignal.phosphorCyan}
          strokeWidth="0.8"
          opacity="0.35"
          strokeDasharray="2 3"
        />
      ))}
      {nodes.map((n, i) => (
        <motion.g
          key={i}
          initial={reduced ? { opacity: 0.7 } : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={reduced ? { duration: 0 } : { delay: n.d, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <circle cx={n.x} cy={n.y} r={n.r + 2.5} fill={bioSignal.phosphorCyan} opacity="0.15" filter="url(#ie-hc-glow)" />
          <circle cx={n.x} cy={n.y} r={n.r} fill={i === nodes.length - 1 ? bioSignal.ignition : bioSignal.phosphorCyan} />
        </motion.g>
      ))}
    </svg>
  );
}

function BaselineField({ reduced }) {
  return (
    <svg width="180" height="100" viewBox="0 0 180 100" role="img" aria-label="Listo para primera calibración">
      <defs>
        <radialGradient id="ie-bf-core">
          <stop offset="0%" stopColor={bioSignal.ignition} stopOpacity="1" />
          <stop offset="60%" stopColor={bioSignal.phosphorCyan} stopOpacity="1" />
          <stop offset="100%" stopColor={bioSignal.phosphorCyan} stopOpacity="0" />
        </radialGradient>
      </defs>
      {[22, 32, 42].map((r, i) => (
        <motion.circle
          key={i}
          cx="90"
          cy="50"
          r={r}
          fill="none"
          stroke={bioSignal.phosphorCyan}
          strokeWidth="0.8"
          opacity={0.35 - i * 0.08}
          animate={reduced ? {} : { r: [r, r + 4, r], opacity: [0.35 - i * 0.08, 0.08, 0.35 - i * 0.08] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}
      <circle cx="90" cy="50" r="10" fill="url(#ie-bf-core)" />
      <circle cx="90" cy="50" r="3" fill={bioSignal.ignition} />
    </svg>
  );
}

const ILLUSTRATIONS = {
  signal: FlatSignalField,
  history: HistoryConstellation,
  baseline: BaselineField,
};

export default function IllustratedEmpty({
  illustration = "signal",
  kicker,
  title,
  body,
  action,
  actionLabel,
  accent = bioSignal.phosphorCyan,
  textPrimary = "#E8ECF4",
  textMuted = "rgba(232,236,244,0.65)",
  bg = "transparent",
}) {
  const reduced = useReducedMotion();
  const Illus = ILLUSTRATIONS[illustration] || FlatSignalField;

  return (
    <div
      role="group"
      aria-label={title}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingBlock: space[8],
        paddingInline: space[5],
        gap: space[3],
        background: bg,
      }}
    >
      <Illus reduced={reduced} />
      {kicker && (
        <div
          style={{
            fontSize: 12,
            letterSpacing: -0.05,
            fontWeight: 600,
            color: accent,
            marginBlockStart: space[2],
          }}
        >
          {kicker}
        </div>
      )}
      <h3
        style={{
          fontSize: font.size.xl,
          fontWeight: font.weight.black,
          color: textPrimary,
          margin: 0,
          lineHeight: 1.25,
          maxInlineSize: 320,
        }}
      >
        {title}
      </h3>
      {body && (
        <p
          style={{
            fontSize: font.size.sm,
            color: textMuted,
            margin: 0,
            lineHeight: 1.55,
            maxInlineSize: 300,
          }}
        >
          {body}
        </p>
      )}
      {action && actionLabel && (
        <motion.button
          type="button"
          className="bi-btn"
          whileTap={reduced ? {} : { scale: 0.97 }}
          onClick={action}
          style={{
            marginBlockStart: space[2],
            paddingBlock: 14,
            paddingInline: 22,
            borderRadius: radius.full,
            border: "none",
            background: `linear-gradient(135deg, ${accent}, ${bioSignal.neuralViolet})`,
            color: "#050810",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: -0.1,
            cursor: "pointer",
            fontFamily: "inherit",
            minBlockSize: 48,
          }}
        >
          {actionLabel}
        </motion.button>
      )}
    </div>
  );
}
