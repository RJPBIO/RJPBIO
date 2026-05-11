"use client";
/* ═══════════════════════════════════════════════════════════════
   ReencuadreChoicePrimitive — Phase 7 SP-S-3
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 3 "Re-encuadre" del protocolo
   #20 Block Break (Crisis Cognitiva).

   Mecanismo:
     Re-encuadre cognitivo activa córtex prefrontal y permite
     ver opciones más allá del bloqueo (Gross 2014, emotion
     regulation framework). Forzar identificar 1 de 3 necesidades
     desbloquea ejecución posterior.

   Visual signature — break-pattern vs P1 (kinetic) + P2 (orb):
     - Central focal point (small orb cyan-light) representa el
       estado actual: "¿qué necesito?".
     - 3 branching paths que descienden desde el focal point a
       cada chip vertical. Línea continua sutil cuando idle,
       paths se iluminan al hover/touch; al seleccionar, sólo
       el path elegido permanece encendido, los otros fade.
     - 3 chips verticales (stack) con label only (sin glifos).
     - Min thinking window 4s: chips faded + counter "Piensa NNNs"
       hasta habilitar selección. Tras window, chips fully
       interactive; selección dispara haptic + onSelect.

   Crisis cognitive tier compliance:
     - no_validation, voice TTS (reading question).
     - Skip option permitida (crisis_no_pressure).
     - Sin sonido emitido.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Re-encuadre · Opción";
const DEFAULT_QUESTION = "¿Qué necesito ahora?";
const DEFAULT_CHIPS = [
  { id: "perspective", label: "Otra perspectiva" },
  { id: "external_help", label: "Pedir ayuda" },
  { id: "pause", label: "Pausa" },
];

// SVG glyphs abstractos cyan custom — sin emoji, sin glyphs genéricos.
// perspective: ángulos divergentes (cambio de vista).
// external_help: arc up-reach (mano-arriba abstracta, no dedos).
// pause: 2 barras verticales (sí, pero proporcionadas elegantemente, no genéricas).
function ChipGlyph({ id, color }) {
  const stroke = color;
  if (id === "perspective") {
    // 2 arrows curving alrededor de un eje central — rotación / refraction
    // metáfora: cambio de punto de vista.
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M 3.5 5 A 5 5 0 0 1 12.5 5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 12.5 5 L 12.5 2.5 M 12.5 5 L 14.8 5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 12.5 11 A 5 5 0 0 1 3.5 11" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
        <path d="M 3.5 11 L 3.5 13.5 M 3.5 11 L 1.2 11" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
      </svg>
    );
  }
  if (id === "external_help") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M 8 13 L 8 5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 4 8 Q 8 4 12 8" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "pause") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="5" y="4" width="2" height="8" rx="1" fill={stroke} />
        <rect x="9" y="4" width="2" height="8" rx="1" fill={stroke} />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="3" fill={stroke} />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} [props.question]
 * @param {{id:string,label:string}[]} [props.chips]
 * @param {number} [props.minThinkingMs=4000]
 * @param {boolean} [props.hapticEnabled]
 * @param {(c:{id:string,label:string})=>void} [props.onSelect]
 * @param {()=>void} [props.onComplete]
 */
