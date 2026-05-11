"use client";
/* ═══════════════════════════════════════════════════════════════
   LoadIdentificationPrimitive — Phase 7 SP-T-1
   ───────────────────────────────────────────────────────────────
   Primitive dedicated para Phase 1 "Estado Actual" del protocolo
   #21 Threshold Crossing (Reset tier, useCase active).

   Mecanismo:
     Identificación explícita del estado cognitivo cargado prepara
     boundary cognitivo (Zacks 2007 event segmentation theory).
     Forzar nombrar la carga es prerequisito para el doorway
     effect que se ejecuta en Phases 2-3.

   Visual signature — break-pattern vs Reencuadre (#20 P3):
     - Misma metáfora "focal point + branches" pero scaled para
       5 chips (no 3) y SIN thinking window (active tier permite
       selección inmediata).
     - Identificación previa: header "¿QUÉ CARGAS AHORA?" + 5 chips
       verticales con small "load weight" glyph (4 horizontal bars
       de altura creciente representando "peso").
     - Selected chip: fill + scale 1.02 + glow halo brief.
     - Active tier: chips fully interactive inmediatamente, sin
       counter de "piensa Ns". Voice OFF default, sin haptic
       intrusivo (solo tap al seleccionar).

   Active tier compliance:
     - validate.kind: "chip_selection", required: true.
     - voice.enabled_default: false.
     - binaural.action: "start", type: "reset".
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useId } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hap, hapticProtocolSignature } from "../../../../lib/audio";
import { colors, typography, spacing, getCyanForPhase } from "../../../app/v2/tokens";
import { useMountFade } from "./useMountFade";

const PHASE_LABEL = "Identificación · Carga";
const DEFAULT_QUESTION = "¿Qué cargas ahora?";
const DEFAULT_CHIPS = [
  { id: "frustration", label: "Frustración" },
  { id: "fatigue", label: "Fatiga" },
  { id: "pending_decision", label: "Decisión pendiente" },
  { id: "distraction", label: "Distracción" },
  { id: "other", label: "Otro" },
];

// Weight glyph — 4 horizontal bars de altura creciente representando "peso"
function LoadGlyph({ color, level = 2 }) {
  // level 0-4: 0 = vacío, 4 = lleno
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => {
        const h = 4 + i * 2.5;
        const y = 14 - h;
        const opacity = i <= level ? 0.95 : 0.25;
        return (
          <rect
            key={`bar-${i}`}
            x={3 + i * 2.5} y={y}
            width="1.8" height={h}
            rx="0.5"
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} [props.question]
 * @param {{id:string,label:string}[]} [props.chips]
 * @param {boolean} [props.hapticEnabled]
 * @param {(c:{id:string,label:string})=>void} [props.onSelect]
 * @param {()=>void} [props.onComplete]
 */
