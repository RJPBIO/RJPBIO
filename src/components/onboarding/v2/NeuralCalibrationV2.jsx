"use client";
/* ═══════════════════════════════════════════════════════════════
   NeuralCalibrationV2 — onboarding clínico con instrumentos
   peer-reviewed.
   Phase 6 quick-fix · ADN Tactical Premium Dark estricto.

   4 instrumentos + summary:
     1 PSS-4   · Cohen 1983 (4 items, scale 0-4, items 2,3 reversed)
     2 rMEQ    · Adan & Almirall 1991 (5 items, custom scoring)
     3 MAIA-2  · Mehling 2018 short (8 items, 4 dimensiones)
     4 HRV     · placeholder Phase 6B
     5 Summary · scores + recommendations derivadas

   onComplete(baseline) shape (compatible con store.setNeuralBaseline):
     {
       pss4: { score, profile },
       rmeq: { score, chronotype, bestTimeWindow },
       maia2: { noticing, attentionRegulation, emotionalAwareness, bodyListening, composite },
       hrvBaseline: null,
       composite, profile, profileLabel,
       recommendations: { primaryIntent, sessionGoal, difficulty },
       timestamp,
       version: "v2"
     }
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion, useFocusTrap } from "../../../lib/a11y";

const ACCENT = "#22D3EE";
const BG = "#08080A";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "rgba(255,255,255,0.6)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_FAINT = "rgba(255,255,255,0.35)";

const FONT = '"Inter Tight", "Sohne", system-ui, -apple-system, sans-serif';

/* ──── Instrument definitions ──────────────────────────── */

const PSS4_ITEMS = [
  {
    text: "En el último mes, ¿con qué frecuencia te sentiste incapaz de controlar las cosas importantes de tu vida?",
    reversed: false,
  },
  {
    text: "En el último mes, ¿con qué frecuencia te sentiste seguro/a sobre tu capacidad para manejar tus problemas personales?",
    reversed: true,
  },
  {
    text: "En el último mes, ¿con qué frecuencia sentiste que las cosas iban como tú querías?",
    reversed: true,
  },
  {
    text: "En el último mes, ¿con qué frecuencia sentiste que las dificultades se acumulaban tanto que no podías superarlas?",
    reversed: false,
  },
];
const PSS4_OPTIONS = [
  { label: "Nunca",                value: 0 },
  { label: "Casi nunca",           value: 1 },
  { label: "A veces",              value: 2 },
  { label: "Frecuentemente",       value: 3 },
  { label: "Muy frecuentemente",   value: 4 },
];

const RMEQ_ITEMS = [
  {
    text: "Si fueras totalmente libre de planificar tu día, ¿a qué hora te levantarías?",
    options: [
      { label: "Antes de 6:30",    value: 5 },
      { label: "6:30 — 7:45",      value: 4 },
      { label: "7:45 — 9:45",      value: 3 },
      { label: "9:45 — 11:00",     value: 2 },
      { label: "Después de 11:00", value: 1 },
    ],
  },
  {
    text: "Después de despertar, ¿cómo te sientes en los primeros 30 minutos?",
    options: [
      { label: "Muy alerta",         value: 4 },
      { label: "Bastante alerta",    value: 3 },
      { label: "Bastante somnoliento/a", value: 2 },
      { label: "Muy somnoliento/a",  value: 1 },
    ],
  },
  {
    text: "¿A qué hora del día te sientes mejor para trabajar mentalmente?",
    options: [
      { label: "Pico mañana — antes de 11:00",  value: 6 },
      { label: "Pico mediodía",                 value: 4 },
      { label: "Pico tarde — después de 17:00", value: 2 },
      { label: "Pico noche — después de 21:00", value: 0 },
    ],
  },
  {
    text: "Cuando te acuestas tarde, ¿qué tipo de día sigue?",
    options: [
      { label: "Muy difícil",   value: 1 },
      { label: "Algo difícil",  value: 2 },
      { label: "Normal",        value: 3 },
      { label: "Sin problema",  value: 4 },
    ],
  },
  {
    text: "¿De qué tipo te consideras?",
    options: [
      { label: "Definitivamente matutino/a",       value: 6 },
      { label: "Más matutino/a que vespertino/a",  value: 4 },
      { label: "Más vespertino/a que matutino/a",  value: 2 },
      { label: "Definitivamente vespertino/a",     value: 0 },
    ],
  },
];

