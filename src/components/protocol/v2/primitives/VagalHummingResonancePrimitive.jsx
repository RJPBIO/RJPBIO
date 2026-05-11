"use client";
/* ═══════════════════════════════════════════════════════════════
   VagalHummingResonancePrimitive — Phase 7 SP-U-2
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 2 "Humming Sostenido" del
   protocolo #22 Vagal Hum Reset (active tier, calma intent).

   Mecanismo (triple sinergia documentada):
     - Humming activa nervio laríngeo recurrente (rama vagal)
       + extensión exhalatoria parasimpática (Porges 2009).
     - Vibración facial trigeminal durante humming.
     - Óxido nítrico nasal ~15× vs respiración normal
       (Maniscalco 2003 European Respiratory Journal).

   Cycle: 4 hums × 14s = 56s total (4s inhala + 10s humming mmmmm).
   Cadencia: inhala 4 segundos → exhala 10s con "mmmmm" sostenido.

   Visual signature — distinto a vagal_vocalization de #19:
     - Central facial resonance orb que vibra durante humming
       (rapid micro-pulsations 4 Hz).
     - 5 facial vibration rings emanando desde el orb (cabeza/
       cara region) durante exhale humming.
     - Nasal NO glow: 2 pequeños puntos cyan-bright animados
       arriba del orb (puentes nasales) durante humming
       — simbolizan óxido nítrico nasal activado.
     - "MMMMM" text emerges durante humming sostained.
     - 4 cycle progression dots top.

   Active tier compliance:
     - validate.kind: "tap_count", min_taps: 4.
     - voice.enabled_default: false.
     - Haptic tap al iniciar cada humming + signature al cerrar.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Humming · Resonancia Vagal";

const PROMPT_INHALE = "Inhala 4 segundos";
const PROMPT_HUM = "Exhala 10s con 'mmmmm'";
const BODY_INHALE = "Aire por la nariz";
const BODY_HUM = "Vibra cara y pecho";

const INHALE_MS = 4000;
const HUM_MS = 10000;
const CYCLE_MS = INHALE_MS + HUM_MS;

/**
 * @param {object} props
 * @param {number} [props.targetHums=4]
 * @param {number} [props.humDurationMs=10000]
 * @param {boolean} [props.hapticEnabled]
 * @param {(n:number)=>void} [props.onHumComplete]
 * @param {()=>void} [props.onComplete]
 */
