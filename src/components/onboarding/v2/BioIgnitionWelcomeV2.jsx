"use client";
/* ═══════════════════════════════════════════════════════════════
   BioIgnitionWelcomeV2 — onboarding 5 screens cinematográficos.
   Phase 6 quick-fix · ADN Tactical Premium Dark estricto:
     bg #08080A · accent #22D3EE phosphorCyan ≤4 viewport · Inter
     Tight 200/400/500 · sin auroras/gradients/glow · 0.5px borders
     · tap targets ≥44px / ≥48px CTAs · focus trap · reduced motion.

   5 pantallas:
     0 manifesto       · BioGlyph + wordmark + tagline
     1 differentiator  · qué NO somos
     2 how_it_works    · 23 protocolos · 4 intents · 1 sistema
     3 commitment      · "1 de cada 20 opera al día 30"
     4 intent_picker   · 4 opciones tappeables
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BioGlyph } from "../../BioIgnicionMark";
import { useReducedMotion, useFocusTrap } from "../../../lib/a11y";

const ACCENT = "#22D3EE";
const BG = "#08080A";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "rgba(255,255,255,0.6)";
const TEXT_MUTED = "rgba(255,255,255,0.4)";
const TEXT_FAINT = "rgba(255,255,255,0.35)";

const FONT = '"Inter Tight", "Sohne", system-ui, -apple-system, sans-serif';

const TOTAL_SCREENS = 5;

const INTENTS = [
  { id: "calma",       label: "Calma",    desc: "Bajo el ruido" },
  { id: "enfoque",     label: "Enfoque",  desc: "Subo la concentración" },
  { id: "energia",     label: "Energía",  desc: "Activo el cuerpo" },
  { id: "reset",       label: "Reset",    desc: "Limpio y reinicio" },
];

export default function BioIgnitionWelcomeV2({ onComplete, onSkip }) {
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(true);
  const [step, setStep] = useState(0);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const liveRef = useRef(null);

  // Announce step changes via aria-live.
  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `Paso ${step + 1} de ${TOTAL_SCREENS}`;
    }
  }, [step]);

  const advance = useCallback(() => {
    if (step < TOTAL_SCREENS - 1) {
      setStep((s) => s + 1);
    } else if (selectedIntent) {
      if (typeof onComplete === "function") {
        onComplete({ intent: selectedIntent, completedAt: Date.now() });
      }
    }
  }, [step, selectedIntent, onComplete]);

  const back = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const skipAll = useCallback(() => {
    if (typeof onSkip === "function") {
      onSkip();
    } else if (typeof onComplete === "function") {
      onComplete({ intent: null, completedAt: Date.now(), skipped: true });
    }
  }, [onComplete, onSkip]);

  // Keyboard: Escape skips, Enter advances when allowed.
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        skipAll();
      } else if (e.key === "Enter") {
        const allowed = step < TOTAL_SCREENS - 1 || selectedIntent;
        if (allowed) {
          e.preventDefault();
          advance();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [advance, skipAll, step, selectedIntent]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bi-welcome-title"
      data-v2-welcome
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
      }}
    >
      <span
        ref={liveRef}
        aria-live="polite"
        style={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}
      />

      <Header
        step={step}
        onBack={step > 0 ? back : null}
        onSkip={step === 0 ? skipAll : null}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingInline: 24,
          maxInlineSize: 480,
          marginInline: "auto",
          width: "100%",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "flex", flexDirection: "column" }}
          >
            {step === 0 && <ScreenManifesto reduced={reduced} />}
            {step === 1 && <ScreenDifferentiator />}
            {step === 2 && <ScreenHowItWorks />}
            {step === 3 && <ScreenCommitment />}
            {step === 4 && (
              <ScreenIntentPicker
                selected={selectedIntent}
                onSelect={setSelectedIntent}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer
        step={step}
        canAdvance={step < TOTAL_SCREENS - 1 || !!selectedIntent}
        onAdvance={advance}
      />
    </div>
  );
}

/* ──── Header ──────────────────────────────────────────── */
function Header({ step, onBack, onSkip }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: 24,
        paddingBlockEnd: 16,
        minHeight: 44,
      }}
    >
      <div style={{ minWidth: 44, display: "flex", alignItems: "center" }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            data-testid="welcome-back"
            aria-label="Volver"
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              color: TEXT_MUTED,
              cursor: "pointer",
              minWidth: 44,
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginInlineStart: -10,
            }}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
        ) : null}
      </div>

      <div
        data-testid="welcome-step-counter"
        style={{
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: TEXT_FAINT,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(step + 1).padStart(2, "0")} / {String(TOTAL_SCREENS).padStart(2, "0")}
      </div>

      <div style={{ minWidth: 44, display: "flex", justifyContent: "flex-end" }}>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            data-testid="welcome-skip"
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              color: TEXT_MUTED,
              cursor: "pointer",
              minHeight: 44,
              padding: "0 4px",
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 400,
            }}
          >
            Saltar introducción
          </button>
        ) : null}
      </div>
    </header>
  );
}

