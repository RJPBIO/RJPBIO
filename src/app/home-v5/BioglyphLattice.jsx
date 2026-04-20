"use client";
import { motion } from "framer-motion";
import { bioSignal } from "@/components/ui/tokens";

/* One neural mote — the brand atom. Variations of this shape compose
   every decorative visual in the marketing surface. Cover the logo
   and this motif alone should identify BIO-IGNICIÓN. */
function Mote({
  cx, cy,
  r = 5,
  accent = bioSignal.phosphorCyan,
  rays = 3,
  halo = false,
  opacity = 1,
  animated = false,
  delay = 0,
}) {
  const rayLen = r * 2.6;
  const angles = [
    -Math.PI / 6,        // 30°  (signature asymmetric)
    (7 * Math.PI) / 6,   // 210°
    Math.PI / 2,         // 90°
  ].slice(0, rays);

  return (
    <g opacity={opacity}>
      {halo && (
        <circle
          cx={cx} cy={cy} r={r * 3.6}
          fill="none" stroke={accent}
          strokeWidth="0.6"
          strokeDasharray="1.5 2.8"
          opacity="0.38"
        />
      )}
      {angles.map((a, i) => (
        <line key={i}
          x1={cx} y1={cy}
          x2={cx + Math.cos(a) * rayLen}
          y2={cy + Math.sin(a) * rayLen}
          stroke={accent}
          strokeWidth={Math.max(0.6, r * 0.36)}
          strokeLinecap="round"
          opacity={i === 0 ? 0.95 : i === 1 ? 0.6 : 0.8}
        />
      ))}
      {animated ? (
        <motion.circle cx={cx} cy={cy} r={r} fill={accent}
          animate={{ r: [r, r * 1.32, r], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay }}
        />
      ) : (
        <circle cx={cx} cy={cy} r={r} fill={accent} />
      )}
    </g>
  );
}

export default function BioglyphLattice({ variant = "constellation", animated = true, height }) {
  const sx = { width: "100%", height: height || "auto", display: "block" };
  if (variant === "neural")      return <NeuralLattice animated={animated} sx={sx} />;
  if (variant === "privacy")     return <PrivacyLattice animated={animated} sx={sx} />;
  if (variant === "evidence")    return <EvidenceLattice animated={animated} sx={sx} />;
  if (variant === "protocols")   return <ProtocolsLattice animated={animated} sx={sx} />;
  if (variant === "ambient")     return <AmbientLattice sx={sx} />;
  return <ConstellationLattice animated={animated} sx={sx} />;
}

function NeuralLattice({ animated, sx }) {
  const cy = bioSignal.phosphorCyan, nv = bioSignal.neuralViolet;
  return (
    <svg viewBox="0 0 400 220" style={sx}>
      <g stroke={cy} strokeWidth="0.5" opacity="0.22" strokeDasharray="2 3" fill="none">
        <line x1={200} y1={110} x2={80}  y2={60} />
        <line x1={200} y1={110} x2={120} y2={170} />
        <line x1={200} y1={110} x2={290} y2={50} />
        <line x1={200} y1={110} x2={330} y2={160} />
        <line x1={200} y1={110} x2={60}  y2={140} />
      </g>
      <Mote cx={200} cy={110} r={11} accent={cy} halo animated={animated} />
      <Mote cx={80}  cy={60}  r={4.5} accent={cy} opacity={0.75} animated={animated} delay={0.4} />
      <Mote cx={120} cy={170} r={5}   accent={nv} opacity={0.8}  animated={animated} delay={0.7} />
      <Mote cx={290} cy={50}  r={4.5} accent={nv} opacity={0.75} animated={animated} delay={0.2} />
      <Mote cx={330} cy={160} r={5}   accent={cy} opacity={0.85} animated={animated} delay={0.55} />
      <Mote cx={60}  cy={140} r={3}   rays={2} accent={cy} opacity={0.55} />
      <Mote cx={360} cy={100} r={3}   rays={2} accent={nv} opacity={0.55} />
    </svg>
  );
}

