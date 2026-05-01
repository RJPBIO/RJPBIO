"use client";
/* ═══════════════════════════════════════════════════════════════
   CHRONOTYPE TEST — Reduced MEQ-SA (Adan & Almirall 1991)
   ═══════════════════════════════════════════════════════════════ */

import { useId, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";
import { MEQ_SA_QUESTIONS, classifyChronotype } from "../lib/chronotype";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const numStyle = (color, weight = 700) => ({
  fontFamily: MONO,
  fontWeight: weight,
  color,
  letterSpacing: -0.1,
  fontVariantNumeric: "tabular-nums",
});
const kickerStyle = (color) => ({
  fontSize: 12,
  fontWeight: 600,
  color,
  letterSpacing: -0.05,
  margin: 0,
});

export default function ChronotypeTest({ show, isDark, onClose, onComplete }) {
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const idx = answers.length;
  const total = MEQ_SA_QUESTIONS.length;
  const question = MEQ_SA_QUESTIONS[idx];

  function pick(score) {
    const next = [...answers, score];
    setAnswers(next);
    if (next.length === total) setResult(classifyChronotype(next));
  }

  function save() {
    onComplete?.({ ...result, completedAt: Date.now() });
    onClose?.();
  }

  function reset() { setAnswers([]); setResult(null); }

  if (!show) return null;

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0,
        background: `radial-gradient(ellipse 70% 80% at 50% 0%, #D9770624 0%, transparent 55%), linear-gradient(180deg, #0a0a10 0%, #08080A 100%)`,
        zIndex: 220, padding: "20px 20px 60px", overflowY: "auto",
      }}
    >
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBlockEnd: 24,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5, display: "inline-block" }}>
              <motion.span
                animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
                transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#D97706" }}
              />
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, #D97706 55%)`, boxShadow: `0 0 8px #D97706` }} />
            </span>
            <span style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 500,
              color: "#D97706", letterSpacing: "0.30em", textTransform: "uppercase",
              textShadow: `0 0 6px #D9770680`,
            }}>
              MEQ-SA · Cronotipo
            </span>
          </span>
          <h2 id={titleId} style={{
            fontSize: 22, fontWeight: 300, color: t1,
            letterSpacing: -0.5, lineHeight: 1.1, margin: 0,
          }}>
            Tu ritmo circadiano
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar test"
          style={{
            inlineSize: 38, blockSize: 38,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(180deg, #D9770618 0%, #D9770608 100%)`,
            border: `0.5px solid #D9770638`,
            borderRadius: "50%",
            color: "#D97706",
            cursor: "pointer",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13"><path d="M3 3 L10 10 M10 3 L3 10" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </header>

      {!result && question && (
        <section aria-label={`Pregunta ${idx + 1} de ${total}`} style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={idx}
            aria-label={`Pregunta ${idx + 1} de ${total}`}
            style={{ blockSize: 4, background: bd, borderRadius: 2, overflow: "hidden", marginBlockEnd: 24 }}
          >
            <div style={{ blockSize: "100%", inlineSize: `${(idx / total) * 100}%`, background: brand.primary, transition: "inline-size .3s" }} />
          </div>

          <p style={{ ...kickerStyle(t3), marginBlockEnd: 8 }}>
            Pregunta <span style={numStyle(t3, 600)}>{idx + 1}</span> de <span style={numStyle(t3, 600)}>{total}</span>
          </p>
          <h3 style={{ color: t1, fontSize: 20, fontWeight: 700, lineHeight: 1.35, letterSpacing: -0.2, marginBlockEnd: 24 }}>
            {question.q}
          </h3>

          <div role="radiogroup" aria-labelledby={`${titleId}-q${idx}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {question.options.map((opt, i) => (
              <button
                key={i}
                role="radio"
                aria-checked="false"
                onClick={() => pick(opt.score)}
                style={{
                  inlineSize: "100%",
                  minBlockSize: 48,
                  paddingBlock: 14,
                  paddingInline: 16,
                  background: cd,
                  color: t1,
                  border: `1px solid ${bd}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: -0.05,
                  textAlign: "start",
                  cursor: "pointer",
                }}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section aria-label="Resultado de cronotipo" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 16, padding: 20, marginBlockEnd: 16 }}>
            <p style={{ ...kickerStyle(t3), marginBlockEnd: 8 }}>
              Tu cronotipo
            </p>
            <h3 style={{ color: brand.primary, fontSize: 26, fontWeight: 800, letterSpacing: -0.6, marginBlockEnd: 6 }}>
              {result.label}
            </h3>
            <p style={{ color: t2, fontSize: 12, letterSpacing: -0.05 }}>
              Puntaje MEQ-SA: <span style={numStyle(t2, 700)}>{result.score}/25</span>
            </p>

            <div style={{ marginBlockStart: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <Row label="Ventana de sueño" value={result.sleepWindow} t1={t1} t3={t3} />
              <Row label="Luz matutina" value={result.lightExposure} t1={t1} t3={t3} />
              <Row label="Trabajo profundo" value={result.deepWork} t1={t1} t3={t3} />
              <Row label="Ejercicio pico" value={result.exercisePeak} t1={t1} t3={t3} />
              <Row label="Cena recomendada antes de" value={result.dinnerCutoff} t1={t1} t3={t3} />
            </div>
          </div>

          <p style={{ color: t3, fontSize: 11, lineHeight: 1.6, marginBlockEnd: 16, letterSpacing: -0.05 }}>
            Basado en Adan &amp; Almirall 1991. Cronotipos son disposiciones, no destinos — luz matutina fuerte puede adelantar el ritmo circadiano incluso en vespertinos.
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={reset}
              aria-label="Repetir test"
              style={{
                flex: 1,
                minBlockSize: 48,
                paddingBlock: 14,
                background: "transparent",
                color: t1,
                border: `1px solid ${bd}`,
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: -0.05,
                cursor: "pointer",
              }}
            >
              Repetir
            </button>
            <button
              onClick={save}
              aria-label="Guardar cronotipo"
              style={{
                flex: 2,
                minBlockSize: 48,
                paddingBlock: 14,
                background: brand.primary,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: -0.1,
                cursor: "pointer",
              }}
            >
              Guardar
            </button>
          </div>
        </section>
      )}
    </motion.div>
  );
}

function Row({ label, value, t1, t3 }) {
  return (
    <div>
      <div style={{ color: t3, fontSize: 11, fontWeight: 600, letterSpacing: -0.05, marginBlockEnd: 3 }}>{label}</div>
      <div style={{ color: t1, fontSize: 14, fontWeight: 700, letterSpacing: -0.1 }}>{value}</div>
    </div>
  );
}
