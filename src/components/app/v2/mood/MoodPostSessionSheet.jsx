"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 6J-1 Group A — MoodPostSessionSheet
   ───────────────────────────────────────────────────────────────
   Sheet bottom-up que captura mood post-sesión. Closes Engine Audit
   CRITICAL-1 (state.moodLog empty) + CRITICAL-2 (bandit reward null).

   Pattern reuse 1:1 de StreakMilestoneSheet (Phase 6I-2):
     - z-index 1000/1001
     - useFocusTrap(active, onEscape) para a11y dialog
     - useReducedMotion respect
     - announce sr-live polite
     - bottom-up slide + backdrop fade

   ADN visual:
     - Iconos brand-DNA via lucide-react (stress/drain/neutral/sharp/peak)
       de MOODS constant en lib/constants.js. NO emojis (memoria
       feedback_no_emojis_no_generic_glyphs). Mismo registry que el
       legacy PostSessionFlow.jsx.
     - phosphorCyan accent en mood seleccionado (border + bg suave)
     - typography.familyMono caps eyebrow + caption

   Phase 7 F0-3 — Cinco preguntas post-sesión (additive):
     - Tras submit del mood step, el sheet expone 5 sub-steps secuenciales
       OPCIONALES (todos skippable individual + skip-all en cualquier paso).
     - State machine local: step ∈ {mood, helped, willDoAgain,
       bodySensations, sideEffects, timeToEffect}.
     - Output enriquecido onSubmit(mood, feedback) — feedback es null si
       user salta todos los sub-steps tras el mood pick. Anti-regression:
       callers que sólo lean `mood` siguen funcionando (segundo arg ignored).
     - Cero nuevos archivos: chip-row primitive inline (radio + multi-select
       + exclusive flag) reutilizable entre los 5 sub-steps.
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useState } from "react";
import { Frown, Meh, Minus, Eye, Smile } from "lucide-react";
import { announce, useFocusTrap, useReducedMotion } from "@/lib/a11y";
import {
  colors,
  typography,
  spacing,
  radii,
  motion as motionTok,
  touchTarget,
} from "../tokens";
import { useStore } from "@/store/useStore";
import MarkMomentSheet from "../data/MarkMomentSheet";

// Mood scale 1–5 con icons brand-DNA. Matchea MOODS constant en
// lib/constants.js (stress/drain/neutral/sharp/peak) — los mismos
// que el legacy PostSessionFlow.jsx usa via Icon.jsx wrapper.
//
// Decisión consciente: NO emojis literales (😞😕😐🙂😊). La memoria
// feedback_no_emojis_no_generic_glyphs es absoluta para toda la PWA.
// Lucide icons tienen brand DNA strokes 1.6 + cyan tint cuando active.
const MOOD_OPTIONS = [
  { value: 1, Icon: Frown, label: "Tensión alta",  ariaLabel: "Mood 1, tensión alta" },
  { value: 2, Icon: Meh,   label: "Agotamiento",   ariaLabel: "Mood 2, agotamiento" },
  { value: 3, Icon: Minus, label: "Estable",       ariaLabel: "Mood 3, estable" },
  { value: 4, Icon: Eye,   label: "Enfocado",      ariaLabel: "Mood 4, enfocado" },
  { value: 5, Icon: Smile, label: "Óptimo",        ariaLabel: "Mood 5, óptimo" },
];

/* ─── F0-3 sub-steps config ────────────────────────────────────── */

// Paso machine: el orden importa para el progress dots y para advanceStep.
// `mood` es el step heredado de Phase 6J-1; los 5 siguientes son F0-3.
const F03_STEP_SEQUENCE = [
  "helped",
  "willDoAgain",
  "bodySensations",
  "sideEffects",
  "timeToEffect",
];