/* ──── Footer (CTA + dots) ─────────────────────────────── */
function Footer({ step, canAdvance, onAdvance }) {
  const isLast = step === TOTAL_SCREENS - 1;
  const isCommitmentOrLast = step >= 3;
  const filled = isCommitmentOrLast;
  const ctaLabel = isLast ? "Estoy listo" : isCommitmentOrLast ? "Estoy listo" : "Continuar";

  return (
    <footer
      style={{
        paddingInline: 24,
        paddingBlockStart: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <ProgressDots active={step} total={TOTAL_SCREENS} />
      <button
        type="button"
        onClick={onAdvance}
        disabled={!canAdvance}
        data-testid="welcome-cta"
        aria-label={ctaLabel}
        style={{
          appearance: "none",
          cursor: canAdvance ? "pointer" : "default",
          background: filled ? (canAdvance ? ACCENT : "rgba(34,211,238,0.32)") : "transparent",
          color: filled ? BG : (canAdvance ? ACCENT : "rgba(34,211,238,0.4)"),
          border: filled ? "none" : `0.5px solid ${canAdvance ? ACCENT : "rgba(34,211,238,0.32)"}`,
          borderRadius: 8,
          minHeight: 52,
          paddingInline: 28,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          width: "100%",
          maxWidth: 320,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          transition: "background 180ms ease, color 180ms ease",
        }}
      >
        <span>{ctaLabel}</span>
        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </footer>
  );
}

function ProgressDots({ active, total }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={active + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === active;
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: isActive ? 24 : 6,
              height: 2,
              background: isActive ? ACCENT : "rgba(255,255,255,0.18)",
              borderRadius: 1,
              transition: "width 180ms ease, background 180ms ease",
            }}
          />
        );
      })}
    </div>
  );
}

/* ──── Screen 0 — Manifesto ────────────────────────────── */
function ScreenManifesto({ reduced }) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        textAlign: "center",
      }}
    >
      <BioGlyph size={88} animated={!reduced} />
      <h1
        id="bi-welcome-title"
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 42,
          fontWeight: 200,
          letterSpacing: "0.02em",
          color: TEXT_PRIMARY,
          lineHeight: 1,
        }}
      >
        BIO-IGNICIÓN
      </h1>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 24,
          height: 0.5,
          background: ACCENT,
          opacity: 0.6,
        }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 400,
          color: TEXT_SECONDARY,
          lineHeight: 1.5,
          maxWidth: 280,
        }}
      >
        Sistema neural de alto rendimiento para profesionales.
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 400,
          color: TEXT_MUTED,
          lineHeight: 1.6,
          maxWidth: 260,
        }}
      >
        Diseñado con neurociencia validada. Construido para ejecutar bajo presión.
      </p>
    </section>
  );
}

