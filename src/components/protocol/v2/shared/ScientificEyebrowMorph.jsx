"use client";
/* ═══════════════════════════════════════════════════════════════
   ScientificEyebrowMorph — SP-B-1 Capa 3
   ───────────────────────────────────────────────────────────────
   Character-by-character tween entre dos eyebrows científicos.
   Foundation reusable para hero flagship redesigns Opción B
   (Phase transitions de #1 + futuro F1.5/F2.5/F4-F23).

   Pattern morph:
     Phase 1 → Phase 2:
       "POLYVAGAL · 3.75 BRPM · RCT-VALIDATED" → morph →
       "AFFECT LABELING · LIEBERMAN 2007 · UCLA"

   Specs locked:
     - 600ms morph duration default
     - 30 steps max (cap performance)
     - Cubic-bezier(0.32, 0.72, 0, 1) timing (Apple Magic curve)
     - Reduced motion: instant swap (no morph)
     - Color: getCyanForPhase(phaseIdx) per-phase
     - a11y: aria-live polite + announce nuevo eyebrow

   ADN visual:
     - mono caps letter-spacing 0.18em
     - light weight 200
     - opacity 0.85 (consistent con eyebrows existing)
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState, useRef } from "react";
import { announce, useReducedMotion } from "@/lib/a11y";
import { getCyanForPhase } from "@/components/app/v2/tokens";

const DEFAULT_MORPH_MS = 600;
const MAX_STEPS = 30;

/**
 * @param {object} props
 * @param {string} props.text — texto eyebrow target
 * @param {number} [props.phaseIdx=0] — 0/1/2 para color per phase
 * @param {number} [props.morphDurationMs=600]
 * @param {string} [props.testId='scientific-eyebrow-morph']
 */
export default function ScientificEyebrowMorph({
  text,
  phaseIdx = 0,
  morphDurationMs = DEFAULT_MORPH_MS,
  testId = "scientific-eyebrow-morph",
}) {
  const reduceMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousTextRef = useRef(text);

  useEffect(() => {
    if (text === previousTextRef.current) return;

    if (reduceMotion) {
      setDisplayText(text);
      previousTextRef.current = text;
      try { announce(text, "polite"); } catch { /* noop */ }
      return undefined;
    }

    setIsAnimating(true);
    const oldText = previousTextRef.current || "";
    const newText = text || "";
    const maxLength = Math.max(oldText.length, newText.length);
    const steps = Math.min(maxLength, MAX_STEPS);
    const stepDuration = Math.max(8, Math.floor(morphDurationMs / Math.max(1, steps)));

    let stepIdx = 0;
    let cancelled = false;
    const id = setInterval(() => {
      if (cancelled) return;
      stepIdx += 1;
      if (stepIdx >= steps) {
        clearInterval(id);
        setDisplayText(newText);
        setIsAnimating(false);
        previousTextRef.current = newText;
        try { announce(newText, "polite"); } catch { /* noop */ }
        return;
      }
      const progress = stepIdx / steps;
      const transitionPoint = Math.floor(maxLength * progress);
      let mixed = "";
      for (let i = 0; i < maxLength; i++) {
        if (i < transitionPoint) {
          mixed += newText[i] || " ";
        } else {
          mixed += oldText[i] || " ";
        }
      }
      setDisplayText(mixed);
    }, stepDuration);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [text, reduceMotion, morphDurationMs]);

  const phaseColor = getCyanForPhase(phaseIdx);

  return (
    <div
      data-v2-scientific-eyebrow-morph
      data-testid={testId}
      data-phase-idx={phaseIdx}
      data-is-animating={isAnimating ? "true" : "false"}
      aria-live="polite"
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: 200,
        color: phaseColor,
        opacity: 0.85,
        whiteSpace: "pre",
      }}
    >
      {displayText}
    </div>
  );
}
