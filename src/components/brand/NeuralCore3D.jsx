"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   NeuralCore3D — núcleo sensorial del orb de ignición

   EL momento wow del sistema. Cámara cristalina translúcida donde
   la lattice del trademark vive en 3D, respira con el usuario, se
   comporta como red neuronal sintonizada al protocolo en curso, y
   entrega feedback del estado de coherencia en tiempo real.

   Capas:
     1. Glass sphere (specular drift)
     2. Coherence halo (outer, breath-rewarding aura)
     3. Aurora nebula interior
     4. Aura cónica exterior
     5. SVG lattice 3D: edges + firings + motes trademark
     6. Anchor mote (solo durante VACÍO): blanco al centro

   Comportamientos:
     • Personalidad por intent (calma/enfoque/reset/energia)
     • Ignition wave · phase ring wave · resonance collapse
     • Cascadas sinápticas (probabilidad por intent)
     • Breath coupling individual por mote
     • Breath-phase visual: INHALA expande, SOSTÉN freeze, EXHALA
       atenúa, VACÍO stillness + anchor mote
     • Coherence biofeedback (grows con progreso, penaliza pausas)
       → halo exterior + flecks dorados en 4 motes al coherence>0.7
     • Crystallization: 16→24 motes van emergiendo con progreso
     • Countdown micro-pulse (tick por segundo)
     • Últimos 20% intensifican firing rate
     • Ember mode: tras done + 1.4s, firings esporádicos, 30s fade
     • Rotación INTEGRADA (no elapsed*speed) para que los cambios de
       velocidad por fase respiratoria nunca causen jumps visibles.
     • reducedMotion: proyección estática, sin firings

   Contratos de props:
     state: "idle" | "running" | "paused" | "done" | "ember"
     breathPhase: "INHALA" | "SOSTÉN"/"SOSTEN" | "EXHALA" | "VACÍO"/"VACIO" | ""
     intent: "calma" | "enfoque" | "reset" | "energia"
   ═══════════════════════════════════════════════════════════════ */

// ─── Geometry ─────────────────────────────────────────────────────
// Atractores fijos para clustering orgánico de la lattice. Coordenadas
// elegidas para sentir "regiones cerebrales" sin alinearse con ejes
// cardinales (anti-mecánico). Re-normalización a esfera unitaria
// preserva la integridad del wireframe — solo cambia la densidad local.
const LATTICE_ATTRACTORS = [
  { x: 0.62, y: 0.55, z: 0.42 },
  { x: -0.58, y: -0.18, z: 0.55 },
  { x: 0.18, y: -0.62, z: -0.48 },
  { x: -0.42, y: 0.48, z: -0.55 },
];

function fibSphere(n) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    let p = { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };

    // Pull suave hacia el atractor más cercano. Clustering orgánico
    // sin romper la cobertura de la esfera. Pull-strength escala con
    // 1/distance^2, así regiones lejanas se mueven poco y cercanas
    // se densifican notoriamente. Cap pull a 0.22 para evitar overlap
    // entre nodos en el cluster core.
    let bestD = Infinity;
    let best = null;
    for (const a of LATTICE_ATTRACTORS) {
      const dx = p.x - a.x, dy = p.y - a.y, dz = p.z - a.z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) { bestD = d; best = a; }
    }
    if (best) {
      const pull = Math.min(0.22, 0.16 / Math.max(0.4, bestD));
      p.x += (best.x - p.x) * pull;
      p.y += (best.y - p.y) * pull;
      p.z += (best.z - p.z) * pull;
      // Re-normalizar a esfera unitaria (los atractores no están en r=1)
      const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      if (len > 0) { p.x /= len; p.y /= len; p.z /= len; }
    }
    pts.push(p);
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

