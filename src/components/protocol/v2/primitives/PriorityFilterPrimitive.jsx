"use client";
/* ═══════════════════════════════════════════════════════════════
   PriorityFilterPrimitive — Phase 7 SP-D-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Filtro de Prioridad" del
   protocolo #3 Reset Ejecutivo. Reemplaza shared text_emphasis_voice
   ×3 con primitive multi-exercise wrapper (Eisenhower decision matrix
   + slots tracker + tongue palate body anchor + visual continuity).

   3 sub-actos (controlled via subActIdx prop):
     - subActIdx=0 (18s): "Tres tareas urgentes. Las que más pesan."
       → text + 3-slot tracker visual (mental candidates).
     - subActIdx=1 (24s): "¿Importante o urgente? Eliminar. Delegar. Hacer."
       → text + Eisenhower 2×2 matrix visual (decision aid concrete).
     - subActIdx=2 (18s): "Queda una. Solo una."
       → text + single-slot highlighted (convergence final).

   Multi-exercise tracks simultáneos (ejercicios neurales layered):
     1. PRIMARY mental: text prompt + visual aid per subActIdx.
     2. VISUAL DECISION MATRIX: Eisenhower 2×2 cuadrant grid sub-act 1
        (importante × urgente axes con cuadrant labels).
     3. VISUAL SLOTS TRACKER: 3-slot indicator (sub 0 empty) → matrix
        (sub 1) → 1-slot highlighted (sub 2 convergence).
     4. FÍSICO BIOHACKING: "Lengua al paladar" sustained body anchor
        — vagal afferent via lingual nerve + cognitive activation
        proprioceptive (yoga "khechari mudra" simplified).
     5. VISUAL CONTINUITY: orb continuation Phase 1 carry-over soft.
     6. VISUAL CONTINUITY: particle field orbital hold-pattern.
     7. PHASE label "Filtro de Prioridad" cyan-cool.

   Mecanismos científicos (NO surface en UI per user feedback):
     - Eisenhower matrix reduces cognitive load (Eisenhower 1954
       paradox · Covey 1989 7 habits).
     - Tongue palate press activates vagal afferent via lingual
       nerve cranial X branch (yoga research · Brown 2005).
     - Convergence to single-task reduces decision fatigue
       (Baumeister 2000 ego depletion).

   Functional human logic:
     - subAct 0: identify 3 tasks (mentales) + leer 3 slots vacíos.
     - subAct 1: leer matrix Eisenhower + decidir mental por cada
       (visual matrix sirve como decision aid concrete, NO interactivo).
     - subAct 2: convergencia final (single slot).
     - Mientras procesa cognitivo (X), lengua al paladar (Y) — vagal
       afferent compatible non-conflicting.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Tongue palate press passive (sustained, sin esfuerzo).
     - Cero touch interactions (cognitive-only, no chip).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

// Sub-act configs internos.
const SUB_ACTS = [
  {
    idx: 0,
    kind: "candidates",
    title: "Tres tareas urgentes.",
    subtitle: "Las que más pesan.",
    minDurationMs: 15000,
  },
  {
    idx: 1,
    kind: "matrix",
    title: "¿Importante o urgente?",
    subtitle: "Eliminar. Delegar. Hacer.",
    minDurationMs: 20000,
  },
  {
    idx: 2,
    kind: "convergence",
    title: "Queda una.",
    subtitle: "Solo una.",
    minDurationMs: 12000,
  },
];

const PHASE_LABEL = "Filtro de Prioridad";
const BODY_ANCHOR_CUE = "Lengua al paladar";

// Eisenhower matrix cells — decision aid concrete.
const EISENHOWER_CELLS = [
  { row: 0, col: 0, label: "HACER",    sub: "Importante + Urgente",     emphasis: true  },
  { row: 0, col: 1, label: "AGENDAR",  sub: "Importante + No urgente",  emphasis: false },
  { row: 1, col: 0, label: "DELEGAR",  sub: "No importante + Urgente",  emphasis: false },
  { row: 1, col: 1, label: "ELIMINAR", sub: "No importante + No urg.",  emphasis: false },
];

/**
 * @param {object} props
 * @param {number} [props.subActIdx=0] — 0/1/2
 * @param {number} [props.min_duration_ms]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal]
 * @param {()=>void} [props.onComplete]
 */
