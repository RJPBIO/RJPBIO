"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   NeuralCore3D — núcleo sensorial del orb de ignición

   EL momento wow del sistema. La esfera es una cámara translúcida
   donde la lattice del trademark vive en 3D real, respira con el
   usuario, y se comporta como red neuronal sintonizada al protocolo
   en ejecución. Cada protocolo tiene personalidad distinta; cada
   fase dispara una señal coreografiada; cada respiración altera la
   materia dentro del cristal.

   Arquitectura de capas:
   ─────────────────────
   1. Glass sphere — backdrop-filter + highlight superior que deriva
      lentamente (specular drift), no pétreo.
   2. Aurora nebula interior — radial tintada rotando opuesto al aro.
   3. Aura cónica exterior — energía rotando en el rim.
   4. Lattice SVG 3D (proyección manual rAF):
      — 24 motes (trademark: 3 rayos asimétricos) en fib-sphere
      — 42 edges KNN(k=3) depth-faded
      — firing events orgánicos con cadencia protocolar
      — firings programados (ignition wave · phase ring · collapse)
      — cascadas: un hit puede propagarse a un vecino
      — depth-sorting, escala y opacidad por z
      — breath coupling: cada mote pulsa con la curva del usuario
      — countdown tick: 3 motes random brillan cada segundo
      — últimos 20% de sesión: firing rate +30% (anticipación)

   Personalidad por intent (pr.int):
   ─────────────────────────────────
     calma       → rotación lenta, firings espaciados, poco chaos
     enfoque     → ritmo medio, firings regulares, nebula intensa
     reset       → cadencia rítmica (jitter=0), sin chaos
     energia     → rotación rápida, firings densos, chaos alto
     (default)   → enfoque
   ═══════════════════════════════════════════════════════════════ */

// ─── Geometry ─────────────────────────────────────────────────────
function fibSphere(n) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  return pts;
}

function buildEdges(nodes, k) {
  const set = new Set();
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    const dists = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      dists.push({ j, d: dx * dx + dy * dy + dz * dz });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let p = 0; p < k; p++) {
      const j = dists[p].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!set.has(key)) {
        set.add(key);
        edges.push({ a: Math.min(i, j), b: Math.max(i, j) });
      }
    }
  }
  return edges;
}

function buildNeighbors(n, edges) {
  const map = Array.from({ length: n }, () => []);
  edges.forEach(({ a, b }) => {
    map[a].push(b);
    map[b].push(a);
  });
  return map;
}

function rotateXY(p, cy, sy, cx, sx) {
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const y2 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;
  return { x: x1, y: y2, z: z2 };
}

// ─── Intent personalities ─────────────────────────────────────────
const INTENT = {
  calma: {
    rotIdle: 44, rotRun: 34, sparkMs: 820, fireBase: 2600, fireJit: 900,
    chaos: 0, cascadeP: 0.05, nebulaOp: 0.82, edgeOp: 0.9, moteBase: 2.1,
  },
  enfoque: {
    rotIdle: 28, rotRun: 22, sparkMs: 520, fireBase: 1600, fireJit: 650,
    chaos: 0.05, cascadeP: 0.10, nebulaOp: 1.0, edgeOp: 1.0, moteBase: 2.2,
  },
  reset: {
    rotIdle: 36, rotRun: 26, sparkMs: 620, fireBase: 1800, fireJit: 120, // rítmico: jitter ~0
    chaos: 0, cascadeP: 0.07, nebulaOp: 0.92, edgeOp: 0.95, moteBase: 2.2,
  },
  energia: {
    rotIdle: 22, rotRun: 14, sparkMs: 340, fireBase: 900, fireJit: 1100,
    chaos: 0.28, cascadeP: 0.22, nebulaOp: 1.18, edgeOp: 1.15, moteBase: 2.35,
  },
};
const DEFAULT_INTENT = INTENT.enfoque;

// ─── Component ────────────────────────────────────────────────────
const N_NODES = 24;
const K_NEIGHBORS = 3;

