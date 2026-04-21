"use client";
/* ═══════════════════════════════════════════════════════════════
   ONBOARDING TOUR — 3-step guided intro
   ═══════════════════════════════════════════════════════════════
   Aparece en el primer uso (después o en lugar de la calibración
   si el usuario la salta). Explica:
     1. Qué mide BIO-IGNICIÓN (bioSignal/burnout/variabilidad).
     2. Cómo es una sesión (respiración + interocepción).
     3. Qué esperar del sistema (adaptativo, voz, háptica).
   - role="dialog" aria-modal + focus trap + Escape.
   - Navegación con Arrow keys y Enter/Space.
   - Reduced-motion aware.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, ty, font, space, radius, z, brand } from "../lib/theme";
import { useReducedMotion, useFocusTrap, KEY } from "../lib/a11y";

const STEPS = [
  {
    id: "measure",
    icon: "cpu",
    title: "Medimos tu estado neural",
    body: "BioSignal, burnout y variabilidad se calculan localmente en tu dispositivo a partir de tus sesiones, humor y rutina. Ningún dato sale sin tu permiso.",
    action: "Empezar",
  },
  {
    id: "session",
    icon: "bolt",
    title: "Respira con el orbe",
    body: "Cada sesión sincroniza tu respiración con un orbe vivo. El sistema usa voz, háptica y binaural para guiarte: solo escucha y sigue el ritmo.",
    action: "Entendido",
  },
  {
    id: "adapt",
    icon: "predict",
    title: "El sistema aprende",
    body: "Después de 3 sesiones el coach neural detecta tu hora pico, protocolos sensibles y tu día óptimo. Mejor respondes, más preciso se vuelve.",
    action: "Estoy listo",
  },
];

export default function OnboardingTour({ show, isDark = false, onClose }) {
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(show, onClose);

  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose?.();
  }, [step, onClose]);
  const prev = useCallback(() => { if (step > 0) setStep(step - 1); }, [step]);

  const onKey = useCallback((e) => {
    if (e.key === KEY.RIGHT) { e.preventDefault(); next(); }
    if (e.key === KEY.LEFT)  { e.preventDefault(); prev(); }
  }, [next, prev]);

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: z.modal,
            background: "rgba(11,14,20,0.72)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: space[5],
          }}
          aria-hidden="true"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            aria-describedby="tour-body"
            onKeyDown={onKey}
            initial={reduced ? { opacity: 0 } : { y: 20, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 20, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 25 }}
            style={{
              inlineSize: "100%",
              maxInlineSize: 400,
              background: cd,
              borderRadius: radius.xl,
              padding: `${space[7]}px ${space[6]}px ${space[5]}px`,
              border: `1px solid ${bd}`,
              boxShadow: `0 20px 60px rgba(0,0,0,${isDark ? 0.5 : 0.2})`,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Saltar tutorial"
              style={{
                position: "absolute",
                insetBlockStart: space[3],
                insetInlineEnd: space[3],
                fontSize: font.size.sm,
                fontWeight: font.weight.semibold,
                color: t3,
                background: "transparent",
                border: "none",
                padding: space[1],
                borderRadius: radius.sm,
              }}
            >
              Saltar
            </button>

            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={step + 1}
              aria-label={`Paso ${step + 1} de ${STEPS.length}`}
              style={{ display: "flex", gap: space[1], marginBlockEnd: space[5] }}
            >
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    blockSize: 4,
                    borderRadius: 2,
                    background: i <= step ? brand.primary : bd,
                    transition: reduced ? "none" : "background .3s",
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={reduced ? { opacity: 1 } : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
                transition={{ duration: reduced ? 0 : 0.25 }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    inlineSize: 56,
                    blockSize: 56,
                    borderRadius: radius.lg,
                    background: `linear-gradient(135deg, ${brand.primary}, #0D9488)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBlockEnd: space[4],
                  }}
                >
                  <Icon name={current.icon} size={24} color="#fff" />
                </div>

                <h2 id="tour-title" style={{ ...ty.heroHeading(t1), fontSize: font.size["2xl"], margin: 0, marginBlockEnd: space[2] }}>
                  {current.title}
                </h2>
                <p id="tour-body" style={{ ...ty.body(t2), margin: 0, marginBlockEnd: space[5] }}>
                  {current.body}
                </p>
              </motion.div>
            </AnimatePresence>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space[2] }}>
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                aria-label="Paso anterior"
                style={{
                  inlineSize: 44,
                  blockSize: 44,
                  borderRadius: radius.full,
                  border: `1.5px solid ${bd}`,
                  background: cd,
                  color: step === 0 ? bd : t2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: step === 0 ? 0.4 : 1,
                  cursor: step === 0 ? "not-allowed" : "pointer",
                  transition: "opacity .2s",
                }}
              >
                <Icon name="chevron" size={14} color={step === 0 ? bd : t2} />
              </button>

              <motion.button
                whileTap={reduced ? {} : { scale: 0.96 }}
                onClick={next}
                style={{
                  flex: 1,
                  maxInlineSize: 220,
                  minBlockSize: 48,
                  paddingBlock: 14,
                  paddingInline: 22,
                  borderRadius: radius.full,
                  background: `linear-gradient(135deg, ${brand.primary}, #0D9488)`,
                  border: "none",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: -0.1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: space[1.5],
                  cursor: "pointer",
                }}
              >
                {current.action}
                <Icon name="chevron" size={14} color="#fff" />
              </motion.button>

              <div style={{ inlineSize: 44, blockSize: 44, flexShrink: 0 }} aria-hidden="true" />
            </div>

            <div
              aria-live="polite"
              className="bi-sr-only"
            >
              Paso {step + 1} de {STEPS.length}: {current.title}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