const MAIA2_DIMENSIONS = [
  { id: "noticing",            label: "Noticing" },
  { id: "attentionRegulation", label: "Attention Regulation" },
  { id: "emotionalAwareness",  label: "Emotional Awareness" },
  { id: "bodyListening",       label: "Body Listening" },
];
const MAIA2_ITEMS = [
  { dimension: "noticing",            text: "Cuando estoy tenso/a, noto dónde está la tensión en mi cuerpo." },
  { dimension: "noticing",            text: "Noto cambios en mi respiración cuando estoy ansioso/a." },
  { dimension: "attentionRegulation", text: "Puedo mantener mi atención en mis sensaciones corporales." },
  { dimension: "attentionRegulation", text: "Puedo enfocarme en mi respiración cuando lo decido." },
  { dimension: "emotionalAwareness",  text: "Cuando algo está mal en mi vida, lo siento en mi cuerpo." },
  { dimension: "emotionalAwareness",  text: "Reconozco cómo mi cuerpo me dice que estoy estresado/a." },
  { dimension: "bodyListening",       text: "Escucho la información que mi cuerpo me da sobre mi estado emocional." },
  { dimension: "bodyListening",       text: "Cuando estoy alterado/a, me tomo el tiempo para entender qué siento." },
];
const MAIA2_OPTIONS = [
  { label: "Nunca",         value: 0 },
  { label: "Raramente",     value: 1 },
  { label: "Algo",          value: 2 },
  { label: "A veces",       value: 3 },
  { label: "Frecuentemente", value: 4 },
  { label: "Siempre",       value: 5 },
];

/* ──── Scoring ─────────────────────────────────────────── */

function scorePSS4(answers) {
  // answers: array of 4 numbers (0-4) en orden de PSS4_ITEMS.
  let total = 0;
  PSS4_ITEMS.forEach((item, i) => {
    const v = answers[i];
    if (typeof v !== "number") return;
    total += item.reversed ? 4 - v : v;
  });
  const profile = total <= 5 ? "low" : total <= 9 ? "moderate" : "high";
  return { score: total, profile };
}

function scoreRMEQ(answers) {
  // answers: array of 5 numbers (custom values per item).
  const total = answers.reduce((a, v) => a + (typeof v === "number" ? v : 0), 0);
  let chronotype = "intermediate";
  if (total <= 7)       chronotype = "definitely_evening";
  else if (total <= 11) chronotype = "moderately_evening";
  else if (total <= 17) chronotype = "intermediate";
  else if (total <= 21) chronotype = "moderately_morning";
  else                  chronotype = "definitely_morning";
  const bestTimeWindow =
    chronotype === "definitely_morning" || chronotype === "moderately_morning" ? "morning" :
    chronotype === "intermediate" ? "midday" :
    chronotype === "moderately_evening" ? "afternoon" : "evening";
  return { score: total, chronotype, bestTimeWindow };
}

function scoreMAIA2(answers) {
  // answers: array of 8 numbers (0-5) en orden de MAIA2_ITEMS.
  const dims = { noticing: [], attentionRegulation: [], emotionalAwareness: [], bodyListening: [] };
  MAIA2_ITEMS.forEach((it, i) => {
    const v = answers[i];
    if (typeof v === "number") dims[it.dimension].push(v);
  });
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const noticing = avg(dims.noticing);
  const attentionRegulation = avg(dims.attentionRegulation);
  const emotionalAwareness = avg(dims.emotionalAwareness);
  const bodyListening = avg(dims.bodyListening);
  const composite = (noticing + attentionRegulation + emotionalAwareness + bodyListening) / 4;
  return {
    noticing, attentionRegulation, emotionalAwareness, bodyListening, composite,
  };
}