function toHex2(a) {
  const v = Math.max(0, Math.min(255, Math.round(a * 255)));
  return v.toString(16).padStart(2, "0");
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

// ─── Performance tier detection ─────────────────────────────────
// Detecta capacidad del dispositivo en mount (una vez). La degradación
// se aplica quirúrgicamente sobre 3 hot paths identificados: backdrop-
// filter (caro en GPU ARM), drop-shadow animado en firing glow, y
// conteo de nodos (React reconciliation por frame).
// Fallback seguro en SSR (no navigator) → "high".
function detectPerfTier() {
  if (typeof navigator === "undefined") return "high";
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory; // undefined en iOS/Safari
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/.test(ua);
  const isIOS = /iPhone|iPad|iPod/.test(ua);

  // Desktop: asume high. El fallback cubre casos raros (VMs).
  if (!isAndroid && !isIOS) {
    if (cores <= 2) return "mid";
    return "high";
  }

  // iOS: GPU Metal, backdrop-filter hardware-acelerado. Mod iPhones
  // sostienen 60fps sin problema. Sólo degradar en iPhone 7 o anterior.
  if (isIOS) {
    if (cores <= 2) return "low";
    return "high";
  }

  // Android: la zona gris. deviceMemory es la señal más confiable
  // cuando existe. hardwareConcurrency engaña (MediaTek 8-core puede
  // ser más lento que un Snapdragon 4-core).
  if (mem !== undefined) {
    if (mem <= 2) return "low";
    if (mem <= 3) return "mid";
    if (mem <= 4) return "mid";
    return "high";
  }
  // Fallback por cores si mem no reportado
  if (cores <= 4) return "low";
  if (cores <= 6) return "mid";
  return "high";
}

const PERF = {
  high: {
    nodes: 24, baseVisible: 16,
    blurPx: 16, saturatePct: 170,
    sparkGlow: true, boxShadowLayers: 5,
    conicAura: true, nebula: true,
    maxFirings: 99, targetFrameMs: 0, // sin throttle
  },
  mid: {
    nodes: 20, baseVisible: 13,
    blurPx: 10, saturatePct: 140,
    sparkGlow: true, boxShadowLayers: 4,
    conicAura: true, nebula: true,
    maxFirings: 6, targetFrameMs: 0,
  },
  low: {
    nodes: 16, baseVisible: 16, // crystallization off: siempre todos
    blurPx: 0, saturatePct: 100, // sin backdrop-filter
    sparkGlow: false, boxShadowLayers: 3,
    conicAura: false, nebula: false, // reemplazados por rgba sólido
    maxFirings: 3, targetFrameMs: 33, // throttle a ~30fps
  },
};

// Mapeo breath-phase label → modifiers. Las variantes sin acento
// son defensivas por si el servidor envía sin diacríticos.
function resolveBreathPhase(label) {
  if (!label) return null;
  const p = String(label).toUpperCase();
  if (p.startsWith("INHAL")) return "IN";
  if (p.startsWith("SOST")) return "HOLD";
  if (p.startsWith("EXHAL")) return "OUT";
  if (p.startsWith("VAC") || p.startsWith("EMPT")) return "EMPTY";
  return null;
}

// Ember timings (ms) desde state="done":
// — antes de EMBER_FADE_IN_MS: se deja la colapso + tail respirar
// — tras EMBER_FADE_OUT_MS: se considera terminado (parent debe volver a idle)
// Valores documentados aquí por si el parent quiere coincidir con sus timers.
export const EMBER_FADE_IN_MS = 1400;
export const EMBER_FADE_OUT_MS = 30000;

// ─── Component ────────────────────────────────────────────────────
const K_NEIGHBORS = 3;

export default function NeuralCore3D({
  size = 260,
  color = "#22D3EE",
  state = "idle",
  breathScale = 1,
  isBreathing = false,
  reducedMotion = false,
  intent = "enfoque",
  phaseIndex = 0,
  progress = 0,
  secondTick = 0,
  breathPhase = "",
  // Permite forzar un tier específico (debug, o override explícito).
  // Si se omite, auto-detectado en mount por detectPerfTier().
  perfTierOverride = null,
  // Callback que el parent conecta a audio/haptics para sincronía
  // sensorial. Se invoca UNA vez por firing, cuando el spark alcanza
  // su mote destino (t≈0.95). El argumento:
  //   { pitch }  — frecuencia sugerida (Hz) derivada de la y del
  //                nodo destino; el parent puede ignorarla.
  // Si es null o no se pasa, no hay audio/haptic. El parent decide
  // cuándo está activo (p.ej., sólo durante ts==="running").
  onSparkHit = null,
}) {
  const cfg = INTENT[intent] || DEFAULT_INTENT;
  const bp = resolveBreathPhase(breathPhase);

  // Perf tier estable para el ciclo de vida del componente. Si el
  // usuario cambia de dispositivo (poco probable) tendría que recargar.
  const perf = useMemo(() => {
    const tier = perfTierOverride || detectPerfTier();
    return PERF[tier] || PERF.high;
  }, [perfTierOverride]);

  const N_NODES = perf.nodes;
  // 4 nodos dorados distribuidos homogéneamente sobre la lattice
  const GOLDEN_NODES = useMemo(() => [
    Math.floor(N_NODES * 0.08),
    Math.floor(N_NODES * 0.35),
    Math.floor(N_NODES * 0.60),
    Math.floor(N_NODES * 0.85),
  ], [N_NODES]);

  const nodes = useMemo(() => fibSphere(N_NODES), [N_NODES]);
  const edges = useMemo(() => buildEdges(nodes, K_NEIGHBORS), [nodes]);
  const neighbors = useMemo(() => buildNeighbors(N_NODES, edges), [edges, N_NODES]);

  // Emergence order (crystallization): del ecuador hacia los polos
  const nodeEmergeIndex = useMemo(() => {
    const byY = nodes
      .map((n, i) => ({ i, absY: Math.abs(n.y) }))
      .sort((a, b) => a.absY - b.absY);
    const idx = new Array(N_NODES);
    byY.forEach((item, pos) => { idx[item.i] = pos; });
    return idx;
  }, [nodes]);

  // ─── rAF state (rotation integrated, not time×speed) ───────────
  const [, setFrame] = useState(0);
  const rafRef = useRef(0);
  const firingsRef = useRef([]);
  const pulsesRef = useRef([]);
  const lastFireRef = useRef(0);
  const lastTickRef = useRef(0);
  const pauseCountRef = useRef(0);
  const prevStateForCohRef = useRef(state);

  // Integrated angles + eased multipliers
  const rotYRef = useRef(0);
  const rotXPhaseRef = useRef(0);   // phase accumulator for X oscillation
  const rotMultRef = useRef(1);     // eased per-frame to target
  const brightMultRef = useRef(1);
  const auraMultRef = useRef(1);

  // Done timestamp (for ember internal tail timing reference)
  const doneAtRef = useRef(null);

  // Dynamic props mirror en refs para que el rAF loop no tenga que
  // reiniciarse cada vez que cambian (progress 1×/s, bp cada 2-8s,
  // onSparkHit en cada ts transition). El tick lee siempre el valor
  // más reciente sin reestructurar el loop.
  const stateRef = useRef(state);
  const progressRef = useRef(progress);
  const bpRef = useRef(bp);
  const isBreathingRef = useRef(isBreathing);
  const onSparkHitRef = useRef(onSparkHit);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { onSparkHitRef.current = onSparkHit; }, [onSparkHit]);
  useEffect(() => { isBreathingRef.current = isBreathing; }, [isBreathing]);

  // Phase-change pulse — cada vez que bp transiciona, empujamos un
  // pulso global ("nodes: all") al pulsesRef para que toda la lattice
  // brille brevemente. Marca rítmica que el usuario percibe como
  // "el orb sintió la fase". Sin esto, los cambios de fase pasaban
  // sin punctuación visual — solo el label cambiaba arriba.
  // Solo durante isBreathing real para no spamear pulsos en idle.
  const prevBpRef = useRef(bp);
  useEffect(() => {
    const prev = prevBpRef.current;
    prevBpRef.current = bp;
    bpRef.current = bp;
    if (!isBreathing || !bp || bp === prev) return;
    // Intensity por fase: IN/HOLD reciben pulso fuerte (energía sube),
    // OUT/EMPTY pulso suave (energía baja). Duración consistente.
    const intensity = bp === "IN" ? 0.85 : bp === "HOLD" ? 0.7 : bp === "OUT" ? 0.45 : 0.32;
    pulsesRef.current.push({
      startMs: performance.now(),
      duration: 620,
      nodes: "all",
      intensity,
    });
  }, [bp, isBreathing]);

  // Coherence penalty tracking + ember anchor timestamp
  useEffect(() => {
    const prev = prevStateForCohRef.current;
    prevStateForCohRef.current = state;
    if (prev === "running" && state === "paused") {
      pauseCountRef.current += 1;
    }
    if (state === "idle" || (prev === "idle" && state === "running")) {
      pauseCountRef.current = 0;
    }
    if (prev !== "done" && state === "done") {
      doneAtRef.current = performance.now();
    }
    // Ember entry — si el componente monta directo en ember (parent ya
    // transicionó done→idle antes de que este core se montara), ancla
    // doneAtRef a "ahora" para que el fade-out de 30s funcione desde
    // la entrada visual.
    if (state === "ember" && doneAtRef.current === null) {
      doneAtRef.current = performance.now();
    }
    if (state === "running") {
      doneAtRef.current = null;
    }
  }, [state]);

  // ─── rAF loop ──────────────────────────────────────────────────
  const lastRafRenderRef = useRef(0);
  useEffect(() => {
    if (reducedMotion) return undefined;
    let alive = true;
    lastTickRef.current = 0;
    lastRafRenderRef.current = 0;

    const tick = (now) => {
      if (!alive) return;
      // Throttle: en low tier saltamos frames para limitar a ~30fps.
      // El dt se sigue acumulando correctamente porque lastTickRef
      // se actualiza dentro del block de render (abajo), no aquí.
      if (perf.targetFrameMs > 0 && now - lastRafRenderRef.current < perf.targetFrameMs) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastRafRenderRef.current = now;
      const prevLast = lastTickRef.current || now;
      lastTickRef.current = now;
      const dt = Math.min(0.1, (now - prevLast) / 1000); // cap tras pausas largas

      // Lee valores volátiles desde refs (actualizados por useEffects
      // dedicados). Evita que el rAF se reinicie cada vez que cambian.
      const curState = stateRef.current;
      const curProgress = progressRef.current;
      const curBp = bpRef.current;
      const curIsBreathing = isBreathingRef.current;

      // Cull + cascadas + detección de arrival (audio/haptic sync)
      const nextFirings = [];
      firingsRef.current.forEach((f) => {
        // Detección edge: primera vez que t cruza 0.93 disparamos el
        // callback onSparkHit. Usamos flag para que no se repita por
        // frame. La frecuencia se deriva de la y del mote destino
        // (arriba→agudo, abajo→grave) mapeada exponencialmente.
        if (!f.hit && now >= f.startMs) {
          const t = (now - f.startMs) / f.duration;
          if (t >= 0.93 && t <= 1.05) {
            f.hit = true;
            const cb = onSparkHitRef.current;
            if (typeof cb === "function") {
              const ny = nodes[f.to]?.y || 0;
              const pitch = Math.round(640 * Math.pow(1.4, ny));
              try { cb({ pitch, nodeIndex: f.to }); } catch (e) {}
            }
          }
        }

        const end = f.startMs + f.duration;
        if (now >= end) {
          if (
            curState === "running" &&
            f.gen < 2 &&
            Math.random() < cfg.cascadeP
          ) {
            const targets = neighbors[f.to].filter((n) => n !== f.from);
            if (targets.length) {
              const nxt = targets[Math.floor(Math.random() * targets.length)];
              nextFirings.push({
                startMs: now + 40,
                duration: cfg.sparkMs,
                from: f.to,
                to: nxt,
                gen: f.gen + 1,
              });
            }
          }
        } else {
          nextFirings.push(f);
        }
      });
      firingsRef.current = nextFirings;

      // Cull pulses
      pulsesRef.current = pulsesRef.current.filter(
        (p) => now - p.startMs < p.duration
      );

      // Targets para easing por fase respiratoria + ember.
      // Amplitudes amplificadas (antes ±10-22%, ahora ±28-50%) para que
      // el orb visiblemente respire — no como sutileza imperceptible.
      // El usuario debe leer la fase respiratoria del orb aunque cierre
      // a medias los ojos. Mismo principio que la flor de Apple Breathe:
      // cue inequívoco, no decoración.
      let rotTarget = 1;
      let brightTarget = 1;
      let auraTarget = 1;
      if (curBp && curIsBreathing) {
        if (curBp === "IN") { rotTarget = 1; brightTarget = 1.32; auraTarget = 1.22; }
        else if (curBp === "HOLD") { rotTarget = 0.15; brightTarget = 1.18; auraTarget = 1.08; }
        else if (curBp === "OUT") { rotTarget = 1; brightTarget = 0.72; auraTarget = 0.62; }
        else if (curBp === "EMPTY") { rotTarget = 0.25; brightTarget = 0.5; auraTarget = 0.38; }
      }
      const ease = 1 - Math.pow(0.35, dt * 5);
      rotMultRef.current += (rotTarget - rotMultRef.current) * ease;
      brightMultRef.current += (brightTarget - brightMultRef.current) * ease;
      auraMultRef.current += (auraTarget - auraMultRef.current) * ease;

      // Base rotation speed por state
      let ySpeed;
      if (curState === "running") ySpeed = 1 / cfg.rotRun;
      else if (curState === "idle") ySpeed = 1 / cfg.rotIdle;
      else if (curState === "paused") ySpeed = 1 / (cfg.rotIdle * 1.8);
      else if (curState === "ember") ySpeed = 1 / (cfg.rotIdle * 3.5);
      else ySpeed = 1 / cfg.rotIdle;
      if (cfg.chaos > 0) {
        ySpeed *= 1 + Math.sin(now / 200) * cfg.chaos * 0.35;
      }
      ySpeed *= rotMultRef.current;

      rotYRef.current = (rotYRef.current + dt * 360 * ySpeed) % 360;
      rotXPhaseRef.current += dt * (2 * Math.PI / 36);

      // Spawn organic firings (respeta el cap concurrente del perf tier)
      if (curState === "running" || curState === "idle" || curState === "ember") {
        const emberFactor = curState === "ember" ? 15 : 1;
        const intensityBoost = (curState === "running" && curProgress > 0.8)
          ? 1 - (curProgress - 0.8) * 1.5
          : 1;
        const baseMs = cfg.fireBase * (curState === "idle" ? 1.6 : intensityBoost) * emberFactor;
        const jit = cfg.fireJit * emberFactor;
        const chaosFire = curState === "running" && cfg.chaos > 0 && Math.random() < cfg.chaos * 0.02;
        const canSpawn = firingsRef.current.length < perf.maxFirings;
        if (canSpawn && (chaosFire || now - lastFireRef.current > baseMs + Math.random() * jit)) {
          lastFireRef.current = now;
          if (edges.length > 0) {
            const e = edges[Math.floor(Math.random() * edges.length)];
            const fromFirst = Math.random() < 0.5;
            firingsRef.current.push({
              startMs: now,
              duration: cfg.sparkMs * (curState === "ember" ? 1.4 : 1),
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
    // Deps minimales: sólo cambios estructurales (tier, intent, grafo,
    // reducedMotion) reinician el loop. Props volátiles (state, progress,
    // bp, isBreathing, onSparkHit) se leen vía refs dentro del tick.
  }, [reducedMotion, cfg, edges, neighbors, nodes, perf]);

  // ─── Ignition wave & resonance collapse ────────────────────────
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (reducedMotion) return;
    const now = performance.now();

    if (prev === "idle" && state === "running") {
      const seed = Math.floor(Math.random() * N_NODES);
      const lv1 = neighbors[seed].slice(0, 3);
      lv1.forEach((n, i) => {
        firingsRef.current.push({
          startMs: now + i * 60,
          duration: cfg.sparkMs * 0.85,
          from: seed, to: n, gen: 0,
        });
      });
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
      pulsesRef.current.push({
        startMs: now, duration: 700,
        nodes: [seed, ...lv1], intensity: 0.9,
      });
    } else if (prev !== "done" && state === "done") {
      // Resonance collapse — 24 motes bloom + 8 concentric-staggered firings
      pulsesRef.current.push({
        startMs: now, duration: 1400,
        nodes: "all", intensity: 1.0,
      });
      for (let i = 0; i < 8; i++) {
        const e = edges[Math.floor(Math.random() * edges.length)];
        firingsRef.current.push({
          startMs: now + i * 45, duration: cfg.sparkMs,
          from: e.a, to: e.b, gen: 0,
        });
      }
    }
  }, [state, reducedMotion, neighbors, edges, cfg]);

  // ─── Phase ring wave ────────────────────────────────────────────
  const prevPiRef = useRef(phaseIndex);
  useEffect(() => {
    const prev = prevPiRef.current;
    prevPiRef.current = phaseIndex;
    if (reducedMotion) return;
    if (prev === phaseIndex) return;
    if (state !== "running") return;

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
    pulsesRef.current.push({
      startMs: now, duration: 900,
      nodes: ring.map((m) => m.i), intensity: 0.55,
    });
  }, [phaseIndex, state, reducedMotion, nodes, cfg]);

  // ─── Countdown micro-pulse ─────────────────────────────────────
  const prevSecRef = useRef(secondTick);
  useEffect(() => {
    const prev = prevSecRef.current;
    prevSecRef.current = secondTick;
    if (reducedMotion) return;
    if (state !== "running") return;
    if (prev === secondTick) return;
    const chosen = [];
    for (let i = 0; i < 3; i++) chosen.push(Math.floor(Math.random() * N_NODES));
    pulsesRef.current.push({
      startMs: performance.now(), duration: 280,
      nodes: chosen, intensity: 0.45,
    });
  }, [secondTick, state, reducedMotion]);

  // ─── Valores derivados para el render ─────────────────────────
  const now = performance.now();

  // Coherence: grows con progress, penalized por pauses
  const coherenceRaw = 0.4 + progress * 0.6 - pauseCountRef.current * 0.15;
  const runningCoh = Math.max(0.2, Math.min(1, coherenceRaw));
  let coherence;
  if (state === "ember") coherence = Math.max(runningCoh, 0.82);
  else if (state === "idle") coherence = 0.5;
  else coherence = runningCoh;

  // Crystallization: ramp lineal de motes visibles durante running/done/ember
  const emergeFraction = (state === "running" || state === "done" || state === "ember")
    ? perf.baseVisible + progress * (N_NODES - perf.baseVisible)
    : N_NODES;
  const emergeAlpha = (i) => {
    const pos = nodeEmergeIndex[i];
    if (pos < perf.baseVisible) return 1;
    const delta = emergeFraction - pos;
    if (delta <= 0) return 0;
    if (delta >= 1) return 1;
    return delta;
  };

  // Rotación integrada (no elapsed*speed, evita saltos)
  const rotY = reducedMotion ? 0 : rotYRef.current;
  const rotXAmp = state === "ember" ? 4 : 10;
  const rotX = reducedMotion ? 0 : Math.sin(rotXPhaseRef.current) * rotXAmp * rotMultRef.current;

  const cosY = Math.cos((rotY * Math.PI) / 180);
  const sinY = Math.sin((rotY * Math.PI) / 180);
  const cosX = Math.cos((rotX * Math.PI) / 180);
  const sinX = Math.sin((rotX * Math.PI) / 180);

  const R = size * 0.36;
  const center = size / 2;
  // 0.7 (antes 0.45): los motes individuales respiran más visiblemente
  // con cada ciclo. La identidad visual ahora es "lattice viva", no
  // "puntitos decorativos".
  const breathK = isBreathing ? (breathScale - 1) * 0.7 : 0;

  const projected = nodes.map((n, i) => {
    const r = rotateXY(n, cosY, sinY, cosX, sinX);
    const depth = (r.z + 1) / 2;
    return {
      i,
      x: center + r.x * R, y: center + r.y * R,
      z: r.z, depth,
      scale: 0.72 + depth * 0.56,
      alpha: 0.28 + depth * 0.72,
    };
  });
  const drawOrder = [...projected].sort((a, b) => a.z - b.z);

  const active = state === "running" || state === "paused";
  const paused = state === "paused";
  const ember = state === "ember";

  // Specular drift del highlight — período ~38s/44s (premium, sutil)
  const elapsedForDrift = now / 1000;
  const hx = 50 + Math.sin(elapsedForDrift / 6) * 4;
  const hy = 22 + Math.cos(elapsedForDrift / 7) * 3;

  const getPulseBoost = (idx) => {
    let boost = 0;
    for (const p of pulsesRef.current) {
      if (p.nodes !== "all" && !p.nodes.includes(idx)) continue;
      const t = (now - p.startMs) / p.duration;
      if (t < 0 || t > 1) continue;
      const env = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      boost = Math.max(boost, env * p.intensity);
    }
    return boost;
  };

  // Collapse progress — 0 al arrancar "done", 1 al completar 1.6s.
  // Gate para todas las capas cinemáticas del cierre.
  const COLLAPSE_MS = 1600;
  const collapseT = (state === "done" && doneAtRef.current)
    ? Math.min(1, (now - doneAtRef.current) / COLLAPSE_MS)
    : null;
  const isCollapsing = collapseT !== null && collapseT < 1;

  // Envelope del supernova central (implosion→explosion→fade):
  // t<0.08 ramp fast to 1, t<0.35 sustain, then exponential fade.
  const supernovaEnv = (() => {
    if (collapseT === null) return 0;
    const t = collapseT;
    if (t < 0.08) return t / 0.08;
    if (t < 0.35) return 1 - (t - 0.08) * 0.3;   // cae suave durante sustain
    return Math.max(0, 0.92 - (t - 0.35) * 1.4); // fade final
  })();

  // Ember opacity multiplier (fades in post 1.4s and fades out at 30s)
  const emberOp = (() => {
    if (!ember) return 1;
    if (!doneAtRef.current) return 0.6;
    const dt = now - doneAtRef.current;
    if (dt < EMBER_FADE_IN_MS) return 0.3 + (dt / EMBER_FADE_IN_MS) * 0.3;
    const fadeOutStart = EMBER_FADE_OUT_MS - 4000;
    if (dt > fadeOutStart) {
      const fadeT = (dt - fadeOutStart) / 4000;
      return Math.max(0, 0.6 * (1 - fadeT));
    }
    return 0.6;
  })();

  // Aura + nebula + sphere global opacity multipliers
  const baseSphereOp = paused ? 0.78 : ember ? 0.72 * emberOp : 1;
  const baseNebulaOp = paused ? 0.35 : ember ? 0.28 * emberOp : cfg.nebulaOp;
  const baseAuraOp = paused ? 0.3 : ember ? 0.22 * emberOp : 0.9;

  // Coherence halo intensity
  const haloIntensity = Math.max(0, (coherence - 0.35) / 0.65); // 0–1 above 0.35

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
                : ember
                  ? { scale: [1, 1.005, 1] }
                  : active
                    ? { scale: [1, 1.008, 1] }
                    : { scale: 0.97 }
        }
        transition={
          isBreathing && !reducedMotion
            ? { type: "spring", stiffness: 30, damping: 20, mass: 1.2 }
            : { duration: state === "idle" ? 5 : ember ? 8 : 3.5, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          // En low tier, backdrop-filter es el hot path que mata FPS en
          // GPU ARM. Sustituyo por un background más opaco que mantiene
          // la sensación de cristal sin el costo de composite blur.
          background: perf.blurPx === 0
            ? `radial-gradient(circle at ${hx}% ${hy}%, rgba(255,255,255,${0.14 * brightMultRef.current}) 0%, rgba(10,19,14,0.62) 40%, rgba(6,8,16,0.82) 82%, rgba(4,6,16,0.92) 100%)`
            : `radial-gradient(circle at ${hx}% ${hy}%, rgba(255,255,255,${0.11 * brightMultRef.current}) 0%, rgba(10,19,14,0.12) 40%, rgba(6,8,16,0.28) 82%, rgba(4,6,16,0.40) 100%)`,
          backdropFilter: perf.blurPx > 0 ? `blur(${perf.blurPx}px) saturate(${perf.saturatePct}%)` : "none",
          WebkitBackdropFilter: perf.blurPx > 0 ? `blur(${perf.blurPx}px) saturate(${perf.saturatePct}%)` : "none",
          border: `1px solid ${color}44`,
          boxShadow: perf.boxShadowLayers >= 5
            ? `0 32px 90px -22px ${color}55,` +
              `0 10px 30px -10px rgba(0,0,0,0.38),` +
              `inset 0 2px 0 0 rgba(255,255,255,${0.14 * brightMultRef.current}),` +
              `inset 0 -26px 56px -20px rgba(0,0,0,0.55),` +
              `inset 0 0 72px -12px ${color}26`
            : perf.boxShadowLayers >= 4
              ? `0 26px 70px -20px ${color}4d,` +
                `inset 0 2px 0 0 rgba(255,255,255,${0.12 * brightMultRef.current}),` +
                `inset 0 -24px 48px -18px rgba(0,0,0,0.5),` +
                `inset 0 0 60px -12px ${color}20`
              : `0 20px 56px -18px ${color}44,` +
                `inset 0 1px 0 0 rgba(255,255,255,0.10),` +
                `inset 0 -20px 40px -16px rgba(0,0,0,0.45)`,
          pointerEvents: "none",
          opacity: baseSphereOp,
          transition: "opacity .4s ease, border-color .6s ease, box-shadow .6s ease",
        }}
      />

      {/* ─── 1.5. Aurora central breath-coupled ──────────────────
          El centro del orb estaba muerto durante running (la mask de
          la lattice deja transparente el 0-26% para legibilidad del
          dígito, pero eso dejaba un vacío negro). Ahora una aurora
          tenue (radial gradient, blur 12px) vive detrás del dígito
          y respira: INHALA expande+brilla, EXHALA contrae+atenúa,
          VACÍO casi se apaga. Sin reducedMotion. Bajo el threshold
          de opacity para no competir con el "109" en peso visual. */}
      {!reducedMotion && (
        <motion.div
          aria-hidden
          animate={
            isBreathing && bp
              ? {
                  scale: bp === "IN" ? 1.28 : bp === "HOLD" ? 1.28 : bp === "OUT" ? 0.82 : 0.7,
                  opacity: bp === "IN" ? 0.42 : bp === "HOLD" ? 0.48 : bp === "OUT" ? 0.18 : 0.1,
                }
              : state === "idle"
                ? { scale: [1, 1.05, 1], opacity: [0.18, 0.28, 0.18] }
                : ember
                  ? { scale: 0.85, opacity: 0.12 * emberOp }
                  : paused
                    ? { scale: 0.92, opacity: 0.16 }
                    : { scale: 1, opacity: 0.22 }
          }
          transition={
            isBreathing && bp
              ? bp === "HOLD" || bp === "EMPTY"
                ? { duration: 0.45, ease: [0.25, 1, 0.4, 1] }
                : { type: "spring", stiffness: 26, damping: 22, mass: 1.2 }
              : { duration: state === "idle" ? 4.5 : 1.2, repeat: state === "idle" ? Infinity : 0, ease: "easeInOut" }
          }
          style={{
            position: "absolute",
            inset: "30%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}55 0%, ${color}28 40%, ${color}10 70%, transparent 100%)`,
            filter: "blur(12px)",
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ─── 2. Coherence halo exterior ─────────────────────────
          Crece suave con coherence. Feedback positivo: respiras bien,
          el halo se enciende. Se difumina con blur para que nunca
          compita con el aro ni con el texto central. */}
      {!reducedMotion && haloIntensity > 0.01 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            background:
              `radial-gradient(circle, transparent 54%, ${color}${toHex2(0.10 + haloIntensity * 0.30)} 60%, ${color}${toHex2(0.03 + haloIntensity * 0.12)} 66%, transparent 74%)`,
            filter: `blur(${4 + haloIntensity * 5}px)`,
            opacity: (ember ? emberOp : 1) * (0.5 + haloIntensity * 0.5),
            pointerEvents: "none",
            transition: "opacity .5s ease, filter .5s ease",
          }}
        />
      )}

      {/* ─── 2.5. Breath ring — cue inequívoco de fase respiratoria ──
          El equivalente brand-DNA de la "flor" de Apple Breathe: un
          anillo delgado teñido del color del protocolo que escala +
          modula opacidad explícitamente con la fase. INHALA expande,
          SOSTÉN se queda + glow congelado, EXHALA contrae, VACÍO
          quietud apagada. Spring transition para que la lectura sea
          orgánica, no robotizada. mixBlendMode: screen para sumar
          luz sin oscurecer las capas previas.
          Solo durante isBreathing real (running + fase con ciclo). */}
      {!reducedMotion && isBreathing && bp && (
        <motion.div
          aria-hidden
          animate={{
            scale: bp === "IN" ? 1.16 : bp === "HOLD" ? 1.16 : bp === "OUT" ? 0.9 : 0.9,
            opacity: bp === "IN" ? 0.78 : bp === "HOLD" ? 0.62 : bp === "OUT" ? 0.32 : 0.16,
          }}
          transition={
            bp === "HOLD" || bp === "EMPTY"
              ? { duration: 0.4, ease: [0.25, 1, 0.4, 1] }
              : { type: "spring", stiffness: 28, damping: 22, mass: 1.1 }
          }
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: `1.5px solid ${color}`,
            boxShadow: `0 0 20px ${color}66, inset 0 0 14px ${color}44`,
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ─── 3. Aurora nebula interior (omitted on low tier) ─── */}
      {!reducedMotion && perf.nebula && (
        <motion.div
          aria-hidden
          animate={{ rotate: -360 }}
          transition={{ duration: active ? 38 : ember ? 80 : 52, repeat: Infinity, ease: "linear" }}
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
            opacity: baseNebulaOp,
            transition: "opacity .4s ease",
          }}
        />
      )}

      {/* ─── 4. Aura cónica exterior (simplified on low tier) ─── */}
      {!reducedMotion && perf.conicAura && (
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: active ? 14 : ember ? 40 : 18, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "50%",
            background: `conic-gradient(from 0deg, transparent 0%, ${color}48 10%, transparent 24%, transparent 52%, ${color}30 68%, transparent 84%)`,
            maskImage: "radial-gradient(circle, transparent 57%, black 60%, black 62%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 57%, black 60%, black 62%, transparent 65%)",
            pointerEvents: "none",
            opacity: baseAuraOp * auraMultRef.current,
            transition: "opacity .4s ease",
          }}
        />
      )}
      {/* Fallback de aro para low tier: borde estático teñido sin
          conic-gradient ni rotación. Preserva la identidad visual
          (aro brillante) con costo cero. */}
      {!reducedMotion && !perf.conicAura && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "50%",
            border: `1px solid ${color}55`,
            boxShadow: `0 0 24px -4px ${color}44, inset 0 0 16px -6px ${color}33`,
            pointerEvents: "none",
            opacity: baseAuraOp * auraMultRef.current,
            transition: "opacity .4s ease",
          }}
        />
      )}

      {/* ─── 4.5. COLLAPSE shockwave rings (solo durante done) ───
          3 ondas concéntricas staggered que expanden más allá del
          sphere boundary (transform: scale 1 → 3.2x). Cada una
          recorre el color protocolo → gold → blanco → transparente.
          Este es el elemento que el compFlash previo NO lograba:
          una explosión *emergiendo del núcleo* y propagándose al
          mundo, no un parpadeo genérico. */}
      {isCollapsing && !reducedMotion && [0, 0.12, 0.26].map((delay, i) => {
        const rt = Math.max(0, (collapseT - delay) / (1 - delay));
        if (rt <= 0 || rt >= 1) return null;
        const scale = 1 + rt * 2.2;
        const ringOp = (1 - rt) * 0.85;
        // Color sweep: inicio color → gold mid → white late → transparent
        const stageColor = rt < 0.4 ? color : rt < 0.75 ? "#FBBF24" : "#FFFFFF";
        return (
          <div
            key={`sw-${i}`}
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `${2.5 + rt * 1.5}px solid ${stageColor}`,
              transform: `scale(${scale})`,
              opacity: ringOp,
              pointerEvents: "none",
              filter: `blur(${rt * 1.2}px)`,
              boxShadow: `0 0 ${20 + rt * 30}px ${stageColor}, inset 0 0 ${8 + rt * 18}px ${stageColor}`,
            }}
          />
        );
      })}

      {/* Supernova central — disco blanco que implosiona-explota al
          arrancar el collapse. Bloom breve que llena el sphere y se
          desvanece rápido. Aterriza en el punto temporal donde el
          compFlash previo hacía su white-wash global. */}
      {isCollapsing && !reducedMotion && supernovaEnv > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: `${16 - supernovaEnv * 16}%`,
            borderRadius: "50%",
            background:
              `radial-gradient(circle, rgba(255,255,255,${0.95 * supernovaEnv}) 0%, rgba(255,255,255,${0.6 * supernovaEnv}) 30%, ${color}${toHex2(0.35 * supernovaEnv)} 60%, transparent 85%)`,
            filter: `blur(${6 - supernovaEnv * 3}px)`,
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ─── 5. SVG lattice ──────────────────────────────────── */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          maskImage: "radial-gradient(circle, transparent 0%, transparent 20%, rgba(0,0,0,0.55) 30%, black 46%, black 100%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 0%, transparent 20%, rgba(0,0,0,0.55) 30%, black 46%, black 100%)",
          opacity: (paused ? 0.55 : 1) * (ember ? emberOp : 1),
          transition: "opacity .4s ease",
        }}
      >
        {/* Edges — depth-faded, respetan emerge alpha */}
        <g>
          {edges.map((e, ei) => {
            const a = projected[e.a];
            const b = projected[e.b];
            const eaA = emergeAlpha(e.a);
            const eaB = emergeAlpha(e.b);
            const eaMin = Math.min(eaA, eaB);
            if (eaMin <= 0) return null;
            const avgDepth = (a.depth + b.depth) / 2;
            const op = (0.08 + avgDepth * 0.22) * cfg.edgeOp * eaMin * brightMultRef.current;
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

        {/* Firings — sparks viajando */}
        <g>
          {firingsRef.current.map((f, fi) => {
            if (now < f.startMs) return null;
            // Silenciar firing si mote origen o destino aún no emerge
            if (emergeAlpha(f.from) < 0.5 || emergeAlpha(f.to) < 0.5) return null;
            const t = Math.min(1, (now - f.startMs) / f.duration);
            const a = projected[f.from];
            const b = projected[f.to];
            const sx = a.x + (b.x - a.x) * t;
            const sy = a.y + (b.y - a.y) * t;
            const lineOp = (1 - t) * 0.75 * brightMultRef.current;
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
                {perf.sparkGlow && (
                  <circle cx={sx} cy={sy} r={glowR} fill={color}
                    opacity={0.38 * (1 - Math.abs(0.5 - t) * 2)} filter="blur(3px)" />
                )}
                <circle cx={sx} cy={sy} r={sparkR} fill="#ffffff" />
              </g>
            );
          })}
        </g>

        {/* Motes — trademark glyph depth-sorted, breath-coupled,
            pulse-boosted, crystallization-aware, coherence-gold */}
        <g>
          {drawOrder.map((p) => {
            const ea = emergeAlpha(p.i);
            if (ea <= 0) return null;

            // Firing arrival boost
            let hitBoost = 0;
            for (const f of firingsRef.current) {
              if (f.to !== p.i) continue;
              const t = (now - f.startMs) / f.duration;
              if (t < 0 || t > 1) continue;
              hitBoost = Math.max(hitBoost, Math.max(0, 1 - Math.abs(t - 0.95) * 12));
            }
            const pulseBoost = getPulseBoost(p.i);
            const totalBoost = Math.max(hitBoost, pulseBoost);

            const breath = 1 + breathK;
            const r = cfg.moteBase * p.scale * breath * (1 + totalBoost * 0.8);
            const alpha = Math.min(1,
              p.alpha * breath * brightMultRef.current * ea + totalBoost * 0.6
            );
            const rayLen = r * 2.8;
            const strokeW = Math.max(0.5, r * 0.34);
            const rays = [-Math.PI / 6, (7 * Math.PI) / 6, Math.PI / 2];

            // Coherence gold: 4 nodos específicos reciben tinte dorado
            // cuando coherence > 0.65. Transición suave.
            const goldStrength = GOLDEN_NODES.includes(p.i)
              ? Math.max(0, Math.min(1, (coherence - 0.65) / 0.25))
              : 0;
            const moteColor = goldStrength > 0
              ? mixHex(color, "#FBBF24", goldStrength * 0.6)
              : color;
            const coreFill = totalBoost > 0.35 ? "#ffffff" : moteColor;
            const glowColor = goldStrength > 0.3 ? "#FBBF24" : color;
            // drop-shadow es moderadamente caro en mobile GPU; en low
            // tier lo desactivamos y la identidad visual la carga el
            // boost de radio + alpha ya presentes arriba.
            const glow = perf.sparkGlow && (totalBoost > 0.25 || goldStrength > 0.3)
              ? `drop-shadow(0 0 ${6 + totalBoost * 8 + goldStrength * 4}px ${glowColor})`
              : undefined;

            return (
              <g key={p.i} opacity={alpha}>
                {rays.map((ang, ri) => (
                  <line
                    key={ri}
                    x1={p.x} y1={p.y}
                    x2={p.x + Math.cos(ang) * rayLen}
                    y2={p.y + Math.sin(ang) * rayLen}
                    stroke={moteColor}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    opacity={ri === 0 ? 0.95 : ri === 1 ? 0.55 : 0.78}
                  />
                ))}
                <circle cx={p.x} cy={p.y} r={r} fill={coreFill}
                  style={glow ? { filter: glow } : undefined} />
              </g>
            );
          })}
        </g>

        {/* Radial rays del collapse — 8 líneas blancas emergiendo
            del centro hacia afuera con longitud creciente. Funciona
            como "rayos de supernova" y se perciben muy bien contra
            la lattice. Duración ~600ms, peak al 25%. */}
        {isCollapsing && !reducedMotion && collapseT < 0.55 && (
          <g opacity={Math.max(0, 1 - collapseT / 0.55)}>
            {Array.from({ length: 8 }, (_, i) => {
              const ang = (i / 8) * Math.PI * 2;
              const progress = Math.min(1, collapseT / 0.35);
              const len = (size / 2) * progress;
              const x2 = center + Math.cos(ang) * len;
              const y2 = center + Math.sin(ang) * len;
              const w = 2 + (1 - collapseT) * 2;
              return (
                <line
                  key={i}
                  x1={center} y1={center}
                  x2={x2} y2={y2}
                  stroke="#FFFFFF"
                  strokeWidth={w}
                  strokeLinecap="round"
                  opacity={1 - progress * 0.35}
                  style={perf.sparkGlow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
                />
              );
            })}
          </g>
        )}

        {/* Anchor mote durante VACÍO — blanco central, pulso suave.
            Aparece sólo en VACÍO/EMPTY para anclar la atención del
            usuario durante la quietud. */}
        {bp === "EMPTY" && isBreathing && !reducedMotion && (
          <g>
            <circle
              cx={center} cy={center}
              r={3 + Math.sin(now / 350) * 0.8}
              fill="#ffffff"
              opacity={0.6 + Math.sin(now / 350) * 0.15}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          </g>
        )}
      </svg>
    </>
  );
}

// Mezcla dos colores hex (#RRGGBB) con factor 0..1
function mixHex(a, b, t) {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}
function parseHex(h) {
  const s = String(h || "").replace("#", "");
  if (s.length !== 6) return null;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
