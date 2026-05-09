"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 7 F3.5-A — Reset1IntroCard
   ───────────────────────────────────────────────────────────────
   Pre-session intro card específica para protocolo #1 Reinicio
   Parasimpático. Mounta ANTES Phase 1 cuando user lanza el protocolo.
   Establece autoridad científica + mecanismos antes de empezar la
   sesión (boost D1 + D4).

   Skippable + skip preference persistent en state.preferences:
   `dontShowAgainReset1Intro`. Cuando user tap "No mostrar de nuevo",
   future launches del #1 saltan directo al primitive.

   Pattern reuse Sigh15+Pulse25+Reset1CompletionCard 4-stage choreography.

   Stages:
     - 1 (200ms): Eyebrow + título "Activa tu sistema vagal en 2 minutos"
     - 2 (400ms): 4 mecanismos científicos con citations inline
     - 3 (600ms): Validation context (5 estudios revisados por pares)
     - 4 (800ms): CTAs (EMPEZAR + No mostrar de nuevo)

   Foundation reuse: useFocusTrap + useReducedMotion + announce sr-live.
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

const MECHANISMS = [
  {
    headline: "Activación VVC",
    body: "El complejo vagal ventral genera neuroception of safety (Porges 2022).",
  },
  {
    headline: "HRV ↑",
    body: "Tu variabilidad cardíaca aumenta medible (Russo 2017, Breathe ERS).",
  },
  {
    headline: "Cortisol ↓",
    body: "Práctica regular reduce cortisol salival (Ma 2017, RCT N=40).",
  },
  {
    headline: "Resonancia óptima",
    body: "3.75 brpm está dentro del rango efectivo (Lemaitre 2025, RCT box 4-4-4-4).",
  },
];

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {()=>void} props.onStart       — Tap EMPEZAR
 * @param {()=>void} props.onSkipForever — Tap "No mostrar de nuevo" (sets preference + onStart)
 */
export default function Reset1IntroCard({
  isOpen,
  onStart,
  onSkipForever,
}) {
  const reduceMotion = useReducedMotion();
  const trapRef = useFocusTrap(!!isOpen, () => onStart?.());
  const [stage, setStage] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStage(0);
      setMounted(false);
      return undefined;
    }
    announce(
      "Reinicio Parasimpático: respiración box validada por estudios RCT. 4 mecanismos científicos.",
      "polite"
    );
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

  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";

  return (
    <>
      <div
        data-v2-reset1-intro-backdrop
        data-testid="reset1-intro-backdrop"
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
          data-v2-reset1-intro-card
          data-testid="reset1-intro-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset1-intro-title"
          aria-describedby="reset1-intro-desc"
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
            data-testid="reset1-intro-stage-1"
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
              data-testid="reset1-intro-eyebrow"
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
              POLYVAGAL · BOX 4-4-4-4 · RCT-VALIDATED
            </span>
            <h2
              id="reset1-intro-title"
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
              Activa tu sistema vagal en 2 minutos.
            </h2>
          </div>

          {/* Stage 2: 4 Mecanismos */}
          <div
            data-testid="reset1-intro-stage-2"
            data-stage-visible={stage >= 2 ? "true" : "false"}
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0)" : "translateY(8px)",
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
                marginBlockEnd: spacing.s12,
              }}
            >
              QUÉ SUCEDE EN TU CUERPO
            </span>
            <ul
              id="reset1-intro-desc"
              data-testid="reset1-intro-mechanisms"
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: spacing.s12,
              }}
            >
              {MECHANISMS.map((m, i) => (
                <li
                  key={i}
                  data-testid={`reset1-intro-mechanism-${i}`}
                  style={{
                    fontFamily: typography.family,
                    fontSize: typography.size.caption,
                    fontWeight: typography.weight.regular,
                    color: colors.text.secondary,
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{
                    color: colors.accent.phosphorCyan,
                    fontWeight: typography.weight.medium,
                  }}>
                    {m.headline}.
                  </strong>{" "}
                  {m.body}
                </li>
              ))}
            </ul>
          </div>

          {/* Stage 3: Validation context */}
          <div
            data-testid="reset1-intro-stage-3"
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
              RESPALDO CIENTÍFICO
            </span>
            <p
              data-testid="reset1-intro-validation"
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.6,
              }}
            >
              2 minutos · 8 ciclos · validado en estudios revisados por pares
              (Frontiers, ERS, MDPI). Mecanismos vagales documentados Porges 2022.
            </p>
          </div>

          {/* Stage 4: CTAs */}
          <div
            data-testid="reset1-intro-stage-4"
            data-stage-visible={stage >= 4 ? "true" : "false"}
            style={{
              opacity: stage >= 4 ? 1 : 0,
              transform: stage >= 4 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              marginBlockStart: spacing.s32,
              width: "100%",
              maxWidth: 320,
              display: "flex",
              flexDirection: "column",
              gap: spacing.s8,
            }}
          >
            <button
              type="button"
              data-testid="reset1-intro-start"
              onClick={onStart}
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
              Empezar
            </button>
            <button
              type="button"
              data-testid="reset1-intro-skip-forever"
              onClick={onSkipForever}
              style={{
                background: "transparent",
                border: "none",
                paddingBlock: spacing.s12,
                paddingInline: spacing.s16,
                color: colors.text.muted,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                cursor: "pointer",
                minHeight: touchTarget.min,
              }}
            >
              No mostrar de nuevo
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
