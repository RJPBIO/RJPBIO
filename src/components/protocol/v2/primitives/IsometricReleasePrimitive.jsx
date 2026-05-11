"use client";
/* ═══════════════════════════════════════════════════════════════
   IsometricReleasePrimitive — Phase 7 SP-S-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Descarga Isométrica" del
   protocolo #20 Block Break (Crisis Cognitiva).

   Mecanismo:
     Tensión isométrica máxima (10s puño máxima fuerza) +
     relajación completa (10s suelta) crea contraste somático que
     descarga frustración acumulada. Jacobson 1938 PMR
     (Progressive Muscle Relaxation): tense-release pattern reduce
     tensión muscular crónica + activa parasympathetic post-tense.

   Single-hand phone resolución:
     "Aprieta el puño de la mano libre." (un solo puño, no ambos)
     El teléfono sigue en la otra mano sin necesidad de soltarlo.

   Visual signature — break-pattern vs P1 kinetic + #19 chain:
     - 2 fases distintas A→B:
       A "TENSE" (10s): orb central COMPRIME (scale 1.0 → 0.6),
         density rings interiores INTENSIFICAN, color denso,
         halo encogiendo. Cuenta atrás visible.
       B "RELEASE" (10s): orb EXPLOTA outward (rapid expansion
         scale 0.6 → 1.4 → settle 1.0), particle burst diffuse,
         halo expande, opacity fade. Cuenta atrás visible.
     - Color: mid cyan getCyanForPhase(1) — break-pattern vs P1.

   Crisis tier compliance:
     - no_validation, voice TTS, binaural continue.
     - Skip permitido, sin sonido emitido por el primitive.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Descarga · Tensión / Suelta";

const PROMPT_TENSE = "Aprieta · Máxima fuerza";
const PROMPT_RELEASE = "Suelta · Siente la pesadez";
const BODY_TENSE = "Una mano · Puño firme";
const BODY_RELEASE = "Mano abierta · Pesadez";

const TENSE_MS = 10000;
const RELEASE_MS = 10000;
const TOTAL_MS = TENSE_MS + RELEASE_MS;

const BURST_PARTICLE_COUNT = 16;

/**
 * @param {object} props
 * @param {number} [props.holdDurationMs=10000]
 * @param {number} [props.releaseDurationMs=10000]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function IsometricReleasePrimitive({
  holdDurationMs = TENSE_MS,
  releaseDurationMs = RELEASE_MS,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(1); // mid cyan — break-pattern vs P1 (deep)
  const uid = useId();
  const haloId = `irBlur-${uid}`;
  const vignetteId = `irVignette-${uid}`;
  const auraId = `irAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const totalMs = holdDurationMs + releaseDurationMs;

  const [phaseState, setPhaseState] = useState("tense"); // tense | release
  const [orbScaleRaw, setOrbScaleRaw] = useState(1.0);
  const [tensionDensity, setTensionDensity] = useState(0); // 0-1 intensity of inner density rings
  const [releaseRatio, setReleaseRatio] = useState(0); // 0-1 burst expansion
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(holdDurationMs / 1000));
  const [completed, setCompleted] = useState(false);

  // Burst particles (visible only during release)
  const [burst, setBurst] = useState(() =>
    Array.from({ length: BURST_PARTICLE_COUNT }, (_, i) => ({
      id: i,
      angle: (i / BURST_PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3,
      speed: 0.8 + Math.random() * 0.6,
      seed: Math.random(),
    }))
  );

  const lastPhaseRef = useRef("tense");

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

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;

      let phase = "tense";
      let secsLeft = 0;
      let scale = 1.0;
      let density = 0;
      let release = 0;

      if (elapsed < holdDurationMs) {
        phase = "tense";
        const t = elapsed / holdDurationMs; // 0 → 1
        secsLeft = Math.ceil((holdDurationMs - elapsed) / 1000);
        // Orb compresses: 1.0 → 0.60 (ease in cubic)
        const easeIn = t * t;
        scale = 1.0 - easeIn * 0.40;
        density = Math.min(1, t * 1.1); // density rings build up
        release = 0;
      } else {
        phase = "release";
        const rMs = elapsed - holdDurationMs;
        const t = Math.min(rMs / releaseDurationMs, 1);
        secsLeft = Math.ceil((releaseDurationMs - rMs) / 1000);
        // Release burst: 0.6 → 1.4 (rapid first 1.5s) → settle 1.0
        const burstPhase = Math.min(rMs / 1500, 1);
        const settlePhase = Math.max(0, Math.min((rMs - 1500) / 2000, 1));
        scale = 0.60 + burstPhase * 0.80 - settlePhase * 0.40;
        density = (1 - burstPhase) * 0.85; // density fades fast
        release = burstPhase;
      }

      setOrbScaleRaw((prev) => (Math.abs(prev - scale) > 0.015 ? scale : prev));
      setTensionDensity((prev) => (Math.abs(prev - density) > 0.025 ? density : prev));
      setReleaseRatio((prev) => (Math.abs(prev - release) > 0.025 ? release : prev));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastPhaseRef.current) {
        setPhaseState(phase);
        lastPhaseRef.current = phase;
        if (phase === "release" && hapticEnabled) {
          try { hap("tap"); } catch {}
        }
      }

      if (elapsed >= totalMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(20, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [holdDurationMs, releaseDurationMs, totalMs, hapticEnabled, reduceMotion]);

  const isTense = phaseState === "tense";
  const isRelease = phaseState === "release";

  const primaryPrompt = isRelease ? PROMPT_RELEASE : PROMPT_TENSE;
  const bodyAnchor = isRelease ? BODY_RELEASE : BODY_TENSE;

  return (
    <div
      data-v2-isometric-release
      data-phase-state={phaseState}
      data-completed={completed ? "true" : "false"}
      data-testid="isometric-release-primitive"
      role="region"
      aria-label="Descarga isométrica: aprieta puño 10 segundos y suelta"
      style={{
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s20,
        opacity: mountFade.opacity,
        transform: mountFade.transform,
      }}
    >
      <span
        data-testid="isometric-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.70,
        }}
      >
        {PHASE_LABEL}
      </span>

      <p
        data-testid="isometric-instruction"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 19,
          fontWeight: typography.weight.medium,
          letterSpacing: "-0.02em",
          color: phaseColor,
          lineHeight: 1.25,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          minHeight: 26,
          transition: reduceMotion ? "none" : "color 320ms ease-out",
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
        <svg
          aria-hidden="true"
          width="320"
          height="280"
          viewBox="0 0 320 280"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={isTense ? "7" : "14"} />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.90" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.30" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="140" rx="140" ry="120" fill={`url(#${vignetteId})`} />

          {/* Density rings interiores — visibles durante tense, fade durante release */}
          {isTense && [0, 1, 2, 3].map((i) => {
            const r = 18 + i * 6;
            const rOffset = r * orbScaleRaw;
            return (
              <circle
                key={`dens-${i}`}
                cx="160" cy="140" r={rOffset.toFixed(2)}
                fill="none"
                stroke={phaseColor}
                strokeWidth="0.8"
                opacity={tensionDensity * (0.55 - i * 0.10)}
                style={{ transition: reduceMotion ? "none" : "opacity 200ms ease-out, r 200ms ease-out" }}
              />
            );
          })}

          {/* Burst particles — visibles durante release */}
          {isRelease && burst.map((b) => {
            const dist = 35 + releaseRatio * b.speed * 95;
            const x = 160 + Math.cos(b.angle) * dist;
            const y = 140 + Math.sin(b.angle) * dist;
            const op = Math.max(0, 0.75 - releaseRatio * 0.55);
            return (
              <circle
                key={`burst-${b.id}`}
                cx={x.toFixed(2)} cy={y.toFixed(2)}
                r={(2.4 + b.seed * 1.2).toFixed(2)}
                fill={phaseColor}
                opacity={op.toFixed(3)}
              />
            );
          })}

          {/* Outer halo aura — expande en release, contrae en tense */}
          <circle
            cx="160" cy="140" r="60"
            fill={`url(#${auraId})`}
            opacity={isTense ? 0.50 + tensionDensity * 0.30 : 0.30 + (1 - releaseRatio) * 0.35}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${orbScaleRaw.toFixed(3)})`,
              transformOrigin: "160px 140px",
              transition: reduceMotion ? "none" : "opacity 280ms ease-out, transform 220ms ease-out",
            }}
          />

          {/* Core orb */}
          <circle
            cx="160" cy="140" r="14"
            fill={phaseColor}
            opacity={isTense ? 0.85 + tensionDensity * 0.10 : 0.95 - releaseRatio * 0.30}
            style={{
              transform: `scale(${orbScaleRaw.toFixed(3)})`,
              transformOrigin: "160px 140px",
              transition: reduceMotion ? "none" : "transform 220ms ease-out, opacity 220ms ease-out",
            }}
          />

          {/* Countdown prominente */}
          <text
            x="160" y="240"
            fontSize="22"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={phaseColor}
            opacity="0.78"
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.08em" }}
          >
            {secondsRemaining}s
          </text>
        </svg>
      </div>

      <span
        data-testid="isometric-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.74,
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {bodyAnchor}
      </span>

      {/* Sub-phase indicator: 2 dots, current highlighted */}
      <div style={{ display: "flex", gap: 10, marginTop: -4 }}>
        {["tense", "release"].map((p) => (
          <span
            key={p}
            data-testid={`isometric-step-${p}`}
            style={{
              width: 5, height: 5, borderRadius: "50%",
              background: phaseState === p ? phaseColor : `${phaseColor}55`,
              opacity: phaseState === p ? 0.95 : 0.40,
              transition: reduceMotion ? "none" : "opacity 320ms ease-out, background 320ms ease-out",
            }}
          />
        ))}
      </div>
    </div>
  );
}