const F03_STEP_CONFIGS = {
  helped: {
    eyebrow: "PASO 1 DE 5",
    title: "¿Te ayudó?",
    subtitle: "Una respuesta breve mejora la recomendación de mañana.",
    kind: "single",
    field: "helpedRating",
    options: [
      { value: 5, label: "Sí, mucho" },
      { value: 4, label: "Sí, algo" },
      { value: 3, label: "Neutral" },
      { value: 2, label: "No mucho" },
      { value: 1, label: "No" },
    ],
  },
  willDoAgain: {
    eyebrow: "PASO 2 DE 5",
    title: "¿Volverías a hacerlo?",
    subtitle: "Calibramos tu motor con tu intención real.",
    kind: "single",
    field: "willDoAgain",
    options: [
      { value: 5, label: "Sin dudarlo" },
      { value: 4, label: "Probablemente" },
      { value: 3, label: "Tal vez" },
      { value: 2, label: "Probablemente no" },
      { value: 1, label: "No" },
    ],
  },
  bodySensations: {
    eyebrow: "PASO 3 DE 5",
    title: "¿Cómo se siente tu cuerpo?",
    subtitle: "Selecciona todas las que apliquen.",
    kind: "multi",
    field: "bodySensations",
    options: [
      { value: "relaxed",   label: "Relajado" },
      { value: "energized", label: "Energizado" },
      { value: "clear",     label: "Mente clara" },
      { value: "light",     label: "Ligero" },
      { value: "tense",     label: "Tenso" },
      { value: "heavy",     label: "Pesado" },
    ],
  },
  sideEffects: {
    eyebrow: "PASO 4 DE 5",
    title: "¿Algún efecto no deseado?",
    subtitle: "Capturarlo nos ayuda a evitarte ese protocolo más adelante.",
    kind: "multi",
    field: "sideEffects",
    options: [
      { value: "none",        label: "Ninguno", exclusive: true },
      { value: "dizziness",   label: "Mareo" },
      { value: "anxiety",     label: "Ansiedad" },
      { value: "frustration", label: "Frustración" },
      { value: "fatigue",     label: "Fatiga" },
      { value: "other",       label: "Otro" },
    ],
  },
  timeToEffect: {
    eyebrow: "PASO 5 DE 5",
    title: "¿Cuándo lo notaste?",
    subtitle: "Mide la velocidad real del cambio fisiológico.",
    kind: "single",
    field: "timeToEffect",
    options: [
      { value: "immediate", label: "Inmediato" },
      { value: "during",    label: "Durante" },
      { value: "end",       label: "Al final" },
      { value: "not_yet",   label: "Aún no" },
      { value: "none",      label: "No sentí nada" },
    ],
  },
};

const F03_INITIAL_FEEDBACK = {
  helpedRating: null,
  willDoAgain: null,
  bodySensations: null,
  sideEffects: null,
  timeToEffect: null,
};

/**
 * Defensive: si feedback no contiene NINGUNA respuesta (todo null/empty),
 * devuelve null. Esto evita persistir objetos huecos cuando user salta
 * todos los sub-steps. Si al menos un field tiene valor, retorna el shape
 * completo (con fields no respondidos en null — preservación parcial).
 */
