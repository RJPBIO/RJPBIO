"use client";
/* ═══════════════════════════════════════════════════════════════
   CognitiveDescargaPrimitive — Phase 7 SP-B-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Descarga Cognitiva" del protocolo
   #1 Reinicio Parasimpático. Reemplaza shared text_emphasis_voice +
   chip_selector + text_emphasis_voice con primitive multi-task wrapper.

   3 sub-actos (controlled via subActIdx prop):
     - subActIdx=0 (15s): "Identifica el peso. El pensamiento que más pesa."
       → text emphasis + body anchor + orb continuation + particles + eyebrow.
     - subActIdx=1 (25s): "¿Depende de ti?" chip selector binario.
       → chip selector + body anchor + orb + particles + eyebrow.
     - subActIdx=2 (20s): "Una acción para 30 min · O suéltalo 24 horas."
       → text emphasis + body anchor + orb + particles + eyebrow.

   Multi-task tracks simultáneos cada subAct:
     1. PRIMARY cognitive: text/chip per subActIdx (interaction o read).
     2. SECONDARY visual: orb continuación pulsando suave (vagal carry-over
        from Phase 1 box breathing — establece continuidad).
     3. SECONDARY visual: particle field orbital (hold-pattern, no aggressive
        movement durante phase cognitiva).
     4. SECONDARY cognitive-somatic: body anchor "Palma libre en el
        pecho" sustained durante todo Phase 2 (singular — la mano que
        no sostiene el celular, evita conflicto con tap del chip).
     5. PHASE label simple "Descarga Cognitiva" (zero scientific text
        per user feedback — fatiga textual durante ejecución).

   Mecanismo científico: affect labeling (nombrar pensamiento dominante)
   reduce activación amigdalar hasta 40% + activa córtex prefrontal
   ventrolateral (Lieberman 2007 UCLA, Psychological Science).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano: ✅ todos.
     - Cero touch interactions excepto subAct=1 chip selector (tap único).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

// Sub-act configs internos.
const SUB_ACTS = [
  {
    idx: 0,
    title: "Identifica el peso",
    subtitle: "El pensamiento que más pesa ahora.",
    kind: "text",
    minDurationMs: 12000,
  },
  {
    idx: 1,
    title: "¿Depende de ti?",
    subtitle: null,
    kind: "chip",
    chips: [
      { id: "yes", label: "Sí depende" },
      { id: "no",  label: "No depende" },
    ],
    minThinkingMs: 5000,
  },
  {
    idx: 2,
    title: "Una acción para los próximos 30 minutos.",
    subtitle: "O suéltalo 24 horas. Confía en tu primera respuesta.",
    kind: "text",
    minDurationMs: 15000,
  },
];

// Body anchor sustained durante todo Phase 2 (somatic secondary).
// Singular "palma libre" — la mano que NO sostiene el celular, evita
// conflicto con tap del chip en sub-act 1.
const BODY_ANCHOR_CUE = "Palma libre en el pecho";

const PHASE_2_LABEL = "Descarga Cognitiva";

/**
 * @param {object} props
 * @param {number} [props.subActIdx=0] — 0/1/2 controlled by ProtocolPlayer act sequence
 * @param {Array} [props.chips] — override chips list (Phase 2 sub-act 1)
 * @param {number} [props.min_thinking_ms=5000] — chip selector lockout
 * @param {number} [props.min_duration_ms=12000] — text sub-act gate
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {(s:object)=>void} [props.onSignal] — caller propaga signals (selectedChipId/completedFlag)
 * @param {()=>void} [props.onComplete]
 */
