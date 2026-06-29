"use client";
/* ═══════════════════════════════════════════════════════════════
   CrisisSensoryAnchorPrimitive — Phase 7 SP-Q-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated dual-mode-triple para Crisis tier protocolos
   (#18 Emergency Reset Phases 1+2+3). Implementa grounding 5-4-3-2-1
   simplificado (Najavits 2002) con modes: visual / auditory / tactile.

   3 modes:
     mode="visual" (Phase 1):
       - "Nombra UN objeto que ves"
       - Eye icon SVG
       - Input field text
       - Affirmation: "{value} es lo que ves"

     mode="auditory" (Phase 2):
       - "Nombra UN sonido que escuchas"
       - Ear icon SVG
       - Input field text
       - Affirmation: "{value} es lo que escuchas"

     mode="tactile" (Phase 3):
       - "Toca una superficie · Describe la textura"
       - Hand icon SVG
       - Input field text (textura: rugosa, lisa, fría, tibia)
       - Affirmation: "{value} es lo que sientes"

   Crisis-specific UX:
     - No countdown pressure (validate.no_validation = "crisis_no_pressure")
     - Skip option always available
     - Voice-led TTS auto-on
     - Affirmation peak after input
     - Calming soft visual backdrop

   Constraint compliance:
     - Oficina + sentado + sin volumen + 1 mano celular: ✅ todos.
     - Crisis-friendly: low cognitive load, self-paced, skip option.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature, speak } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { createParticleSystem } from "../../../../lib/animations/particleSystem";

const MODE_CONFIG = {
  visual: {
    phaseLabel: "Anclaje Visual",
    primary: "Nombra UN objeto que ves",
    subtitle: "Solo uno · El primero que veas",
    inputPlaceholder: "Una mesa, un libro...",
    affirmationTemplate: "{value} es lo que ves",
    body: "Mira alrededor · Sin buscar el perfecto",
    voiceCue: "Mira a tu alrededor. Encuentra un objeto. Nómbralo.",
    iconType: "eye",
  },
  auditory: {
    phaseLabel: "Anclaje Auditivo",
    primary: "Nombra UN sonido que escuchas",
    subtitle: "Cualquier sonido · Aunque sea pequeño",
    inputPlaceholder: "Un ventilador, un reloj...",
    affirmationTemplate: "{value} es lo que escuchas",
    body: "Detente · Escucha",
    voiceCue: "Escucha. Encuentra un sonido. Nómbralo.",
    iconType: "ear",
  },
  tactile: {
    phaseLabel: "Anclaje Táctil",
    primary: "Toca una superficie · Describe la textura",
    subtitle: "Rugosa · Lisa · Fría · Tibia",
    inputPlaceholder: "Rugosa, lisa, fría, tibia...",
    affirmationTemplate: "{value} es lo que sientes",
    body: "Cualquier superficie · Mesa, ropa, pared",
    voiceCue: "Toca una superficie. Describe la textura.",
    iconType: "hand",
  },
};

// Phase progress per mode (used for progress dots indicator).
const MODE_TO_STEP = { visual: 1, auditory: 2, tactile: 3 };
const TOTAL_STEPS = 5; // protocol #18 total phases

// Safety phone number per locale (default MX).
const SAFETY_PHONE = "911";

/**
 * @param {object} props
 * @param {"visual"|"auditory"|"tactile"} [props.mode]
 * @param {number} [props.min_chars=2]
 * @param {boolean} [props.audioEnabled]
 * @param {boolean} [props.hapticEnabled]
 * @param {boolean} [props.voiceEnabled]
 * @param {(value:string)=>void} [props.onComplete]
 */
