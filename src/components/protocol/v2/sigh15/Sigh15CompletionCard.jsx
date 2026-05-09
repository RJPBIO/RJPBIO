"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 7 F1 Flagship #15 — Sigh15CompletionCard
   ───────────────────────────────────────────────────────────────
   Post-session completion card específica para Suspiro Fisiológico.
   Mounta DESPUÉS del flow completo de MoodPostSessionSheet (mood pick
   + F0-3 5 questions). Pattern reuse StreakMilestoneSheet 5-stage
   choreography (Phase 6I-2).

   ADN visual:
     - z-index 1000/1001 (sheet stack)
     - useFocusTrap + useReducedMotion + announce sr-live
     - cubic-bezier(0.32, 0.72, 0, 1) 320ms transform
     - cyan #22D3EE single accent + mono caps eyebrows 0.22em
     - light weight 200 tabular-nums

   HRV delta framing científico:
     - Bio captura HRV (rmssd ms via cam-PPG), NO bpm crudo.
     - hrvDelta > 0 con classification 'vagal-lift' → uplift framing
     - hrvDelta < 0 con classification 'vagal-suppression' → neutro (sin judgment)
     - hrvDelta = null → fallback non-data ("90s. 1 patrón. Sistema regulado.")

   Stages choreography (5 stages):
     - Stage 1 (200ms): eyebrow + título "Tu sistema acaba de regular."
     - Stage 2 (400ms): HRV delta visible si data, fallback si null
     - Stage 3 (600ms): Stanford 2023 comparison
     - Stage 4 (800ms): CTA "Continuar"
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useState } from "react";
import { announce, useFocusTrap, useReducedMotion } from "@/lib/a11y";
import {
  colors,
  typography,
  spacing,
  radii,
  motion as motionTok,
  touchTarget,
} from "../../../app/v2/tokens";

/**
 * Build delta display strings from raw hrvDelta + classification.
 * Defensive: cualquier shape inesperado → fallback non-data.
 *
 * @param {number|null} hrvDelta — deltaRmssd en ms (post − pre via buildSessionDelta)
 * @param {string|null} classification — 'vagal-lift' | 'vagal-suppression' | 'no-change' | 'unverified' | null
 * @returns {{ tone: 'uplift'|'neutral'|'fallback', headline: string, sub?: string }}
 */
