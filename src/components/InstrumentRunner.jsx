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
import { colors, withAlpha } from "./app/v2/tokens";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";

// Phase 6B SP2 — Shim de compatibilidad con tokens.js v2.
// Reemplaza imports legacy `lib/theme` + `lib/tokens` (brand, semantic,
// font.weight) por equivalentes derivados de v2 sin reescribir la
// estructura de styles del componente. Pesos tipográficos colapsan a
// max 500 (regla ADN v2: solo 200/400/500 permitidos).
const brand = { primary: colors.accent.phosphorCyan };
const semantic = {
  warning: colors.semantic.warning,
  danger: colors.semantic.danger,
  success: colors.semantic.success,
};
const font = {
  weight: { thin: 200, light: 200, regular: 400, medium: 500, semibold: 500, bold: 500, black: 500 },
};

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
  // Phase 6B SP2 — superficies derivadas de tokens v2 (isDark legacy se
  // ignora: la PWA v2 es dark-only canon). Sustituye resolveTheme(isDark).
  const bg = colors.bg.base;
  const cd = colors.bg.raised;
  const bd = colors.separator;
  const t1 = colors.text.primary;
  const t2 = colors.text.secondary;
  const t3 = colors.text.muted;
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
      style={{
        position: "fixed", inset: 0,
        background: `radial-gradient(ellipse 70% 80% at 50% 0%, ${withAlpha(brand.primary, 18)} 0%, transparent 55%), linear-gradient(180deg, #0a0a10 0%, #08080A 100%)`,
        zIndex: 220, padding: "20px 20px 60px", overflowY: "auto",
      }}
    >
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBlockEnd: 24,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5 }}>
              <motion.span
                animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
                transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                style={{ position: "absolute", inset: 0, borderRadius: "50%", background: brand.primary }}
              />
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${brand.primary} 55%)`, boxShadow: `0 0 8px ${brand.primary}` }} />
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 9, fontWeight: 500,
              color: brand.primary, letterSpacing: "0.30em", textTransform: "uppercase",
              textShadow: `0 0 6px ${withAlpha(brand.primary, 50)}`,
            }}>
              Evaluación validada · {instrument.version}
            </span>
          </span>
          <h2 id={titleId} style={{
            fontSize: 19, fontWeight: 300, color: t1,
            letterSpacing: -0.4, lineHeight: 1.1, margin: 0,
          }}>
            {instrument.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar evaluación"
          style={{
            inlineSize: 38, blockSize: 38,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(180deg, ${withAlpha(brand.primary, 18)} 0%, ${withAlpha(brand.primary, 6)} 100%)`,
            border: `0.5px solid ${withAlpha(brand.primary, 38)}`,
            borderRadius: "50%",
            color: brand.primary,
            cursor: "pointer",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13"><path d="M3 3 L10 10 M10 3 L3 10" stroke={brand.primary} strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </header>

      {!result && item && (
        <section aria-label={`Pregunta ${idx + 1} de ${total}`} style={{ maxInlineSize: 560, marginInline: "auto" }}>
          {/* Progress bar with cyan gradient + glow */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={idx + 1}
            aria-label={`Pregunta ${idx + 1} de ${total}`}
            style={{ blockSize: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", marginBlockEnd: 16, boxShadow: `inset 0 0.5px 0 rgba(0,0,0,0.4)` }}
          >
            <div style={{
              blockSize: "100%",
              inlineSize: `${((idx + 1) / total) * 100}%`,
              background: `linear-gradient(90deg, ${withAlpha(brand.primary, 60)} 0%, ${brand.primary} 100%)`,
              borderRadius: 99,
              boxShadow: `0 0 8px ${withAlpha(brand.primary, 60)}`,
              transition: "inline-size .35s cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBlockEnd: 14,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 8.5, fontWeight: 500,
              color: brand.primary, letterSpacing: "0.24em", textTransform: "uppercase",
              textShadow: `0 0 5px ${withAlpha(brand.primary, 50)}`,
            }}>
              Pregunta · {String(idx + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
            <span aria-hidden="true" style={{
              flex: 1, blockSize: 1, marginInlineStart: 8,
              background: `linear-gradient(90deg, ${withAlpha(brand.primary, 30)} 0%, ${withAlpha(brand.primary, 5)} 70%, transparent 100%)`,
            }} />
          </div>

          <h3 style={{
            color: t1, fontSize: 18, fontWeight: 400,
            letterSpacing: -0.3, lineHeight: 1.4,
            marginBlockEnd: 24, margin: 0,
            paddingBlockEnd: 24,
          }}>
            {item.text}
          </h3>

          <div role="radiogroup" aria-label="Frecuencia" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                    position: "relative",
                    display: "flex", alignItems: "center", gap: 12,
                    inlineSize: "100%",
                    paddingBlock: 14, paddingInline: 14,
                    background: selected
                      ? `radial-gradient(ellipse 70% 100% at 0% 50%, ${withAlpha(brand.primary, 18)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`
                      : `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.08) 100%)`,
                    color: t1,
                    border: `0.5px solid ${selected ? withAlpha(brand.primary, 40) : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 14,
                    fontSize: 14, fontWeight: 500, letterSpacing: -0.2,
                    textAlign: "start", cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: selected
                      ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha(brand.primary, 28)}, 0 4px 14px rgba(0,0,0,0.24), 0 0 12px ${withAlpha(brand.primary, 14)}`
                      : `inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.18)`,
                    transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {/* Custom radio bullet */}
                  <span aria-hidden="true" style={{
                    flexShrink: 0,
                    inlineSize: 18, blockSize: 18,
                    borderRadius: "50%",
                    background: selected
                      ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 50%), linear-gradient(140deg, ${withAlpha(brand.primary, 32)} 0%, ${withAlpha(brand.primary, 10)} 100%)`
                      : "rgba(255,255,255,0.04)",
                    border: `0.5px solid ${selected ? withAlpha(brand.primary, 60) : "rgba(255,255,255,0.15)"}`,
                    boxShadow: selected ? `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 8px ${withAlpha(brand.primary, 40)}` : "inset 0 1px 0 rgba(255,255,255,0.05)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {selected && (
                      <span aria-hidden="true" style={{
                        inlineSize: 7, blockSize: 7,
                        borderRadius: "50%",
                        background: brand.primary,
                        boxShadow: `0 0 6px ${brand.primary}`,
                      }} />
                    )}
                  </span>
                  <span style={{ flex: 1 }}>{label}</span>
                </button>
              );
            })}
          </div>

          {idx > 0 && (
            <button
              onClick={prev}
              aria-label="Volver a pregunta anterior"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                marginBlockStart: 18,
                background: "transparent",
                color: t3, border: "none",
                fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 8.5, fontWeight: 500,
                letterSpacing: "0.18em", textTransform: "uppercase",
                cursor: "pointer",
                padding: "8px 4px",
              }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9"><path d="M5.5 1.5 L1.5 4.5 L5.5 7.5" stroke={t3} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
              Anterior
            </button>
          )}
        </section>
      )}

      {result && (
        <section aria-label="Resultado de la evaluación" style={{ maxInlineSize: 560, marginInline: "auto" }}>
          <div
            style={{
              background: cd,
              border: `1px solid ${withAlpha(tone.color, 40)}`,
              borderRadius: 16,
              padding: 20,
              marginBlockEnd: 16,
              textAlign: "center",
            }}
          >
            <div style={{ color: tone.color, fontSize: 22, fontWeight: 500, letterSpacing: "-0.005em" }}>
              {tone.label}
            </div>
            <p style={{ color: t2, fontSize: 13, marginBlockStart: 8 }}>
              Puntaje {displayScore} de {result.max ?? instrument.max}
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
              <p style={{ color: semantic.danger, fontSize: 13, fontWeight: 500, marginBlockEnd: 6 }}>
                Recomendación clínica
              </p>
              <p style={{ color: t1, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
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
              minBlockSize: 48,
              paddingBlock: 14,
              background: brand.primary,
              color: colors.bg.base,
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: -0.1,
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