export default function CrisisSensoryAnchorPrimitive({
  mode = "visual",
  min_chars = 2,
  audioEnabled = true,  
  hapticEnabled = true,
  voiceEnabled = false,
  onComplete,
}) {
  const [inputFocused, setInputFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const phaseColor = getCyanForPhase(0); // cyan-deep calming
  const uid = useId();
  const haloId = `csaBlur-${uid}`;
  const vignetteId = `csaVignette-${uid}`;
  const auraId = `csaAura-${uid}`;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // BUG FIX: el setTimeout de completion (2.5s) no se capturaba ni limpiaba.
  // En un primitivo crisis-tier, si la pantalla se descartaba en esa ventana
  // se disparaba un advance + una vibración háptica sobre una instancia ya
  // desmontada (haptic fantasma segundos después de salir).
  const completeTimerRef = useRef(null);
  useEffect(() => () => { if (completeTimerRef.current) clearTimeout(completeTimerRef.current); }, []);

  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.visual;

  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedValue, setSubmittedValue] = useState("");
  const [pointPulse, setPointPulse] = useState(0);
  const inputRef = useRef(null);

  // Slow ambient pulse for calming effect
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const startTime = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const t = (elapsed / 8000) % 1; // very slow calming ~8s
      const pulseVal = Math.sin(t * Math.PI * 2);
      setPointPulse((prev) => (Math.abs(prev - pulseVal) > 0.05 ? pulseVal : prev));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  // Voice cue on mount
  useEffect(() => {
    if (voiceEnabled && !reduceMotion) {
      try { speak(cfg.voiceCue); } catch {}
    }
  }, [voiceEnabled, reduceMotion, cfg.voiceCue]);

  // Particles ambient soft
  const particleCanvasRef = useRef(null);
  const particleSysRef = useRef(null);
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return undefined;
    canvas.width = 320;
    canvas.height = 240;
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

  const handleSubmit = (skipped = false) => {
    if (submitted) return;
    const trimmed = (inputValue || "").trim();
    if (!skipped && trimmed.length < min_chars) return;
    const finalValue = skipped ? "Tu atención está aquí" : trimmed;
    setSubmittedValue(finalValue);
    setSubmitted(true);
    if (hapticEnabled) {
      try { hap("tap"); } catch {}
    }
    completeTimerRef.current = setTimeout(() => {
      try {
        if (typeof onCompleteRef.current === "function") {
          onCompleteRef.current(finalValue);
        }
      } catch {}
      if (hapticEnabled) {
        try { hapticProtocolSignature(18, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
      }
    }, 2500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(false);
    }
  };

  const pointScale = 1.0 + pointPulse * 0.35;
  const affirmationText = submitted
    ? cfg.affirmationTemplate.replace("{value}", submittedValue)
    : "";

  return (
    <div
      data-v2-crisis-sensory-anchor
      data-mode={mode}
      data-submitted={submitted ? "true" : "false"}
      data-testid="crisis-sensory-anchor-primitive"
      role="region"
      aria-label={`Crisis ${cfg.phaseLabel.toLowerCase()}, ${cfg.primary}`}
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          data-testid="crisis-sensory-anchor-phase-label"
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
          {cfg.phaseLabel}
        </span>

        {/* Phase progress dots — protocol-wide indicator (current step / 5) */}
        <div
          data-testid="crisis-sensory-anchor-progress-dots"
          aria-hidden="true"
          style={{ display: "flex", gap: 6, alignItems: "center" }}
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const currentStep = MODE_TO_STEP[mode] ?? 1;
            const isActive = i === currentStep - 1;
            const isPassed = i < currentStep - 1;
            return (
              <div
                key={`pd-${i}`}
                style={{
                  width: isActive ? 14 : 4,
                  height: 4,
                  borderRadius: 2,
                  background: isActive || isPassed ? phaseColor : "rgba(255,255,255,0.15)",
                  opacity: isActive ? 0.85 : isPassed ? 0.45 : 0.25,
                  transition: reduceMotion ? "none" : "all 320ms ease-out",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Primary prompt + subtitle */}
      <div
        data-testid="crisis-sensory-anchor-prompt"
        aria-live="polite"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          paddingInline: spacing.s16,
          minHeight: 60,
          maxWidth: 360,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: submitted ? 17 : 21,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.02em",
            color: colors.text.strong,
            lineHeight: 1.3,
            textAlign: "center",
            opacity: submitted ? 0.55 : 1,
            transition: reduceMotion ? "none" : "opacity 320ms ease-out, font-size 320ms ease-out",
          }}
        >
          {cfg.primary}
        </p>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 12,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: phaseColor,
            opacity: submitted ? 0.40 : 0.75,
            transition: reduceMotion ? "none" : "opacity 320ms ease-out",
          }}
        >
          {cfg.subtitle}
        </span>
      </div>

      {/* Visual area: icon + ambient pulse + affirmation */}
      <div
        style={{
          position: "relative",
          width: 320,
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={particleCanvasRef}
          data-testid="crisis-sensory-anchor-particles"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: reduceMotion ? 0 : 0.14,
            transition: "opacity 200ms ease-out",
          }}
        />

        <svg
          aria-hidden="true"
          width="320"
          height="240"
          viewBox="0 0 320 240"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.10" />
              <stop offset="60%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.80" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.30" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="120" rx="140" ry="100" fill={`url(#${vignetteId})`} />

          {/* Ambient calming pulse — peaks dramatically on submit */}
          <circle
            cx="160" cy="120" r={submitted ? 80 : 56}
            fill={`url(#${auraId})`}
            opacity={submitted ? 0.95 : 0.45}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{
              transform: `scale(${(submitted ? pointScale * 1.15 : pointScale).toFixed(3)})`,
              transformOrigin: "160px 120px",
              transition: reduceMotion ? "none" : "transform 600ms cubic-bezier(0.22,1,0.36,1), opacity 800ms ease-out, r 600ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />

          {/* Confirmation rings — only after submit, 2 expanding outward */}
          {submitted && !reduceMotion && [0, 1].map((i) => (
            <circle
              key={`confirm-${i}`}
              cx="160" cy="120"
              r="50"
              fill="none"
              stroke={phaseColor}
              strokeWidth="0.8"
              opacity="0"
              style={{
                animation: `csaConfirmRing 1600ms ease-out ${i * 350}ms 1 forwards`,
              }}
            />
          ))}

          {/* Sensory icon: eye / ear / hand */}
          <g
            opacity={submitted ? 0.35 : 0.85}
            style={{ transition: reduceMotion ? "none" : "opacity 600ms ease-out" }}
          >
            {cfg.iconType === "eye" && (
              <>
                <path
                  d="M 130 120 Q 160 96, 190 120 Q 160 144, 130 120 Z"
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="160" cy="120" r="8" fill={phaseColor} opacity="0.85" />
                <circle cx="158" cy="118" r="2" fill="#A5F3FC" opacity="0.95" />
              </>
            )}
            {cfg.iconType === "ear" && (
              <g>
                {/* Abstract sound waves emanating outward — Apple-style listening icon.
                    3 arcs forming a "sound wave" pattern emerging from a listening point. */}

                {/* Central listening point */}
                <circle
                  cx="160" cy="120"
                  r="4"
                  fill={phaseColor}
                  opacity="0.95"
                />
                <circle
                  cx="160" cy="120"
                  r="8"
                  fill={phaseColor}
                  opacity="0.30"
                />

                {/* 3 sound wave arcs to the right (sound coming from outside) */}
                {[0, 1, 2].map((i) => {
                  const radius = 16 + i * 12;
                  const opacity = 0.85 - i * 0.20;
                  return (
                    <path
                      key={`wave-${i}`}
                      d={`M ${160 + radius} ${120 - radius * 0.7}
                          A ${radius} ${radius} 0 0 1 ${160 + radius} ${120 + radius * 0.7}`}
                      fill="none"
                      stroke={phaseColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity={opacity}
                    />
                  );
                })}

                {/* 3 sound wave arcs to the left (mirror — sound from any direction) */}
                {[0, 1, 2].map((i) => {
                  const radius = 16 + i * 12;
                  const opacity = (0.85 - i * 0.20) * 0.55;
                  return (
                    <path
                      key={`wave-l-${i}`}
                      d={`M ${160 - radius} ${120 - radius * 0.7}
                          A ${radius} ${radius} 0 0 0 ${160 - radius} ${120 + radius * 0.7}`}
                      fill="none"
                      stroke={phaseColor}
                      strokeWidth="1"
                      strokeLinecap="round"
                      opacity={opacity}
                    />
                  );
                })}
              </g>
            )}
            {cfg.iconType === "hand" && (
              <g>
                {/* Abstract tactile symbol: fingertip touching surface + texture ripples
                    Más minimal y elegante que intentar dibujar mano anatómica completa.
                    Concept: punto contacto + 3 ripple lines emanando + horizonte surface */}

                {/* Surface horizon line */}
                <line
                  x1="120" y1="142" x2="200" y2="142"
                  stroke={phaseColor}
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.55"
                />

                {/* 3 texture ripples emanando del punto de contacto */}
                {[0, 1, 2].map((i) => (
                  <ellipse
                    key={`tex-${i}`}
                    cx="160" cy="142"
                    rx={10 + i * 12}
                    ry={2 + i * 0.8}
                    fill="none"
                    stroke={phaseColor}
                    strokeWidth="0.8"
                    opacity={0.55 - i * 0.15}
                  />
                ))}

                {/* Fingertip — line descending into the surface */}
                <line
                  x1="160" y1="108" x2="160" y2="138"
                  stroke={phaseColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                {/* Fingertip pad — small rounded dot at contact point */}
                <circle
                  cx="160" cy="140"
                  r="3.5"
                  fill={phaseColor}
                  opacity="0.95"
                />

                {/* Glow at contact point */}
                <circle
                  cx="160" cy="140"
                  r="8"
                  fill={phaseColor}
                  opacity="0.30"
                />
              </g>
            )}
          </g>

          {/* Affirmation text cinematic — slides up + glow + larger */}
          {submitted && (
            <text
              x="160" y="208"
              fontSize="16"
              fontFamily={typography.family}
              fontWeight="500"
              fill={phaseColor}
              textAnchor="middle"
              opacity="0.95"
              style={{
                animation: reduceMotion ? "none" : "csaAffirmRise 700ms cubic-bezier(0.22,1,0.36,1) 200ms 1 both",
                filter: reduceMotion ? "none" : `drop-shadow(0 0 12px rgba(14,116,144,0.55))`,
              }}
            >
              {affirmationText}
            </text>
          )}
        </svg>

        <style jsx>{`
          @keyframes csaAffirmRise {
            from {
              opacity: 0;
              transform: translateY(14px) scale(0.92);
            }
            to {
              opacity: 0.95;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes csaConfirmRing {
            0% { opacity: 0; r: 50; }
            30% { opacity: 0.75; }
            100% { opacity: 0; r: 130; }
          }
        `}</style>
      </div>

      {/* Input field (or skip) */}
      {!submitted ? (
        <div
          data-testid="crisis-sensory-anchor-input-row"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: spacing.s12,
            paddingInline: spacing.s16,
            width: "100%",
            maxWidth: 340,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            data-testid="crisis-sensory-anchor-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={cfg.inputPlaceholder}
            aria-label={cfg.primary}
            style={{
              appearance: "none",
              width: "100%",
              padding: "13px 18px",
              fontFamily: typography.family,
              fontSize: 16,
              fontWeight: typography.weight.light,
              color: colors.text.strong,
              background: inputFocused ? "rgba(14,116,144,0.08)" : "rgba(255,255,255,0.04)",
              border: `0.5px solid ${inputFocused ? phaseColor : colors.separator}`,
              borderRadius: 10,
              outline: "none",
              textAlign: "center",
              boxShadow: inputFocused
                ? `0 0 0 3px rgba(14,116,144,0.15), 0 0 18px rgba(14,116,144,0.25)`
                : "none",
              transition: reduceMotion ? "none" : "all 220ms cubic-bezier(0.22,1,0.36,1)",
              transform: inputFocused ? "scale(1.02)" : "scale(1.0)",
              transformOrigin: "center",
            }}
          />

          <div style={{ display: "flex", gap: spacing.s12, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={(inputValue || "").trim().length < min_chars}
              style={{
                appearance: "none",
                padding: "10px 28px",
                fontFamily: typography.family,
                fontSize: 12,
                fontWeight: typography.weight.medium,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: (inputValue || "").trim().length >= min_chars ? phaseColor : colors.text.muted,
                background: (inputValue || "").trim().length >= min_chars ? "rgba(14,116,144,0.15)" : "rgba(255,255,255,0.03)",
                border: `0.5px solid ${(inputValue || "").trim().length >= min_chars ? phaseColor : colors.separator}`,
                borderRadius: 999,
                cursor: (inputValue || "").trim().length >= min_chars ? "pointer" : "not-allowed",
                transition: "all 120ms ease-out",
              }}
            >
              Anclar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              style={{
                appearance: "none",
                padding: "10px 16px",
                fontFamily: typography.family,
                fontSize: 11,
                fontWeight: typography.weight.regular,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: colors.text.muted,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                opacity: 0.55,
              }}
            >
              Saltar
            </button>
          </div>
        </div>
      ) : (
        <span
          data-testid="crisis-sensory-anchor-body-anchor"
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.01em",
            color: colors.text.secondary,
            opacity: 0.75,
            textAlign: "center",
            minHeight: 22,
          }}
        >
          Estás aquí · Ahora
        </span>
      )}

      {!submitted && (
        <span
          data-testid="crisis-sensory-anchor-body-cue"
          style={{
            fontFamily: typography.family,
            fontSize: 12,
            fontWeight: typography.weight.light,
            letterSpacing: "0.04em",
            color: colors.text.muted,
            opacity: 0.55,
            textAlign: "center",
          }}
        >
          {cfg.body}
        </span>
      )}
    </div>
  );
}