export default function VagalHummingResonancePrimitive({
  targetHums = 4,
  humDurationMs = HUM_MS,
  hapticEnabled = true,
  onHumComplete,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(1); // mid cyan
  const uid = useId();
  const haloId = `hrBlur-${uid}`;
  const vignetteId = `hrVignette-${uid}`;
  const auraId = `hrAura-${uid}`;
  const nasalGlowId = `hrNasal-${uid}`;

  const onCompleteRef = useRef(onComplete);
  const onHumCompleteRef = useRef(onHumComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onHumCompleteRef.current = onHumComplete; }, [onHumComplete]);

  const cycleTotal = INHALE_MS + humDurationMs;
  const totalMs = cycleTotal * targetHums;

  const [phaseState, setPhaseState] = useState("inhale"); // inhale | hum
  const [cycleIdx, setCycleIdx] = useState(0);
  const [orbPulse, setOrbPulse] = useState(0);
  const [vibrationTick, setVibrationTick] = useState(0);
  const [microVib, setMicroVib] = useState(0); // facial micro-vibration during hum
  const [nasalPulse, setNasalPulse] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(INHALE_MS / 1000));
  const [completed, setCompleted] = useState(false);

  const lastCycleRef = useRef(0);
  const lastPhaseRef = useRef("inhale");

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
      const cycleMs = elapsed % cycleTotal;
      const currentCycle = Math.floor(elapsed / cycleTotal);

      let phase = "inhale";
      let secsLeft = 0;
      let pulse = 0;
      let vibT = 0;
      let mvib = 0;
      let nasal = 0;

      if (cycleMs < INHALE_MS) {
        phase = "inhale";
        secsLeft = Math.ceil((INHALE_MS - cycleMs) / 1000);
        const t = cycleMs / INHALE_MS;
        pulse = Math.sin(t * Math.PI * 0.5) * 0.55; // 0 → 0.55
      } else {
        phase = "hum";
        const humMs = cycleMs - INHALE_MS;
        secsLeft = Math.ceil((humDurationMs - humMs) / 1000);
        const t = humMs / humDurationMs;
        // Resonance pulse: macro envelope (0→1→0) + 4Hz micro-vib
        const envelope = Math.sin(t * Math.PI);
        const fastVib = Math.sin((humMs / 250) * Math.PI * 2);
        pulse = envelope * 0.45;
        mvib = fastVib * 0.18;
        vibT = (humMs / 1100) % 1;
        // Nasal NO glow — pulsing brightly during hum (2 Hz)
        nasal = (Math.sin((humMs / 480) * Math.PI * 2) + 1) * 0.5;
      }

      setOrbPulse((prev) => (Math.abs(prev - pulse) > 0.04 ? pulse : prev));
      setMicroVib((prev) => (Math.abs(prev - mvib) > 0.04 ? mvib : prev));
      setVibrationTick((prev) => (Math.abs(prev - vibT) > 0.02 ? vibT : prev));
      setNasalPulse((prev) => (Math.abs(prev - nasal) > 0.04 ? nasal : prev));
      setSecondsRemaining((prev) => (prev !== secsLeft ? secsLeft : prev));

      if (phase !== lastPhaseRef.current) {
        setPhaseState(phase);
        lastPhaseRef.current = phase;
        if (phase === "hum" && hapticEnabled) {
          try { hap("tap"); } catch {}
        }
      }

      if (currentCycle !== lastCycleRef.current) {
        lastCycleRef.current = currentCycle;
        setCycleIdx(currentCycle);
        try {
          if (typeof onHumCompleteRef.current === "function") {
            onHumCompleteRef.current(currentCycle);
          }
        } catch {}
      }

      if (elapsed >= totalMs) {
        stopped = true;
        setCompleted(true);
        if (hapticEnabled) {
          try { hapticProtocolSignature(22, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
        }
        try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [cycleTotal, totalMs, humDurationMs, hapticEnabled, reduceMotion]);

  const isHum = phaseState === "hum";
  const primaryPrompt = isHum ? PROMPT_HUM : PROMPT_INHALE;
  const bodyAnchor = isHum ? BODY_HUM : BODY_INHALE;
  const cyclesCompleted = Math.min(cycleIdx, targetHums);
  const orbScale = 1.0 + orbPulse * (isHum ? 0.35 : 0.20) + microVib;

  return (
    <div
      data-v2-vagal-humming-resonance
      data-phase-state={phaseState}
      data-cycle-idx={cycleIdx}
      data-completed={completed ? "true" : "false"}
      data-testid="vagal-humming-resonance-primitive"
      role="region"
      aria-label="Humming sostenido para resonancia vagal"
      style={{
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s24,
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
          fontWeight: isHum ? typography.weight.medium : typography.weight.light,
          letterSpacing: "-0.02em",
          color: isHum ? phaseColor : colors.text.strong,
          lineHeight: 1.25,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
          transition: reduceMotion ? "none" : "color 320ms ease-out",
        }}
      >
        {primaryPrompt}
      </p>

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
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.85" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.30" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={nasalGlowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="160" rx="140" ry="140" fill={`url(#${vignetteId})`} />

          {/* 5 facial vibration rings during hum — emanating outward */}
          {isHum && [0, 1, 2, 3, 4].map((i) => {
            const offset = i / 5;
            const t = (vibrationTick + offset) % 1;
            const r = 58 + t * 95;
            const opacity = (1 - t) * 0.42;
            return (
              <circle
                key={`vib-${i}`}
                cx="160" cy="160" r={r}
                fill="none"
                stroke={phaseColor}
                strokeWidth="1.0"
                opacity={opacity}
              />
            );
          })}

          {/* Nasal NO glow — 2 small bright points encima del orb durante hum */}
          {isHum && [-12, 12].map((dx, i) => (
            <g key={`nasal-${i}`}>
              <circle
                cx={160 + dx} cy="118" r={(6 + nasalPulse * 4).toFixed(2)}
                fill={`url(#${nasalGlowId})`}
                opacity={(0.30 + nasalPulse * 0.45).toFixed(3)}
                style={{ filter: reduceMotion ? "none" : "blur(3px)" }}
              />
              <circle
                cx={160 + dx} cy="118" r="1.6"
                fill={phaseColor}
                opacity={(0.70 + nasalPulse * 0.25).toFixed(3)}
              />
            </g>
          ))}

          {/* Throat/chest zone indicator — arc abajo del orb que pulsa con humming.
              Anchor de sensación corporal: "vibra cara y pecho". */}
          {isHum && (
            <g>
              {/* Chest zone arc */}
              <path
                d="M 130 218 Q 160 234 190 218"
                fill="none"
                stroke={phaseColor}
                strokeWidth="1.4"
                opacity={(0.32 + nasalPulse * 0.40).toFixed(3)}
                strokeLinecap="round"
              />
              {/* Chest zone dots (3 small) */}
              {[-18, 0, 18].map((dx, i) => (
                <circle
                  key={`chest-${i}`}
                  cx={160 + dx} cy="226"
                  r={(1.6 + nasalPulse * 1.0).toFixed(2)}
                  fill={phaseColor}
                  opacity={(0.55 + nasalPulse * 0.30).toFixed(3)}
                />
              ))}
            </g>
          )}

          {/* Resonance orb — facial */}
          <circle
            cx="160" cy="160" r="46"
            fill={`url(#${auraId})`}
            opacity={isHum ? 0.88 : 0.55}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 60ms linear, opacity 320ms ease-out",
            }}
          />
          <circle
            cx="160" cy="160" r="10"
            fill={phaseColor}
            opacity="0.95"
            style={{
              transform: `scale(${orbScale.toFixed(3)})`,
              transformOrigin: "160px 160px",
              transition: reduceMotion ? "none" : "transform 60ms linear",
            }}
          />

          {/* "MMMMM" text durante hum sostained */}
          {isHum && (
            <text
              x="160" y="168"
              fontSize="20"
              fontFamily={typography.family}
              fontWeight="500"
              fill="#FFFFFF"
              textAnchor="middle"
              opacity="0.85"
              letterSpacing="0.20em"
              style={{
                animation: reduceMotion ? "none" : "vhMmmFade 600ms ease-out 1 both",
              }}
            >
              MMMMM
            </text>
          )}

          {/* 4 cycle progression dots — satélites arriba del orb en arc semi-superior.
              Más integrados con el resonance visual vs top-corner aislados. */}
          {[0, 1, 2, 3].map((i) => {
            // Arc from -135° to -45° (top half over the orb), 4 positions
            const angleDeg = -135 + i * 30; // -135, -105, -75, -45
            const angle = (angleDeg * Math.PI) / 180;
            const radius = 92;
            const cx = 160 + Math.cos(angle) * radius;
            const cy = 160 + Math.sin(angle) * radius;
            const isActive = i === cyclesCompleted;
            const isPast = i < cyclesCompleted;
            return (
              <g key={`cy-${i}`}>
                {/* Aura glow para el activo */}
                {isActive && isHum && (
                  <circle
                    cx={cx.toFixed(2)} cy={cy.toFixed(2)} r="9"
                    fill={phaseColor}
                    opacity={(0.18 + microVib * 0.20).toFixed(3)}
                    style={{ filter: reduceMotion ? "none" : "blur(3px)" }}
                  />
                )}
                <circle
                  cx={cx.toFixed(2)} cy={cy.toFixed(2)}
                  r={isActive ? 4.5 : 3.5}
                  fill={phaseColor}
                  opacity={isActive ? 0.95 : isPast ? 0.65 : 0.22}
                  style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out, r 220ms ease-out" }}
                />
              </g>
            );
          })}

          {/* Countdown bottom */}
          <text
            x="160" y="300"
            fontSize="13"
            fontFamily={typography.familyMono}
            fontWeight="300"
            fill={colors.text.muted}
            opacity={secondsRemaining > 0 ? 0.65 : 0.20}
            textAnchor="middle"
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.10em" }}
          >
            {secondsRemaining > 0 ? `${secondsRemaining}s` : ""}
          </text>
        </svg>

        <style jsx>{`
          @keyframes vhMmmFade {
            from { opacity: 0; transform: translateY(6px) scale(0.88); }
            to { opacity: 0.85; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>

      <span
        aria-live="polite"
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.light,
          color: colors.text.secondary,
          opacity: 0.78,
          textAlign: "center",
          minHeight: 22,
        }}
      >
        {bodyAnchor}
      </span>

      <span
        aria-label={`Humming ${Math.min(cyclesCompleted + 1, targetHums)} de ${targetHums}`}
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: colors.text.muted,
          opacity: 0.55,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.min(cyclesCompleted + 1, targetHums)} / {targetHums}
      </span>
    </div>
  );
}
