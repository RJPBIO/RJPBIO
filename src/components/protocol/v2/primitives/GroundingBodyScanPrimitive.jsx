"use client";
/* ═══════════════════════════════════════════════════════════════
   GroundingBodyScanPrimitive — Phase 7 SP-G-1
   ───────────────────────────────────────────────────────────────
   Visual primitive dedicated para Aterrizaje Sensorial — Phase 1
   "Aterrizaje Sensorial" del protocolo #6 Grounded Steel.

   Body scan secuencial 5 puntos × 8s = 40s total. Atención
   propioceptiva activa ínsula posterior + grounding cuerpo en silla
   (Khalsa 2018 + Mehling 2009 MAIA interocepción).

   Diferenciación vs Tier 1A+1B Phase 1 primitives:
     - #1 ParasympathicResetOrb: Respiratorio BOX 4-4-4-4
     - #2 CardiacCoherence: Respiratorio HeartMath 6-2-8-0
     - #3 DescargaRapida: Respiratorio 1:3 dramatic
     - #4 BilateralPulseActivation: Motor bilateral
     - #5 PanoramicVision: Visual paradox passive
     - **#6 GroundingBodyScan: Propioceptivo secuencial** ← NUEVO modality

   5 zones secuenciales (8s × 5 = 40s):
     0-8s:   PIES — contacto con piso
     8-16s:  GLÚTEOS — contacto con silla
     16-24s: ESPALDA — apoyada
     24-32s: MANOS — en regazo
     32-40s: MANDÍBULA — relajada

   Multi-task tracks layered (6):
     1. PRIMARY visual: SVG silhouette body con zone highlight progressive.
     2. DYNAMIC active zone big text per timer (PIES/GLÚTEOS/ESPALDA/MANOS/MANDÍBULA).
     3. 5-zone progress indicator (5 chips horizontal active/done/pending).
     4. BODY anchor sustained: "Cuerpo en silla · Inmóvil".
     5. COUNTDOWN ring overall 40s.
     6. PHASE label "Aterrizaje Sensorial" cyan-deep.
     + Particles ambient continuity.

   Functional human logic:
     - Mientras observas silhouette + zone label (visual cognitive),
       sientes ESA zona del cuerpo (propioceptivo).
     - "Cuerpo en silla · Inmóvil" sustained — minimiza movimiento
       para focus interocéptivo.
     - Active zone big text guía atención mental.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - User permanece inmóvil sentado durante 40s — solo atención mueve.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Aterrizaje Sensorial";
const PRIMARY_INSTRUCTION = "Atención secuencial · 5 puntos del cuerpo";
const BODY_ANCHOR_CUE = "Cuerpo en silla · Inmóvil";

const ZONE_TRANSITION_MS = 8000;
const DEFAULT_DURATION_MS = 40000;
const RING_SIZE = 240;
const RING_RADIUS = 110;

const ZONES = [
  { idx: 0, label: "Pies",      svgKey: "feet" },
  { idx: 1, label: "Glúteos",   svgKey: "glutes" },
  { idx: 2, label: "Espalda",   svgKey: "back" },
  { idx: 3, label: "Manos",     svgKey: "hands" },
  { idx: 4, label: "Mandíbula", svgKey: "jaw" },
];

// SVG viewBox 0 0 200 360 — silhouette humana anatómicamente
// proporcional (head + neck + shoulders + tapered torso + hips +
// 2 legs separated). Posiciones de zonas overlays alineadas a
// anatomía real per zone label.
const ZONE_GEOMETRY = {
  // Mandíbula: rect área inferior cara (debajo del centro de la cabeza)
  jaw:    { type: "rect", x: 84, y: 42, w: 32, h: 14, rx: 6 },
  // Espalda: torso center superior
  back:   { type: "rect", x: 64, y: 78, w: 72, h: 78, rx: 6 },
  // Manos: laterales en muslo superior (regazo) — DOS rects (L+R)
  hands:  { type: "split", left:  { x: 36, y: 178, w: 24, h: 22, rx: 6 },
                          right: { x: 140, y: 178, w: 24, h: 22, rx: 6 } },
  // Glúteos: hip area
  glutes: { type: "rect", x: 60, y: 168, w: 80, h: 28, rx: 6 },
  // Pies: dos rects al final (L+R)
  feet:   { type: "split", left:  { x: 64, y: 332, w: 32, h: 16, rx: 4 },
                          right: { x: 104, y: 332, w: 32, h: 16, rx: 4 } },
};

// Anatomic outline path — silhouette humana stylized, slim, elegante.
// Proporciones: head 1, neck 0.3, shoulders 1.4× head, torso 3×, hips 1.5×, legs 4×.
const SILHOUETTE_PATH = [
  // Head: circle approximated via path
  "M 100 12",
  "C 88 12, 78 22, 78 36",
  "C 78 50, 88 60, 100 60",
  "C 112 60, 122 50, 122 36",
  "C 122 22, 112 12, 100 12",
  "Z",
  // Neck + torso + arms + hips + legs as one outline
  "M 92 60",
  "L 92 70",
  "L 70 76",       // left shoulder
  "L 60 88",       // left arm outer top
  "L 56 168",      // left arm down to hip area
  "L 60 200",      // left hand area
  "L 66 200",      // left hand inner
  "L 68 168",      // back to torso left
  "L 70 156",      // hip taper
  "L 72 168",      // left hip
  "L 76 200",      // left thigh top
  "L 70 280",      // left thigh down
  "L 70 332",      // left calf
  "L 70 350",      // left foot
  "L 96 350",
  "L 96 332",
  "L 96 280",
  "L 100 200",     // crotch
  "L 104 280",
  "L 104 332",
  "L 104 350",
  "L 130 350",
  "L 130 332",
  "L 130 280",
  "L 124 200",     // right thigh top
  "L 128 168",     // right hip
  "L 130 156",
  "L 132 168",
  "L 134 200",     // right hand inner
  "L 140 200",     // right hand
  "L 144 168",     // right arm down
  "L 140 88",      // right arm
  "L 130 76",      // right shoulder
  "L 108 70",
  "L 108 60",      // right neck
  "Z",
].join(" ");

/**
 * @param {object} props
 * @param {number} [props.duration_ms=40000]
 * @param {boolean} [props.audioEnabled=true]
 * @param {boolean} [props.hapticEnabled=true]
 * @param {boolean} [props.voiceEnabled=false]
 * @param {()=>void} [props.onComplete]
 */
