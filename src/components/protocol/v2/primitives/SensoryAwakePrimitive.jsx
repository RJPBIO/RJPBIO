"use client";
/* ═══════════════════════════════════════════════════════════════
   SensoryAwakePrimitive — Phase 7 SP-K-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated dual-mode para Phase 2 "Barrido Sensorial"
   del protocolo #10 Sensory Wake. Body silhouette completa con
   6-zone scan ascendente (feet → legs → abdomen → chest → arms →
   head) + tactile pulse indicators en muslos (finger taps).

   Two modes (one per sub-acto en Phase 2):
     mode="body_scan" (sub-acto 0, 0-35s):
       - 6-zone progression 5s each: feet → legs → abdomen → chest
         → arms → head (ascendente).
       - Body silhouette + zone glow ellipses sync.
       - Tactile pulse dots en muslos pulsando ~120bpm.
       - Body anchor evolutivo per zone.

     mode="attention_global" (sub-acto 1, 0-10s):
       - Body silhouette + ALL zones lit (post-scan).
       - Pulse continues subtle.
       - Body anchor: "Cuerpo despierto · Atención global".
       - Visual shimmer effect.

   Continuity: same body silhouette entre sub-actos eliminates
   context-switch friction (lesson SP-I-2 + SP-J-2).

   Multi-exercise tracks layered (8):
     1. BODY silhouette stylized flowing path.
     2. ZONE highlight ellipses (6 zones, glow per active stage).
     3. TACTILE pulse dots en muslos (rhythmic finger taps cue).
     4. ENERGY wave traveling up at zone transitions.
     5. DYNAMIC primary prompt evolutivo per zone/mode (aria-live).
     6. BODY anchor evolutivo per zone.
     7. ZONE counter X/6 (body_scan) o "global" indicator (attention).
     8. PHASE label "Barrido Sensorial" cyan-cool.

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Tactile dedos contra muslos = self-touch, sin sound, sin
       ambas manos required (1 mano celular + 1 mano pulse).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const PHASE_LABEL = "Barrido Sensorial";

// Zone progression ascendente (feet → head)
const ZONES = [
  { key: "feet",    cy: 308, label: "PIES",            anchor: "Siente las plantas en el suelo" },
  { key: "legs",    cy: 270, label: "PIERNAS",         anchor: "Siente la piel y los músculos" },
  { key: "abdomen", cy: 210, label: "ABDOMEN",         anchor: "Siente el vientre suave" },
  { key: "chest",   cy: 140, label: "PECHO",           anchor: "Siente la expansión al respirar" },
  { key: "arms",    cy: 100, label: "BRAZOS",          anchor: "Siente brazos y manos" },
  { key: "head",    cy: 58,  label: "CABEZA",          anchor: "Siente cara y cuero cabelludo" },
];

// Primary instruction is CONSTANT throughout the scan — never changes
const PRIMARY_ACTION = "Toca con tus dedos los muslos";
const PRIMARY_RHYTHM = "2 toques por segundo · sin parar";

const ZONE_DURATION_MS = 5000;
const TOTAL_ZONES = ZONES.length;

const TACTILE_PULSE_BPM = 120; // 2 Hz finger tap rhythm
const TACTILE_PULSE_PERIOD_MS = (60 / TACTILE_PULSE_BPM) * 1000;

const GLOBAL_LABEL = "TODO EL CUERPO";
const GLOBAL_BODY = "Siente el cuerpo entero despierto";

/**
 * @param {object} props
 * @param {"body_scan"|"attention_global"} [props.mode]
 * @param {number} [props.duration_ms]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {()=>void} [props.onComplete]
 */
