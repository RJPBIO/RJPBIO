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
import { bioSignal, brand, font, space, radius, ty, withAlpha } from "../lib/theme";
import { protoColor } from "../lib/tokens";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";

// INTENTS alineado a protoColor — coherente con ProtocolSelector / ReadinessRing
// / metrics bar. Enfoque=phosphorCyan, Calma=emerald, Energía=amber, Reset=violet.
const INTENTS = [
  { id: "enfoque",       label: "Enfoque",        desc: "Cortar ruido mental. Entrar en flow.",     icon: "focus",   color: protoColor.enfoque,  stat: "72% lo eligen en la primera semana." },
  { id: "calma",         label: "Calma",          desc: "Bajar activación. Soltar tensión.",        icon: "calm",    color: protoColor.calma,    stat: "Caída media de cortisol −18% al día 14." },
  { id: "energia",       label: "Energía",        desc: "Encender el sistema. Activar el día.",     icon: "energy",  color: protoColor.energia,  stat: "Pico cognitivo +23% vs baseline." },
  { id: "recuperacion",  label: "Recuperación",   desc: "Descomprimir. Reparar carga acumulada.",   icon: "shield",  color: protoColor.reset,    stat: "HRV recupera 2.3× más rápido." },
];

const SCREENS = [
  {
    id: "manifest",
    kicker: "Manifiesto",
    wordmark: true,
    title: "El sistema nervioso como instrumento.",
    titleAccent: "Tú como medida.",
    body: "No es una app de bienestar. Es un instrumento para leer tu señal biométrica y activarla.",
    fomo: "94% abandona antes del día 7. El instrumento filtra.",
  },
  {
    id: "how",
    kicker: "Cómo funciona",
    title: "Tres movimientos.",
    titleAccent: "Una sola señal.",
    pillars: [
      { label: "Señal",      desc: "Baseline cognitivo en 60 segundos.",          icon: "gauge" },
      { label: "Ignición",   desc: "Protocolos diseñados por tu neurología.",     icon: "bolt" },
      { label: "Adaptación", desc: "El sistema aprende y se recalibra contigo.",  icon: "sparkle" },
    ],
  },
  {
    id: "intent",
    kicker: "Qué vienes a resolver",
    title: "Tu primer protocolo",
    titleAccent: "lo elige tu señal.",
    intents: INTENTS,
  },
  {
    id: "ignite",
    kicker: "Tu primera señal",
    title: "Tu baseline existe ahora.",
    titleAccent: "En 24 horas será otro.",
    body: "Calibrar toma 60 segundos y captura tu señal real. Esperar significa tener otra.",
    fomo: "1 de cada 20 opera al día 30.",
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
      {/* Static particle field — cinematic texture, no ambient pulsing */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              insetBlockStart: `${(i * 53) % 100}%`,
              insetInlineStart: `${(i * 37) % 100}%`,
              inlineSize: 2,
              blockSize: 2,
              borderRadius: "50%",
              background: bioSignal.phosphorCyan,
              opacity: 0.22,
            }}
          />
        ))}
      </div>

      {/* Viewport corner brackets — instrument framing */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {[
          { style: { top: 20, left: 20 },    d: "M 0 22 L 0 0 L 22 0" },
          { style: { top: 20, right: 20 },   d: "M 0 0 L 22 0 L 22 22" },
          { style: { bottom: 20, left: 20 }, d: "M 0 0 L 0 22 L 22 22" },
          { style: { bottom: 20, right: 20 },d: "M 22 0 L 22 22 L 0 22" },
        ].map((b, i) => (
          <svg
            key={i}
            width="22"
            height="22"
            viewBox="0 0 22 22"
            style={{ position: "absolute", ...b.style }}
          >
            <path d={b.d} stroke={withAlpha(bioSignal.phosphorCyan, 32)} strokeWidth="1" fill="none" />
          </svg>
        ))}
      </div>

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
                boxShadow: i === step ? `0 0 8px ${withAlpha(bioSignal.phosphorCyan, 60)}` : "none",
                transition: "inline-size 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
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
            fontSize: 12,
            letterSpacing: -0.05,
            fontWeight: 600,
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
          {/* Glyph with optional lattice DNA backdrop on manifest */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current.wordmark && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: -30,
                  backgroundImage: `
                    linear-gradient(${withAlpha(bioSignal.phosphorCyan, 6)} 1px, transparent 1px),
                    linear-gradient(90deg, ${withAlpha(bioSignal.phosphorCyan, 6)} 1px, transparent 1px)
                  `,
                  backgroundSize: "14px 14px",
                  maskImage: "radial-gradient(circle at center, #000 0%, #000 30%, transparent 70%)",
                  WebkitMaskImage: "radial-gradient(circle at center, #000 0%, #000 30%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            )}
            <BioGlyph
              size={current.id === "manifest" ? 140 : current.id === "ignite" ? 160 : 96}
              color={bioSignal.phosphorCyan}
              spark={bioSignal.ignition}
              animated
            />
          </div>

          {/* Wordmark hero — brutal trademark + instrument nameplate on manifest */}
          {current.wordmark && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBlockStart: -space[1] }}>
              <div
                aria-label="BIO-IGNICIÓN"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: font.family,
                  fontSize: "clamp(44px, 13vw, 64px)",
                  fontWeight: font.weight.black,
                  letterSpacing: -2.5,
                  lineHeight: 1,
                }}
              >
                <span style={{ color: "#E8ECF4" }}>BIO</span>
                <span
                  aria-hidden="true"
                  style={{
                    color: bioSignal.phosphorCyan,
                    fontWeight: font.weight.bold,
                    marginInline: 8,
                    filter: `drop-shadow(0 0 12px ${withAlpha(bioSignal.phosphorCyan, 70)})`,
                  }}
                >
                  —
                </span>
                <span
                  style={{
                    color: "#E8ECF4",
                    filter: `drop-shadow(0 0 18px ${withAlpha(bioSignal.phosphorCyan, 45)})`,
                  }}
                >
                  IGNICIÓN
                </span>
              </div>
              {/* Instrument nameplate — specimen feel */}
              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: font.mono,
                  fontSize: 9,
                  fontWeight: font.weight.bold,
                  letterSpacing: font.tracking?.caps ?? "0.18em",
                  textTransform: "uppercase",
                  color: withAlpha("#E8ECF4", 55),
                }}
              >
                <span style={{ inlineSize: 28, blockSize: 1, background: withAlpha(bioSignal.phosphorCyan, 40) }} />
                <span>Instrumento · v1</span>
                <span style={{ inlineSize: 28, blockSize: 1, background: withAlpha(bioSignal.phosphorCyan, 40) }} />
              </div>
            </div>
          )}

          {/* Kicker — MONO tracked uppercase + spark dot */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 10,
              fontWeight: font.weight.bold,
              letterSpacing: font.tracking?.caps ?? "0.16em",
              textTransform: "uppercase",
              color: bioSignal.phosphorCyan,
              fontFamily: font.mono,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                inlineSize: 5,
                blockSize: 5,
                borderRadius: "50%",
                background: bioSignal.ignition,
                boxShadow: `0 0 6px ${bioSignal.ignition}`,
              }}
            />
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
            <>
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
                      boxShadow: active ? `0 0 0 1px ${opt.color}40 inset` : "none",
                      transition: "background 0.2s, border-color 0.2s",
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
                        fontSize: 14,
                        fontWeight: 700,
                        color: active ? opt.color : "#E8ECF4",
                        letterSpacing: -0.1,
                      }}
                    >
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(232,236,244,0.65)", lineHeight: 1.4, letterSpacing: -0.05 }}>
                      {opt.desc}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            {/* Intent-anchored stat — appears post-selection */}
            <AnimatePresence mode="wait">
              {intent && (() => {
                const sel = current.intents.find((x) => x.id === intent);
                if (!sel) return null;
                return (
                  <motion.div
                    key={sel.id}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: reduced ? 0 : 0.35 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      paddingBlock: 8,
                      paddingInline: 14,
                      borderRadius: radius.full,
                      background: withAlpha(sel.color, 10),
                      border: `1px solid ${withAlpha(sel.color, 30)}`,
                      fontFamily: font.mono,
                      fontSize: 11,
                      fontWeight: font.weight.bold,
                      letterSpacing: -0.02,
                      color: sel.color,
                      maxInlineSize: "fit-content",
                      marginInline: "auto",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        inlineSize: 6,
                        blockSize: 6,
                        borderRadius: "50%",
                        background: sel.color,
                        boxShadow: `0 0 8px ${sel.color}`,
                      }}
                    />
                    {sel.stat}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
            </>
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
                <div key={p.label} style={{ position: "relative" }}>
                  <motion.div
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
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span
                          aria-hidden="true"
                          style={{
                            fontFamily: font.mono,
                            fontSize: 10,
                            fontWeight: font.weight.bold,
                            letterSpacing: font.tracking?.caps ?? "0.16em",
                            color: withAlpha(bioSignal.phosphorCyan, 70),
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#E8ECF4",
                            letterSpacing: -0.1,
                          }}
                        >
                          {p.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(232,236,244,0.7)", marginBlockStart: 3, lineHeight: 1.45, letterSpacing: -0.05 }}>
                        {p.desc}
                      </div>
                    </div>
                  </motion.div>
                  {/* Connective rule — vertical hairline between pillars */}
                  {i < current.pillars.length - 1 && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        insetInlineStart: space[4] + 20,
                        insetBlockStart: "100%",
                        inlineSize: 1,
                        blockSize: space[3],
                        background: `linear-gradient(to bottom, ${withAlpha(bioSignal.phosphorCyan, 40)}, transparent)`,
                      }}
                    />
                  )}
                </div>
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

          {/* FOMO chip — loss-aversion trigger */}
          {current.fomo && (
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.45, duration: 0.4 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                paddingBlock: 8,
                paddingInline: 14,
                borderRadius: radius.full,
                background: withAlpha(bioSignal.plasmaPink, 10),
                border: `1px solid ${withAlpha(bioSignal.plasmaPink, 30)}`,
                fontFamily: font.mono,
                fontSize: 11,
                fontWeight: font.weight.bold,
                letterSpacing: -0.02,
                color: bioSignal.plasmaPink,
                maxInlineSize: "fit-content",
                marginInline: "auto",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  inlineSize: 6,
                  blockSize: 6,
                  borderRadius: "50%",
                  background: bioSignal.plasmaPink,
                  boxShadow: `0 0 8px ${bioSignal.plasmaPink}`,
                }}
              />
              {current.fomo}
            </motion.div>
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
            minBlockSize: 48,
            paddingBlock: 16,
            paddingInline: 22,
            borderRadius: radius.full,
            border: "none",
            background: canAdvance
              ? `linear-gradient(135deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet})`
              : "rgba(255,255,255,0.06)",
            color: canAdvance ? "#050810" : "rgba(232,236,244,0.45)",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: -0.1,
            cursor: canAdvance ? "pointer" : "not-allowed",
            fontFamily: font.family,
            transition: "background 0.25s, color 0.25s",
          }}
          aria-label={isLast ? "Capturar baseline" : isIntentStep && !intent ? "Elige una intención primero" : "Siguiente"}
        >
          {isLast ? "Capturar baseline" : "Siguiente"}
        </motion.button>
        {step > 0 && !isLast && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(232,236,244,0.55)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: -0.05,
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