export default function GroundingBodyScanPrimitive({
  duration_ms = DEFAULT_DURATION_MS,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep #0E7490

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Active zone tracker + progress ─────────────────────────────
  const [activeZoneIdx, setActiveZoneIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setActiveZoneIdx(0);
    setProgress(0);
    setCompleted(false);
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(1, elapsed / duration_ms);
      setProgress(pct);
      const zoneIdx = Math.min(ZONES.length - 1, Math.floor(elapsed / ZONE_TRANSITION_MS));
      setActiveZoneIdx(zoneIdx);
      if (pct >= 1) {
        clearInterval(intervalId);
        setCompleted(true);
        if (hapticEnabled) {
          try {
            hapticProtocolSignature(6, "phase_shift", { reducedMotion: reduceMotion });
          } catch { /* noop */ }
        }
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        } catch { /* noop */ }
      }
    }, 200);
    return () => clearInterval(intervalId);
  }, [duration_ms, hapticEnabled, reduceMotion]);

  // ─── Particles ambient ──────────────────────────────────────────
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
    } catch (e) { /* noop */ }
    return () => {
      if (particleSysRef.current) {
        try { particleSysRef.current.stop(); } catch { /* noop */ }
        particleSysRef.current = null;
      }
    };
  }, [reduceMotion]);

  const ringCircumference = 2 * Math.PI * RING_RADIUS;
  const ringDashOffset = ringCircumference * (1 - progress);

  const activeZone = ZONES[Math.min(activeZoneIdx, ZONES.length - 1)];
  const activeKey = activeZone.svgKey;

  // Helper: render zone(s) — supports rect or split (L+R for hands/feet).
  const renderZone = (key) => {
    const g = ZONE_GEOMETRY[key];
    const isActive = key === activeKey;
    const fill = isActive ? "rgba(14,116,144,0.36)" : "transparent";
    const stroke = isActive ? phaseColor : "rgba(245,245,247,0.0)";
    const strokeWidth = isActive ? 1.5 : 0;
    const filter = isActive ? "url(#zoneGlow)" : "none";
    if (g.type === "split") {
      return (
        <g key={key} filter={filter}>
          <rect
            x={g.left.x}
            y={g.left.y}
            width={g.left.w}
            height={g.left.h}
            rx={g.left.rx || 4}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <rect
            x={g.right.x}
            y={g.right.y}
            width={g.right.w}
            height={g.right.h}
            rx={g.right.rx || 4}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </g>
      );
    }
    return (
      <rect
        key={key}
        x={g.x}
        y={g.y}
        width={g.w}
        height={g.h}
        rx={g.rx || 4}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        filter={filter}
      />
    );
  };

  return (
    <div
      data-v2-grounding-body-scan
      data-active-zone-idx={activeZoneIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="grounding-body-scan-primitive"
      role="region"
      aria-label="Aterrizaje Sensorial, body scan secuencial 5 puntos"
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
      {/* Phase label */}
      <span
        data-testid="grounding-body-scan-phase-label"
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

      {/* Primary instruction */}
      <p
        data-testid="grounding-body-scan-instruction"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 17,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: colors.text.strong,
          lineHeight: 1.3,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
        }}
      >
        {PRIMARY_INSTRUCTION}
      </p>

      {/* Dynamic active zone big text */}
      <span
        data-testid="grounding-body-scan-active-zone"
        data-zone={activeZone.svgKey}
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: 32,
          fontWeight: typography.weight.light,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: phaseColor,
          opacity: 0.95,
          minWidth: 200,
          textAlign: "center",
        }}
      >
        {activeZone.label}
      </span>

      {/* Visual stack: silhouette SVG + countdown ring + particles */}
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
        {/* Particles ambient */}
        <canvas
          ref={particleCanvasRef}
          data-testid="grounding-body-scan-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.25,
            transition: "opacity 200ms ease-out",
          }}
        />

        {/* Countdown ring outer */}
        <svg
          data-testid="grounding-body-scan-ring"
          aria-hidden="true"
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          style={{ position: "absolute", transform: "rotate(-90deg)" }}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={phaseColor}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringDashOffset}
            style={{
              transition: reduceMotion ? "none" : "stroke-dashoffset 200ms linear",
              opacity: 0.55,
            }}
          />
        </svg>

        {/* Body silhouette SVG anatomically correct con zonas */}
        <svg
          data-testid="grounding-body-scan-silhouette"
          aria-label="Silueta corporal con zona activa"
          width="160"
          height="290"
          viewBox="0 0 200 360"
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* SVG defs for active zone glow filter */}
          <defs>
            <filter id="zoneGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Body outline path — anatomical silhouette */}
          <path
            d={SILHOUETTE_PATH}
            fill="rgba(255,255,255,0.025)"
            stroke="rgba(245,245,247,0.30)"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />

          {/* Zone highlights (active glows + filter) */}
          {Object.keys(ZONE_GEOMETRY).map(renderZone)}
        </svg>
      </div>

      {/* 5-zone progress indicator (chips) */}
      <div
        data-testid="grounding-body-scan-zone-progress"
        aria-label={`Zona ${activeZoneIdx + 1} de ${ZONES.length}`}
        style={{
          display: "flex",
          gap: spacing.s8,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {ZONES.map((zone) => {
          const isActive = zone.idx === activeZoneIdx;
          const isDone = zone.idx < activeZoneIdx;
          return (
            <div
              key={zone.idx}
              data-testid={`grounding-body-scan-zone-chip-${zone.idx}`}
              data-active={isActive ? "true" : "false"}
              data-done={isDone ? "true" : "false"}
              style={{
                paddingBlock: 5,
                paddingInline: 9,
                borderRadius: 6,
                border: `0.5px solid ${isActive ? phaseColor : colors.separator}`,
                background: isActive
                  ? "rgba(14,116,144,0.18)"
                  : isDone
                    ? "rgba(14,116,144,0.06)"
                    : "rgba(255,255,255,0.02)",
                color: isActive ? phaseColor : isDone ? "rgba(14,116,144,0.6)" : colors.text.muted,
                fontFamily: typography.family,
                fontSize: 10,
                fontWeight: typography.weight.medium,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                opacity: isActive ? 1 : isDone ? 0.7 : 0.4,
                boxShadow: isActive ? "0 0 10px rgba(14,116,144,0.45)" : "none",
                transition: reduceMotion ? "none" : "all 220ms ease-out",
                minWidth: 50,
                textAlign: "center",
              }}
            >
              {zone.label}
            </div>
          );
        })}
      </div>

      {/* Body anchor sustained */}
      <span
        data-testid="grounding-body-scan-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.75,
          textAlign: "center",
        }}
      >
        {BODY_ANCHOR_CUE}
      </span>
    </div>
  );
}