function deriveRecommendations({ pss4, rmeq /*, maia2 */ }) {
  let primaryIntent = "reset";
  if (pss4.profile === "high") primaryIntent = "calma";
  else if (pss4.profile === "low" && rmeq.chronotype.includes("morning")) primaryIntent = "enfoque";
  else if (pss4.profile === "low" && rmeq.chronotype.includes("evening")) primaryIntent = "energia";
  const difficulty = pss4.profile === "high" ? 1 : 2;
  const sessionGoal = rmeq.chronotype === "definitely_morning" ? 3 : 2;
  return { primaryIntent, sessionGoal, difficulty, bestTimeWindow: rmeq.bestTimeWindow };
}

/* ──── Component ───────────────────────────────────────── */

const STEPS = ["pss4", "rmeq", "maia2", "hrv", "summary"];

export default function NeuralCalibrationV2({ onComplete, onSkip }) {
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(true);
  const liveRef = useRef(null);

  const [step, setStep] = useState(0);
  const [pss4Answers, setPss4Answers] = useState(Array(PSS4_ITEMS.length).fill(null));
  const [rmeqAnswers, setRmeqAnswers] = useState(Array(RMEQ_ITEMS.length).fill(null));
  const [maia2Answers, setMaia2Answers] = useState(Array(MAIA2_ITEMS.length).fill(null));

  const pss4Result = useMemo(() => scorePSS4(pss4Answers), [pss4Answers]);
  const rmeqResult = useMemo(() => scoreRMEQ(rmeqAnswers), [rmeqAnswers]);
  const maia2Result = useMemo(() => scoreMAIA2(maia2Answers), [maia2Answers]);
  const recommendations = useMemo(
    () => deriveRecommendations({ pss4: pss4Result, rmeq: rmeqResult, maia2: maia2Result }),
    [pss4Result, rmeqResult, maia2Result],
  );

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `Paso ${step + 1} de ${STEPS.length}`;
    }
  }, [step]);

  const allPss4Answered = pss4Answers.every((v) => typeof v === "number");
  const allRmeqAnswered = rmeqAnswers.every((v) => typeof v === "number");
  const allMaia2Answered = maia2Answers.every((v) => typeof v === "number");

  const canAdvance =
    (step === 0 && allPss4Answered) ||
    (step === 1 && allRmeqAnswered) ||
    (step === 2 && allMaia2Answered) ||
    step === 3 || // hrv placeholder always advances
    step === 4;   // summary CTA advances out

  const handleAdvance = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    // Step 4 summary → onComplete with baseline.
    const baseline = {
      pss4: pss4Result,
      rmeq: rmeqResult,
      maia2: maia2Result,
      hrvBaseline: null,
      composite: Math.round((100 - pss4Result.score * 6) * 0.4 + maia2Result.composite * 12 + 20), // 0-100 derived
      profile: pss4Result.profile === "high" ? "recuperación"
        : pss4Result.profile === "moderate" ? "funcional"
        : maia2Result.composite >= 3.5 ? "alto_rendimiento" : "en_desarrollo",
      profileLabel: pss4Result.profile === "high" ? "Recuperación Activa"
        : pss4Result.profile === "moderate" ? "Funcional"
        : maia2Result.composite >= 3.5 ? "Alto Rendimiento" : "En Desarrollo",
      recommendations,
      timestamp: Date.now(),
      version: "v2",
    };
    if (typeof onComplete === "function") onComplete(baseline);
  }, [step, pss4Result, rmeqResult, maia2Result, recommendations, onComplete]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const handleSkipInstrument = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }, [step]);

  const handleSkipAll = useCallback(() => {
    if (typeof onSkip === "function") {
      onSkip();
    } else if (typeof onComplete === "function") {
      onComplete(null);
    }
  }, [onSkip, onComplete]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bi-calibration-title"
      data-v2-calibration
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: BG,
        color: TEXT_PRIMARY,
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        paddingBlockStart: "max(env(safe-area-inset-top), 24px)",
        paddingBlockEnd: "max(env(safe-area-inset-bottom), 24px)",
        overflow: "auto",
      }}
    >
      <span
        ref={liveRef}
        aria-live="polite"
        style={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}
      />

      <CalibHeader
        step={step}
        onBack={step > 0 ? handleBack : null}
        onSkip={step === 0 ? handleSkipAll : null}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          paddingInline: 24,
          maxInlineSize: 480,
          marginInline: "auto",
          width: "100%",
          paddingBlockStart: 8,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {step === 0 && (
              <InstrumentPSS4
                answers={pss4Answers}
                onAnswer={(idx, v) => setPss4Answers((a) => { const n = [...a]; n[idx] = v; return n; })}
              />
            )}
            {step === 1 && (
              <InstrumentRMEQ
                answers={rmeqAnswers}
                onAnswer={(idx, v) => setRmeqAnswers((a) => { const n = [...a]; n[idx] = v; return n; })}
              />
            )}
            {step === 2 && (
              <InstrumentMAIA2
                answers={maia2Answers}
                onAnswer={(idx, v) => setMaia2Answers((a) => { const n = [...a]; n[idx] = v; return n; })}
              />
            )}
            {step === 3 && <HRVPlaceholder />}
            {step === 4 && (
              <CalibSummary
                pss4={pss4Result}
                rmeq={rmeqResult}
                maia2={maia2Result}
                recommendations={recommendations}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <CalibFooter
        step={step}
        canAdvance={canAdvance}
        onAdvance={handleAdvance}
        onSkipInstrument={step >= 0 && step <= 2 ? handleSkipInstrument : null}
      />
    </div>
  );
}

