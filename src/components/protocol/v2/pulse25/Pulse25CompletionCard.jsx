"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 7 F2 Flagship #25 — Pulse25CompletionCard
   ───────────────────────────────────────────────────────────────
   Post-session completion card específica para Cardiac Pulse Match.
   Pattern reuse F1 Sigh15CompletionCard (4-stage choreography).
   Mounta DESPUÉS del flow completo de MoodPostSessionSheet.

   Diferencias vs Sigh15:
     - 2 métricas visibles (no 1): HRV delta + Coherence score.
     - Research framing: Schandry 1981 + Garfinkel 2015 + Lehrer-Vaschillo 2014.
     - Coherence threshold ≥0.50 = "vagal coupling achieved" (Lehrer 2014).
     - Validation paragraph condicional: solo si coherence ≥0.50 OR delta>0.

   Honest limitation: hrvClassification es null en práctica (entry.coherenceLive
   shape no incluye classification field; se hereda este límite F1). Defensive
   fallback en buildPulse25DeltaDisplay maneja null sin overclaim.
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
 * Build HRV delta display (mismo patrón F1 Sigh15, ms framing).
 * @param {number|null} hrvDelta — deltaRmssd ms
 * @param {string|null} classification — 'vagal-lift' | 'vagal-suppression' | etc | null
 * @returns {{ tone: 'uplift'|'neutral'|'fallback'|null, headline: string, sub: string }|null}
 */
export function buildPulse25HrvDisplay(hrvDelta, classification = null) {
  if (typeof hrvDelta !== "number" || !Number.isFinite(hrvDelta)) return null;
  const abs = Math.round(Math.abs(hrvDelta) * 10) / 10;
  if (classification === "vagal-lift" || (classification == null && hrvDelta > 0)) {
    return {
      tone: "uplift",
      headline: `+${abs} ms HRV`,
      sub: "Variabilidad cardíaca aumentó · sistema parasimpático activado",
    };
  }
  if (classification === "vagal-suppression" || (classification == null && hrvDelta < 0)) {
    return {
      tone: "neutral",
      headline: `${hrvDelta > 0 ? "+" : "−"}${abs} ms HRV`,
      sub: "Variabilidad disminuyó · señal sostenida pide repetición",
    };
  }
  return {
    tone: "neutral",
    headline: `${hrvDelta > 0 ? "+" : "−"}${abs} ms HRV`,
    sub: "Sin cambio significativo medido",
  };
}

/**
 * Build coherence display per Lehrer-Vaschillo 2014 thresholds.
 * @param {number|null} coherenceScore — 0..1 (or null si no captured)
 * @returns {{ tone: 'optimal'|'achieved'|'partial'|'low'|'fallback', headline: string, sub: string }|null}
 */