export default function CognitiveDescargaPrimitive({
  subActIdx = 0,
  chips,
  min_thinking_ms = 5000,
  min_duration_ms = 12000,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onSignal,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const cfg = SUB_ACTS[subActIdx] || SUB_ACTS[0];
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9 phase2

  const onSignalRef = useRef(onSignal);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onSignalRef.current = onSignal; }, [onSignal]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Sub-act state ─────────────────────────────────────────
  const [thinkingTimePassed, setThinkingTimePassed] = useState(false);
  const [textTimePassed, setTextTimePassed] = useState(false);
  const [selectedChipId, setSelectedChipId] = useState(null);

  // Text sub-act min_duration gate.
  useEffect(() => {
    if (cfg.kind !== "text") return undefined;
    setTextTimePassed(false);
    const timeout = setTimeout(() => {
      setTextTimePassed(true);
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch (e) { /* noop */ }
    }, min_duration_ms || cfg.minDurationMs);
    return () => clearTimeout(timeout);
  }, [cfg.kind, min_duration_ms, cfg.minDurationMs]);

  // Chip selector min_thinking gate.
  useEffect(() => {
    if (cfg.kind !== "chip") return undefined;
    setThinkingTimePassed(false);
    setSelectedChipId(null);
    const timeout = setTimeout(() => setThinkingTimePassed(true), min_thinking_ms);
    return () => clearTimeout(timeout);
  }, [cfg.kind, min_thinking_ms]);

  function handleChipSelect(chipId) {
    if (!thinkingTimePassed) return;
    if (cfg.kind !== "chip") return;
    setSelectedChipId(chipId);
    try {
      if (typeof onSignalRef.current === "function") {
        onSignalRef.current({ selectedChipId: chipId });
      }
    } catch (e) { /* noop */ }
    if (hapticEnabled) {
      try {
        hapticProtocolSignature(1, "phase_shift", { reducedMotion: reduceMotion });
      } catch (e) { /* noop */ }
    }
    try {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
    } catch (e) { /* noop */ }
  }

  // ─── Multi-task overlays ───────────────────────────────────
  // Track 2: orb continuation (subtle pulse, vagal carry-over).
  const orbRef = useRef(null);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const t = ((now - start) / 1000) % 4; // 4s soft pulse
      const scale = 1.0 + Math.sin((t / 4) * Math.PI * 2) * 0.05; // 0.95-1.05
      const orb = orbRef.current;
      if (orb) orb.style.transform = `scale(${scale.toFixed(4)})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Track 3: particle field orbital (hold pattern durante Phase 2).
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
        particleSysRef.current.setPhase("hold", 0); // orbital pattern
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
      data-v2-cognitive-descarga
      data-sub-act-idx={subActIdx}
      data-sub-act-kind={cfg.kind}
      data-testid="cognitive-descarga-primitive"
      role="region"
      aria-label={`Descarga Cognitiva, sub-acto ${subActIdx + 1}, ${cfg.title}`}
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
      {/* Track 5 (phase label): static phase name (zero scientific text per user feedback). */}
      <span
        data-testid="cognitive-descarga-phase-label"
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
        {PHASE_2_LABEL}
      </span>

      {/* Visual stack: particles + orb continuation (background) */}
      <div
        style={{
          position: "relative",
          width: 300,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Track 3: particles orbital */}
        <canvas
          ref={particleCanvasRef}
          data-testid="cognitive-descarga-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.4,
            transition: "opacity 200ms ease-out",
          }}
        />
        {/* Track 2: orb continuation (subtle) */}
        <div
          ref={orbRef}
          data-testid="cognitive-descarga-orb"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(103,232,249,0.30) 0%, rgba(14,116,144,0.15) 60%, rgba(14,116,144,0) 100%)",
            border: `1px solid ${phaseColor}`,
            opacity: 0.6,
            transition: "none",
            willChange: "transform",
            transform: "scale(1.0)",
          }}
        />

        {/* Track 1: PRIMARY cognitive content (text or chip) */}
        <div
          data-testid="cognitive-descarga-primary"
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
          <h2
            data-testid="cognitive-descarga-title"
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
              data-testid="cognitive-descarga-subtitle"
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

          {cfg.kind === "chip" && (
            <div
              data-testid="cognitive-descarga-chips"
              role="radiogroup"
              aria-label="¿Depende de ti?"
              style={{
                marginBlockStart: spacing.s16,
                display: "flex",
                gap: spacing.s8,
                justifyContent: "center",
                flexWrap: "wrap",
                opacity: thinkingTimePassed ? 1 : 0.4,
                transition: reduceMotion ? "none" : "opacity 220ms ease-out",
                pointerEvents: thinkingTimePassed ? "auto" : "none",
              }}
            >
              {(chips || cfg.chips).map((c) => {
                const isActive = selectedChipId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    data-testid={`cognitive-descarga-chip-${c.id}`}
                    onClick={() => handleChipSelect(c.id)}
                    disabled={!thinkingTimePassed}
                    style={{
                      paddingBlock: spacing.s12,
                      paddingInline: spacing.s24,
                      borderRadius: 999,
                      border: `1px solid ${isActive ? phaseColor : colors.separator}`,
                      background: isActive ? "rgba(103,232,249,0.12)" : "transparent",
                      color: isActive ? phaseColor : colors.text.primary,
                      fontFamily: typography.family,
                      fontSize: typography.size.body,
                      fontWeight: typography.weight.regular,
                      cursor: thinkingTimePassed ? "pointer" : "not-allowed",
                      minHeight: 44,
                      minWidth: 120,
                      transition: reduceMotion ? "none" : "all 180ms ease-out",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Track 4: SECONDARY cognitive-somatic body anchor sustained */}
      <span
        data-testid="cognitive-descarga-body-anchor"
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