/* ──── Screen 1 — Differentiator ───────────────────────── */
function ScreenDifferentiator() {
  const cards = [
    { title: "Protocolos clínicos",   desc: "Cada uno cita literatura peer-reviewed." },
    { title: "Anti-trampa real",      desc: "Validación por señal corporal, no auto-completion." },
    { title: "Bandit adaptativo",     desc: "El sistema aprende qué funciona para ti." },
  ];
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 200,
            color: TEXT_PRIMARY,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          No es meditación.<br />No es relajación.
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 400,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.5,
          }}
        >
          Bio-Ignición es un sistema neural instrumentado.
        </p>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {cards.map((c) => (
          <article
            key={c.title}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 500,
                color: TEXT_PRIMARY,
                letterSpacing: "-0.005em",
              }}
            >
              {c.title}
            </h3>
            <p
              style={{
                margin: 0,
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 400,
                color: TEXT_MUTED,
                lineHeight: 1.5,
              }}
            >
              {c.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ──── Screen 2 — How it works ─────────────────────────── */
function ScreenHowItWorks() {
  const flow = ["INTENT", "PROTOCOLO", "SESIÓN", "BANDIT"];
  const intents = [
    { name: "Calma",   sub: "Bajo el ruido" },
    { name: "Enfoque", sub: "Subo concentración" },
    { name: "Energía", sub: "Activo el cuerpo" },
    { name: "Reset",   sub: "Limpio y reinicio" },
  ];
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 200,
            color: TEXT_PRIMARY,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          23 protocolos. 4 intents.<br />1 sistema.
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 400,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.5,
          }}
        >
          Empezamos con tu intención. El sistema aprende qué funciona para ti.
        </p>
      </header>

      {/* Flow diagram horizontal compact */}
      <div
        aria-label="Flujo del sistema"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
          maxBlockSize: 120,
        }}
      >
        {flow.map((label, i) => (
          <div
            key={label}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: ACCENT,
                border: `0.5px solid rgba(34,211,238,0.3)`,
                borderRadius: 6,
                padding: "8px 12px",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
            {i < flow.length - 1 ? (
              <span aria-hidden="true" style={{ color: "rgba(34,211,238,0.4)", fontSize: 12 }}>→</span>
            ) : (
              <span aria-hidden="true" style={{ color: "rgba(34,211,238,0.4)", fontSize: 11 }}>↺</span>
            )}
          </div>
        ))}
      </div>

      {/* Intents list */}
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {intents.map((it) => (
          <li
            key={it.name}
            style={{ display: "inline-flex", alignItems: "center", gap: 12 }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 4,
                height: 4,
                background: ACCENT,
                opacity: 0.6,
                borderRadius: "50%",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 400,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              <strong style={{ fontWeight: 500, color: TEXT_PRIMARY }}>{it.name}</strong>
              {" — "}
              {it.sub}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ──── Screen 3 — Commitment (filtro) ──────────────────── */
function ScreenCommitment() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 200,
            color: TEXT_PRIMARY,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          1 de cada 20 opera al día 30.
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 400,
            color: ACCENT,
            letterSpacing: "0.02em",
          }}
        >
          El compromiso es el filtro.
        </p>
      </header>

      <p
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 400,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.6,
        }}
      >
        Bio-Ignición premia consistencia. Si lo usas 3 veces a la semana, ves cambios.
        Si esperas magia sin trabajo, no es para ti.
      </p>

      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 24,
          height: 0.5,
          background: ACCENT,
          opacity: 0.5,
        }}
      />

      <p
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 400,
          color: TEXT_MUTED,
          lineHeight: 1.6,
          fontStyle: "italic",
        }}
      >
        Producto B2B para profesionales que valoran rigor.
      </p>
    </section>
  );
}

/* ──── Screen 4 — Intent picker ────────────────────────── */
function ScreenIntentPicker({ selected, onSelect }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: ACCENT,
          }}
        >
          PRIMERA DECISIÓN
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 200,
            color: TEXT_PRIMARY,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          ¿Cómo quieres empezar?
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 400,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Elige tu primer foco. Lo puedes cambiar después.
        </p>
      </header>

      <div
        role="radiogroup"
        aria-label="Intent picker"
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        {INTENTS.map((it) => {
          const active = selected === it.id;
          return (
            <button
              key={it.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(it.id)}
              data-testid={`welcome-intent-${it.id}`}
              style={{
                appearance: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 14,
                paddingInline: 20,
                paddingBlock: 18,
                minHeight: 72,
                width: "100%",
                background: active ? "rgba(34,211,238,0.04)" : "rgba(255,255,255,0.02)",
                border: `0.5px solid ${active ? ACCENT : "rgba(255,255,255,0.12)"}`,
                borderRadius: 8,
                color: "inherit",
                textAlign: "start",
                transition: "border 180ms ease, background 180ms ease",
              }}
            >
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 15,
                    fontWeight: 500,
                    color: TEXT_PRIMARY,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {it.label}
                </span>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 12,
                    fontWeight: 400,
                    color: TEXT_MUTED,
                    lineHeight: 1.4,
                  }}
                >
                  {it.desc}
                </span>
              </span>
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                color={active ? ACCENT : "rgba(255,255,255,0.3)"}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
