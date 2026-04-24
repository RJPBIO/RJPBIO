"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   NeuralCore3D — núcleo sensorial del orb de ignición

   La esfera ya no es una piedra — es una cámara translúcida donde
   la lattice del trademark (Motes de 3 rayos asimétricos) vive en
   3D real, respira, gira en parallax asíncrono, y dispara sinapsis
   como una red neuronal activa.

   Arquitectura:
   ─────────────
   1. Glass sphere — backdrop-filter + highlight sutil, no sólido.
   2. Aurora nebula interior — radial tinted al protocolo, rota
      lento en sentido opuesto a la aura exterior → profundidad.
   3. Aura cónica rim — energía que corre por el aro exterior.
   4. Lattice SVG — 24 motes en fibonacci-sphere + edges KNN(k=3).
      Rotación computada por rAF (rotateY + rotateX asíncrono) y
      proyectada a 2D manualmente para:
        • ordenar draw order por z (front ocluye back)
        • escalar + opacity por depth (front brillante, back tenue)
        • dibujar edges reales entre nodos proyectados
   5. Sistema de firing events — cada 1.2-2.4s un nodo dispara,
      la luz viaja por una edge en ~500ms hasta el vecino, el
      destino parpadea. Tasa de firing aumenta en `running`.
   6. Cada mote es el trademark exacto: 3 rayos en -30°/210°/90°,
      core circle, tamaño y alpha derivados de z.
   7. Vignette interior: el centro se atenúa para que el countdown
      lea limpio sobre el enjambre.
   8. Reduced motion: congela rotación + firing, mantiene lattice
      estática visible.
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

