"use client";
/* ═══════════════════════════════════════════════════════════════
   PosturalAlignmentPrimitive — Phase 7 SP-M-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Alineación 5 Puntos" del
   protocolo #12 Neural Ascension. Body silhouette + 5 postural
   anchor zones ASCENDING (feet → glutes → spine → shoulders →
   head) + vertical postural axis line que se construye progresivo.

   Differentiation vs SP-K-2 (sensory ascending) y SP-L-2 (relax
   descending):
     - SP-K-2 SensoryAwake: 6 sensory zones + tactile pulse muslos
     - SP-L-2 RelaxationDescent: 7 release zones descending
     - SP-M-2 (este): 5 POSTURAL zones ascending + vertical axis
       building (alignment focus, not sensation/release)

   5-zone progression (5 × 7s = 35s) + axis builds bottom-up:
     Zone 1 feet (cy=320):   "Pies firmes en el suelo"
     Zone 2 glutes (cy=240): "Glúteos en la silla"
     Zone 3 spine (cy=170):  "Columna recta · larga"
     Zone 4 shoulders (cy=100): "Hombros un poco atrás"
     Zone 5 head (cy=58):    "Cabeza alineada · centrada"

   Estructura semántica clara (lesson SP-K-2 v3):
     1. PRIMARY ACTION (constante): "Alinea tu postura, zona a zona"
     2. DYNAMIC PROMPT: postural cue per zone + countdown
     3. BODY ANCHOR: sensación postural concreta per zone

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Sin posture extra requerida — visualización mental del check.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Alineación 5 Puntos";

const PRIMARY_ACTION = "Alinea tu postura, zona a zona";
const PRIMARY_RHYTHM = "Pies → cabeza · 7 segundos por zona";

// 5 postural zones ASCENDING (feet → head)
const ZONES = [
  { key: "feet",      cy: 320, label: "PIES",      prompt: "Pies firmes en el suelo",       anchor: "Apoyo firme abajo" },
  { key: "glutes",    cy: 240, label: "GLÚTEOS",   prompt: "Glúteos en la silla",            anchor: "Asiento estable" },
  { key: "spine",     cy: 170, label: "COLUMNA",   prompt: "Columna recta · larga",          anchor: "Eje vertical" },
  { key: "shoulders", cy: 100, label: "HOMBROS",   prompt: "Hombros un poco atrás · suaves", anchor: "Apertura · sin tensión" },
  { key: "head",      cy: 58,  label: "CABEZA",    prompt: "Cabeza alineada · al centro",    anchor: "Coronilla arriba" },
];

const ZONE_DURATION_MS = 7000;
const TOTAL_ZONES = ZONES.length;

/**
 * @param {object} props
 * @param {number} [props.duration_ms]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function PosturalAlignmentPrimitive({
  duration_ms,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9
  const uid = useId();
  const haloId = `paBlur-${uid}`;
  const vignetteId = `paVignette-${uid}`;
  const auraId = `paAura-${uid}`;
  const axisGradId = `paAxisGrad-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const totalDurationMs = duration_ms || (ZONE_DURATION_MS * TOTAL_ZONES);

  const [completed, setCompleted] = useState(false);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [zoneSecondsRemaining, setZoneSecondsRemaining] = useState(7);
  const [waveY, setWaveY] = useState(null);

  const lastZoneRef = useRef(-1);

  const triggerEnergyWave = (newZone) => {
    if (reduceMotion) return;
    setWaveY(ZONES[newZone]?.cy ?? 320);
    setTimeout(() => setWaveY(null), 1300);
  };

  // Main RAF tick
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

      const zone = Math.min(TOTAL_ZONES - 1, Math.floor(elapsed / ZONE_DURATION_MS));
      const inZoneMs = elapsed - zone * ZONE_DURATION_MS;
      const secsLeft = Math.max(0, Math.ceil((ZONE_DURATION_MS - inZoneMs) / 1000));
      setZoneSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (zone !== lastZoneRef.current) {
        lastZoneRef.current = zone;
        setZoneIdx(zone);
        triggerEnergyWave(zone);
        if (hapticEnabled && zone > 0) {
          try { hap("tap"); } catch {}
        }
      }

      if (elapsed >= totalDurationMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(12, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [totalDurationMs, hapticEnabled, reduceMotion]);

  // Particles
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 280;
    canvas.height = 360;
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

  const activeZone = ZONES[zoneIdx] || ZONES[0];

  // Zone activation: zones at idx <= current = aligned (lit)
  const zoneActive = (key) => {
    const idx = ZONES.findIndex((z) => z.key === key);
    return zoneIdx >= idx;
  };

  const zoneIntensity = (key) => {
    const idx = ZONES.findIndex((z) => z.key === key);
    if (zoneIdx === idx) return 1.0;     // ACTIVE (aligning right now)
    if (zoneIdx > idx) return 0.55;      // ALIGNED (locked)
    return 0.0;
  };

  // Vertical axis fill: bottom-up cumulative per zones aligned
  // axis spans from feet (y=320) up to head (y=58)
  const axisBottomY = 320;
  const axisTopY = 58;
  const axisFullHeight = axisBottomY - axisTopY; // 262
  // Map zoneIdx to axis fill height (zone 0 = feet = axis just at bottom; zone 4 = head = full axis)
  const zoneCyValues = ZONES.map((z) => z.cy);
  const currentAxisTopY = zoneCyValues[zoneIdx]; // current zone position
  const axisCurrentHeight = axisBottomY - currentAxisTopY;

  return (
    <div
      data-v2-postural-alignment
      data-zone-idx={zoneIdx}
      data-zone-key={activeZone.key}
      data-completed={completed ? "true" : "false"}
      data-testid="postural-alignment-primitive"
      role="region"
      aria-label="Alineación postural ascendente, pies a cabeza"
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
        data-testid="postural-alignment-phase-label"
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

      {/* PRIMARY ACTION — constant */}
      <div
        data-testid="postural-alignment-instruction"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          paddingInline: spacing.s16,
          minHeight: 48,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 17,
            fontWeight: typography.weight.medium,
            letterSpacing: "-0.02em",
            color: colors.text.strong,
            lineHeight: 1.3,
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          {PRIMARY_ACTION}
        </p>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 13,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.01em",
            color: colors.text.secondary,
            opacity: 0.75,
            textAlign: "center",
          }}
        >
          {PRIMARY_RHYTHM}
        </span>
      </div>

      {/* DYNAMIC PROMPT — current zone */}
      <div
        data-testid="postural-alignment-zone-focus"
        aria-live="polite"
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.s12,
          minHeight: 22,
        }}
      >
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 14,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.10em",
            color: phaseColor,
            opacity: 1,
            textTransform: "uppercase",
            transition: reduceMotion ? "none" : "color 320ms ease-out",
          }}
        >
          {activeZone.label}
        </span>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            color: colors.text.muted,
            opacity: 0.55,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {zoneSecondsRemaining}s
        </span>
      </div>

      {/* Zone-specific prompt subtitle (postural cue) */}
      <p
        data-testid="postural-alignment-zone-prompt"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 14,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.85,
          textAlign: "center",
          minHeight: 20,
          maxWidth: 300,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {activeZone.prompt}
      </p>

      <div
        style={{
          position: "relative",
          width: 280,
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="postural-alignment-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.16,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          data-testid="postural-alignment-silhouette"
          aria-hidden="true"
          width="240"
          height="340"
          viewBox="0 0 240 340"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.06" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.45" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={axisGradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0.65" />
            </linearGradient>
          </defs>

          <ellipse cx="120" cy="170" rx="110" ry="160" fill={`url(#${vignetteId})`} />

          {/* Body silhouette */}
          <path
            d="M 120 36
               C 109 36, 100 46, 100 60
               C 100 70, 104 79, 110 84
               L 110 90
               C 100 92, 86 96, 82 108
               C 78 122, 76 138, 76 158
               L 76 196
               C 76 210, 78 222, 84 234
               L 88 248
               C 88 260, 90 270, 90 280
               L 90 308
               C 90 314, 94 318, 100 318
               L 108 318
               C 110 314, 112 308, 112 300
               L 112 250
               L 128 250
               L 128 300
               C 128 308, 130 314, 132 318
               L 140 318
               C 146 318, 150 314, 150 308
               L 150 280
               C 150 270, 152 260, 152 248
               L 156 234
               C 162 222, 164 210, 164 196
               L 164 158
               C 164 138, 162 122, 158 108
               C 154 96, 140 92, 130 90
               L 130 84
               C 136 79, 140 70, 140 60
               C 140 46, 131 36, 120 36 Z"
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.8"
            opacity={0.30 + (zoneIdx / TOTAL_ZONES) * 0.35}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />

          {/* VERTICAL POSTURAL AXIS — builds bottom-up per zone aligned */}
          <rect
            x="116" y={currentAxisTopY} width="8" height={axisBottomY - currentAxisTopY}
            fill={`url(#${axisGradId})`}
            rx="4"
            opacity="0.95"
            style={{ transition: reduceMotion ? "none" : "all 600ms ease-out" }}
          />
          {/* Axis outer glow */}
          <rect
            x="113" y={currentAxisTopY} width="14" height={axisBottomY - currentAxisTopY}
            fill="none"
            stroke={phaseColor}
            strokeWidth="0.5"
            opacity={0.40}
            rx="6"
            style={{ transition: reduceMotion ? "none" : "all 600ms ease-out" }}
          />

          {/* Zone halos (per zone) */}
          {ZONES.map((zone) => {
            const isActive = zoneActive(zone.key);
            const intensity = zoneIntensity(zone.key);
            if (!isActive) return null;

            if (zone.key === "head") {
              return (
                <circle
                  key={`zn-${zone.key}`}
                  cx="120" cy="58" r="32"
                  fill={`url(#${auraId})`}
                  opacity={intensity * 0.95}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                  style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                />
              );
            }
            if (zone.key === "shoulders") {
              return (
                <g key={`zn-${zone.key}`}>
                  {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
                    <circle
                      key={`sh-${i}`}
                      cx={pt.x} cy={pt.y} r="14"
                      fill={`url(#${auraId})`}
                      opacity={intensity * 0.85}
                      filter={reduceMotion ? undefined : `url(#${haloId})`}
                      style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                    />
                  ))}
                </g>
              );
            }
            if (zone.key === "spine") {
              return (
                <ellipse
                  key={`zn-${zone.key}`}
                  cx="120" cy="170" rx="22" ry="40"
                  fill={`url(#${auraId})`}
                  opacity={intensity * 0.75}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                  style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                />
              );
            }
            if (zone.key === "glutes") {
              return (
                <ellipse
                  key={`zn-${zone.key}`}
                  cx="120" cy="240" rx="36" ry="14"
                  fill={`url(#${auraId})`}
                  opacity={intensity * 0.85}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                  style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                />
              );
            }
            if (zone.key === "feet") {
              return (
                <g key={`zn-${zone.key}`}>
                  {[{ x: 97, y: 320 }, { x: 143, y: 320 }].map((pt, i) => (
                    <ellipse
                      key={`f-${i}`}
                      cx={pt.x} cy={pt.y} rx="20" ry="4"
                      fill={`url(#${auraId})`}
                      opacity={intensity * 0.85}
                      filter={reduceMotion ? undefined : `url(#${haloId})`}
                      style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                    />
                  ))}
                </g>
              );
            }
            return null;
          })}

          {/* Static body landmarks (always visible) */}
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.55" />
          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <circle key={`sh-${i}`} cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.75" />
          ))}
          {[{ x1: 84, x2: 110 }, { x1: 130, x2: 156 }].map((seg, i) => (
            <line key={`ft-${i}`}
              x1={seg.x1} y1="320" x2={seg.x2} y2="320"
              stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round"
              opacity="0.85"
            />
          ))}

          {/* Energy wave at zone transition (ascending direction) */}
          {waveY !== null && (
            <ellipse
              cx="120" cy={waveY} rx="48" ry="6"
              fill={phaseColor}
              opacity="0.55"
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{
                animation: reduceMotion ? "none" : "paAlignmentWave 1300ms ease-out 1",
              }}
            />
          )}
        </svg>

        <style jsx>{`
          @keyframes paAlignmentWave {
            0% { opacity: 0; transform: scaleY(0.5) translateY(8px); }
            30% { opacity: 0.85; transform: scaleY(1) translateY(0); }
            100% { opacity: 0; transform: scaleY(1.4) translateY(-8px); }
          }
        `}</style>
      </div>

      {/* Body anchor — postural sensation */}
      <span
        data-testid="postural-alignment-body-anchor"
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.01em",
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          minHeight: 22,
          maxWidth: 320,
          transition: reduceMotion ? "none" : "opacity 220ms ease-out",
        }}
      >
        {activeZone.anchor}
      </span>

      {/* Zone counter */}
      <span
        data-testid="postural-alignment-zone-counter"
        aria-label={`Zona ${zoneIdx + 1} de ${TOTAL_ZONES}`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          opacity: 0.55,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {zoneIdx + 1} / {TOTAL_ZONES}
      </span>
    </div>
  );
}