function _maybeFeedback(feedback) {
  if (!feedback) return null;
  const nonNull = Object.entries(feedback).filter(([, v]) => {
    if (v == null) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
  if (nonNull.length === 0) return null;
  return { ...feedback, capturedAt: Date.now() };
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 *   Mount/unmount gate.
 * @param {(mood:number, feedback:object|null)=>void} props.onSubmit
 *   Tap REGISTRAR (mood step) o COMPLETAR (último sub-step F0-3).
 *   Anti-regression: callers que sólo lean `mood` siguen funcionando.
 *   `feedback` es null si user salta todos los sub-steps; objeto con
 *   los 5 fields (algunos null) si respondió ≥1 pregunta.
 * @param {()=>void} props.onSkip
 *   Tap "Saltar por ahora" desde el mood step inicial, o ESC, o backdrop.
 *   NO se dispara desde sub-steps F0-3 (esos usan handleStepSkipAll que
 *   completa con feedback parcial vía onSubmit).
 * @param {object} [props.proto]
 *   Protocol object {n, int, ...} para context.
 */
export default function MoodPostSessionSheet({
  isOpen,
  onSubmit,
  onSkip,
  proto = null,  
}) {
  const reduceMotion = useReducedMotion();
  const trapRef = useFocusTrap(!!isOpen, () => onSkip?.());

  const [selectedMood, setSelectedMood] = useState(null);
  const [mounted, setMounted] = useState(false);
  // F0-3: state machine local. 'mood' es el step heredado Phase 6J-1.
  const [step, setStep] = useState("mood");
  const [feedback, setFeedback] = useState(F03_INITIAL_FEEDBACK);
  // Diario autonómico: etiquetar el momento de esta sesión (additive, no
  // toca la máquina de estados mood/F0-3 ni el reward del bandit).
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [momentTagged, setMomentTagged] = useState(false);

  // Reset state on unmount/remount.
  useEffect(() => {
    if (!isOpen) {
      setSelectedMood(null);
      setStep("mood");
      setFeedback(F03_INITIAL_FEEDBACK);
      setTagSheetOpen(false);
      setMomentTagged(false);
      setMounted(false);
      return;
    }
    if (reduceMotion) {
      setMounted(true);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen, reduceMotion]);

  // sr-live announcement on open + on step change.
  useEffect(() => {
    if (!isOpen) return;
    if (step === "mood") {
      announce("¿Cómo te sientes ahora? Tu respuesta entrena tu motor neural.", "polite");
    } else {
      const cfg = F03_STEP_CONFIGS[step];
      if (cfg) announce(`${cfg.title} Puedes saltar o ir atrás.`, "polite");
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    // En sub-steps F0-3, backdrop NO cierra (evita perder feedback partial
    // por tap accidental). Solo cierra desde el mood step inicial.
    if (e.target !== e.currentTarget) return;
    if (step !== "mood") return;
    if (onSkip) onSkip();
  };

  // F0-3 step navigation helpers.
  const advanceStep = () => {
    if (step === "mood") {
      setStep(F03_STEP_SEQUENCE[0]);
      return;
    }
    const idx = F03_STEP_SEQUENCE.indexOf(step);
    if (idx === -1) return;
    if (idx === F03_STEP_SEQUENCE.length - 1) {
      // Último sub-step → completar.
      onSubmit?.(selectedMood, _maybeFeedback(feedback));
      return;
    }
    setStep(F03_STEP_SEQUENCE[idx + 1]);
  };

  const goBackStep = () => {
    const idx = F03_STEP_SEQUENCE.indexOf(step);
    if (idx <= 0) {
      setStep("mood");
      return;
    }
    setStep(F03_STEP_SEQUENCE[idx - 1]);
  };

  const handleStepSkip = () => {
    // Salta solo este step (no responde, deja field null) y avanza.
    advanceStep();
  };

  const handleStepSkipAll = () => {
    // Salta todos los sub-steps restantes → completa con feedback acumulado
    // hasta este punto (si hay), o null si todos quedaron sin respuesta.
    onSubmit?.(selectedMood, _maybeFeedback(feedback));
  };

  const handleSubmit = () => {
    if (typeof selectedMood === "number" && selectedMood >= 1 && selectedMood <= 5) {
      // Tras submit del mood step, abrimos el primer sub-step F0-3.
      setStep(F03_STEP_SEQUENCE[0]);
    }
  };

  // F0-3 chip selection handlers.
  const handleSingleSelect = (field, value) => {
    setFeedback((f) => ({ ...f, [field]: value }));
  };

  const handleMultiToggle = (field, value, options) => {
    setFeedback((f) => {
      const current = Array.isArray(f[field]) ? f[field] : [];
      const opt = options.find((o) => o.value === value);
      const isExclusive = !!opt?.exclusive;
      // Si user toca opción exclusive ('none'): reemplaza array a [value].
      if (isExclusive) {
        return { ...f, [field]: current.includes(value) ? [] : [value] };
      }
      // Si user toca opción no-exclusive: deselecciona cualquier exclusive
      // que estuviera previamente activa (semántica "none cancela todo").
      const exclusiveValues = options.filter((o) => o.exclusive).map((o) => o.value);
      const cleaned = current.filter((v) => !exclusiveValues.includes(v));
      const next = cleaned.includes(value)
        ? cleaned.filter((v) => v !== value)
        : [...cleaned, value];
      return { ...f, [field]: next };
    });
  };

  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";

  return (
    <>
      {/* Backdrop */}
      <div
        data-v2-mood-post-backdrop
        data-testid="mood-post-backdrop"
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1000,
          opacity: backdropOpacity,
          transition: reduceMotion ? "none" : `opacity 180ms ${motionTok.ease.out}`,
          pointerEvents: "auto",
        }}
      >
        <aside
          ref={trapRef}
          data-v2-mood-post-sheet
          data-testid="mood-post-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v2-mood-post-title"
          aria-describedby="v2-mood-post-subtitle"
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

          {/* Eyebrow — varies por step (F0-3) */}
          <span
            data-testid="mood-post-eyebrow"
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
            {step === "mood" ? "DESPUÉS DE LA SESIÓN" : F03_STEP_CONFIGS[step].eyebrow}
          </span>

          {step === "mood" && (
            <>
              {/* Title */}
              <h2
                id="v2-mood-post-title"
                style={{
                  margin: 0,
                  marginBlockStart: spacing.s12,
                  fontFamily: typography.family,
                  fontSize: 24,
                  fontWeight: typography.weight.light,
                  letterSpacing: "-0.02em",
                  color: colors.text.strong,
                  lineHeight: 1.2,
                  textAlign: "center",
                  maxWidth: 320,
                }}
              >
                ¿Cómo te sientes ahora?
              </h2>

              {/* Subtitle */}
              <p
                id="v2-mood-post-subtitle"
                style={{
                  margin: 0,
                  marginBlockStart: spacing.s8,
                  fontFamily: typography.family,
                  fontSize: typography.size.body,
                  fontWeight: typography.weight.regular,
                  color: colors.text.secondary,
                  lineHeight: 1.45,
                  textAlign: "center",
                  maxWidth: 320,
                }}
              >
                Tu respuesta entrena tu motor neural personalizado.
              </p>

              {/* Mood icon row */}
              <div
                data-v2-mood-icons
                data-testid="mood-post-icons"
                role="radiogroup"
                aria-labelledby="v2-mood-post-title"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: spacing.s8,
                  marginBlockStart: spacing.s32,
                  maxWidth: 320,
                  width: "100%",
                }}
              >
                {MOOD_OPTIONS.map(({ value, Icon, label, ariaLabel }) => {
                  const isActive = selectedMood === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      aria-label={ariaLabel}
                      data-testid={`mood-post-option-${value}`}
                      data-active={isActive ? "true" : "false"}
                      onClick={() => setSelectedMood(value)}
                      style={{
                        background: isActive
                          ? "rgba(34,211,238,0.12)"
                          : "transparent",
                        border: isActive
                          ? `1px solid ${colors.accent.phosphorCyan}`
                          : `0.5px solid ${colors.separator}`,
                        borderRadius: radii.pill,
                        paddingBlock: spacing.s12,
                        paddingInline: spacing.s4,
                        cursor: "pointer",
                        minHeight: touchTarget.preferred,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: spacing.s8,
                        transition: reduceMotion ? "none" : `all 180ms ${motionTok.ease.out}`,
                        fontFamily: typography.family,
                      }}
                    >
                      <Icon
                        size={24}
                        strokeWidth={1.6}
                        color={isActive ? colors.accent.phosphorCyan : colors.text.secondary}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          fontFamily: typography.familyMono,
                          fontSize: 9,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: isActive ? colors.accent.phosphorCyan : colors.text.muted,
                          lineHeight: 1.2,
                          textAlign: "center",
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CTAs */}
              <div
                style={{
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
                  data-testid="mood-post-submit"
                  disabled={selectedMood == null}
                  onClick={handleSubmit}
                  style={{
                    background: selectedMood != null
                      ? colors.accent.phosphorCyan
                      : "rgba(255,255,255,0.08)",
                    color: selectedMood != null
                      ? "#041019"
                      : colors.text.muted,
                    border: "none",
                    borderRadius: 999,
                    paddingBlock: spacing.s14,
                    paddingInline: spacing.s24,
                    fontFamily: typography.familyMono,
                    fontSize: 12,
                    fontWeight: typography.weight.medium,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    cursor: selectedMood != null ? "pointer" : "not-allowed",
                    minHeight: touchTarget.preferred,
                    transition: reduceMotion ? "none" : `all 180ms ${motionTok.ease.out}`,
                  }}
                >
                  Registrar
                </button>
                <button
                  type="button"
                  data-testid="mood-post-skip"
                  onClick={onSkip}
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
                  Saltar por ahora
                </button>
                {/* Diario autonómico: etiquetar este momento (opcional, additive). */}
                {momentTagged ? (
                  <span
                    style={{
                      fontFamily: typography.family,
                      fontSize: typography.size.caption,
                      color: colors.text.muted,
                      textAlign: "center",
                      paddingBlock: spacing.s8,
                    }}
                  >
                    Momento etiquetado en tu diario
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTagSheetOpen(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      paddingBlock: spacing.s8,
                      color: colors.accent.phosphorCyan,
                      fontFamily: typography.family,
                      fontSize: typography.size.caption,
                      fontWeight: typography.weight.medium,
                      cursor: "pointer",
                      minHeight: touchTarget.min,
                    }}
                  >
                    Etiqueta este momento
                  </button>
                )}
              </div>
            </>
          )}

          {step !== "mood" && (
            <F03StepView
              step={step}
              feedback={feedback}
              reduceMotion={reduceMotion}
              onSingleSelect={handleSingleSelect}
              onMultiToggle={handleMultiToggle}
              onAdvance={advanceStep}
              onSkipStep={handleStepSkip}
              onSkipAll={handleStepSkipAll}
              onBack={goBackStep}
            />
          )}
        </aside>
      </div>

      {tagSheetOpen && (
        <MarkMomentSheet
          onSave={(ev) => {
            try { useStore.getState().logLifeEvent(ev); } catch { /* noop */ }
            setMomentTagged(true);
            setTagSheetOpen(false);
          }}
          onClose={() => setTagSheetOpen(false)}
        />
      )}
    </>
  );
}

/* ─── F0-3 sub-step view (single primitive, all 5 steps) ──────── */

function F03StepView({
  step,
  feedback,
  reduceMotion,
  onSingleSelect,
  onMultiToggle,
  onAdvance,
  onSkipStep,
  onSkipAll,
  onBack,
}) {
  const cfg = F03_STEP_CONFIGS[step];
  if (!cfg) return null;
  const stepIndex = F03_STEP_SEQUENCE.indexOf(step); // 0..4
  const value = feedback[cfg.field];
  const hasAnswer = cfg.kind === "multi"
    ? Array.isArray(value) && value.length > 0
    : value != null;

  return (
    <>
      {/* Title */}
      <h2
        id="v2-mood-post-title"
        data-testid="post-step-title"
        style={{
          margin: 0,
          marginBlockStart: spacing.s12,
          fontFamily: typography.family,
          fontSize: 24,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: colors.text.strong,
          lineHeight: 1.2,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        {cfg.title}
      </h2>

      {/* Subtitle */}
      <p
        id="v2-mood-post-subtitle"
        style={{
          margin: 0,
          marginBlockStart: spacing.s8,
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.regular,
          color: colors.text.secondary,
          lineHeight: 1.45,
          textAlign: "center",
          maxWidth: 320,
        }}
      >
        {cfg.subtitle}
      </p>

      {/* Chip row (single or multi-select) */}
      <div
        data-testid={`post-step-${step}-chips`}
        role={cfg.kind === "single" ? "radiogroup" : "group"}
        aria-labelledby="v2-mood-post-title"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: spacing.s8,
          marginBlockStart: spacing.s32,
          maxWidth: 360,
          width: "100%",
        }}
      >
        {cfg.options.map((opt) => {
          const isActive = cfg.kind === "multi"
            ? Array.isArray(value) && value.includes(opt.value)
            : value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role={cfg.kind === "single" ? "radio" : "checkbox"}
              aria-checked={isActive}
              data-testid={`post-step-${step}-opt-${opt.value}`}
              data-active={isActive ? "true" : "false"}
              onClick={() => {
                if (cfg.kind === "multi") {
                  onMultiToggle(cfg.field, opt.value, cfg.options);
                } else {
                  onSingleSelect(cfg.field, opt.value);
                }
              }}
              style={{
                background: isActive
                  ? "rgba(34,211,238,0.12)"
                  : "transparent",
                border: isActive
                  ? `1px solid ${colors.accent.phosphorCyan}`
                  : `0.5px solid ${colors.separator}`,
                borderRadius: radii.pill,
                paddingBlock: spacing.s12,
                paddingInline: spacing.s16,
                cursor: "pointer",
                minHeight: touchTarget.preferred,
                color: isActive ? colors.accent.phosphorCyan : colors.text.secondary,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                letterSpacing: "0.02em",
                transition: reduceMotion ? "none" : `all 180ms ${motionTok.ease.out}`,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Progress dots */}
      <div
        data-testid="post-step-progress"
        aria-hidden="true"
        style={{
          display: "flex",
          gap: spacing.s4,
          marginBlockStart: spacing.s24,
        }}
      >
        {F03_STEP_SEQUENCE.map((_, i) => (
          <span
            key={i}
            style={{
              width: i === stepIndex ? 24 : 6,
              height: 6,
              borderRadius: 999,
              background: i === stepIndex
                ? colors.accent.phosphorCyan
                : "rgba(255,255,255,0.18)",
              transition: reduceMotion ? "none" : `width 220ms ${motionTok.ease.out}`,
            }}
          />
        ))}
      </div>

      {/* CTAs */}
      <div
        style={{
          marginBlockStart: spacing.s24,
          width: "100%",
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s8,
        }}
      >
        <button
          type="button"
          data-testid="post-step-advance"
          onClick={onAdvance}
          style={{
            background: hasAnswer
              ? colors.accent.phosphorCyan
              : "rgba(255,255,255,0.08)",
            color: hasAnswer ? "#041019" : colors.text.muted,
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
            transition: reduceMotion ? "none" : `all 180ms ${motionTok.ease.out}`,
          }}
        >
          {stepIndex === F03_STEP_SEQUENCE.length - 1 ? "Completar" : "Continuar"}
        </button>
        <div style={{ display: "flex", gap: spacing.s8, justifyContent: "center" }}>
          <button
            type="button"
            data-testid="post-step-back"
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              paddingBlock: spacing.s12,
              paddingInline: spacing.s16,
              color: colors.text.muted,
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              cursor: "pointer",
              minHeight: touchTarget.min,
            }}
          >
            Atrás
          </button>
          <button
            type="button"
            data-testid="post-step-skip"
            onClick={onSkipStep}
            style={{
              background: "transparent",
              border: "none",
              paddingBlock: spacing.s12,
              paddingInline: spacing.s16,
              color: colors.text.muted,
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              cursor: "pointer",
              minHeight: touchTarget.min,
            }}
          >
            Saltar
          </button>
          <button
            type="button"
            data-testid="post-step-skip-all"
            onClick={onSkipAll}
            style={{
              background: "transparent",
              border: "none",
              paddingBlock: spacing.s12,
              paddingInline: spacing.s16,
              color: colors.text.muted,
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              cursor: "pointer",
              minHeight: touchTarget.min,
            }}
          >
            Saltar todo
          </button>
        </div>
      </div>
    </>
  );
}