export function buildSigh15DeltaDisplay(hrvDelta, classification = null) {
  if (typeof hrvDelta !== "number" || !Number.isFinite(hrvDelta)) {
    return {
      tone: "fallback",
      headline: "Sistema regulado",
      sub: "90 segundos · 1 patrón · 5 ciclos completos",
    };
  }
  const abs = Math.round(Math.abs(hrvDelta) * 10) / 10;
  if (classification === "vagal-lift" || (classification == null && hrvDelta > 0)) {
    return {
      tone: "uplift",
      headline: `+${abs} ms HRV`,
      sub: "Tu sistema parasimpático se activó",
    };
  }
  if (classification === "vagal-suppression" || (classification == null && hrvDelta < 0)) {
    return {
      tone: "neutral",
      headline: `${hrvDelta > 0 ? "+" : "−"}${abs} ms HRV`,
      sub: "Tu fisiología no cambió todavía. La señal sostenida pide repetición.",
    };
  }
  return {
    tone: "neutral",
    headline: `${hrvDelta > 0 ? "+" : "−"}${abs} ms HRV`,
    sub: "Sin cambio significativo medido",
  };
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {number|null} [props.hrvDelta=null] — deltaRmssd ms (postDelta.hrv.deltaRmssd)
 * @param {string|null} [props.hrvClassification=null] — 'vagal-lift'|'vagal-suppression'|'no-change'|'unverified'
 * @param {()=>void} props.onContinue
 */
export default function Sigh15CompletionCard({
  isOpen,
  hrvDelta = null,
  hrvClassification = null,
  onContinue,
}) {
  const reduceMotion = useReducedMotion();
  const trapRef = useFocusTrap(!!isOpen, () => onContinue?.());
  const [stage, setStage] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStage(0);
      setMounted(false);
      return undefined;
    }
    announce("Suspiro Fisiológico completado. Tu sistema acaba de regular.", "polite");
    if (reduceMotion) {
      setMounted(true);
      setStage(4);
      return undefined;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    const timers = [200, 400, 600, 800].map((delay, idx) =>
      setTimeout(() => setStage(idx + 1), delay)
    );
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [isOpen, reduceMotion]);

  if (!isOpen) return null;

  const display = buildSigh15DeltaDisplay(hrvDelta, hrvClassification);
  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";

  return (
    <>
      <div
        data-v2-sigh15-backdrop
        data-testid="sigh15-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1000,
          opacity: backdropOpacity,
          transition: reduceMotion ? "none" : `opacity 200ms ${motionTok.ease.out}`,
          pointerEvents: "auto",
        }}
      >
        <aside
          ref={trapRef}
          data-v2-sigh15-completion-card
          data-testid="sigh15-completion-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sigh15-title"
          aria-describedby="sigh15-sub"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            background: colors.bg.raised,
            border: `0.5px solid ${colors.accent.phosphorCyan}`,
            borderBottom: "none",
            borderRadius: `${radii.panelLg}px ${radii.panelLg}px 0 0`,
            paddingInline: spacing.s24,
            paddingBlockStart: spacing.s32,
            paddingBlockEnd: `calc(${spacing.s32}px + env(safe-area-inset-bottom))`,
            zIndex: 1001,
            maxHeight: "85vh",
            overflowY: "auto",
            transform: sheetTranslate,
            transition: reduceMotion
              ? "none"
              : `transform 320ms cubic-bezier(0.32, 0.72, 0, 1)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Drag handle */}
          <span
            aria-hidden="true"
            style={{
              width: 36,
              height: 4,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999,
              marginBlockEnd: spacing.s24,
            }}
          />

          {/* Stage 1: Eyebrow + Title */}
          <div
            data-testid="sigh15-stage-1"
            data-stage-visible={stage >= 1 ? "true" : "false"}
            style={{
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              textAlign: "center",
              maxWidth: 360,
              width: "100%",
            }}
          >
            <span
              data-testid="sigh15-eyebrow"
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: colors.accent.phosphorCyan,
                fontWeight: typography.weight.medium,
                opacity: 0.85,
              }}
            >
              SUSPIRO FISIOLÓGICO COMPLETADO
            </span>
            <h2
              id="sigh15-title"
              style={{
                margin: 0,
                marginBlockStart: spacing.s12,
                fontFamily: typography.family,
                fontSize: 26,
                fontWeight: typography.weight.light,
                letterSpacing: "-0.02em",
                color: colors.text.strong,
                lineHeight: 1.2,
              }}
            >
              Tu sistema acaba de regular.
            </h2>
          </div>

          {/* Stage 2: HRV delta visible */}
          <div
            data-testid="sigh15-stage-2"
            data-stage-visible={stage >= 2 ? "true" : "false"}
            data-hrv-tone={display.tone}
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              marginBlockStart: spacing.s32,
              textAlign: "center",
              maxWidth: 360,
              width: "100%",
            }}
          >
            <div
              data-testid="sigh15-hrv-headline"
              style={{
                fontFamily: typography.family,
                fontSize: 48,
                fontWeight: typography.weight.light,
                letterSpacing: "-0.03em",
                color: display.tone === "uplift"
                  ? colors.accent.phosphorCyan
                  : colors.text.strong,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.0,
              }}
            >
              {display.headline}
            </div>
            {display.sub && (
              <p
                id="sigh15-sub"
                data-testid="sigh15-hrv-sub"
                style={{
                  margin: 0,
                  marginBlockStart: spacing.s8,
                  fontFamily: typography.family,
                  fontSize: typography.size.body,
                  fontWeight: typography.weight.regular,
                  color: colors.text.secondary,
                  lineHeight: 1.45,
                }}
              >
                {display.sub}
              </p>
            )}
          </div>

          {/* Stage 3: Stanford comparison */}
          <div
            data-testid="sigh15-stage-3"
            data-stage-visible={stage >= 3 ? "true" : "false"}
            style={{
              opacity: stage >= 3 ? 1 : 0,
              transform: stage >= 3 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              marginBlockStart: spacing.s32,
              maxWidth: 360,
              width: "100%",
            }}
          >
            <span
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: colors.text.muted,
                fontWeight: typography.weight.medium,
                display: "block",
                marginBlockEnd: spacing.s8,
              }}
            >
              STANFORD 2023 · CELL REPORTS MEDICINE
            </span>
            <p
              data-testid="sigh15-stanford-body"
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.6,
              }}
            >
              Balban et al. (Cell Reports Medicine, N=114, 28 días) reportó que
              el suspiro fisiológico produce mayor descenso de ansiedad que la
              meditación de atención focalizada cuando se practica 5 minutos al
              día.
            </p>
            {display.tone === "uplift" && (
              <p
                data-testid="sigh15-stanford-validation"
                style={{
                  margin: 0,
                  marginBlockStart: spacing.s12,
                  fontFamily: typography.family,
                  fontSize: typography.size.caption,
                  fontWeight: typography.weight.regular,
                  color: colors.accent.phosphorCyan,
                  lineHeight: 1.6,
                }}
              >
                Tu activación parasimpática post-sesión está en línea con el
                rango observado en la cohorte de estudio.
              </p>
            )}
          </div>

          {/* Stage 4: CTA Continuar */}
          <div
            data-testid="sigh15-stage-4"
            data-stage-visible={stage >= 4 ? "true" : "false"}
            style={{
              opacity: stage >= 4 ? 1 : 0,
              transform: stage >= 4 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              marginBlockStart: spacing.s32,
              width: "100%",
              maxWidth: 320,
            }}
          >
            <button
              type="button"
              data-testid="sigh15-continue"
              onClick={onContinue}
              style={{
                background: colors.accent.phosphorCyan,
                color: "#041019",
                border: "none",
                borderRadius: 999,
                paddingBlock: spacing.s14,
                paddingInline: spacing.s24,
                fontFamily: typography.familyMono,
                fontSize: 12,
                fontWeight: typography.weight.medium,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                minHeight: touchTarget.preferred,
                width: "100%",
                transition: reduceMotion ? "none" : `all 180ms ${motionTok.ease.out}`,
              }}
            >
              Continuar
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