/* ──── Header / Footer / Dots ──────────────────────────── */

function CalibHeader({ step, onBack, onSkip }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: 24,
        paddingBlockEnd: 12,
        minHeight: 44,
      }}
    >
      <div style={{ minWidth: 44, display: "flex", alignItems: "center" }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            data-testid="calibration-back"
            aria-label="Volver"
            style={{
              appearance: "none", background: "transparent", border: "none",
              color: TEXT_MUTED, cursor: "pointer", minWidth: 44, minHeight: 44,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginInlineStart: -10,
            }}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
        ) : null}
      </div>
      <div
        data-testid="calibration-step-counter"
        style={{
          fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: "0.16em",
          textTransform: "uppercase", color: TEXT_FAINT, fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
      </div>
      <div style={{ minWidth: 44, display: "flex", justifyContent: "flex-end" }}>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            data-testid="calibration-skip-all"
            style={{
              appearance: "none", background: "transparent", border: "none",
              color: TEXT_MUTED, cursor: "pointer", minHeight: 44, padding: "0 4px",
              fontFamily: FONT, fontSize: 11, fontWeight: 400,
            }}
          >
            Saltar calibración
          </button>
        ) : null}
      </div>
    </header>
  );
}

function CalibFooter({ step, canAdvance, onAdvance, onSkipInstrument }) {
  const isLast = step === STEPS.length - 1;
  const filled = isLast || step === 3;
  const ctaLabel = isLast ? "Empezar" : "Siguiente";

  return (
    <footer
      style={{
        paddingInline: 24,
        paddingBlockStart: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <CalibProgressDots active={step} total={STEPS.length} />
      <button
        type="button"
        onClick={onAdvance}
        disabled={!canAdvance}
        data-testid="calibration-cta"
        aria-label={ctaLabel}
        style={{
          appearance: "none",
          cursor: canAdvance ? "pointer" : "default",
          background: filled ? (canAdvance ? ACCENT : "rgba(34,211,238,0.32)") : "transparent",
          color: filled ? BG : (canAdvance ? ACCENT : "rgba(34,211,238,0.4)"),
          border: filled ? "none" : `0.5px solid ${canAdvance ? ACCENT : "rgba(34,211,238,0.32)"}`,
          borderRadius: 8, minHeight: 52, paddingInline: 28,
          fontFamily: FONT, fontSize: 13, fontWeight: 500, letterSpacing: "0.12em",
          textTransform: "uppercase", width: "100%", maxWidth: 320,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "background 180ms ease, color 180ms ease",
        }}
      >
        <span>{ctaLabel}</span>
        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      {onSkipInstrument ? (
        <button
          type="button"
          onClick={onSkipInstrument}
          data-testid="calibration-skip-instrument"
          style={{
            appearance: "none", background: "transparent", border: "none",
            color: TEXT_MUTED, cursor: "pointer", padding: "8px 4px",
            fontFamily: FONT, fontSize: 11, fontWeight: 400,
          }}
        >
          Saltar este instrumento
        </button>
      ) : null}
    </footer>
  );
}

function CalibProgressDots({ active, total }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={active + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: i === active ? 24 : 6,
            height: 2,
            background: i === active ? ACCENT : "rgba(255,255,255,0.18)",
            borderRadius: 1,
            transition: "width 180ms ease",
          }}
        />
      ))}
    </div>
  );
}

