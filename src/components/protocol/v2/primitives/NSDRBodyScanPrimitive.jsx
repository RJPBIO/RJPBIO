"use client";
/* ═══════════════════════════════════════════════════════════════
   NSDRBodyScanPrimitive — Phase 7 SP-P-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Body Scan Descendente" del
   protocolo #17 NSDR 10 min. 4 sub-actos × 75s = 300s body scan.

   IMPORTANT: User has eyes closed (NSDR Phase 1 just ended con
   "cierra los ojos"). Visual SECONDARY — voice-led primary.
   Sleep-mode aesthetic minimal para users que abran ojos briefly.

   4 sub-actos per subActIdx:
     subActIdx 0 (0-75s):   "Cabeza · Cuello · Hombros"
     subActIdx 1 (75-150s): "Brazos · Manos · Dedos"
     subActIdx 2 (150-225s):"Pecho · Abdomen · Caderas"
     subActIdx 3 (225-300s):"Piernas · Pies · Dedos"

   Visual signature (break-pattern intentional):
     - NO body silhouette (sleep mode, eyes closed)
     - Backdrop ambient muy dim
     - Big primary text zone name
     - Subtle pulsing point ambient (~7s)
     - 4 sub-acto progression dots
     - Subtle "suelta" subtitle cyan

   Mecanismo: body scan descendente activa propiocepción + reduce
   activación cortical (Yoga Nidra Saraswati 1976, Huberman 2021).

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Voice-led intended (catálogo voice.enabled_default:true).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Body Scan";

const ZONES = [
  {
    key: "head",
    primary: "Cabeza · Cuello · Hombros",
    subtitle: "Suelta · Sin tensión",
    anchor: "Cuero cabelludo · Frente · Mandíbula",
    voiceCue: "Atención a la cabeza, cuello y hombros. Suelta.",
  },
  {
    key: "arms",
    primary: "Brazos · Manos · Dedos",
    subtitle: "Pesados · Sueltos",
    anchor: "Codos · Antebrazos · Manos",
    voiceCue: "Atención a brazos, manos y dedos. Suelta.",
  },
  {
    key: "torso",
    primary: "Pecho · Abdomen · Caderas",
    subtitle: "Suelta el peso",
    anchor: "Costillas · Vientre · Pelvis",
    voiceCue: "Atención al pecho, abdomen y caderas. Suelta.",
  },
  {
    key: "legs",
    primary: "Piernas · Pies · Dedos",
    subtitle: "Pesados sobre el suelo",
    anchor: "Muslos · Pantorrillas · Pies",
    voiceCue: "Atención a piernas, pies y dedos. Suelta.",
  },
];

const TOTAL_ZONES = ZONES.length;

/**
 * @param {object} props
 * @param {number} [props.subActIdx=0] — 0..3
 * @param {number} [props.duration_ms=75000]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function NSDRBodyScanPrimitive({
  subActIdx = 0,
  duration_ms = 75000,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(1); // cyan-cool phase2
  const uid = useId();
  const haloId = `nbBlur-${uid}`;
  const vignetteId = `nbVignette-${uid}`;
  const auraId = `nbAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [pointPulse, setPointPulse] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(duration_ms / 1000));
  const [completed, setCompleted] = useState(false);

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

      const breathT = (elapsed / 7000) % 1;
      const pulseVal = Math.sin(breathT * Math.PI * 2);
      setPointPulse((prev) => (Math.abs(prev - pulseVal) > 0.05 ? pulseVal : prev));

      const secsLeft = Math.max(0, Math.ceil((duration_ms - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (elapsed >= duration_ms) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(17, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [duration_ms, hapticEnabled, reduceMotion]);

  // Voice cue at start of this acto (per subActIdx zone)
  useEffect(() => {
    if (voiceEnabled && !reduceMotion) {
      const zone = ZONES[subActIdx] || ZONES[0];
      try { speak(zone.voiceCue); } catch {}
    }
  }, [subActIdx, voiceEnabled, reduceMotion]);

  // Particles ambient subtle
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 320;
    try {
      particleSysRef.current = createParticleSystem({ canvas, reducedMotion: reduceMotion });
      if (particleSysRef.current) {
        particleSysRef.current.setPhase("hold", 0);
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

  const zone = ZONES[subActIdx] || ZONES[0];
  const zoneIdx = Math.min(TOTAL_ZONES - 1, subActIdx);
  const pointScale = 1.0 + pointPulse * 0.5;

  return (
    <div
      data-v2-nsdr-body-scan
      data-zone-idx={zoneIdx}
      data-zone-key={zone.key}
      data-completed={completed ? "true" : "false"}
      data-testid="nsdr-body-scan-primitive"
      role="region"
      aria-label={`NSDR body scan, zona ${zoneIdx + 1} de ${TOTAL_ZONES}, ${zone.primary}`}
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
        data-testid="nsdr-body-scan-phase-label"
        style={{
          fontFamily: typography.family,
          fontSize: 11,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.6,
        }}
      >
        {PHASE_LABEL}
      </span>

      {/* Zone primary + subtitle */}
      <div
        data-testid="nsdr-body-scan-zone"
        aria-live="polite"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          paddingInline: spacing.s16,
          minHeight: 70,
          maxWidth: 360,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 24,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.02em",
            color: colors.text.strong,
            lineHeight: 1.25,
            textAlign: "center",
          }}
        >
          {zone.primary}
        </p>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 12,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: phaseColor,
            opacity: 0.70,
          }}
        >
          {zone.subtitle}
        </span>
      </div>

      <div
        style={{
          position: "relative",
          width: 320,
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="nsdr-body-scan-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.10,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          aria-hidden="true"
          width="320"
          height="320"
          viewBox="0 0 320 320"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.80" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* Ambient pulsing point */}
          <circle
            cx="160" cy="160" r="42"
            fill={`url(#${auraId})`}
            opacity={0.40}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${pointScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear",
            }}
          />
          <circle
            cx="160" cy="160" r="5"
            fill={phaseColor}
            opacity={0.75}
            style={{
              transform: `scale(${pointScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 200ms linear",
            }}
          />

          {/* 4 zone progression dots top */}
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={`zone-dot-${i}`}
              cx={136 + i * 16} cy="20" r="3"
              fill={phaseColor}
              opacity={i === zoneIdx ? 0.85 : i < zoneIdx ? 0.50 : 0.18}
              style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out" }}
            />
          ))}

          {/* Bottom countdown — small mono */}
          <text
            x="160" y="300"
            fontSize="13"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={colors.text.muted}
            opacity={secondsRemaining > 0 ? 0.55 : 0.20}
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
          >
            {secondsRemaining > 0 ? `${secondsRemaining}s` : ""}
          </text>
        </svg>
      </div>

      {/* Body anchor */}
      <span
        data-testid="nsdr-body-scan-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.65,
          textAlign: "center",
          minHeight: 22,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {zone.anchor}
      </span>
    </div>
  );
}
