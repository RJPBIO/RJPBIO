"use client";
/* ═══════════════════════════════════════════════════════════════
   NOM-035-STPS-2018 QUESTIONNAIRE — Guía de Referencia II
   Riesgo psicosocial laboral. 46 ítems oficiales.
   ═══════════════════════════════════════════════════════════════ */

import { useId, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";
import {
  NOM035_ITEMS_GUIA_II, NOM035_SCALE, NOM035_CATEGORIES,
  scoreNOM035, actionsFor,
} from "../lib/nom035";

const LEVEL_COLORS = {
  null_or_low: brand.primary,
  low: semantic.info,
  medium: semantic.warning,
  high: "#F97316",
  very_high: semantic.danger,
};

export default function NOM035Questionnaire({ show, isDark, onClose, onComplete }) {
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);

  const item = NOM035_ITEMS_GUIA_II[idx];
  const total = NOM035_ITEMS_GUIA_II.length;

  function pick(score) {
    const next = { ...answers, [item.id]: score };
    setAnswers(next);
    if (idx + 1 < total) {
      setIdx(idx + 1);
      announce(`Pregunta ${idx + 2} de ${total}`);
    } else {
      const r = scoreNOM035({ answers: next });
      setResult(r);
      announce(`Cuestionario completado. Nivel de riesgo: ${r.level.label}.`);
    }
  }

  function save() {
    onComplete?.({ ts: Date.now(), answers, ...result });
    onClose?.();
  }

  function prev() { if (idx > 0) setIdx(idx - 1); }

  if (!show) return null;

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
        <h2 id={titleId} style={{ fontSize: 14, fontWeight: font.weight.black, color: t1, margin: 0 }}>
          NOM-035 · Riesgo psicosocial
        </h2>
        <button onClick={onClose} aria-label="Cerrar cuestionario" style={{ border: "none", background: "transparent", color: t2, padding: 8, cursor: "pointer", minInlineSize: 44, minBlockSize: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
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

          <div style={{ display: "flex", justifyContent: "space-between", marginBlockEnd: 12 }}>
            <span style={{ color: t3, fontSize: 12, letterSpacing: -0.1, fontWeight: 600, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontVariantNumeric: "tabular-nums" }}>
              {idx + 1} / {total}
            </span>
            <span style={{ color: t3, fontSize: 12, letterSpacing: -0.05, fontWeight: 600 }}>
              {NOM035_CATEGORIES[item.cat]}
            </span>
          </div>

          <h3 style={{ color: t1, fontSize: 15, fontWeight: 700, lineHeight: 1.5, marginBlockEnd: 20 }}>
            {item.q}
          </h3>

          <div role="radiogroup" aria-label="Frecuencia" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {NOM035_SCALE.map((s) => (
              <button
                key={s.score}
                role="radio"
                aria-checked={answers[item.id] === s.score}
                onClick={() => pick(s.score)}
                style={{
                  inlineSize: "100%",
                  paddingBlock: 12,
                  paddingInline: 14,
                  background: answers[item.id] === s.score ? withAlpha(brand.primary, 10) : cd,
                  color: t1,
                  border: `1px solid ${answers[item.id] === s.score ? brand.primary : bd}`,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "start",
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))}
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
        <section aria-label="Resultado NOM-035" style={{ maxInlineSize: 560, marginInline: "auto" }}>
          <div style={{ background: cd, border: `2px solid ${LEVEL_COLORS[result.level.key]}`, borderRadius: 16, padding: 20, marginBlockEnd: 16, textAlign: "center" }}>
            <p style={{ color: t3, fontSize: 12, letterSpacing: -0.05, fontWeight: 600, marginBlockEnd: 8 }}>
              Nivel de riesgo psicosocial
            </p>
            <div style={{ color: LEVEL_COLORS[result.level.key], fontSize: 28, fontWeight: font.weight.black, letterSpacing: -0.5 }}>
              {result.level.label}
            </div>
            <p style={{ color: t2, fontSize: 13, letterSpacing: -0.05, marginBlockStart: 8 }}>
              Puntaje total: <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{result.total}</span>
            </p>
          </div>

          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 16, marginBlockEnd: 16 }}>
            <h4 style={{ color: t3, fontSize: 12, letterSpacing: -0.05, fontWeight: 600, margin: 0, marginBlockEnd: 12 }}>
              Puntaje por categoría
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(result.byCat).map(([cat, score]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, letterSpacing: -0.05 }}>
                  <span style={{ color: t1 }}>{NOM035_CATEGORIES[cat] || cat}</span>
                  <span style={{ color: t2, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontVariantNumeric: "tabular-nums" }}>{score}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: withAlpha(LEVEL_COLORS[result.level.key], 8), border: `1px solid ${withAlpha(LEVEL_COLORS[result.level.key], 30)}`, borderRadius: 12, padding: 14, marginBlockEnd: 16 }}>
            <p style={{ color: t3, fontSize: 12, letterSpacing: -0.05, fontWeight: 600, margin: 0, marginBlockEnd: 6 }}>
              Acción recomendada (NOM-035 Art. 7-8)
            </p>
            <p style={{ color: t1, fontSize: 13, letterSpacing: -0.05, lineHeight: 1.6, margin: 0 }}>
              {actionsFor(result.level.key)}
            </p>
          </div>

          <button
            onClick={save}
            aria-label="Guardar evaluación"
            style={{ inlineSize: "100%", minBlockSize: 48, paddingBlock: 14, background: brand.primary, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, letterSpacing: -0.1, cursor: "pointer" }}
          >
            Guardar evaluación
          </button>
        </section>
      )}
    </motion.div>
  );
}
