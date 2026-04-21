"use client";
import { motion } from "framer-motion";
import { bioSignal } from "@/lib/theme";

/* ═══════════════════════════════════════════════════════════════
   AMBIENT LATTICE — shared cinematic backdrop
   ═══════════════════════════════════════════════════════════════
   BIO atom motes (rays at 30°/210°/90°) + optional vignette.
   Two intensities:
     - Full (runner): opacity 0.4, 9 motes, vignette on
     - Edge (idle):   opacity 0.12, 5 motes en bordes, vignette off
   ═══════════════════════════════════════════════════════════════ */

function Mote({ cx, cy, r, accent, animated, delay = 0 }) {
  const rayLen = r * 2.6;
  const angles = [-Math.PI / 6, (7 * Math.PI) / 6, Math.PI / 2];
  return (
    <g>
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(a) * rayLen}
          y2={cy + Math.sin(a) * rayLen}
          stroke={accent}
          strokeWidth={Math.max(0.4, r * 0.3)}
          strokeLinecap="round"
          opacity={i === 0 ? 0.75 : i === 1 ? 0.45 : 0.6}
        />
      ))}
      {animated ? (
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill={accent}
          animate={{ r: [r, r * 1.35, r], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay }}
        />
      ) : (
        <circle cx={cx} cy={cy} r={r} fill={accent} opacity={0.7} />
      )}
    </g>
  );
}

const FULL_MOTES = [
  { cx: 14, cy: 20, r: 1.3, d: 0.0 },
  { cx: 82, cy: 24, r: 1.6, d: 0.6 },
  { cx: 28, cy: 66, r: 1.4, d: 1.2 },
  { cx: 74, cy: 80, r: 1.0, d: 1.8 },
  { cx: 52, cy: 14, r: 0.9, d: 2.2 },
  { cx: 10, cy: 90, r: 0.8, d: 2.6 },
  { cx: 90, cy: 54, r: 1.1, d: 0.4 },
  { cx: 40, cy: 42, r: 0.7, d: 1.5 },
  { cx: 64, cy: 38, r: 0.8, d: 2.0 },
];

const EDGE_MOTES = [
  { cx: 6, cy: 18, r: 1.1, d: 0.0 },
  { cx: 94, cy: 32, r: 1.3, d: 0.8 },
  { cx: 8, cy: 72, r: 0.9, d: 1.6 },
  { cx: 92, cy: 84, r: 1.0, d: 2.2 },
  { cx: 4, cy: 46, r: 0.7, d: 1.1 },
];

export default function AmbientLattice({
  accent,
  reducedMotion = false,
  opacity = 0.4,
  edgeOnly = false,
  vignette = true,
  fixed = false,
}) {
  const color = accent || bioSignal.phosphorCyan;
  const motes = edgeOnly ? EDGE_MOTES : FULL_MOTES;
  const gradId = `al-vig-${edgeOnly ? "edge" : "full"}`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: fixed ? "fixed" : "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {vignette && (
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="72%">
            <stop offset="58%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
          </radialGradient>
        </defs>
      )}
      {motes.map((m, i) => (
        <Mote key={i} cx={m.cx} cy={m.cy} r={m.r} accent={color} animated={!reducedMotion} delay={m.d} />
      ))}
      {vignette && <rect x="0" y="0" width="100" height="100" fill={`url(#${gradId})`} />}
    </svg>
  );
}