export function buildPulse25CoherenceDisplay(coherenceScore) {
  if (typeof coherenceScore !== "number" || !Number.isFinite(coherenceScore)) return null;
  const pct = Math.round(coherenceScore * 100);
  if (coherenceScore >= 0.70) {
    return {
      tone: "optimal",
      headline: `${pct}% coherencia`,
      sub: "Acoplamiento vagal sostenido · resonancia óptima",
    };
  }
  if (coherenceScore >= 0.50) {
    return {
      tone: "achieved",
      headline: `${pct}% coherencia`,
      sub: "Acoplamiento vagal alcanzado",
    };
  }
  if (coherenceScore >= 0.30) {
    return {
      tone: "partial",
      headline: `${pct}% coherencia`,
      sub: "Coherencia parcial · práctica continua mejora",
    };
  }
  return {
    tone: "low",
    headline: `${pct}% coherencia`,
    sub: "Coherencia baja · práctica repetida desarrolla la capacidad",
  };
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {number|null} [props.hrvDelta=null] — deltaRmssd ms
 * @param {string|null} [props.hrvClassification=null]
 * @param {number|null} [props.coherenceScore=null] — 0..1 from coherenceLive
 * @param {()=>void} props.onContinue
 */
export default function Pulse25CompletionCard({
  isOpen,
  hrvDelta = null,
  hrvClassification = null,
  coherenceScore = null,
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
    announce("Cardiac Pulse Match completado. Tu sistema sincronizó.", "polite");
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

  const hrvDisplay = buildPulse25HrvDisplay(hrvDelta, hrvClassification);
  const cohDisplay = buildPulse25CoherenceDisplay(coherenceScore);
  const showFallback = !hrvDisplay && !cohDisplay;
  const showValidation = (cohDisplay?.tone === "optimal" || cohDisplay?.tone === "achieved")
    || (hrvDisplay?.tone === "uplift");

  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";

  return (
    <>
      <div
        data-v2-pulse25-backdrop
        data-testid="pulse25-backdrop"
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
          data-v2-pulse25-completion-card
          data-testid="pulse25-completion-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pulse25-title"
          aria-describedby="pulse25-sub"
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
            data-testid="pulse25-stage-1"
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
              data-testid="pulse25-eyebrow"
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
              CARDIAC PULSE MATCH COMPLETADO
            </span>
            <h2
              id="pulse25-title"
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
              Tu sistema sincronizó.
            </h2>
          </div>

          {/* Stage 2: HRV delta + Coherence score (or fallback) */}
          <div
            data-testid="pulse25-stage-2"
            data-stage-visible={stage >= 2 ? "true" : "false"}
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              marginBlockStart: spacing.s32,
              textAlign: "center",
              maxWidth: 360,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: spacing.s24,
            }}
          >
            {hrvDisplay && (
              <div data-testid="pulse25-hrv-block" data-hrv-tone={hrvDisplay.tone}>
                <div
                  data-testid="pulse25-hrv-headline"
                  style={{
                    fontFamily: typography.family,
                    fontSize: 40,
                    fontWeight: typography.weight.light,
                    letterSpacing: "-0.03em",
                    color: hrvDisplay.tone === "uplift"
                      ? colors.accent.phosphorCyan
                      : colors.text.strong,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.0,
                  }}
                >
                  {hrvDisplay.headline}
                </div>
                <p
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
                  {hrvDisplay.sub}
                </p>
              </div>
            )}
            {cohDisplay && (
              <div data-testid="pulse25-coherence-block" data-coh-tone={cohDisplay.tone}>
                <div
                  data-testid="pulse25-coherence-headline"
                  style={{
                    fontFamily: typography.family,
                    fontSize: 32,
                    fontWeight: typography.weight.light,
                    letterSpacing: "-0.02em",
                    color: (cohDisplay.tone === "optimal" || cohDisplay.tone === "achieved")
                      ? colors.accent.phosphorCyan
                      : colors.text.strong,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.0,
                  }}
                >
                  {cohDisplay.headline}
                </div>
                <p
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
                  {cohDisplay.sub}
                </p>
              </div>
            )}
            {showFallback && (
              <div data-testid="pulse25-fallback-block">
                <div
                  style={{
                    fontFamily: typography.family,
                    fontSize: 32,
                    fontWeight: typography.weight.light,
                    letterSpacing: "-0.02em",
                    color: colors.text.strong,
                    lineHeight: 1.2,
                  }}
                >
                  Sistema regulado
                </div>
                <p
                  id="pulse25-sub"
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
                  154 segundos · resonancia 5.5 rpm · interocepción cardíaca
                </p>
              </div>
            )}
          </div>

          {/* Stage 3: Research framing */}
          <div
            data-testid="pulse25-stage-3"
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
              SCHANDRY 1981 · GARFINKEL 2015 · LEHRER-VASCHILLO 2014
            </span>
            <p
              data-testid="pulse25-research-body"
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.6,
              }}
            >
              La interocepción cardíaca activa precisa el monitoreo autonómico
              (Garfinkel 2015), y la respiración resonante a 5.5 rpm acopla el
              ritmo cardíaco al ritmo respiratorio (Lehrer 2014; vagal coupling).
            </p>
            {showValidation && (
              <p
                data-testid="pulse25-research-validation"
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
                {cohDisplay?.tone === "optimal"
                  ? `Tu coherencia indica acoplamiento vagal sostenido — resonancia barorrefleja máxima alcanzada.`
                  : cohDisplay?.tone === "achieved"
                    ? `Tu coherencia indica acoplamiento vagal alcanzado durante la sesión.`
                    : `Tu activación parasimpática post-sesión es consistente con el efecto observado en la literatura.`}
              </p>
            )}
          </div>

          {/* Stage 4: CTA */}
          <div
            data-testid="pulse25-stage-4"
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
              data-testid="pulse25-continue"
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