/* ──── Instrument header (shared) ──────────────────────── */
function InstrumentHeader({ eyebrow, title, badge }) {
  return (
    <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
          textTransform: "uppercase", color: ACCENT,
        }}
      >
        {eyebrow}
      </span>
      <h2
        id="bi-calibration-title"
        style={{
          margin: 0, fontFamily: FONT, fontSize: 22, fontWeight: 400,
          color: TEXT_PRIMARY, letterSpacing: "-0.005em",
        }}
      >
        {title}
      </h2>
      <span
        style={{
          alignSelf: "flex-start",
          fontFamily: FONT, fontSize: 9, fontWeight: 500, color: ACCENT,
          border: `0.5px solid rgba(34,211,238,0.4)`,
          padding: "3px 6px", borderRadius: 3, letterSpacing: "0.04em",
        }}
      >
        {badge}
      </span>
    </header>
  );
}

/* ──── Likert option (shared) ──────────────────────────── */
function LikertOption({ label, value, selected, onSelect, testId }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      data-testid={testId}
      style={{
        appearance: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingInline: 16,
        paddingBlock: 14,
        minHeight: 48,
        width: "100%",
        background: selected ? "rgba(34,211,238,0.04)" : "rgba(255,255,255,0.02)",
        border: `0.5px solid ${selected ? ACCENT : "rgba(255,255,255,0.12)"}`,
        borderRadius: 8,
        color: "inherit",
        textAlign: "start",
        transition: "background 180ms ease, border 180ms ease",
      }}
    >
      <span
        style={{
          flex: 1,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: selected ? 500 : 400,
          color: selected ? TEXT_PRIMARY : "rgba(255,255,255,0.78)",
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `0.5px solid ${selected ? ACCENT : "rgba(255,255,255,0.3)"}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected ? (
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT }} />
        ) : null}
      </span>
    </button>
  );
}

/* ──── Step 1 — PSS-4 ──────────────────────────────────── */
function InstrumentPSS4({ answers, onAnswer }) {
  const [activeItem, setActiveItem] = useState(0);
  return (
    <>
      <InstrumentHeader
        eyebrow="CALIBRACIÓN NEURAL"
        title="Estrés percibido"
        badge="PSS-4 · Cohen 1983 · validado peer-reviewed"
      />
      <ItemQuestion
        text={PSS4_ITEMS[activeItem].text}
        idx={activeItem}
        total={PSS4_ITEMS.length}
        instrument="pss4"
      />
      <div role="radiogroup" aria-label="Respuesta PSS-4" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PSS4_OPTIONS.map((opt) => (
          <LikertOption
            key={opt.value}
            label={opt.label}
            value={opt.value}
            selected={answers[activeItem] === opt.value}
            onSelect={(v) => {
              onAnswer(activeItem, v);
              if (activeItem < PSS4_ITEMS.length - 1) {
                setActiveItem(activeItem + 1);
              }
            }}
            testId={`pss4-opt-${activeItem}-${opt.value}`}
          />
        ))}
      </div>
      <ItemNav
        active={activeItem}
        total={PSS4_ITEMS.length}
        onPrev={activeItem > 0 ? () => setActiveItem(activeItem - 1) : null}
        onNext={activeItem < PSS4_ITEMS.length - 1 && answers[activeItem] !== null
          ? () => setActiveItem(activeItem + 1)
          : null}
      />
    </>
  );
}

/* ──── Step 2 — rMEQ ───────────────────────────────────── */
function InstrumentRMEQ({ answers, onAnswer }) {
  const [activeItem, setActiveItem] = useState(0);
  const item = RMEQ_ITEMS[activeItem];
  return (
    <>
      <InstrumentHeader
        eyebrow="CALIBRACIÓN NEURAL"
        title="Cronotipo"
        badge="rMEQ · Adan & Almirall 1991 · 5 ítems"
      />
      <ItemQuestion
        text={item.text}
        idx={activeItem}
        total={RMEQ_ITEMS.length}
        instrument="rmeq"
      />
      <div role="radiogroup" aria-label="Respuesta rMEQ" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {item.options.map((opt) => (
          <LikertOption
            key={opt.value + "-" + opt.label}
            label={opt.label}
            value={opt.value}
            selected={answers[activeItem] === opt.value}
            onSelect={(v) => {
              onAnswer(activeItem, v);
              if (activeItem < RMEQ_ITEMS.length - 1) {
                setActiveItem(activeItem + 1);
              }
            }}
            testId={`rmeq-opt-${activeItem}-${opt.value}`}
          />
        ))}
      </div>
      <ItemNav
        active={activeItem}
        total={RMEQ_ITEMS.length}
        onPrev={activeItem > 0 ? () => setActiveItem(activeItem - 1) : null}
        onNext={activeItem < RMEQ_ITEMS.length - 1 && answers[activeItem] !== null
          ? () => setActiveItem(activeItem + 1)
          : null}
      />
    </>
  );
}

/* ──── Step 3 — MAIA-2 ─────────────────────────────────── */
function InstrumentMAIA2({ answers, onAnswer }) {
  const [activeItem, setActiveItem] = useState(0);
  const item = MAIA2_ITEMS[activeItem];
  return (
    <>
      <InstrumentHeader
        eyebrow="CALIBRACIÓN NEURAL"
        title="Conciencia interocéptiva"
        badge="MAIA-2 · Mehling 2018 · 4 dimensiones"
      />
      <div
        style={{
          fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: "0.16em",
          textTransform: "uppercase", color: TEXT_FAINT,
        }}
      >
        {item.dimension.replace(/([A-Z])/g, " $1").toLowerCase()} · pregunta {activeItem + 1} de {MAIA2_ITEMS.length}
      </div>
      <p
        style={{
          margin: "0 0 4px",
          fontFamily: FONT, fontSize: 13, fontWeight: 400,
          color: TEXT_SECONDARY, lineHeight: 1.5,
        }}
      >
        {item.text}
      </p>
      <div role="radiogroup" aria-label="Respuesta MAIA-2" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {MAIA2_OPTIONS.map((opt) => (
          <LikertOption
            key={opt.value}
            label={opt.label}
            value={opt.value}
            selected={answers[activeItem] === opt.value}
            onSelect={(v) => {
              onAnswer(activeItem, v);
              if (activeItem < MAIA2_ITEMS.length - 1) {
                setActiveItem(activeItem + 1);
              }
            }}
            testId={`maia2-opt-${activeItem}-${opt.value}`}
          />
        ))}
      </div>
      <ItemNav
        active={activeItem}
        total={MAIA2_ITEMS.length}
        onPrev={activeItem > 0 ? () => setActiveItem(activeItem - 1) : null}
        onNext={activeItem < MAIA2_ITEMS.length - 1 && answers[activeItem] !== null
          ? () => setActiveItem(activeItem + 1)
          : null}
      />
    </>
  );
}

/* ──── ItemQuestion + ItemNav helpers ──────────────────── */
function ItemQuestion({ text, idx, total, instrument }) {
  return (
    <>
      <div
        data-testid={`${instrument}-counter`}
        style={{
          fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: "0.16em",
          textTransform: "uppercase", color: TEXT_FAINT,
        }}
      >
        Pregunta {idx + 1} de {total}
      </div>
      <p
        style={{
          margin: "0 0 4px",
          fontFamily: FONT, fontSize: 13, fontWeight: 400,
          color: TEXT_SECONDARY, lineHeight: 1.5,
        }}
      >
        {text}
      </p>
    </>
  );
}

function ItemNav({ active, total, onPrev, onNext }) {
  if (!onPrev && !onNext) return null;
  return (
    <div style={{ display: "flex", gap: 12, paddingBlockStart: 4 }}>
      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          style={{
            appearance: "none", background: "transparent", border: "none",
            color: TEXT_MUTED, cursor: "pointer", padding: "6px 4px",
            fontFamily: FONT, fontSize: 11, fontWeight: 400,
          }}
        >
          ← Pregunta anterior
        </button>
      ) : <span style={{ flex: 1 }} />}
      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          style={{
            appearance: "none", background: "transparent", border: "none",
            color: ACCENT, cursor: "pointer", padding: "6px 4px",
            fontFamily: FONT, fontSize: 11, fontWeight: 500, marginInlineStart: "auto",
          }}
        >
          Siguiente pregunta →
        </button>
      ) : null}
    </div>
  );
}

/* ──── Step 4 — HRV placeholder ────────────────────────── */
function HRVPlaceholder() {
  return (
    <>
      <InstrumentHeader
        eyebrow="CALIBRACIÓN NEURAL"
        title="Variabilidad cardíaca"
        badge="HRV · próximamente"
      />
      <article
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p
          style={{
            margin: 0, fontFamily: FONT, fontSize: 13, fontWeight: 400,
            color: TEXT_SECONDARY, lineHeight: 1.5,
          }}
        >
          Mediremos tu HRV cuando habilites la cámara o un dispositivo BLE.
        </p>
        <p
          style={{
            margin: 0, fontFamily: FONT, fontSize: 12, fontWeight: 400,
            color: TEXT_MUTED, lineHeight: 1.5,
          }}
        >
          Por ahora, esta calibración queda incompleta. Puedes habilitarla después desde
          {" "}
          <strong style={{ fontWeight: 500, color: TEXT_SECONDARY }}>Hoy → Mide tu HRV</strong>.
        </p>
      </article>
      <button
        type="button"
        disabled
        data-testid="hrv-enable-camera"
        style={{
          appearance: "none", background: "transparent",
          border: "0.5px solid rgba(34,211,238,0.2)",
          borderRadius: 8, color: "rgba(34,211,238,0.4)",
          padding: "12px 16px", cursor: "default",
          fontFamily: FONT, fontSize: 12, fontWeight: 500,
          letterSpacing: "0.06em", alignSelf: "flex-start",
        }}
      >
        Habilitar cámara — próximamente
      </button>
    </>
  );
}

/* ──── Step 5 — Summary ────────────────────────────────── */
function CalibSummary({ pss4, rmeq, maia2, recommendations }) {
  const intentLabel = {
    calma: "Calma",
    enfoque: "Enfoque",
    energia: "Energía",
    reset: "Reset",
  }[recommendations.primaryIntent] || "Reset";

  return (
    <>
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          style={{
            fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
            textTransform: "uppercase", color: ACCENT,
          }}
        >
          CALIBRACIÓN COMPLETA
        </span>
        <h2
          style={{
            margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 200,
            color: TEXT_PRIMARY, letterSpacing: "-0.005em", lineHeight: 1.15,
          }}
        >
          Tu baseline neural.
        </h2>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SummaryRow
          kicker="ESTRÉS PERCIBIDO"
          value={pss4ProfileLabel(pss4.profile)}
          aux={`PSS-4 score ${pss4.score}/16`}
        />
        <SummaryRow
          kicker="CRONOTIPO"
          value={chronotypeLabel(rmeq.chronotype)}
          aux={`Mejor ventana: ${windowLabel(rmeq.bestTimeWindow)}`}
        />
        <SummaryRow
          kicker="INTEROCEPCIÓN"
          value={`${maia2.composite.toFixed(1)} / 5`}
          aux="Promedio 4 dimensiones MAIA-2"
        />
        <MAIA2Bars maia2={maia2} />
        <SummaryRow
          kicker="HRV"
          value="Pendiente"
          aux="Habilitar después con cámara o BLE"
          dim
        />
      </section>

      <section
        style={{
          background: "rgba(34,211,238,0.04)",
          border: "0.5px solid rgba(34,211,238,0.3)",
          borderRadius: 8,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
            textTransform: "uppercase", color: ACCENT,
          }}
        >
          RECOMENDACIÓN
        </span>
        <p
          style={{
            margin: 0, fontFamily: FONT, fontSize: 14, fontWeight: 500,
            color: TEXT_PRIMARY, lineHeight: 1.4,
          }}
        >
          Empieza con foco en {intentLabel}. Dificultad inicial nivel {recommendations.difficulty}.
        </p>
        <p
          style={{
            margin: 0, fontFamily: FONT, fontSize: 12, fontWeight: 400,
            color: TEXT_MUTED, lineHeight: 1.5,
          }}
        >
          Meta sesiones: {recommendations.sessionGoal} por día. El sistema adapta basado en cómo respondes.
        </p>
      </section>
    </>
  );
}

function SummaryRow({ kicker, value, aux, dim }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 4,
        paddingBlock: 10, borderBlockEnd: "0.5px solid rgba(255,255,255,0.06)",
        opacity: dim ? 0.6 : 1,
      }}
    >
      <span
        style={{
          fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: "0.16em",
          textTransform: "uppercase", color: TEXT_FAINT,
        }}
      >
        {kicker}
      </span>
      <span
        style={{
          fontFamily: FONT, fontSize: 16, fontWeight: 500,
          color: TEXT_PRIMARY, letterSpacing: "-0.005em",
        }}
      >
        {value}
      </span>
      <span
        style={{ fontFamily: FONT, fontSize: 11, fontWeight: 400, color: TEXT_MUTED }}
      >
        {aux}
      </span>
    </div>
  );
}

function MAIA2Bars({ maia2 }) {
  const dims = [
    { id: "noticing",            value: maia2.noticing,            label: "Noticing" },
    { id: "attentionRegulation", value: maia2.attentionRegulation, label: "Atención" },
    { id: "emotionalAwareness",  value: maia2.emotionalAwareness,  label: "Conciencia emocional" },
    { id: "bodyListening",       value: maia2.bodyListening,       label: "Escucha corporal" },
  ];
  return (
    <div data-testid="maia2-bars" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {dims.map((d) => {
        const pct = Math.max(0, Math.min(100, (d.value / 5) * 100));
        return (
          <div key={d.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 400, color: TEXT_SECONDARY }}>
                {d.label}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 500, color: TEXT_FAINT, fontVariantNumeric: "tabular-nums" }}>
                {d.value.toFixed(1)}
              </span>
            </div>
            <div
              aria-hidden="true"
              style={{
                width: "100%", height: 2, background: "rgba(255,255,255,0.06)",
                borderRadius: 1, overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`, height: "100%", background: ACCENT, opacity: 0.6,
                  transition: "width 240ms ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function pss4ProfileLabel(profile) {
  return profile === "low" ? "Bajo" : profile === "moderate" ? "Moderado" : "Alto";
}
function chronotypeLabel(c) {
  return ({
    definitely_morning:  "Definitivamente matutino",
    moderately_morning:  "Más matutino",
    intermediate:        "Intermedio",
    moderately_evening:  "Más vespertino",
    definitely_evening:  "Definitivamente vespertino",
  })[c] || "Intermedio";
}
function windowLabel(w) {
  return ({ morning: "mañana", midday: "mediodía", afternoon: "tarde", evening: "noche" })[w] || "—";
}