export default function PriorityFilterPrimitive({
  subActIdx = 0,
  min_duration_ms,
  audioEnabled = true,  
  hapticEnabled = true,  
  voiceEnabled = false,  
  onSignal,  
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const cfg = SUB_ACTS[subActIdx] || SUB_ACTS[0];
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9 phase2

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── min_duration gate per sub-act ─────────────────────────
  const [timePassed, setTimePassed] = useState(false);
  useEffect(() => {
    setTimePassed(false);
    const targetMs = min_duration_ms || cfg.minDurationMs;
    const timeout = setTimeout(() => {
      setTimePassed(true);
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
    }, targetMs);
    return () => clearTimeout(timeout);
  }, [cfg.kind, min_duration_ms, cfg.minDurationMs]);

  // ─── Multi-task overlays ───────────────────────────────────
  // Track 5: orb continuation (Phase 1 carry-over).
  const orbRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const t = ((now - start) / 1000) % 4;
      const scale = 1.0 + Math.sin((t / 4) * Math.PI * 2) * 0.04;
      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Track 6: particles orbital hold-pattern.
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 300;
    canvas.height = 300;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("hold", 0);
        particleSysRef.current.start();
      }
    } catch (e) { /* noop */ }
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch { /* noop */ }
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  return (
    <div
      data-v2-priority-filter
      data-sub-act-idx={subActIdx}
      data-sub-act-kind={cfg.kind}
      data-testid="priority-filter-primitive"
      role="region"
      aria-label={`Filtro de Prioridad, sub-acto ${subActIdx + 1}, ${cfg.title}`}
      style={{
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s24,
      }}
    >
      {/* Phase label simple top */}
      <span
        data-testid="priority-filter-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.7,
        }}
      >
        {PHASE_LABEL}
      </span>

      {/* Visual stack: particles + orb + PRIMARY content per sub-act */}
      <div
        style={{
          position: "relative",
          width: 300,
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Particles bio-synced */}
        <canvas
          ref={particleCanvasRef}
          data-testid="priority-filter-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.35,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Orb continuation Phase 1 carry-over soft */}
        <div
          ref={orbRef}
          data-testid="priority-filter-orb"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(103,232,249,0.20) 0%, rgba(14,116,144,0.08) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${phaseColor}`,
            opacity: 0.45,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />

        {/* PRIMARY content per sub-act */}
        <div
          data-testid="priority-filter-primary"
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 320,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: spacing.s12,
            paddingInline: spacing.s16,
          }}
        >
          {/* Title + subtitle */}
          <h2
            data-testid="priority-filter-title"
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: 22,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: colors.text.strong,
              lineHeight: 1.25,
            }}
          >
            {cfg.title}
          </h2>
          {cfg.subtitle && (
            <p
              data-testid="priority-filter-subtitle"
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.body,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.45,
              }}
            >
              {cfg.subtitle}
            </p>
          )}

          {/* Sub-act 0: 3-slot tracker (mental candidates) */}
          {cfg.kind === "candidates" && (
            <div
              data-testid="priority-filter-slots-3"
              aria-label="Tres tareas, slots vacíos"
              style={{
                marginBlockStart: spacing.s16,
                display: "flex",
                gap: spacing.s12,
                justifyContent: "center",
              }}
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  data-testid={`priority-filter-slot-${n}`}
                  style={{
                    width: 58,
                    height: 38,
                    borderRadius: 8,
                    border: `0.5px dashed ${phaseColor}`,
                    background: "rgba(103,232,249,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: typography.familyMono,
                    fontSize: 14,
                    fontWeight: typography.weight.light,
                    color: phaseColor,
                    opacity: 0.6,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          )}

          {/* Sub-act 1: Eisenhower 2×2 matrix decision aid */}
          {cfg.kind === "matrix" && (
            <div
              data-testid="priority-filter-eisenhower"
              aria-label="Matriz Eisenhower 2×2 importante por urgente"
              style={{
                marginBlockStart: spacing.s16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                gap: 6,
                width: 240,
                maxWidth: "90%",
              }}
            >
              {EISENHOWER_CELLS.map((cell) => (
                <div
                  key={`${cell.row}-${cell.col}`}
                  data-testid={`priority-filter-eisenhower-cell-${cell.row}-${cell.col}`}
                  style={{
                    paddingBlock: spacing.s8,
                    paddingInline: spacing.s12,
                    borderRadius: 8,
                    border: `0.5px solid ${cell.emphasis ? phaseColor : colors.separator}`,
                    background: cell.emphasis ? "rgba(103,232,249,0.10)" : "rgba(255,255,255,0.02)",
                    minHeight: 60,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: typography.family,
                      fontSize: 11,
                      fontWeight: typography.weight.medium,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: cell.emphasis ? phaseColor : colors.text.primary,
                    }}
                  >
                    {cell.label}
                  </span>
                  <span
                    style={{
                      fontFamily: typography.family,
                      fontSize: 9,
                      fontWeight: typography.weight.regular,
                      color: colors.text.muted,
                      opacity: 0.85,
                      lineHeight: 1.2,
                      textAlign: "center",
                    }}
                  >
                    {cell.sub}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Sub-act 2: single-slot highlighted (convergence) */}
          {cfg.kind === "convergence" && (
            <div
              data-testid="priority-filter-slot-converged"
              aria-label="Tarea convergida"
              style={{
                marginBlockStart: spacing.s16,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 56,
                  borderRadius: 10,
                  border: `1px solid ${phaseColor}`,
                  background: "rgba(103,232,249,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: typography.familyMono,
                  fontSize: 18,
                  fontWeight: typography.weight.light,
                  letterSpacing: "0.08em",
                  color: phaseColor,
                  boxShadow: `0 0 14px rgba(103,232,249,0.18)`,
                }}
              >
                1
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body anchor sustained "Lengua al paladar" — biohacking físico */}
      <span
        data-testid="priority-filter-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.7,
          textAlign: "center",
        }}
      >
        {BODY_ANCHOR_CUE}
      </span>
    </div>
  );
}
