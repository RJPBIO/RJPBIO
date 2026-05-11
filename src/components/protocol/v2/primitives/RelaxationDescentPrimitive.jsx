"use client";
/* ═══════════════════════════════════════════════════════════════
   RelaxationDescentPrimitive — Phase 7 SP-L-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated dual-mode para Phase 2 "Relajación
   Descendente" del protocolo #11 Body Anchor. Body silhouette +
   7-zone scan DESCENDENTE (head → feet) con énfasis "suelta cada
   zona" + descent_hold final.

   Differentiation vs SP-K-2 SensoryAwake:
     - SP-K-2: ascendente feet→head, theme ACTIVATION (despertar)
     - SP-L-2 (este): descendente head→feet, theme RELEASE (soltar)

   Two modes:
     mode="body_scan_descent" (sub-acto 0, 0-50s):
       - 7-zone progression 7s each: head → neck → shoulders →
         arms → abdomen → legs → feet (descendente).
       - Each zone "suelta" — release/relax cue per zone.
       - Body silhouette + zone halo + subtle downward flow.
       - Body anchor evolutivo per zone (cara floja, hombros caen,
         brazos pesados, etc.).

     mode="descent_hold" (sub-acto 1, 0-10s):
       - All body lit + subtle gentle settling.
       - Body anchor: "Descenso · Sostén · Sin moverte".

   Estructura semántica clara (lesson SP-K-2 v3):
     1. PRIMARY ACTION (constante): "Suelta cada zona del cuerpo"
     2. DYNAMIC PROMPT: "Suelta · [ZONA]" (cambia per zona)
     3. BODY ANCHOR: qué SENTIR ("cara floja", "hombros caen", etc.)

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Cuerpo en silla, sin posture extra requerido.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Relajación Descendente";

// PRIMARY ACTION — constant throughout phase
const PRIMARY_ACTION = "Suelta cada zona del cuerpo";
const PRIMARY_RHYTHM = "Cabeza → pies · 7 segundos por zona";

// Zone progression DESCENDENTE (head → feet)
const ZONES = [
  { key: "head",      cy: 58,  label: "CABEZA · CARA",   anchor: "Cara floja · Mandíbula suave" },
  { key: "neck",      cy: 90,  label: "CUELLO",           anchor: "Cuello largo · Sin tensión" },
  { key: "shoulders", cy: 100, label: "HOMBROS",          anchor: "Hombros caen" },
  { key: "arms",      cy: 130, label: "BRAZOS · MANOS",   anchor: "Brazos pesados · Manos sueltas" },
  { key: "abdomen",   cy: 200, label: "ABDOMEN",          anchor: "Vientre suelto" },
  { key: "legs",      cy: 270, label: "PIERNAS",          anchor: "Piernas pesadas" },
  { key: "feet",      cy: 318, label: "PIES",             anchor: "Pies sueltos" },
];

const ZONE_DURATION_MS = 7000;
const TOTAL_ZONES = ZONES.length;

const HOLD_LABEL = "TODO EL CUERPO";
const HOLD_BODY = "Descenso · Sostén · Sin moverte";

/**
 * @param {object} props
 * @param {"body_scan_descent"|"descent_hold"} [props.mode]
 * @param {number} [props.duration_ms]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function RelaxationDescentPrimitive({
  mode = "body_scan_descent",
  duration_ms,
  audioEnabled = true, // eslint-disable-line no-unused-vars
  hapticEnabled = true,
  voiceEnabled = false, // eslint-disable-line no-unused-vars
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9
  const uid = useId();
  const haloId = `rdBlur-${uid}`;
  const vignetteId = `rdVignette-${uid}`;
  const auraId = `rdAura-${uid}`;
  const descentGradId = `rdDescentGrad-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const totalDurationMs = duration_ms || (mode === "body_scan_descent"
    ? ZONE_DURATION_MS * TOTAL_ZONES
    : 10000);

  const [completed, setCompleted] = useState(false);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [zoneSecondsRemaining, setZoneSecondsRemaining] = useState(7);
  const [waveY, setWaveY] = useState(null);

  const lastZoneRef = useRef(-1);

  const triggerDescentWave = (newZone) => {
    if (reduceMotion) return;
    setWaveY(ZONES[newZone]?.cy ?? 58);
    setTimeout(() => setWaveY(null), 1500);
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

      if (mode === "body_scan_descent") {
        const zone = Math.min(TOTAL_ZONES - 1, Math.floor(elapsed / ZONE_DURATION_MS));
        const inZoneMs = elapsed - zone * ZONE_DURATION_MS;
        const secsLeft = Math.max(0, Math.ceil((ZONE_DURATION_MS - inZoneMs) / 1000));
        setZoneSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));
        if (zone !== lastZoneRef.current) {
          lastZoneRef.current = zone;
          setZoneIdx(zone);
          triggerDescentWave(zone);
          if (hapticEnabled && zone > 0) {
            try { hap("tap"); } catch {}
          }
        }
      }

      if (elapsed >= totalDurationMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(11, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [mode, totalDurationMs, hapticEnabled, reduceMotion]);

  // Particles ambient
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

  const dynamicLabel = mode === "body_scan_descent"
    ? `Suelta · ${ZONES[zoneIdx]?.label || ZONES[0].label}`
    : `Sostén · ${HOLD_LABEL}`;
  const bodyAnchor = mode === "body_scan_descent"
    ? (ZONES[zoneIdx]?.anchor || ZONES[0].anchor)
    : HOLD_BODY;

  // Zone activation: in descent mode, ZONES "passed" = already released = stay lit (relaxed)
  const zoneActive = (key) => {
    if (mode === "body_scan_descent") {
      const idx = ZONES.findIndex((z) => z.key === key);
      return zoneIdx >= idx;
    }
    return true;
  };

  const zoneIntensity = (key) => {
    const idx = ZONES.findIndex((z) => z.key === key);
    if (mode !== "body_scan_descent") return 0.85;
    if (zoneIdx === idx) return 1.0;     // ACTIVE (releasing right now)
    if (zoneIdx > idx) return 0.45;      // RELEASED (relaxed, gentle glow)
    return 0.0;
  };

  return (
    <div
      data-v2-relaxation-descent
      data-mode={mode}
      data-zone-idx={zoneIdx}
      data-zone-key={ZONES[zoneIdx]?.key}
      data-completed={completed ? "true" : "false"}
      data-testid="relaxation-descent-primitive"
      role="region"
      aria-label={mode === "body_scan_descent"
        ? "Relajación descendente, suelta cada zona del cuerpo de cabeza a pies"
        : "Mantén el descenso, sin moverte"}
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
        data-testid="relaxation-descent-phase-label"
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
        data-testid="relaxation-descent-instruction"
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

      {/* DYNAMIC PROMPT — current zone or hold */}
      <div
        data-testid="relaxation-descent-zone-focus"
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
          {dynamicLabel}
        </span>
        {mode === "body_scan_descent" && (
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
        )}
      </div>

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
          data-testid="relaxation-descent-particles"
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
          data-testid="relaxation-descent-silhouette"
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
            <linearGradient id={descentGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.65" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
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
            opacity={mode === "body_scan_descent" ? 0.30 + (zoneIdx / TOTAL_ZONES) * 0.30 : 0.60}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />

          {/* Zone highlight ellipses */}
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
            if (zone.key === "neck") {
              return (
                <ellipse
                  key={`zn-${zone.key}`}
                  cx="120" cy="90" rx="14" ry="8"
                  fill={`url(#${auraId})`}
                  opacity={intensity * 0.85}
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
            if (zone.key === "arms") {
              return (
                <g key={`zn-${zone.key}`}>
                  {[{ x: 78, y: 140 }, { x: 162, y: 140 }].map((pt, i) => (
                    <ellipse
                      key={`a-${i}`}
                      cx={pt.x} cy={pt.y} rx="10" ry="22"
                      fill={`url(#${auraId})`}
                      opacity={intensity * 0.80}
                      filter={reduceMotion ? undefined : `url(#${haloId})`}
                      style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                    />
                  ))}
                </g>
              );
            }
            if (zone.key === "abdomen") {
              return (
                <ellipse
                  key={`zn-${zone.key}`}
                  cx="120" cy="200" rx="34" ry="22"
                  fill={`url(#${auraId})`}
                  opacity={intensity * 0.85}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                  style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                />
              );
            }
            if (zone.key === "legs") {
              return (
                <g key={`zn-${zone.key}`}>
                  {[{ x: 100, y: 280 }, { x: 140, y: 280 }].map((pt, i) => (
                    <ellipse
                      key={`l-${i}`}
                      cx={pt.x} cy={pt.y} rx="10" ry="24"
                      fill={`url(#${auraId})`}
                      opacity={intensity * 0.80}
                      filter={reduceMotion ? undefined : `url(#${haloId})`}
                      style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                    />
                  ))}
                </g>
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

          {/* Static body anchor lines (head ring, shoulder dots, feet anchors) */}
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1.2" opacity="0.55" />
          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <circle key={`sh-${i}`} cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.85" />
          ))}
          {[{ x1: 84, x2: 110 }, { x1: 130, x2: 156 }].map((seg, i) => (
            <line key={`ft-${i}`}
              x1={seg.x1} y1="320" x2={seg.x2} y2="320"
              stroke={phaseColor} strokeWidth="2" strokeLinecap="round"
              opacity="0.75"
            />
          ))}

          {/* Energy descent wave at zone transition (downward direction) */}
          {waveY !== null && (
            <ellipse
              cx="120" cy={waveY} rx="48" ry="6"
              fill={phaseColor}
              opacity="0.55"
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{
                animation: reduceMotion ? "none" : "rdDescentWave 1500ms ease-out 1",
              }}
            />
          )}

          {/* Subtle continuous descent gradient (always visible — gravity feel) */}
          <rect
            x="116" y="40" width="8" height="280"
            fill={`url(#${descentGradId})`}
            opacity={mode === "body_scan_descent" ? 0.10 + (zoneIdx / TOTAL_ZONES) * 0.20 : 0.30}
            rx="4"
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />
        </svg>

        <style jsx>{`
          @keyframes rdDescentWave {
            0% { opacity: 0; transform: scaleY(0.5) translateY(-4px); }
            30% { opacity: 0.85; transform: scaleY(1) translateY(0); }
            100% { opacity: 0; transform: scaleY(1.4) translateY(8px); }
          }
        `}</style>
      </div>

      {/* Body anchor — what to FEEL */}
      <span
        data-testid="relaxation-descent-body-anchor"
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
        {bodyAnchor}
      </span>

      {/* Counter */}
      {mode === "body_scan_descent" ? (
        <span
          data-testid="relaxation-descent-zone-counter"
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
      ) : (
        <span
          data-testid="relaxation-descent-hold-indicator"
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.18em",
            color: colors.text.muted,
            opacity: 0.55,
            textTransform: "uppercase",
          }}
        >
          SOSTÉN
        </span>
      )}
    </div>
  );
}
