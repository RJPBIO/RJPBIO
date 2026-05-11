"use client";
/* ═══════════════════════════════════════════════════════════════
   PowerPostureAlignmentPrimitive — Phase 7 SP-V-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Postura Erguida" del protocolo
   #23 Power Pose Activation (active tier, energia intent).

   Mecanismo (Cuddy 2018 p-curve análisis):
     Postura erguida expansiva activa propiocepción central +
     modifica postural feedback effect. NO se reclama efecto
     hormonal de Carney 2010 (no replicado).

   Visual signature — distinto a HummingPreparation (#22 P1):
     - Body axis vertical central + 3 horizontal expansion zones
       (pies/base, columna/medio, hombros/superior).
     - Cada zona muestra arrows expansivos outward (no checkmarks)
       cuando se activa — simbolizando expansión postural.
     - Sequential activation: pies (foundation) → columna (axis)
       → hombros (expanded).
     - Diferenciador clave: arrows lateral expansion en lugar de
       vertebrae horizontales de #22.

   Active tier compliance:
     - validate.kind: "min_duration", min_ms: 25000.
     - voice.enabled_default: false.
     - binaural.action: "start", type: "energia".
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Postura · Expansión";
const PROMPT_MAIN = "Pies firmes. Columna erguida.";
const PROMPT_HINT = "Hombros un poco atrás. Cabeza alineada.";
const BODY_ANCHOR = "Espacio. Apertura. Presencia.";

const EXPANSION_ZONES = [
  // direction: "down" (grounding), "vertical" (lengthening), "lateral" (wide)
  { id: "feet", label: "Pies firmes", y: 240, direction: "down" },
  { id: "spine", label: "Columna erguida", y: 165, direction: "vertical" },
  { id: "shoulders", label: "Hombros expandidos", y: 90, direction: "lateral" },
];

/**
 * @param {object} props
 * @param {number} [props.durationMs=30000]
 * @param {boolean} [props.hapticEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function PowerPostureAlignmentPrimitive({
  durationMs = 30000,
  hapticEnabled = true,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(0); // deep cyan — entry of #23 chain
  const uid = useId();
  const haloId = `pp1Blur-${uid}`;
  const vignetteId = `pp1Vignette-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [zoneIdx, setZoneIdx] = useState(-1); // last activated zone
  const [breathPhase, setBreathPhase] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(durationMs / 1000));
  const [completed, setCompleted] = useState(false);

  const lastZoneRef = useRef(-1);

  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(() => {
        setZoneIdx(EXPANSION_ZONES.length - 1);
        setCompleted(true);
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
      }, 1500);
      return () => clearTimeout(t);
    }

    let stopped = false;
    let raf;
    const startTime = performance.now();
    const cycleMs = 8000;

    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / durationMs, 1);
      setBreathPhase((Math.sin((elapsed / cycleMs) * Math.PI * 2 - Math.PI / 2) + 1) * 0.5);

      // Activate zones at 25%, 50%, 75%
      const nextZone = Math.min(EXPANSION_ZONES.length - 1, Math.floor(ratio * 4));
      if (nextZone !== lastZoneRef.current && nextZone >= 0) {
        lastZoneRef.current = nextZone;
        setZoneIdx(nextZone);
        if (hapticEnabled) {
          try { hap("tap"); } catch {}
        }
      }

      const secs = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setSecondsRemaining((prev) => (prev !== secs ? secs : prev));

      if (ratio >= 1) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(23, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [durationMs, hapticEnabled, reduceMotion]);

  return (
    <div
      data-v2-power-posture-alignment
      data-completed={completed ? "true" : "false"}
      data-testid="power-posture-alignment-primitive"
      role="region"
      aria-label="Alineación postural expansiva"
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
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 19,
          fontWeight: typography.weight.medium,
          color: phaseColor,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          letterSpacing: "-0.02em",
        }}
      >
        {PROMPT_MAIN}
      </p>

      <span
        style={{
          fontFamily: typography.family,
          fontSize: 13,
          fontWeight: typography.weight.light,
          color: colors.text.muted,
          opacity: 0.65,
          textAlign: "center",
        }}
      >
        {PROMPT_HINT}
      </span>

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
        <svg
          aria-hidden="true"
          width="320" height="320" viewBox="0 0 320 320"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* Body axis vertical line (head→base) — central spine */}
          <line
            x1="160" y1="60" x2="160" y2="270"
            stroke={phaseColor}
            strokeWidth="1.2"
            opacity={(0.35 + breathPhase * 0.15).toFixed(3)}
            strokeLinecap="round"
          />

          {/* Top dot (head) + bottom dot (base) */}
          <circle cx="160" cy="60" r="4" fill={phaseColor} opacity="0.65" />
          <circle cx="160" cy="270" r="4" fill={phaseColor} opacity="0.65" />

          {/* 3 expansion zones — cada zona con direction anatomical específica:
              - "down" (pies): arrows hacia abajo (grounding, peso al suelo)
              - "vertical" (columna): arrows vertical bidireccional (lengthening)
              - "lateral" (hombros): arrows lateral (wide expansion) */}
          {EXPANSION_ZONES.map((zone, i) => {
            const active = i <= zoneIdx;
            const justActivated = i === zoneIdx;
            const reach = active ? (justActivated ? 36 : 30) : 14;
            const stroke = active ? 2.0 : 1.2;
            const op = active ? 0.95 : 0.35;

            // Helper to render arrow head at endpoint with given direction angle (radians)
            const renderArrow = (cx, cy, angle, key) => {
              const headLen = 7;
              const headAngle = Math.PI / 6;
              const hx1 = cx - Math.cos(angle - headAngle) * headLen;
              const hy1 = cy - Math.sin(angle - headAngle) * headLen;
              const hx2 = cx - Math.cos(angle + headAngle) * headLen;
              const hy2 = cy - Math.sin(angle + headAngle) * headLen;
              return (
                <path
                  key={`h-${key}`}
                  d={`M ${hx1.toFixed(2)} ${hy1.toFixed(2)} L ${cx.toFixed(2)} ${cy.toFixed(2)} L ${hx2.toFixed(2)} ${hy2.toFixed(2)}`}
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.92"
                />
              );
            };

            return (
              <g key={`zone-${zone.id}`}>
                {justActivated && (
                  <circle
                    cx="160" cy={zone.y} r="22"
                    fill={phaseColor}
                    opacity="0.16"
                    filter={reduceMotion ? undefined : `url(#${haloId})`}
                  />
                )}

                {/* Center dot at zone */}
                <circle
                  cx="160" cy={zone.y} r={active ? 3.2 : 2.0}
                  fill={phaseColor}
                  opacity={active ? 0.95 : 0.45}
                />

                {zone.direction === "lateral" && (
                  <>
                    {/* Lateral arrows ← → */}
                    <line x1={160 - reach - 28} y1={zone.y} x2={160 - 12} y2={zone.y}
                      stroke={phaseColor} strokeWidth={stroke} strokeLinecap="round" opacity={op}
                      style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out" }} />
                    <line x1={160 + 12} y1={zone.y} x2={160 + reach + 28} y2={zone.y}
                      stroke={phaseColor} strokeWidth={stroke} strokeLinecap="round" opacity={op}
                      style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out" }} />
                    {active && renderArrow(160 - reach - 28, zone.y, Math.PI, `${zone.id}-l`)}
                    {active && renderArrow(160 + reach + 28, zone.y, 0, `${zone.id}-r`)}
                  </>
                )}

                {zone.direction === "vertical" && (
                  <>
                    {/* Vertical arrows ↑ ↓ (lengthening spine) */}
                    <line x1="160" y1={zone.y - reach - 16} x2="160" y2={zone.y - 12}
                      stroke={phaseColor} strokeWidth={stroke} strokeLinecap="round" opacity={op}
                      style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out" }} />
                    <line x1="160" y1={zone.y + 12} x2="160" y2={zone.y + reach + 16}
                      stroke={phaseColor} strokeWidth={stroke} strokeLinecap="round" opacity={op}
                      style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out" }} />
                    {active && renderArrow(160, zone.y - reach - 16, -Math.PI / 2, `${zone.id}-u`)}
                    {active && renderArrow(160, zone.y + reach + 16, Math.PI / 2, `${zone.id}-d`)}
                  </>
                )}

                {zone.direction === "down" && (
                  <>
                    {/* Downward arrows on both sides (grounding to floor) */}
                    <line x1={160 - 28} y1={zone.y + 4} x2={160 - 28} y2={zone.y + reach + 14}
                      stroke={phaseColor} strokeWidth={stroke} strokeLinecap="round" opacity={op}
                      style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out" }} />
                    <line x1={160 + 28} y1={zone.y + 4} x2={160 + 28} y2={zone.y + reach + 14}
                      stroke={phaseColor} strokeWidth={stroke} strokeLinecap="round" opacity={op}
                      style={{ transition: reduceMotion ? "none" : "opacity 380ms ease-out" }} />
                    {active && renderArrow(160 - 28, zone.y + reach + 14, Math.PI / 2, `${zone.id}-dl`)}
                    {active && renderArrow(160 + 28, zone.y + reach + 14, Math.PI / 2, `${zone.id}-dr`)}
                  </>
                )}
              </g>
            );
          })}

          {/* Zone labels arriba/debajo de cada nivel */}
          {EXPANSION_ZONES.map((zone, i) => {
            const active = i <= zoneIdx;
            return (
              <text
                key={`lbl-${zone.id}`}
                x="160" y={zone.y - 14}
                fontSize="10"
                fontFamily={typography.family}
                fontWeight={active ? "500" : "300"}
                fill={active ? phaseColor : colors.text.muted}
                opacity={active ? 0.85 : 0.40}
                textAnchor="middle"
                style={{
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  transition: reduceMotion ? "none" : "opacity 380ms ease-out, fill 380ms ease-out",
                }}
              >
                {zone.label}
              </text>
            );
          })}

          {/* Countdown */}
          <text
            x="160" y="305"
            fontSize="11"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={colors.text.muted}
            opacity="0.50"
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
          >
            {secondsRemaining}s
          </text>
        </svg>
      </div>

      <span
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          color: colors.text.secondary,
          opacity: 0.74,
          textAlign: "center",
          minHeight: 22,
        }}
      >
        {BODY_ANCHOR}
      </span>
    </div>
  );
}