export default function ReencuadreChoicePrimitive({
  question = DEFAULT_QUESTION,
  chips = DEFAULT_CHIPS,
  minThinkingMs = 4000,
  hapticEnabled = true,
  onSelect,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(2); // light cyan — break-pattern vs P1 (deep) y P2 (mid)
  const uid = useId();
  const haloId = `rcBlur-${uid}`;
  const vignetteId = `rcVignette-${uid}`;

  const onCompleteRef = useRef(onComplete);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const [thinkingMsLeft, setThinkingMsLeft] = useState(minThinkingMs);
  const [enabled, setEnabled] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [focalPulse, setFocalPulse] = useState(0);

  // Thinking window countdown
  useEffect(() => {
    if (reduceMotion) {
      setEnabled(true);
      setThinkingMsLeft(0);
      return undefined;
    }
    if (minThinkingMs <= 0) {
      setEnabled(true);
      setThinkingMsLeft(0);
      return undefined;
    }
    const startTime = performance.now();
    let stopped = false;
    let raf;
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - startTime;
      const left = Math.max(0, minThinkingMs - elapsed);
      setThinkingMsLeft(left);
      // Focal point pulse — sine 1.2 Hz mientras esperas
      setFocalPulse((Math.sin(elapsed / 420) + 1) * 0.5);
      if (left <= 0) {
        setEnabled(true);
        if (hapticEnabled) { try { hap("tap"); } catch {} }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [minThinkingMs, hapticEnabled, reduceMotion]);

  const handleSelect = (idx) => {
    if (!enabled || selectedIdx !== -1) return;
    setSelectedIdx(idx);
    const chip = chips[idx];
    if (hapticEnabled) {
      try { hap("tap"); } catch {}
      try { hapticProtocolSignature(20, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
    }
    try { if (typeof onSelectRef.current === "function") onSelectRef.current(chip); } catch {}
    setTimeout(() => {
      try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
    }, 800);
  };

  const secsThinkingLeft = Math.ceil(thinkingMsLeft / 1000);

  return (
    <div
      data-v2-reencuadre-choice
      data-enabled={enabled ? "true" : "false"}
      data-selected={selectedIdx >= 0 ? chips[selectedIdx]?.id : "none"}
      data-testid="reencuadre-choice-primitive"
      role="region"
      aria-label="Re-encuadre cognitivo: elige una necesidad"
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
        data-testid="reencuadre-phase-label"
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
        data-testid="reencuadre-question"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: 22,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: phaseColor,
          lineHeight: 1.25,
          textAlign: "center",
          maxWidth: 320,
          paddingInline: spacing.s16,
        }}
      >
        {question}
      </p>

      <div
        style={{
          position: "relative",
          width: 320,
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 18,
          paddingBottom: 8,
        }}
      >
        <svg
          aria-hidden="true"
          width="320"
          height="320"
          viewBox="0 0 320 320"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        >
          <defs>
            <filter id={haloId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <radialGradient id={vignetteId} cx="50%" cy="10%" r="60%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="40" rx="100" ry="80" fill={`url(#${vignetteId})`} />

          {/* Central focal point — pulse mientras thinking, settle al habilitar */}
          <circle
            cx="160" cy="38"
            r={enabled ? 16 : (12 + focalPulse * 6).toFixed(2)}
            fill={phaseColor}
            opacity={enabled ? 0.22 : (0.10 + focalPulse * 0.18).toFixed(3)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
            style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out, r 320ms ease-out" }}
          />
          <circle
            cx="160" cy="38" r="5"
            fill={phaseColor}
            opacity={enabled ? 0.95 : (0.45 + focalPulse * 0.30).toFixed(3)}
            style={{
              transform: enabled ? "scale(1)" : `scale(${(0.92 + focalPulse * 0.18).toFixed(3)})`,
              transformOrigin: "160px 38px",
              transition: reduceMotion ? "none" : "opacity 320ms ease-out, transform 220ms ease-out",
            }}
          />

          {/* 3 branching paths from focal (160, 50) con lateral curves +
              dot marker al final (cabeza del camino apuntando al chip). */}
          {chips.map((_, i) => {
            const chipY = 110 + i * 60;
            const chipX = 160;
            const lateralOffset = (i - 1) * 56;
            const cp1X = chipX + lateralOffset;
            const cp1Y = 50 + (chipY - 50) * 0.50;
            const endX = chipX;
            const endY = chipY - 22;
            const isHover = hoverIdx === i;
            const isSelected = selectedIdx === i;
            const opacity = isSelected
              ? 0.95
              : selectedIdx !== -1
                ? 0.10
                : isHover
                  ? 0.85
                  : enabled
                    ? 0.55
                    : 0.32;
            const strokeWidth = isSelected ? 2.4 : isHover ? 2.0 : 1.6;
            return (
              <g key={`path-${i}`}>
                <path
                  d={`M 160 50 Q ${cp1X.toFixed(2)} ${cp1Y.toFixed(2)} ${endX} ${endY.toFixed(2)}`}
                  fill="none"
                  stroke={phaseColor}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeLinecap="round"
                  strokeDasharray={isSelected ? "0" : "5 6"}
                  style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out, stroke-width 220ms ease-out" }}
                />
                <circle
                  cx={endX} cy={endY.toFixed(2)} r={isHover || isSelected ? 3.6 : 2.6}
                  fill={phaseColor}
                  opacity={opacity}
                  style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out, r 220ms ease-out" }}
                />
              </g>
            );
          })}
        </svg>

        {/* Thinking window counter */}
        {!enabled && (
          <span
            data-testid="reencuadre-thinking-counter"
            aria-live="polite"
            style={{
              position: "absolute",
              top: 64,
              fontFamily: typography.familyMono,
              fontSize: 11,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: phaseColor,
              opacity: 0.55,
              zIndex: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Piensa · {secsThinkingLeft}s
          </span>
        )}

        {/* Chips stack vertical */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 75,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            width: "100%",
            paddingInline: spacing.s24,
          }}
        >
          {chips.map((c, i) => {
            const isSelected = selectedIdx === i;
            const isFaded = selectedIdx !== -1 && !isSelected;
            return (
              <button
                key={c.id}
                type="button"
                data-testid={`reencuadre-chip-${c.id}`}
                onClick={() => handleSelect(i)}
                onMouseEnter={() => enabled && setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(-1)}
                onTouchStart={() => enabled && setHoverIdx(i)}
                disabled={!enabled || selectedIdx !== -1}
                aria-pressed={isSelected}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 999,
                  border: `1.5px solid ${isSelected ? phaseColor : `${phaseColor}55`}`,
                  background: isSelected
                    ? `${phaseColor}26`
                    : `${phaseColor}0F`,
                  color: isFaded ? `${phaseColor}80` : phaseColor,
                  fontFamily: typography.family,
                  fontSize: 14,
                  fontWeight: typography.weight.medium,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  cursor: !enabled || selectedIdx !== -1 ? "default" : "pointer",
                  opacity: !enabled ? 0.40 : isFaded ? 0.45 : 1,
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                  transition: reduceMotion ? "none" : "opacity 320ms ease-out, background 280ms ease-out, border-color 280ms ease-out, transform 220ms ease-out",
                  outline: "none",
                  touchAction: "manipulation",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  paddingInline: 14,
                }}
              >
                <ChipGlyph id={c.id} color={isFaded ? `${phaseColor}80` : phaseColor} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