export default function LoadIdentificationPrimitive({
  question = DEFAULT_QUESTION,
  chips = DEFAULT_CHIPS,
  hapticEnabled = true,
  onSelect,
  onComplete,
}) {
  const reduceMotion = useReducedMotion();
  const mountFade = useMountFade({ reduceMotion });
  const phaseColor = getCyanForPhase(0); // deep cyan — entry of Threshold Crossing chain
  const uid = useId();
  const haloId = `liBlur-${uid}`;
  const vignetteId = `liVignette-${uid}`;

  const onCompleteRef = useRef(onComplete);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [focalPulse, setFocalPulse] = useState(0);

  // Focal point ambient pulse (slow)
  useEffect(() => {
    if (reduceMotion) return undefined;
    let stopped = false;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const elapsed = now - start;
      setFocalPulse((Math.sin(elapsed / 520) + 1) * 0.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  const handleSelect = (idx) => {
    if (selectedIdx !== -1) return;
    setSelectedIdx(idx);
    const chip = chips[idx];
    if (hapticEnabled) {
      try { hap("tap"); } catch {}
      try { hapticProtocolSignature(21, "phase_shift", { reducedMotion: reduceMotion }); } catch {}
    }
    try { if (typeof onSelectRef.current === "function") onSelectRef.current(chip); } catch {}
    setTimeout(() => {
      try { if (typeof onCompleteRef.current === "function") onCompleteRef.current(); } catch {}
    }, 700);
  };

  return (
    <div
      data-v2-load-identification
      data-selected={selectedIdx >= 0 ? chips[selectedIdx]?.id : "none"}
      data-testid="load-identification-primitive"
      role="region"
      aria-label="Identifica el estado cognitivo cargado"
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
        data-testid="load-identification-phase-label"
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
        data-testid="load-identification-question"
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
          minHeight: 380,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <svg
          aria-hidden="true"
          width="320"
          height="380"
          viewBox="0 0 320 380"
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
            <radialGradient id={vignetteId} cx="50%" cy="8%" r="55%">
              <stop offset="0%" stopColor={phaseColor} stopOpacity="0.08" />
              <stop offset="50%" stopColor={phaseColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="160" cy="32" rx="110" ry="80" fill={`url(#${vignetteId})`} />

          {/* Focal point ambient pulse */}
          <circle
            cx="160" cy="32"
            r={(12 + focalPulse * 4).toFixed(2)}
            fill={phaseColor}
            opacity={(0.14 + focalPulse * 0.14).toFixed(3)}
            filter={reduceMotion ? undefined : `url(#${haloId})`}
          />
          <circle
            cx="160" cy="32" r="5"
            fill={phaseColor}
            opacity={(0.65 + focalPulse * 0.25).toFixed(3)}
            style={{
              transform: `scale(${(0.92 + focalPulse * 0.12).toFixed(3)})`,
              transformOrigin: "160px 32px",
            }}
          />

          {/* 5 branching paths laterales del focal point a cada chip — patrón
              consistente con Reencuadre. Lateral offset varía por índice
              para crear un fan-out de 5 caminos diferentes. Stroke weight
              y opacity dependen de weight level del chip (más peso = más
              prominente). */}
          {chips.map((c, i) => {
            // Chip center DOM ≈ marginTop(56) + height/2(23) + i*(46+10) → 79, 135, ...
            // Endpoint a top-edge del chip (chipY - 22) para que el dot quede arriba.
            const chipCenterY = 79 + i * 56;
            const endY = chipCenterY - 22;
            const chipX = 160;
            const lateralOffset = (i - 2) * 28;
            const cp1X = chipX + lateralOffset;
            const cp1Y = 44 + (endY - 44) * 0.55;
            const isSelected = selectedIdx === i;
            const isHover = hoverIdx === i;
            const weightLevel = [3, 2, 3, 2, 1][i] || 1;
            // Path: visible solo en hover/select para evitar clutter cruzando text.
            // Dot marker: visible siempre con weight-tinted opacity.
            const pathVisible = isHover || isSelected;
            const pathOpacity = isSelected ? 0.95 : isHover ? 0.85 : 0;
            const strokeWidth = isSelected ? 2.2 : 1.8;
            const dotBaseOpacity = 0.30 + weightLevel * 0.10;
            const dotOpacity = isSelected
              ? 0.95
              : selectedIdx !== -1
                ? 0.18
                : isHover
                  ? 0.90
                  : dotBaseOpacity;
            return (
              <g key={`path-${i}`}>
                {pathVisible && (
                  <path
                    d={`M 160 44 Q ${cp1X.toFixed(2)} ${cp1Y.toFixed(2)} ${chipX} ${endY.toFixed(2)}`}
                    fill="none"
                    stroke={phaseColor}
                    strokeWidth={strokeWidth}
                    opacity={pathOpacity}
                    strokeLinecap="round"
                    strokeDasharray={isSelected ? "0" : "5 6"}
                    style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out, stroke-width 220ms ease-out" }}
                  />
                )}
                <circle
                  cx={chipX} cy={endY.toFixed(2)}
                  r={isHover || isSelected ? 3.6 : 2.6 + weightLevel * 0.18}
                  fill={phaseColor}
                  opacity={dotOpacity}
                  style={{ transition: reduceMotion ? "none" : "opacity 320ms ease-out, r 220ms ease-out" }}
                />
              </g>
            );
          })}
        </svg>

        {/* Chips stack vertical */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 56,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            paddingInline: spacing.s24,
          }}
        >
          {chips.map((c, i) => {
            const isSelected = selectedIdx === i;
            const isFaded = selectedIdx !== -1 && !isSelected;
            // Visual "weight" semántico:
            //   frustración=3 (heavy active), fatiga=2 (medium passive),
            //   decisión pendiente=3 (heavy active block), distracción=2 (medium),
            //   otro=1 (uncertain). Match con SVG branching paths arriba.
            const weightLevel = [3, 2, 3, 2, 1][i] ?? 1;
            return (
              <button
                key={c.id}
                type="button"
                data-testid={`load-chip-${c.id}`}
                onClick={() => handleSelect(i)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(-1)}
                onTouchStart={() => setHoverIdx(i)}
                disabled={selectedIdx !== -1}
                aria-pressed={isSelected}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 999,
                  border: `1.5px solid ${isSelected ? phaseColor : `${phaseColor}55`}`,
                  background: isSelected ? `${phaseColor}26` : `${phaseColor}0F`,
                  color: isFaded ? `${phaseColor}80` : phaseColor,
                  fontFamily: typography.family,
                  fontSize: 14,
                  fontWeight: typography.weight.medium,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  cursor: selectedIdx !== -1 ? "default" : "pointer",
                  opacity: isFaded ? 0.45 : 1,
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                  transition: reduceMotion ? "none" : "opacity 320ms ease-out, background 280ms ease-out, border-color 280ms ease-out, transform 220ms ease-out",
                  outline: "none",
                  touchAction: "manipulation",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  paddingInline: 14,
                }}
              >
                <LoadGlyph color={isFaded ? `${phaseColor}80` : phaseColor} level={weightLevel} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
