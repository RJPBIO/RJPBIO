"use client";
/* ═══════════════════════════════════════════════════════════════
   InstrumentRunner — modal genérico para PSS-4, SWEMWBS-7 y PHQ-2.

   Navega ítem a ítem, guarda respuestas, aplica el scorer recibido
   y devuelve el resultado serializable al padre para persistirlo.

   Respeta reduced-motion, focus-trap y anuncios a11y. No sabe nada
   de persistencia ni de rutas: el padre decide qué hacer con el
   `onComplete(result)`.
   ═══════════════════════════════════════════════════════════════ */

import { useId, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";

// Cada instrumento empieza su escala en un valor distinto. PSS-4 y
// PHQ-2 indexan desde 0; SWEMWBS-7 desde 1. Esta tabla mantiene la
// UI agnóstica del scorer.
const SCALE_OFFSET = { "pss-4": 0, "wemwbs-7": 1, "phq-2": 0 };

function levelTone(instrumentId, result) {
  if (!result) return { color: brand.primary, label: "—" };
  if (instrumentId === "phq-2") {
    return result.positive
      ? { color: semantic.danger, label: "Screening positivo" }
      : { color: semantic.success, label: "Screening negativo" };
  }
  if (instrumentId === "pss-4") {
    const map = {
      low: { color: semantic.success, label: "Estrés bajo" },
      moderate: { color: semantic.warning, label: "Estrés moderado" },
      high: { color: semantic.danger, label: "Estrés alto" },
    };
    return map[result.level] || { color: brand.primary, label: result.level };
  }
  if (instrumentId === "wemwbs-7") {
    const map = {
      low: { color: semantic.danger, label: "Bienestar bajo" },
      average: { color: semantic.warning, label: "Bienestar promedio" },
      high: { color: semantic.success, label: "Bienestar alto" },
    };
    return map[result.level] || { color: brand.primary, label: result.level };
  }
  return { color: brand.primary, label: result.level || "—" };
}

export default function InstrumentRunner({
  show,
  instrument,        // { id, name, version, items, scale, ... }
  scorer,            // (answers) => { score, level, ... }
  isDark,
  onComplete,        // (entry) => void  — entry: {instrumentId, ts, score, level, answers}
  onClose,
}) {
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);

  if (!show || !instrument) return null;

  const total = instrument.items.length;
  const item = instrument.items[idx];
  const offset = SCALE_OFFSET[instrument.id] ?? 0;

  function pick(scaleIndex) {
    const value = scaleIndex + offset;
    const next = { ...answers, [item.id]: value };
    setAnswers(next);
    if (idx + 1 < total) {
      setIdx(idx + 1);
      announce(`Pregunta ${idx + 2} de ${total}`);
    } else {
      const r = scorer(next);
      setResult(r);
      if (r) announce("Evaluación completada.");
    }
  }

  function save() {
    if (!result) return;
    onComplete?.({
      instrumentId: instrument.id,
      ts: Date.now(),
      score: typeof result.metricScore === "number" ? result.metricScore : result.score,
      rawScore: typeof result.rawScore === "number" ? result.rawScore : null,
      level: result.level ?? (result.positive ? "positive" : "negative"),
      answers,
    });
    setAnswers({});
    setIdx(0);
    setResult(null);
    onClose?.();
  }

  function prev() { if (idx > 0) setIdx(idx - 1); }

  const tone = levelTone(instrument.id, result);
  const displayScore =
    result && typeof result.metricScore === "number"
      ? result.metricScore
      : result?.score;

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ position: "fixed", inset: 0, background: bg, zIndex: 220, padding: 20, overflowY: "auto" }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 16 }}>
        <div>
          <h2 id={titleId} style={{ fontSize: 14, fontWeight: font.weight.black, color: t1, margin: 0 }}>
            {instrument.name}
          </h2>
          <p style={{ fontSize: 10, color: t3, margin: 0, marginBlockStart: 2, letterSpacing: 1 }}>
            {instrument.version}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar evaluación"
          style={{
            inlineSize: 44, blockSize: 44,
            border: "none", background: "transparent", color: t2,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon name="close" size={20} color={t2} aria-hidden="true" />
        </button>
      </header>

      {!result && item && (
        <section aria-label={`Pregunta ${idx + 1} de ${total}`} style={{ maxInlineSize: 560, marginInline: "auto" }}>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={idx + 1}
            aria-label={`Pregunta ${idx + 1} de ${total}`}
            style={{ blockSize: 4, background: bd, borderRadius: 2, overflow: "hidden", marginBlockEnd: 14 }}
          >
            <div style={{ blockSize: "100%", inlineSize: `${((idx + 1) / total) * 100}%`, background: brand.primary, transition: "inline-size .3s" }} />
          </div>

          <div style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 12 }}>
            {idx + 1} / {total}
          </div>

          <h3 style={{ color: t1, fontSize: 15, fontWeight: 700, lineHeight: 1.5, marginBlockEnd: 20 }}>
            {item.text}
          </h3>

          <div role="radiogroup" aria-label="Frecuencia" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {instrument.scale.map((label, i) => {
              const value = i + offset;
              const selected = answers[item.id] === value;
              return (
                <button
                  key={i}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => pick(i)}
                  style={{
                    inlineSize: "100%",
                    paddingBlock: 12,
                    paddingInline: 14,
                    background: selected ? withAlpha(brand.primary, 10) : cd,
                    color: t1,
                    border: `1px solid ${selected ? brand.primary : bd}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "start",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {idx > 0 && (
            <button
              onClick={prev}
              aria-label="Volver a pregunta anterior"
              style={{ marginBlockStart: 14, background: "transparent", color: t2, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 8 }}
            >
              ← Anterior
            </button>
          )}
        </section>
      )}

      {result && (
        <section aria-label="Resultado de la evaluación" style={{ maxInlineSize: 560, marginInline: "auto" }}>
          <div
            style={{
              background: cd,
              border: `2px solid ${tone.color}`,
              borderRadius: 16,
              padding: 20,
              marginBlockEnd: 16,
              textAlign: "center",
            }}
          >
            <p style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 8 }}>
              Resultado
            </p>
            <div style={{ color: tone.color, fontSize: 28, fontWeight: font.weight.black }}>
              {tone.label}
            </div>
            <p style={{ color: t2, fontSize: 12, marginBlockStart: 8 }}>
              Puntaje: {displayScore} / {result.max ?? instrument.max}
            </p>
          </div>

          {result.positive && instrument.id === "phq-2" && (
            <div
              style={{
                background: withAlpha(semantic.danger, 8),
                border: `1px solid ${withAlpha(semantic.danger, 30)}`,
                borderRadius: 12,
                padding: 14,
                marginBlockEnd: 16,
              }}
            >
              <p style={{ color: semantic.danger, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBlockEnd: 6 }}>
                Recomendación clínica
              </p>
              <p style={{ color: t1, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                Un screening positivo no equivale a un diagnóstico. Consulta con un profesional
                de salud mental para una evaluación completa.
              </p>
            </div>
          )}

          <button
            onClick={save}
            aria-label="Guardar evaluación"
            style={{
              inlineSize: "100%",
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
            Guardar evaluación
          </button>
        </section>
      )}
    </motion.div>
  );
}