export default function SensoryAwakePrimitive({
  mode = "body_scan",
  duration_ms,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,  
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(1); // cyan-cool #67E8F9
  const uid = useId();
  const blurId = `sawBlur-${uid}`;
  const haloId = `sawHalo-${uid}`;
  const vignetteId = `sawVignette-${uid}`;
  const auraId = `sawAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const totalDurationMs = duration_ms || (mode === "body_scan"
    ? ZONE_DURATION_MS * TOTAL_ZONES
    : 10000);

  const [completed, setCompleted] = useState(false);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [zoneSecondsRemaining, setZoneSecondsRemaining] = useState(5);
  const [tactilePulse, setTactilePulse] = useState(0); // 0 → 1 → 0
  const [waveY, setWaveY] = useState(null);

  const lastZoneRef = useRef(-1);

  const triggerEnergyWave = (newZone) => {
    if (reduceMotion) return;
    setWaveY(ZONES[newZone]?.cy ?? 308);
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

      if (mode === "body_scan") {
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
      }

      // Tactile pulse — sine bell curve per period (~500ms)
      const tactileT = (elapsed % TACTILE_PULSE_PERIOD_MS) / TACTILE_PULSE_PERIOD_MS;
      const tactileVal = Math.sin(tactileT * Math.PI);
      setTactilePulse((prev) => (Math.abs(prev - tactileVal) > 0.05 ? tactileVal : prev));

      if (elapsed >= totalDurationMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(10, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
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

  const activeZoneLabel = mode === "body_scan"
    ? (ZONES[zoneIdx]?.label || ZONES[0].label)
    : GLOBAL_LABEL;
  const bodyAnchor = mode === "body_scan"
    ? (ZONES[zoneIdx]?.anchor || ZONES[0].anchor)
    : GLOBAL_BODY;

  // Zone activation state
  const zoneActive = (key) => {
    if (mode === "body_scan") {
      const idx = ZONES.findIndex((z) => z.key === key);
      return zoneIdx >= idx;
    }
    return true; // attention_global: all lit
  };

  const zoneIntensity = (key) => {
    const idx = ZONES.findIndex((z) => z.key === key);
    if (mode !== "body_scan") return 0.85;
    if (zoneIdx === idx) return 1.4;     // ACTIVE zone: dramatic glow (clear focus)
    if (zoneIdx > idx) return 0.22;      // PASSED zones: very dim (clear hierarchy)
    return 0.0;
  };

  return (
    <div
      data-v2-sensory-awake
      data-mode={mode}
      data-zone-idx={zoneIdx}
      data-zone-key={ZONES[zoneIdx]?.key}
      data-completed={completed ? "true" : "false"}
      data-testid="sensory-awake-primitive"
      role="region"
      aria-label={mode === "body_scan"
        ? "Barrido sensorial ascendente, pies a cabeza, dedos pulsan sobre muslos"
        : "Atención global al cuerpo, mantén pulsación de dedos"}
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
        data-testid="sensory-awake-phase-label"
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

      {/* PRIMARY ACTION — what to DO (constant throughout entire phase) */}
      <div
        data-testid="sensory-awake-instruction"
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

      {/* SECONDARY FOCUS — what zone to feel right now (changes per zone) */}
      <div
        data-testid="sensory-awake-zone-focus"
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
            fontSize: 10,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.16em",
            color: colors.text.muted,
            opacity: 0.55,
            textTransform: "uppercase",
          }}
        >
          Atención
        </span>
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
          {activeZoneLabel}
        </span>
        {mode === "body_scan" && (
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
          data-testid="sensory-awake-particles"
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
          data-testid="sensory-awake-silhouette"
          aria-hidden="true"
          width="240"
          height="340"
          viewBox="0 0 240 340"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
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
          </defs>

          {/* Cinematic vignette */}
          <ellipse cx="120" cy="170" rx="110" ry="160" fill={`url(#${vignetteId})`} />

          {/* Body silhouette flowing path (head + torso + legs) */}
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
            opacity={mode === "body_scan" ? 0.22 + (zoneIdx / TOTAL_ZONES) * 0.30 : 0.55}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          />

          {/* Zone highlight ellipses — light up sequential ascendente */}
          {ZONES.map((zone) => {
            const isActive = zoneActive(zone.key);
            const intensity = zoneIntensity(zone.key);

            // Zone-specific shapes
            if (zone.key === "feet") {
              return (
                <g key={`zn-${zone.key}`}>
                  {[
                    { x: 97, y: 320 },
                    { x: 143, y: 320 },
                  ].map((pt, i) => (
                    <ellipse
                      key={`feet-${i}`}
                      cx={pt.x} cy={pt.y} rx="20" ry="4"
                      fill={`url(#${auraId})`}
                      opacity={isActive ? intensity * 0.85 : 0.10}
                      filter={reduceMotion ? undefined : `url(#${haloId})`}
                      style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                    />
                  ))}
                </g>
              );
            }
            if (zone.key === "legs") {
              return (
                <g key={`zn-${zone.key}`}>
                  {[
                    { x: 100, y: 280 },
                    { x: 140, y: 280 },
                  ].map((pt, i) => (
                    <ellipse
                      key={`leg-${i}`}
                      cx={pt.x} cy={pt.y} rx="10" ry="22"
                      fill={`url(#${auraId})`}
                      opacity={isActive ? intensity * 0.75 : 0.08}
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
                  cx="120" cy="210" rx="34" ry="20"
                  fill={`url(#${auraId})`}
                  opacity={isActive ? intensity * 0.85 : 0.10}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                  style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                />
              );
            }
            if (zone.key === "chest") {
              return (
                <ellipse
                  key={`zn-${zone.key}`}
                  cx="120" cy="140" rx="38" ry="20"
                  fill={`url(#${auraId})`}
                  opacity={isActive ? intensity * 0.85 : 0.10}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                  style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                />
              );
            }
            if (zone.key === "arms") {
              return (
                <g key={`zn-${zone.key}`}>
                  {[
                    { x: 86, y: 100 },
                    { x: 154, y: 100 },
                  ].map((pt, i) => (
                    <ellipse
                      key={`arm-${i}`}
                      cx={pt.x} cy={pt.y} rx="14" ry="14"
                      fill={`url(#${auraId})`}
                      opacity={isActive ? intensity * 0.85 : 0.08}
                      filter={reduceMotion ? undefined : `url(#${haloId})`}
                      style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                    />
                  ))}
                </g>
              );
            }
            if (zone.key === "head") {
              return (
                <circle
                  key={`zn-${zone.key}`}
                  cx="120" cy="58" r="32"
                  fill={`url(#${auraId})`}
                  opacity={isActive ? intensity * 0.95 : 0.10}
                  filter={reduceMotion ? undefined : `url(#${haloId})`}
                  style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
                />
              );
            }
            return null;
          })}

          {/* Zone outline rings (subtle) */}
          <circle cx="120" cy="58" r="20" fill="none" stroke={phaseColor} strokeWidth="1" opacity="0.55" />
          {[{ x: 86, y: 100 }, { x: 154, y: 100 }].map((pt, i) => (
            <circle key={`sh-${i}`} cx={pt.x} cy={pt.y} r="5" fill={phaseColor} opacity="0.85" />
          ))}


          {/* Subtle tactile pulse dots on thighs — pure visual, no text */}
          <circle
            cx="100" cy="265" r={3 + tactilePulse * 3}
            fill={phaseColor}
            opacity={0.40 + tactilePulse * 0.30}
            filter={reduceMotion ? undefined : `url(#${blurId})`}
          />
          <circle
            cx="100" cy="265" r="2.5"
            fill={phaseColor}
            opacity={0.75}
          />
          <circle
            cx="140" cy="265" r={3 + tactilePulse * 3}
            fill={phaseColor}
            opacity={0.40 + tactilePulse * 0.30}
            filter={reduceMotion ? undefined : `url(#${blurId})`}
          />
          <circle
            cx="140" cy="265" r="2.5"
            fill={phaseColor}
            opacity={0.75}
          />

          {/* Energy wave at zone transition */}
          {waveY !== null && (
            <ellipse
              cx="120" cy={waveY} rx="48" ry="6"
              fill={phaseColor}
              opacity="0.55"
              filter={reduceMotion ? undefined : `url(#${haloId})`}
              style={{
                animation: reduceMotion ? "none" : "sawWavePulse 1300ms ease-out 1",
              }}
            />
          )}
        </svg>

        <style jsx>{`
          @keyframes sawWavePulse {
            0% { opacity: 0; transform: scaleY(0.5); }
            30% { opacity: 0.85; transform: scaleY(1); }
            100% { opacity: 0; transform: scaleY(1.4); }
          }
          @keyframes sawZoneRingPulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 0.95; }
          }
          @keyframes sawGlobalShimmer {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Tactile rhythm visualizer — shows the 2 toques/segundo cadence visually */}
      <div
        data-testid="sensory-awake-pulse-bar"
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 10,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.18em",
            color: colors.text.muted,
            opacity: 0.55,
            textTransform: "uppercase",
          }}
        >
          Ritmo
        </span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const offsetT = (tactilePulse + i / 6) % 1;
            const intensity = Math.sin(offsetT * Math.PI);
            return (
              <div
                key={`pb-${i}`}
                style={{
                  width: 4,
                  height: 4 + intensity * 8,
                  background: phaseColor,
                  borderRadius: 2,
                  opacity: 0.30 + intensity * 0.55,
                  transition: reduceMotion ? "none" : "all 80ms linear",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Body anchor */}
      <span
        data-testid="sensory-awake-body-anchor"
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

      {/* Zone counter or global indicator */}
      {mode === "body_scan" ? (
        <span
          data-testid="sensory-awake-zone-counter"
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
          data-testid="sensory-awake-global-indicator"
          style={{
            fontFamily: typography.familyMono,
            fontSize: 11,
            letterSpacing: "0.18em",
            color: colors.text.muted,
            opacity: 0.55,
            textTransform: "uppercase",
          }}
        >
          GLOBAL
        </span>
      )}
    </div>
  );
}