function rotateXY(p, cy, sy, cx, sx) {
  // Y-axis first, then X-axis
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const y2 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;
  return { x: x1, y: y2, z: z2 };
}

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
}) {
  const nodes = useMemo(() => fibSphere(N_NODES), []);
  const edges = useMemo(() => buildEdges(nodes, K_NEIGHBORS), [nodes]);

  // Frame state — drives rotation + firing re-render at ~60fps
  const [frame, setFrame] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const firingsRef = useRef([]); // { edgeIdx, from, to, startMs, duration }
  const lastFireRef = useRef(0);

  // rAF loop — rotation, firing lifecycle
  useEffect(() => {
    if (reducedMotion) return;
    startRef.current = performance.now();
    const tick = (now) => {
      // Cull expired firings
      firingsRef.current = firingsRef.current.filter(
        (f) => now - f.startMs < f.duration
      );

      // Schedule new firings
      const fireInterval = state === "running" ? 900 : state === "paused" ? 99999 : 1600;
      const jitter = state === "running" ? 600 : 1200;
      if (now - lastFireRef.current > fireInterval + Math.random() * jitter) {
        lastFireRef.current = now;
        if (edges.length > 0) {
          const edgeIdx = Math.floor(Math.random() * edges.length);
          const e = edges[edgeIdx];
          const fromFirst = Math.random() < 0.5;
          firingsRef.current.push({
            edgeIdx,
            from: fromFirst ? e.a : e.b,
            to: fromFirst ? e.b : e.a,
            startMs: now,
            duration: state === "running" ? 520 : 680,
          });
        }
      }

      setFrame((f) => (f + 1) % 1_000_000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion, state, edges]);

  // Compute current rotation (deterministic from elapsed time)
  const now = performance.now();
  const elapsed = reducedMotion ? 0 : (now - startRef.current) / 1000;
  const ySpeed = state === "idle" ? 1 / 28 : state === "running" ? 1 / 22 : 1 / 40;
  const rotY = (elapsed * 360 * ySpeed) % 360;
  const rotX = Math.sin((elapsed * 2 * Math.PI) / 36) * 10;

  // Precompute trig
  const cy = Math.cos((rotY * Math.PI) / 180);
  const sy = Math.sin((rotY * Math.PI) / 180);
  const cx = Math.cos((rotX * Math.PI) / 180);
  const sx = Math.sin((rotX * Math.PI) / 180);

  const R = size * 0.36;
  const center = size / 2;

  // Project all nodes
  const projected = nodes.map((n, i) => {
    const r = rotateXY(n, cy, sy, cx, sx);
    const depth = (r.z + 1) / 2; // 0 (back) to 1 (front)
    return {
      i,
      x: center + r.x * R,
      y: center + r.y * R,
      z: r.z,
      depth,
      scale: 0.72 + depth * 0.56, // back 0.72, front 1.28
      alpha: 0.28 + depth * 0.72, // back 0.28, front 1.0
    };
  });

  // Draw order: back to front
  const drawOrder = [...projected].sort((a, b) => a.z - b.z);

  const active = state === "running" || state === "paused";
  const paused = state === "paused";
  void frame; // force re-read each tick

  return (
    <>
      {/* ─── 1. Glass sphere ─────────────────────────────────────── */}
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
            `radial-gradient(circle at 50% 22%, rgba(255,255,255,0.10) 0%, rgba(10,19,14,0.12) 40%, rgba(6,8,16,0.28) 82%, rgba(4,6,16,0.40) 100%)`,
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

      {/* ─── 2. Aurora nebula interior ───────────────────────────
          Radial tinted al protocolo, rota lento opuesto a la aura
          exterior. Sella la sensación de profundidad dentro del
          cristal: no es un fondo plano, es volumen. */}
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
              `radial-gradient(ellipse 60% 50% at 35% 40%, ${color}26 0%, ${color}10 45%, transparent 75%),` +
              `radial-gradient(ellipse 45% 55% at 70% 65%, ${color}1a 0%, transparent 70%)`,
            filter: "blur(6px)",
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: paused ? 0.35 : 0.9,
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

      {/* ─── 4. SVG lattice overlay — edges + motes + firings ───── */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          // Vignette so the countdown reads clean over the swarm
          maskImage:
            "radial-gradient(circle, transparent 0%, transparent 26%, rgba(0,0,0,0.5) 36%, black 52%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 0%, transparent 26%, rgba(0,0,0,0.5) 36%, black 52%, black 100%)",
          opacity: paused ? 0.55 : 1,
          transition: "opacity .4s ease",
        }}
      >
        {/* Edges — dashed, depth-faded */}
        <g>
          {edges.map((e, ei) => {
            const a = projected[e.a];
            const b = projected[e.b];
            const avgDepth = (a.depth + b.depth) / 2;
            const op = 0.08 + avgDepth * 0.22;
            return (
              <line
                key={ei}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
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
            const t = Math.min(1, (now - f.startMs) / f.duration);
            const a = projected[f.from];
            const b = projected[f.to];
            const sx = a.x + (b.x - a.x) * t;
            const sy = a.y + (b.y - a.y) * t;
            const lineOp = (1 - t) * 0.75;
            const sparkR = 2 + (1 - t) * 1.5;
            const glowR = 4 + (1 - Math.abs(0.5 - t) * 2) * 4;
            return (
              <g key={fi}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={color}
                  strokeWidth={1.4}
                  opacity={lineOp}
                />
                <circle
                  cx={sx}
                  cy={sy}
                  r={glowR}
                  fill={color}
                  opacity={0.35 * (1 - Math.abs(0.5 - t) * 2)}
                  filter="blur(3px)"
                />
                <circle cx={sx} cy={sy} r={sparkR} fill="#ffffff" />
              </g>
            );
          })}
        </g>

        {/* Motes — trademark glyph (3 rays asimétricos), depth-sorted */}
        <g>
          {drawOrder.map((p) => {
            // Target node is currently being hit? Boost temporarily.
            const hitBoost = firingsRef.current.reduce((acc, f) => {
              if (f.to !== p.i) return acc;
              const t = Math.min(1, (now - f.startMs) / f.duration);
              return Math.max(acc, Math.max(0, 1 - Math.abs(t - 0.95) * 12));
            }, 0);
            const r = 2.2 * p.scale * (1 + hitBoost * 0.7);
            const alpha = Math.min(1, p.alpha + hitBoost * 0.5);
            const rayLen = r * 2.8;
            const strokeW = Math.max(0.5, r * 0.34);
            // Trademark angles: -30°, 210°, 90°
            const rays = [-Math.PI / 6, (7 * Math.PI) / 6, Math.PI / 2];
            const coreFill = hitBoost > 0.3 ? "#ffffff" : color;
            return (
              <g key={p.i} opacity={alpha}>
                {rays.map((ang, ri) => (
                  <line
                    key={ri}
                    x1={p.x}
                    y1={p.y}
                    x2={p.x + Math.cos(ang) * rayLen}
                    y2={p.y + Math.sin(ang) * rayLen}
                    stroke={color}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    opacity={ri === 0 ? 0.95 : ri === 1 ? 0.55 : 0.78}
                  />
                ))}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={coreFill}
                  style={{
                    filter: hitBoost > 0.3
                      ? `drop-shadow(0 0 ${6 + hitBoost * 6}px ${color})`
                      : undefined,
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
}