export default function NeuralCore3D({
  size = 260,
  color = "#22D3EE",
  state = "idle",
  breathScale = 1,
  isBreathing = false,
  reducedMotion = false,
  // Integración con sesión
  intent = "enfoque",
  phaseIndex = 0,
  progress = 0,      // 0–1, fracción transcurrida de la sesión
  secondTick = 0,    // cambia cada segundo (parent pasa `sec`); trigger de micro-pulso
}) {
  const cfg = INTENT[intent] || DEFAULT_INTENT;

  const nodes = useMemo(() => fibSphere(N_NODES), []);
  const edges = useMemo(() => buildEdges(nodes, K_NEIGHBORS), [nodes]);
  const neighbors = useMemo(() => buildNeighbors(N_NODES, edges), [edges]);

  // rAF frame counter
  const [, setFrame] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const firingsRef = useRef([]);   // { startMs, duration, from, to, gen }
  const pulsesRef = useRef([]);    // { startMs, duration, nodes: number[] | "all", intensity }
  const lastFireRef = useRef(0);
  const pausedAccumRef = useRef(0);

  // Re-create startRef on mount only; subsequent renders use stable ref
  useEffect(() => {
    startRef.current = performance.now();
  }, []);

  // rAF loop
  useEffect(() => {
    if (reducedMotion) return undefined;
    let alive = true;
    const tick = (now) => {
      if (!alive) return;
      // Cull completed firings, handle cascades on completion
      const nextFirings = [];
      firingsRef.current.forEach((f) => {
        const end = f.startMs + f.duration;
        if (now >= end) {
          // Cascade: chance to propagate from `to` → random neighbor
          if (
            state === "running" &&
            f.gen < 2 &&
            Math.random() < cfg.cascadeP
          ) {
            const targets = neighbors[f.to].filter((n) => n !== f.from);
            if (targets.length) {
              const next = targets[Math.floor(Math.random() * targets.length)];
              nextFirings.push({
                startMs: now + 40,
                duration: cfg.sparkMs,
                from: f.to,
                to: next,
                gen: f.gen + 1,
              });
            }
          }
        } else {
          nextFirings.push(f);
        }
      });
      firingsRef.current = nextFirings;

      // Cull completed pulses
      pulsesRef.current = pulsesRef.current.filter(
        (p) => now - p.startMs < p.duration
      );

      // Spawn organic firings (not during paused / done)
      if (state === "running" || state === "idle") {
        const intensityBoost = progress > 0.8 ? 1 - (progress - 0.8) * 1.5 : 1;
        // state==="idle" uses slower base by 1.6x (suggestive, not busy)
        const baseMs = cfg.fireBase * (state === "idle" ? 1.6 : intensityBoost);
        const jit = cfg.fireJit;
        // Off-beat chaos: occasional rogue early fire
        const chaosFire = cfg.chaos > 0 && Math.random() < cfg.chaos * 0.02;
        if (chaosFire || now - lastFireRef.current > baseMs + Math.random() * jit) {
          lastFireRef.current = now;
          if (edges.length > 0) {
            const edgeIdx = Math.floor(Math.random() * edges.length);
            const e = edges[edgeIdx];
            const fromFirst = Math.random() < 0.5;
            firingsRef.current.push({
              startMs: now,
              duration: cfg.sparkMs,
              from: fromFirst ? e.a : e.b,
              to: fromFirst ? e.b : e.a,
              gen: 0,
            });
          }
        }
      }

      setFrame((f) => (f + 1) % 1_000_000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, state, cfg, edges, neighbors, progress]);

  // ─── Ignition wave & resonance collapse on state changes ─────
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (reducedMotion) return;
    const now = performance.now();

    if (prev === "idle" && state === "running") {
      // IGNITION WAVE: radial burst from seed
      const seed = Math.floor(Math.random() * N_NODES);
      const lv1 = neighbors[seed].slice(0, 3);
      // Seed → lv1 at t=0
      lv1.forEach((n, i) => {
        firingsRef.current.push({
          startMs: now + i * 60,
          duration: cfg.sparkMs * 0.85,
          from: seed, to: n, gen: 0,
        });
      });
      // lv1 → lv2 at t=220ms
      lv1.forEach((n1, i) => {
        const lv2 = neighbors[n1].filter((x) => x !== seed).slice(0, 2);
        lv2.forEach((n2, j) => {
          firingsRef.current.push({
            startMs: now + 220 + (i * 2 + j) * 80,
            duration: cfg.sparkMs * 0.9,
            from: n1, to: n2, gen: 0,
          });
        });
      });
      // Big pulse on seed + all lv1 to sell the ignition
      pulsesRef.current.push({
        startMs: now,
        duration: 700,
        nodes: [seed, ...lv1],
        intensity: 0.9,
      });
    } else if (prev !== "done" && state === "done") {
      // RESONANCE COLLAPSE: every node blooms simultaneously, decays 1.4s
      pulsesRef.current.push({
        startMs: now,
        duration: 1400,
        nodes: "all",
        intensity: 1.0,
      });
      // Also spawn ~8 concentric firings for texture
      for (let i = 0; i < 8; i++) {
        const e = edges[Math.floor(Math.random() * edges.length)];
        firingsRef.current.push({
          startMs: now + i * 45,
          duration: cfg.sparkMs,
          from: e.a, to: e.b, gen: 0,
        });
      }
    }
  }, [state, reducedMotion, neighbors, edges, cfg]);

  // ─── Phase ring wave on phase change ──────────────────────────
  const prevPiRef = useRef(phaseIndex);
  useEffect(() => {
    const prev = prevPiRef.current;
    prevPiRef.current = phaseIndex;
    if (reducedMotion) return;
    if (prev === phaseIndex) return;
    if (state !== "running") return;

    // Pick 6 nodes near the equator, order by azimuth, fire in sequence
    const band = nodes
      .map((n, i) => ({ i, theta: Math.atan2(n.z, n.x), absY: Math.abs(n.y) }))
      .filter((m) => m.absY < 0.45)
      .sort((a, b) => a.theta - b.theta);
    const ring = band.slice(0, 6);
    const now = performance.now();
    ring.forEach((m, idx) => {
      const next = ring[(idx + 1) % ring.length];
      firingsRef.current.push({
        startMs: now + idx * 130,
        duration: cfg.sparkMs * 1.1,
        from: m.i, to: next.i, gen: 0,
      });
    });
    // Briefly pulse the whole ring for legibility
    pulsesRef.current.push({
      startMs: now,
      duration: 900,
      nodes: ring.map((m) => m.i),
      intensity: 0.55,
    });
  }, [phaseIndex, state, reducedMotion, nodes, cfg]);

  // ─── Countdown micro-pulse (per-second tick, active only) ─────
  const prevSecRef = useRef(secondTick);
  useEffect(() => {
    const prev = prevSecRef.current;
    prevSecRef.current = secondTick;
    if (reducedMotion) return;
    if (state !== "running") return;
    if (prev === secondTick) return;

    const chosen = [];
    for (let i = 0; i < 3; i++) {
      chosen.push(Math.floor(Math.random() * N_NODES));
    }
    pulsesRef.current.push({
      startMs: performance.now(),
      duration: 280,
      nodes: chosen,
      intensity: 0.45,
    });
  }, [secondTick, state, reducedMotion]);

  // ─── Compute current rotation (deterministic from elapsed time) ─
  const now = performance.now();
  const elapsed = reducedMotion ? 0 : (now - startRef.current) / 1000;
  const baseSpeed = state === "running"
    ? 1 / cfg.rotRun
    : state === "idle"
      ? 1 / cfg.rotIdle
      : state === "paused"
        ? 1 / (cfg.rotIdle * 1.8)
        : 1 / cfg.rotIdle;
  // Chaos shimmer on rotation speed (energia)
  const chaosMod = cfg.chaos > 0
    ? 1 + Math.sin(elapsed * 5.2) * cfg.chaos * 0.4
    : 1;
  const rotY = (elapsed * 360 * baseSpeed * chaosMod) % 360;
  const rotX = Math.sin((elapsed * 2 * Math.PI) / 36) * 10;

  const cosY = Math.cos((rotY * Math.PI) / 180);
  const sinY = Math.sin((rotY * Math.PI) / 180);
  const cosX = Math.cos((rotX * Math.PI) / 180);
  const sinX = Math.sin((rotX * Math.PI) / 180);

  const R = size * 0.36;
  const center = size / 2;

  // Breath coupling factor for individual motes
  const breathK = isBreathing ? (breathScale - 1) * 0.45 : 0;

  // Project all nodes
  const projected = nodes.map((n, i) => {
    const r = rotateXY(n, cosY, sinY, cosX, sinX);
    const depth = (r.z + 1) / 2;
    return {
      i,
      x: center + r.x * R,
      y: center + r.y * R,
      z: r.z,
      depth,
      scale: 0.72 + depth * 0.56,
      alpha: 0.28 + depth * 0.72,
    };
  });
  const drawOrder = [...projected].sort((a, b) => a.z - b.z);

  const active = state === "running" || state === "paused";
  const paused = state === "paused";

  // Specular drift (only the highlight position in the glass gradient)
  const hx = 50 + Math.sin(elapsed / 6) * 4;
  const hy = 22 + Math.cos(elapsed / 7) * 3;

  // ─── Helper: compute aggregate pulse boost for a given mote ────
  const getPulseBoost = (idx) => {
    let boost = 0;
    for (const p of pulsesRef.current) {
      if (p.nodes !== "all" && !p.nodes.includes(idx)) continue;
      const t = (now - p.startMs) / p.duration;
      if (t < 0 || t > 1) continue;
      // Ease: fast ramp, slow fade
      const env = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      boost = Math.max(boost, env * p.intensity);
    }
    return boost;
  };

  return (
    <>
      {/* ─── 1. Glass sphere (con specular drift) ──────────────── */}
      <motion.div
        aria-hidden
        animate={
          reducedMotion
            ? { scale: 1 }
            : isBreathing
              ? { scale: breathScale }
              : state === "idle"
                ? { scale: [1, 1.015, 1] }
                : active
                  ? { scale: [1, 1.008, 1] }
                  : { scale: 0.97 }
        }
        transition={
          isBreathing && !reducedMotion
            ? { type: "spring", stiffness: 30, damping: 20, mass: 1.2 }
            : { duration: state === "idle" ? 5 : 3.5, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            `radial-gradient(circle at ${hx}% ${hy}%, rgba(255,255,255,0.11) 0%, rgba(10,19,14,0.12) 40%, rgba(6,8,16,0.28) 82%, rgba(4,6,16,0.40) 100%)`,
          backdropFilter: "blur(16px) saturate(170%)",
          WebkitBackdropFilter: "blur(16px) saturate(170%)",
          border: `1px solid ${color}44`,
          boxShadow:
            `0 32px 90px -22px ${color}55,` +
            `0 10px 30px -10px rgba(0,0,0,0.38),` +
            `inset 0 2px 0 0 rgba(255,255,255,0.14),` +
            `inset 0 -26px 56px -20px rgba(0,0,0,0.55),` +
            `inset 0 0 72px -12px ${color}26`,
          pointerEvents: "none",
          opacity: paused ? 0.78 : 1,
          transition: "opacity .4s ease, border-color .6s ease, box-shadow .6s ease",
        }}
      />

      {/* ─── 2. Aurora nebula interior ───────────────────────────── */}
      {!reducedMotion && (
        <motion.div
          aria-hidden
          animate={{ rotate: -360 }}
          transition={{ duration: active ? 38 : 52, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: "8%",
            borderRadius: "50%",
            background:
              `radial-gradient(ellipse 60% 50% at 35% 40%, ${color}2a 0%, ${color}12 45%, transparent 75%),` +
              `radial-gradient(ellipse 45% 55% at 70% 65%, ${color}1e 0%, transparent 70%)`,
            filter: "blur(6px)",
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: paused ? 0.35 : cfg.nebulaOp,
            transition: "opacity .4s ease",
          }}
        />
      )}

      {/* ─── 3. Aura cónica exterior ─────────────────────────────── */}
      {!reducedMotion && (
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: active ? 14 : 18, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "50%",
            background: `conic-gradient(from 0deg, transparent 0%, ${color}48 10%, transparent 24%, transparent 52%, ${color}30 68%, transparent 84%)`,
            maskImage:
              "radial-gradient(circle, transparent 57%, black 60%, black 62%, transparent 65%)",
            WebkitMaskImage:
              "radial-gradient(circle, transparent 57%, black 60%, black 62%, transparent 65%)",
            pointerEvents: "none",
            opacity: paused ? 0.3 : 0.9,
            transition: "opacity .4s ease",
          }}
        />
      )}

      {/* ─── 4. SVG lattice (edges + firings + motes) ───────────── */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          maskImage:
            "radial-gradient(circle, transparent 0%, transparent 26%, rgba(0,0,0,0.5) 36%, black 52%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 0%, transparent 26%, rgba(0,0,0,0.5) 36%, black 52%, black 100%)",
          opacity: paused ? 0.55 : 1,
          transition: "opacity .4s ease",
        }}
      >
        {/* Edges */}
        <g>
          {edges.map((e, ei) => {
            const a = projected[e.a];
            const b = projected[e.b];
            const avgDepth = (a.depth + b.depth) / 2;
            const op = (0.08 + avgDepth * 0.22) * cfg.edgeOp;
            return (
              <line
                key={ei}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={color}
                strokeWidth={0.7}
                strokeDasharray="2 3"
                opacity={op}
              />
            );
          })}
        </g>

        {/* Firing edges — bright line + traveling spark */}
        <g>
          {firingsRef.current.map((f, fi) => {
            if (now < f.startMs) return null;
            const t = Math.min(1, (now - f.startMs) / f.duration);
            const a = projected[f.from];
            const b = projected[f.to];
            const sx = a.x + (b.x - a.x) * t;
            const sy = a.y + (b.y - a.y) * t;
            const lineOp = (1 - t) * 0.75;
            const sparkR = 2.2 + (1 - t) * 1.6;
            const glowR = 4 + (1 - Math.abs(0.5 - t) * 2) * 4;
            return (
              <g key={fi}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={color}
                  strokeWidth={1.4}
                  opacity={lineOp}
                />
                <circle
                  cx={sx} cy={sy} r={glowR}
                  fill={color}
                  opacity={0.38 * (1 - Math.abs(0.5 - t) * 2)}
                  filter="blur(3px)"
                />
                <circle cx={sx} cy={sy} r={sparkR} fill="#ffffff" />
              </g>
            );
          })}
        </g>

        {/* Motes — trademark glyph depth-sorted, breath-coupled,
            pulse-boosted (countdown, phase ring, ignition, collapse) */}
        <g>
          {drawOrder.map((p) => {
            // Firing arrival boost (spark hitting the destination)
            let hitBoost = 0;
            for (const f of firingsRef.current) {
              if (f.to !== p.i) continue;
              const t = (now - f.startMs) / f.duration;
              if (t < 0 || t > 1) continue;
              hitBoost = Math.max(hitBoost, Math.max(0, 1 - Math.abs(t - 0.95) * 12));
            }
            const pulseBoost = getPulseBoost(p.i);
            const totalBoost = Math.max(hitBoost, pulseBoost);

            // Base radius + breath coupling + boost
            const breath = 1 + breathK;
            const r = cfg.moteBase * p.scale * breath * (1 + totalBoost * 0.8);
            const alpha = Math.min(1, p.alpha * breath + totalBoost * 0.6);
            const rayLen = r * 2.8;
            const strokeW = Math.max(0.5, r * 0.34);
            const rays = [-Math.PI / 6, (7 * Math.PI) / 6, Math.PI / 2];
            const coreFill = totalBoost > 0.35 ? "#ffffff" : color;
            const glow = totalBoost > 0.25
              ? `drop-shadow(0 0 ${6 + totalBoost * 8}px ${color})`
              : undefined;

            return (
              <g key={p.i} opacity={alpha}>
                {rays.map((ang, ri) => (
                  <line
                    key={ri}
                    x1={p.x} y1={p.y}
                    x2={p.x + Math.cos(ang) * rayLen}
                    y2={p.y + Math.sin(ang) * rayLen}
                    stroke={color}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    opacity={ri === 0 ? 0.95 : ri === 1 ? 0.55 : 0.78}
                  />
                ))}
                <circle
                  cx={p.x} cy={p.y} r={r}
                  fill={coreFill}
                  style={glow ? { filter: glow } : undefined}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
}
