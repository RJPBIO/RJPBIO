"use client";
/* ═══════════════════════════════════════════════════════════════
   VagalBurstExhalePrimitive — Phase 7 SP-J-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Exhale Explosivo" del protocolo
   #9 Steel Core Reset. Visual signature DISTINCT de breath_orb (#1)
   y CardiacCoherence (#2): central core sphere que comprime durante
   inhale → EXPLOTA en burst radial outward durante exhale + sound
   bars verticales sync con exhale intensity.

   Cadence 4-0-6-0 (inhale 4 nariz, exhale 6 boca con sonido fuerte).
   3 cycles × 10s = 30s.

   Mecanismo: exhale explosivo activa cambio de presión torácica que
   estimula barorreceptores (mecanismo vagal documentado).

   Phase tracking dinámico per breath phase:
     Inhale (0-4s):
       - Primary prompt: "Inhala 4 · Por la nariz"
       - Body anchor: "Carga el aire"
       - Core sphere: compresses (scale 1.0 → 0.65) gathering tension.
       - No burst rings, sound bars dim.
     Exhale (4-10s):
       - Primary prompt: "EXHALA 6 · Boca abierta · Sonido fuerte"
       - Body anchor: "Suelta con fuerza"
       - Core sphere: EXPANDS+BURSTS (scale 0.65 → 1.45).
       - 3 burst rings expand outward staggered.
       - Sound bars peak intensity.

   Visual color: violet #8B5CF6 (protocol #9 color · differentiates
   from cyan-only protocols #1-#8).

   Multi-exercise tracks layered (8):
     1. CENTRAL core sphere: compresses inhale → bursts exhale.
     2. 3 BURST rings (staggered 120ms) on exhale outward.
     3. SOUND bars vertical (7 bars) intensity sync exhale curve.
     4. DYNAMIC phase prompt cambia per breath phase (aria-live).
     5. BODY anchor evolutivo per breath phase.
     6. COUNTDOWN per phase ("4..1" inhale, "6..1" exhale) tabular-nums.
     7. CYCLE counter X/3 per ciclo completo.
     8. PHASE label "Exhale Explosivo" violet.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - "Sonido fuerte" recommended pero no required (validate por timing).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Exhale Explosivo";
// Cyan-deep canon (alineado con todos los Phase 1 dedicated en bio-ignición).
// Constraint sin volumen: "exhalar fuerte por la boca" significa fuerza
// física del aire, NO sonido vocal — fix oficina-friendly.
const PHASE_COLOR_HEX = "#0E7490"; // cyan-deep phase1
const PHASE_COLOR_GLOW = "rgba(14,116,144,0.55)";
const PHASE_COLOR_GLOW_PEAK = "rgba(14,116,144,0.85)";

const INHALE_PROMPT = "Inhala 4 · Por la nariz";
const EXHALE_PROMPT = "EXHALA 6 · Por la boca · Fuerte";
const INHALE_BODY = "Carga el aire";
const EXHALE_BODY = "Suelta el aire con fuerza";

const SOUND_BAR_COUNT = 7;
const BURST_RING_COUNT = 3;

/**
 * @param {object} props
 * @param {number} [props.cycleCountTarget=3]
 * @param {{in:number,h1:number,ex:number,h2:number}} [props.cadence]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(n:number)=>void} [props.onCycleComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function VagalBurstExhalePrimitive({
  cycleCountTarget = 3,
  cadence = { in: 4, h1: 0, ex: 6, h2: 0 },
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onCycleComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();

  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const inhaleEndMs = cadence.in * 1000;
  const exhaleStartMs = (cadence.in + cadence.h1) * 1000;
  const exhaleEndMs = exhaleStartMs + cadence.ex * 1000;
  const cyclePeriodMs = (cadence.in + cadence.h1 + cadence.ex + cadence.h2) * 1000;
  const totalMs = cyclePeriodMs * cycleCountTarget;

  const [breathPhase, setBreathPhase] = useState("inhale");
  const [cycleIdx, setCycleIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(cadence.in);
  const [completed, setCompleted] = useState(false);
  const [burstIntensity, setBurstIntensity] = useState(0);

  const coreRef = useRef(null);
  const burstRefs = useRef([null, null, null]);
  const soundBarsRef = useRef(Array(SOUND_BAR_COUNT).fill(null));
  const lastCycleRef = useRef(0);

  // RAF tick
  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => {
        setCompleted(true);
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
      }, 1500);
      return () => clearTimeout(t);
    }

    let stopped = false;
    let raf;
    const startTime = performance.now();

    let lastBreathPhase = "inhale";

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const cycleMs = elapsed % cyclePeriodMs;
      const currentCycle = Math.floor(elapsed / cyclePeriodMs);

      let scale = 1;
      let phase = "inhale";
      let secsLeft = 0;
      let intensity = 0;

      if (cycleMs < inhaleEndMs) {
        // INHALE — core compresses
        const t = cycleMs / inhaleEndMs;
        scale = 1.0 - 0.35 * t; // 1.0 → 0.65
        phase = "inhale";
        secsLeft = Math.ceil((inhaleEndMs - cycleMs) / 1000);
        intensity = 0;
      } else if (cycleMs < exhaleStartMs) {
        // HOLD (h1) — usually 0 for #9
        scale = 0.65;
        phase = "hold";
        secsLeft = 0;
        intensity = 0;
      } else if (cycleMs < exhaleEndMs) {
        // EXHALE — core BURSTS outward + sound peaks
        const t = (cycleMs - exhaleStartMs) / (cadence.ex * 1000);
        scale = 0.65 + 0.80 * t; // 0.65 → 1.45 — explosive expansion
        phase = "exhale";
        secsLeft = Math.ceil((exhaleEndMs - cycleMs) / 1000);
        // Bell curve intensity: rises 0→1→0
        intensity = Math.sin(t * Math.PI);
      } else {
        // HOLD (h2) — usually 0 for #9
        scale = 1.0;
        phase = "rest";
        secsLeft = 0;
        intensity = 0;
      }

      const core = coreRef.current;
      if (core) {
        core.style.transform = `scale(${scale.toFixed(3)})`;
        core.style.opacity = phase === "exhale" ? "0.95" : "0.85";
      }

      // Burst rings — only visible during exhale
      burstRefs.current.forEach((el, i) => {
        if (!el) return;
        if (phase === "exhale") {
          const t = (cycleMs - exhaleStartMs) / (cadence.ex * 1000);
          // Each ring staggered: ring i starts at delay i/3
          const ringStart = i / BURST_RING_COUNT;
          const ringT = Math.max(0, Math.min(1, (t - ringStart) / (1 - ringStart)));
          const ringScale = 0.5 + 1.5 * ringT;
          const ringOpacity = ringT > 0 && ringT < 1 ? (1 - ringT) * 0.55 : 0;
          el.style.transform = `scale(${ringScale.toFixed(3)})`;
          el.style.opacity = ringOpacity.toFixed(3);
        } else {
          el.style.opacity = "0";
        }
      });

      // Sound bars — heights pulsate per exhale intensity with per-bar offset
      soundBarsRef.current.forEach((el, i) => {
        if (!el) return;
        if (phase === "exhale") {
          const offset = (i / SOUND_BAR_COUNT) * Math.PI * 2;
          const t = (cycleMs - exhaleStartMs) / (cadence.ex * 1000);
          const wave = (Math.sin(t * Math.PI * 4 + offset) + 1) / 2;
          const heightPx = 6 + intensity * (10 + wave * 14);
          el.style.height = `${heightPx.toFixed(1)}px`;
          el.style.opacity = (0.4 + intensity * 0.55).toFixed(3);
        } else {
          el.style.height = "4px";
          el.style.opacity = "0.18";
        }
      });

      if (phase !== lastBreathPhase) {
        setBreathPhase(phase);
        lastBreathPhase = phase;
        // Haptic on inhale→exhale transition (start of burst)
        if (phase === "exhale" && hapticEnabled) {
          try { hap("tap"); } catch {}
        }
      }

      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));
      setBurstIntensity((prev) => (Math.abs(prev - intensity) > 0.05 ? intensity : prev));

      if (currentCycle !== lastCycleRef.current) {
        lastCycleRef.current = currentCycle;
        setCycleIdx(currentCycle);
        try {
          if (typeof onCycleCompleteRef.current === "function") {
            onCycleCompleteRef.current(currentCycle);
          }
        } catch {}
      }

      if (elapsed >= totalMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(9, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [
    cycleCountTarget, hapticEnabled, reduceMotion, totalMs,
    cyclePeriodMs, inhaleEndMs, exhaleStartMs, exhaleEndMs,
    cadence.in, cadence.h1, cadence.ex, cadence.h2,
  ]);

  // Particles ambient
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 280;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("exhale", 0.5);
        particleSysRef.current.start();
      }
    } catch (e) {}
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch {}
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  const primaryPrompt = breathPhase === "inhale" ? INHALE_PROMPT : breathPhase === "exhale" ? EXHALE_PROMPT : "";
  const bodyAnchor = breathPhase === "inhale" ? INHALE_BODY : breathPhase === "exhale" ? EXHALE_BODY : "";
  const cyclesCompleted = Math.min(cycleIdx, cycleCountTarget);

  return (
    <div
      data-v2-vagal-burst-exhale
      data-breath-phase={breathPhase}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="vagal-burst-exhale-primitive"
      role="region"
      aria-label="Exhale explosivo, inhala 4 segundos por la nariz exhala 6 segundos por la boca con fuerza"
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
      <span
        data-testid="vagal-burst-exhale-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: PHASE_COLOR_HEX,
          opacity: 0.75,
        }}
      >
        {PHASE_LABEL}
      </span>

      <p
        data-testid="vagal-burst-exhale-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: breathPhase === "exhale" ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.02em",
          color: breathPhase === "exhale" ? PHASE_COLOR_HEX : colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          transition: reduceMotion ? "none" : "color 220ms ease-out, font-weight 220ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 320,
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="vagal-burst-exhale-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.20 + burstIntensity * 0.25,
            transition: "opacity 220ms ease-out",
          }}
        />

        {/* Burst rings — only visible during exhale */}
        {[0, 1, 2].map((i) => (
          <div
            key={`burst-${i}`}
            ref={(el) => { burstRefs.current[i] = el; }}
            data-testid={`vagal-burst-exhale-burst-${i}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              width: 100,
              height: 100,
              borderRadius: "50%",
              border: `1px solid ${PHASE_COLOR_HEX}`,
              opacity: 0,
              transform: "scale(0.5)",
              willChange: "transform, opacity",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Central core sphere */}
        <div
          ref={coreRef}
          data-testid="vagal-burst-exhale-core"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${PHASE_COLOR_HEX} 0%, rgba(14,116,144,0.55) 50%, rgba(14,116,144,0) 100%)`,
            boxShadow: breathPhase === "exhale"
              ? `0 0 60px ${PHASE_COLOR_GLOW_PEAK}, 0 0 100px ${PHASE_COLOR_GLOW}`
              : `0 0 28px ${PHASE_COLOR_GLOW}`,
            opacity: 0.85,
            willChange: "transform, opacity, box-shadow",
            transform: "scale(1)",
            transition: reduceMotion ? "none" : "box-shadow 320ms ease-out",
          }}
        />

        {/* Sound bars — vertical at bottom, intensity sync */}
        <div
          data-testid="vagal-burst-exhale-sound-bars"
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 24,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 4,
            height: 40,
          }}
        >
          {Array.from({ length: SOUND_BAR_COUNT }).map((_, i) => (
            <div
              key={`bar-${i}`}
              ref={(el) => { soundBarsRef.current[i] = el; }}
              style={{
                width: 3,
                height: 4,
                background: PHASE_COLOR_HEX,
                borderRadius: 2,
                opacity: 0.18,
                willChange: "height, opacity",
              }}
            />
          ))}
        </div>

        {/* Countdown chip top-right */}
        <span
          data-testid="vagal-burst-exhale-countdown"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 12,
            right: 24,
            fontFamily: typography.familyMono,
            fontSize: 32,
            fontWeight: typography.weight.light,
            color: PHASE_COLOR_HEX,
            opacity: secondsRemaining > 0 ? 0.85 : 0.2,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            transition: reduceMotion ? "none" : "opacity 200ms ease-out",
          }}
        >
          {secondsRemaining > 0 ? secondsRemaining : ""}
        </span>
      </div>

      {/* Body anchor */}
      <span
        data-testid="vagal-burst-exhale-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>

      {/* Cycle counter */}
      <span
        data-testid="vagal-burst-exhale-cycle-counter"
        aria-label={`Ciclo ${Math.min(cyclesCompleted + 1, cycleCountTarget)} de ${cycleCountTarget}`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          opacity: 0.55,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.min(cyclesCompleted + 1, cycleCountTarget)} / {cycleCountTarget}
      </span>
    </div>
  );
}
