"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN WELCOME — manifiesto cinematográfico de arranque
   ═══════════════════════════════════════════════════════════════
   3 pantallas que llegan ANTES de NeuralCalibration.
   Función: transmitir el "por qué" antes del "cómo". Identidad,
   no explicación funcional. Es el equivalente a la pantalla
   de bienvenida que Oura, Whoop y Apple Fitness usan para
   establecer que el producto es un instrumento, no una app más.

   Flujo:
     0 · MANIFIESTO   BioGlyph + wordmark + tagline
     1 · CÓMO         3 pilares (Medir · Activar · Adaptar)
     2 · IGNICIÓN     CTA con burst al tocar "Empezar"
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BioGlyph } from "./BioIgnicionMark";
import IgnitionBurst from "./IgnitionBurst";
import Icon from "./Icon";
import { bioSignal, font, space, radius, ty } from "../lib/theme";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";

const INTENTS = [
  { id: "enfoque",       label: "Enfoque",        desc: "Cortar ruido mental. Entrar en flow.",     icon: "focus",   color: "#3B82F6" },
  { id: "calma",         label: "Calma",          desc: "Bajar activación. Soltar tensión.",        icon: "calm",    color: "#8B5CF6" },
  { id: "energia",       label: "Energía",        desc: "Encender el sistema. Activar el día.",     icon: "energy",  color: "#D97706" },
  { id: "recuperacion",  label: "Recuperación",   desc: "Descomprimir. Reparar carga acumulada.",   icon: "shield",  color: "#059669" },
];

const SCREENS = [
  {
    id: "manifest",
    kicker: "BIO-IGNICIÓN",
    title: "El sistema nervioso como instrumento.",
    titleAccent: "Tú como medida.",
    body: "Esto no es una app de bienestar. Es un instrumento para leer tu señal biométrica y activarla.",
  },
  {
    id: "how",
    kicker: "CÓMO FUNCIONA",
    title: "Tres movimientos.",
    titleAccent: "Una sola señal.",
    pillars: [
      { label: "Medir", desc: "Baseline cognitivo en 60 segundos.", icon: "gauge" },
      { label: "Activar", desc: "Protocolos diseñados por tu neurología.", icon: "bolt" },
      { label: "Adaptar", desc: "El sistema aprende y se recalibra contigo.", icon: "sparkle" },
    ],
  },
  {
    id: "intent",
    kicker: "¿QUÉ VIENES A RESOLVER?",
    title: "Tu primer protocolo",
    titleAccent: "lo elige tu señal.",
    intents: INTENTS,
  },
  {
    id: "ignite",
    kicker: "TU PRIMERA SEÑAL",
    title: "Cada sesión es una medición.",
    titleAccent: "Cada medición te acerca a tu señal.",
    body: "Vamos a calibrar tu baseline. Toma 60 segundos.",
  },
];