function PrivacyLattice({ animated, sx }) {
  const cy = bioSignal.phosphorCyan;
  const body = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      body.push({ x: 130 + c * 36, y: 120 + r * 26 });
    }
  }
  const shackle = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (Math.PI * i) / 4;
    shackle.push({ x: 184 + Math.cos(a) * 54, y: 100 + Math.sin(a) * 44 });
  }
  return (
    <svg viewBox="0 0 400 220" style={sx}>
      {shackle.map((m, i) => (
        <Mote key={`s${i}`} cx={m.x} cy={m.y} r={3} rays={2} accent={cy} opacity={0.5} />
      ))}
      {body.map((m, i) => (
        <Mote key={`b${i}`} cx={m.x} cy={m.y} r={3} rays={2} accent={cy} opacity={0.6} />
      ))}
      <Mote cx={184} cy={156} r={7} accent={cy} halo animated={animated} />
    </svg>
  );
}

function EvidenceLattice({ animated, sx }) {
  const cy = bioSignal.phosphorCyan, nv = bioSignal.neuralViolet;
  const cols = [6, 5, 4, 3, 2];
  const out = [];
  cols.forEach((h, ci) => {
    for (let ri = 0; ri < h; ri++) {
      out.push({
        x: 70 + ci * 60,
        y: 190 - ri * 26,
        accent: ri === h - 1 ? cy : nv,
        opacity: 0.4 + (ri / h) * 0.55,
      });
    }
  });
  return (
    <svg viewBox="0 0 400 220" style={sx}>
      {out.map((m, i) => (
        <Mote key={i} cx={m.x} cy={m.y} r={3} rays={2} accent={m.accent} opacity={m.opacity} />
      ))}
    </svg>
  );
}

function ProtocolsLattice({ animated, sx }) {
  const cy = bioSignal.phosphorCyan, nv = bioSignal.neuralViolet;
  return (
    <svg viewBox="0 0 400 220" style={sx}>
      <g stroke={cy} strokeWidth="0.5" opacity="0.18" strokeDasharray="2 3" fill="none">
        <line x1={130} y1={80}  x2={270} y2={80} />
        <line x1={130} y1={150} x2={270} y2={150} />
        <line x1={130} y1={80}  x2={130} y2={150} />
        <line x1={270} y1={80}  x2={270} y2={150} />
      </g>
      <Mote cx={130} cy={80}  r={7} accent={cy} halo animated={animated} delay={0} />
      <Mote cx={270} cy={80}  r={7} accent={nv} halo animated={animated} delay={0.4} />
      <Mote cx={130} cy={150} r={7} accent={nv} halo animated={animated} delay={0.8} />
      <Mote cx={270} cy={150} r={7} accent={cy} halo animated={animated} delay={1.2} />
    </svg>
  );
}

function ConstellationLattice({ animated, sx }) {
  const cy = bioSignal.phosphorCyan, nv = bioSignal.neuralViolet;
  const motes = [
    { x: 40,  y: 40,  r: 3,   acc: cy, o: 0.5, rays: 2 },
    { x: 100, y: 80,  r: 4,   acc: nv, o: 0.7 },
    { x: 180, y: 50,  r: 3,   acc: cy, o: 0.5 },
    { x: 240, y: 120, r: 6.5, acc: cy, o: 0.95, halo: true, animated: true },
    { x: 320, y: 70,  r: 4,   acc: nv, o: 0.7 },
    { x: 360, y: 160, r: 3,   acc: cy, o: 0.5, rays: 2 },
    { x: 70,  y: 170, r: 4,   acc: nv, o: 0.6 },
  ];
  return (
    <svg viewBox="0 0 400 220" style={sx}>
      {motes.map((m, i) => (
        <Mote key={i} cx={m.x} cy={m.y}
          r={m.r} accent={m.acc} opacity={m.o}
          rays={m.rays ?? 3} halo={m.halo}
          animated={animated && m.animated}
        />
      ))}
    </svg>
  );
}

/* Full-bleed, very-low-opacity background tiling for section ambience. */
function AmbientLattice({ sx }) {
  const cy = bioSignal.phosphorCyan, nv = bioSignal.neuralViolet;
  const motes = [];
  const cols = 8, rows = 5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jx = (Math.sin(r * 3 + c * 7) + 1) * 8;
      const jy = (Math.cos(r * 5 + c * 11) + 1) * 8;
      const x = 40 + c * 60 + jx;
      const y = 30 + r * 50 + jy;
      const acc = (r + c) % 3 === 0 ? nv : cy;
      motes.push({ x, y, r: 2.2, acc, o: 0.18 });
    }
  }
  return (
    <svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMid slice" style={sx}>
      {motes.map((m, i) => (
        <Mote key={i} cx={m.x} cy={m.y} r={m.r} rays={2} accent={m.acc} opacity={m.o} />
      ))}
    </svg>
  );
}
