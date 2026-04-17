"use client";
/* ═══════════════════════════════════════════════════════════════
   PHYSIOLOGICAL SIGH — 90-second acute stress release
   Balban et al. 2023 (Cell Reports Medicine, N=114)
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";

const CYCLE_STEPS = [
  { id: "in1", label: "Inhala por la nariz", ms: 2000, phase: "inhale" },
  { id: "in2", label: "Segunda inhalación corta", ms: 1000, phase: "inhale" },
  { id: "out", label: "Exhala largo por la boca", ms: 7000, phase: "exhale" },
];

const TOTAL_CYCLES = 8;
const TOTAL_MS = CYCLE_STEPS.reduce((a, s) => a + s.ms, 0) * TOTAL_CYCLES;

export default function PhysiologicalSigh({ show, isDark, onClose, onComplete }) {
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(false);
  const [doneTs, setDoneTs] = useState(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setStep(0); setCycle(0); setRunning(false); setDoneTs(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [show]);

  useEffect(() => {
    if (!running) return;
    if (cycle >= TOTAL_CYCLES) {
      setRunning(false);
      setDoneTs(Date.now());
      announce("Práctica completa. 8 ciclos de suspiro fisiológico.");
      onComplete?.({
        ts: Date.now(),
        technique: "physiological_sigh",
        cycles: TOTAL_CYCLES,
        durationSec: Math.round((Date.now() - startedAtRef.current) / 1000),
      });
      return;
    }
    const s = CYCLE_STEPS[step];
    timerRef.current = setTimeout(() => {
      if (step === CYCLE_STEPS.length - 1) {
        setStep(0);
        setCycle((c) => c + 1);
      } else {
        setStep((s2) => s2 + 1);
      }
    }, s.ms);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [running, step, cycle, onComplete]);

  function start() {
    startedAtRef.current = Date.now();
    setStep(0);
    setCycle(0);
    setDoneTs(null);
    setRunning(true);
    announce("Iniciando suspiro fisiológico.");
  }

  function stop() {
    setRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  if (!show) return null;

  const currentStep = CYCLE_STEPS[step];
  const scale = !running
    ? 1
    : currentStep.phase === "inhale"
      ? (step === 0 ? 1.25 : 1.4)
      : 0.9;

  const progressPct = running
    ? ((cycle * CYCLE_STEPS.length + step) / (TOTAL_CYCLES * CYCLE_STEPS.length)) * 100
    : 0;

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        background: bg,
        zIndex: 220,
        padding: 20,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 16 }}>
        <h2 id={titleId} style={{ fontSize: 16, fontWeight: font.weight.black, color: t1, margin: 0 }}>
          Suspiro Fisiológico
        </h2>
        <button
          onClick={onClose}
          aria-label="Cerrar ejercicio"
          style={{ border: "none", background: "transparent", color: t2, padding: 8, cursor: "pointer" }}
        >
          <Icon name="close" size={20} color={t2} aria-hidden="true" />
        </button>
      </header>

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        <motion.div
          aria-hidden="true"
          animate={reduced ? {} : { scale }}
          transition={reduced ? {} : { duration: running ? currentStep.ms / 1000 : 0.4, ease: "easeInOut" }}
          style={{
            inlineSize: 180,
            blockSize: 180,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${withAlpha(brand.primary, 30)}, ${withAlpha(brand.primary, 10)} 70%)`,
            border: `2px solid ${brand.primary}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: brand.primary, fontSize: 14, fontWeight: font.weight.black }}>
            {running ? `${cycle + 1}/${TOTAL_CYCLES}` : "Listo"}
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          {running ? (
            <motion.p
              key={`${cycle}-${step}`}
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              style={{ fontSize: 20, fontWeight: font.weight.black, color: t1, textAlign: "center", maxInlineSize: 300 }}
            >
              {currentStep.label}
            </motion.p>
          ) : doneTs ? (
            <motion.div key="done" initial={reduced ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: font.weight.black, color: brand.primary, marginBlockEnd: 8 }}>
                Completado
              </p>
              <p style={{ fontSize: 12, color: t2, lineHeight: 1.5, maxInlineSize: 300 }}>
                El efecto parasimpático es mayor en los primeros 60 segundos post-práctica.
              </p>
            </motion.div>
          ) : (
            <motion.div key="intro" initial={reduced ? { opacity: 1 } : { opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", maxInlineSize: 340 }}>
              <p style={{ fontSize: 13, color: t2, lineHeight: 1.6, marginBlockEnd: 8 }}>
                Doble inhalación nasal + exhalación larga bucal. 8 ciclos ≈ 80 segundos.
              </p>
              <p style={{ fontSize: 11, color: t3, lineHeight: 1.5 }}>
                Balban et al. 2023 — descarga parasimpática aguda con evidencia directa de RCT (N=114).
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {running && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          aria-label="Progreso del ejercicio"
          style={{ blockSize: 4, background: bd, borderRadius: 2, overflow: "hidden", marginBlockEnd: 12 }}
        >
          <div style={{ blockSize: "100%", inlineSize: `${progressPct}%`, background: brand.primary, transition: "inline-size .4s" }} />
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {!running && !doneTs && (
          <button
            onClick={start}
            aria-label="Iniciar suspiro fisiológico"
            style={{
              flex: 1,
              paddingBlock: 14,
              background: brand.primary,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: font.weight.black,
              letterSpacing: 1,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Empezar
          </button>
        )}
        {running && (
          <button
            onClick={stop}
            aria-label="Pausar ejercicio"
            style={{
              flex: 1,
              paddingBlock: 14,
              background: "transparent",
              color: t1,
              border: `1px solid ${bd}`,
              borderRadius: 14,
              fontSize: 13,
              fontWeight: font.weight.black,
              letterSpacing: 1,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Pausar
          </button>
        )}
        {doneTs && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              flex: 1,
              paddingBlock: 14,
              background: brand.primary,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: font.weight.black,
              letterSpacing: 1,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Listo
          </button>
        )}
      </div>
    </motion.div>
  );
}