export default function BioIgnitionWelcome({ onComplete, onSkip }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState(null);
  const [bursting, setBursting] = useState(false);
  const dialogRef = useFocusTrap(true);
  const titleId = useId();

  const current = SCREENS[step];
  const isLast = step === SCREENS.length - 1;
  const isIntentStep = current.id === "intent";
  const canAdvance = !isIntentStep || !!intent;

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (!isLast && canAdvance) setStep((s) => Math.min(s + 1, SCREENS.length - 1));
      } else if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(s - 1, 0));
      } else if (e.key === "Escape") {
        onSkip?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLast, onSkip, canAdvance]);

  function handlePrimary() {
    if (!isLast) {
      if (!canAdvance) return;
      setStep((s) => s + 1);
      return;
    }
    if (reduced) {
      onComplete?.(intent);
      return;
    }
    setBursting(true);
    setTimeout(() => onComplete?.(intent), 900);
  }

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.4 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: `radial-gradient(ellipse at 50% 30%, #0a1020 0%, ${bioSignal.deepField} 70%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBlock: `${space[10]}px ${space[8]}px`,
        paddingInline: space[5],
        color: "#E8ECF4",
        overflow: "hidden",
      }}
    >
      {/* Ambient particle field */}
      {!reduced && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              style={{
                position: "absolute",
                insetBlockStart: `${(i * 53) % 100}%`,
                insetInlineStart: `${(i * 37) % 100}%`,
                inlineSize: 2,
                blockSize: 2,
                borderRadius: "50%",
                background: bioSignal.phosphorCyan,
                opacity: 0.25,
              }}
              animate={{
                opacity: [0.1, 0.45, 0.1],
                scale: [1, 1.6, 1],
              }}
              transition={{
                duration: 3 + (i % 4),
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Progress dots + Skip */}
      <div
        style={{
          inlineSize: "100%",
          maxInlineSize: 430,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <div role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={SCREENS.length} style={{ display: "flex", gap: 6 }}>
          {SCREENS.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                inlineSize: i === step ? 22 : 6,
                blockSize: 4,
                borderRadius: 2,
                background: i === step ? bioSignal.phosphorCyan : "rgba(255,255,255,0.18)",
                transition: "inline-size 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(232,236,244,0.55)",
            fontSize: font.size.xs,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            fontWeight: font.weight.bold,
            cursor: "pointer",
            padding: space[2],
          }}
          aria-label="Saltar introducción"
        >
          Saltar
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            inlineSize: "100%",
            maxInlineSize: 430,
            textAlign: "center",
            gap: space[5],
            zIndex: 1,
          }}
        >
          {/* Glyph */}
          <div style={{ position: "relative" }}>
            <BioGlyph
              size={current.id === "manifest" ? 140 : current.id === "ignite" ? 160 : 96}
              color={bioSignal.phosphorCyan}
              spark={bioSignal.ignition}
              animated
            />
          </div>

          {/* Kicker */}
          <div
            style={{
              fontSize: font.size.xs,
              letterSpacing: 4,
              fontWeight: font.weight.black,
              color: bioSignal.phosphorCyan,
              textTransform: "uppercase",
              fontFamily: font.mono,
            }}
          >
            {current.kicker}
          </div>

          {/* Title */}
          <h1
            id={titleId}
            style={{
              fontSize: font.size["3xl"] || 32,
              fontWeight: font.weight.black,
              lineHeight: 1.15,
              letterSpacing: -0.5,
              margin: 0,
              maxInlineSize: 360,
            }}
          >
            {current.title}
            <span style={{ display: "block", color: bioSignal.phosphorCyan, marginBlockStart: 4 }}>
              {current.titleAccent}
            </span>
          </h1>

          {/* Body, pillars, or intent grid */}
          {current.intents ? (
            <div
              role="radiogroup"
              aria-label="Selecciona tu intención"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: space[2],
                inlineSize: "100%",
                marginBlockStart: space[1],
              }}
            >
              {current.intents.map((opt, i) => {
                const active = intent === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setIntent(opt.id)}
                    whileTap={reduced ? {} : { scale: 0.97 }}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.12 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: space[1],
                      paddingBlock: space[3],
                      paddingInline: space[3],
                      background: active ? `${opt.color}1A` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? opt.color : "rgba(34,211,238,0.12)"}`,
                      borderRadius: radius.lg,
                      cursor: "pointer",
                      textAlign: "start",
                      color: "#E8ECF4",
                      boxShadow: active ? `0 0 0 1px ${opt.color}40 inset, 0 8px 24px -10px ${opt.color}` : "none",
                      transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        inlineSize: 32,
                        blockSize: 32,
                        borderRadius: radius.md,
                        background: active ? `${opt.color}26` : "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${active ? `${opt.color}55` : "rgba(255,255,255,0.06)"}`,
                        marginBlockEnd: space[0.5] || 2,
                      }}
                    >
                      <Icon name={opt.icon} size={16} color={active ? opt.color : "rgba(232,236,244,0.75)"} />
                    </div>
                    <div
                      style={{
                        fontSize: font.size.sm,
                        fontWeight: font.weight.black,
                        color: active ? opt.color : "#E8ECF4",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        fontFamily: font.mono,
                      }}
                    >
                      {opt.label}
                    </div>
                    <div style={{ fontSize: font.size.xs, color: "rgba(232,236,244,0.65)", lineHeight: 1.35 }}>
                      {opt.desc}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : current.pillars ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: space[3],
                inlineSize: "100%",
                marginBlockStart: space[2],
              }}
            >
              {current.pillars.map((p, i) => (
                <motion.div
                  key={p.label}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduced ? 0 : 0.2 + i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: space[3],
                    paddingBlock: space[3],
                    paddingInline: space[4],
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(34,211,238,0.14)",
                    borderRadius: radius.lg,
                    textAlign: "start",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      inlineSize: 40,
                      blockSize: 40,
                      borderRadius: radius.md,
                      background: `linear-gradient(135deg, rgba(34,211,238,0.18), rgba(139,92,246,0.10))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: `1px solid rgba(34,211,238,0.22)`,
                    }}
                  >
                    <Icon name={p.icon} size={18} color={bioSignal.phosphorCyan} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: font.size.sm,
                        fontWeight: font.weight.black,
                        color: "#E8ECF4",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        fontFamily: font.mono,
                      }}
                    >
                      {p.label}
                    </div>
                    <div style={{ fontSize: font.size.sm, color: "rgba(232,236,244,0.7)", marginBlockStart: 2, lineHeight: 1.4 }}>
                      {p.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: font.size.base || 15,
                color: "rgba(232,236,244,0.72)",
                lineHeight: 1.55,
                margin: 0,
                maxInlineSize: 340,
              }}
            >
              {current.body}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div
        style={{
          inlineSize: "100%",
          maxInlineSize: 430,
          display: "flex",
          flexDirection: "column",
          gap: space[2],
          zIndex: 1,
        }}
      >
        <motion.button
          type="button"
          whileTap={reduced || !canAdvance ? {} : { scale: 0.97 }}
          onClick={canAdvance ? handlePrimary : undefined}
          aria-disabled={!canAdvance}
          style={{
            inlineSize: "100%",
            paddingBlock: space[4],
            paddingInline: space[5],
            borderRadius: radius.full,
            border: "none",
            background: canAdvance
              ? `linear-gradient(135deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`
              : "rgba(255,255,255,0.06)",
            color: canAdvance ? "#050810" : "rgba(232,236,244,0.45)",
            fontSize: font.size.base || 15,
            fontWeight: font.weight.black,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: canAdvance ? "pointer" : "not-allowed",
            boxShadow: canAdvance ? `0 8px 32px -8px ${bioSignal.phosphorCyan}` : "none",
            fontFamily: font.family,
            transition: "background 0.25s, color 0.25s, box-shadow 0.25s",
          }}
          aria-label={isLast ? "Empezar calibración" : isIntentStep && !intent ? "Elige una intención primero" : "Siguiente"}
        >
          {isLast ? "Empezar" : "Siguiente"}
        </motion.button>
        {step > 0 && !isLast && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(232,236,244,0.55)",
              fontSize: font.size.xs,
              fontWeight: font.weight.bold,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              cursor: "pointer",
              paddingBlock: space[2],
            }}
          >
            Atrás
          </button>
        )}
      </div>

      <IgnitionBurst show={bursting} accent={bioSignal.phosphorCyan} onDone={() => {}} />
    </motion.div>
  );
}
