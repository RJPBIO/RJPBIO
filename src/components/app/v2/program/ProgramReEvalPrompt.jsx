"use client";
/* ═══════════════════════════════════════════════════════════════
   ProgramReEvalPrompt — Phase 6F SP-B
   Wrapper que abre InstrumentRunner con PSS-4 y al completar postea a
   POST /api/v1/me/program/reEval. Backend SP-A valida que activeProgram
   tenga reEvalAt set y reEvalCompletedAt null.

   InstrumentRunner ya es un full-screen modal con su propio backdrop +
   focus trap + framer motion. NO lo envolvemos en ModalShell (eso sería
   doble-modal). El contexto "PROGRAMA · DÍA 14" lo da el banner CTA de
   ProgramActiveCard que dispara este prompt.

   Flow:
     1. InstrumentRunner renderea las 4 preguntas PSS-4
     2. User responde → scorer Cohen 1983 calcula score 0-16 + level
     3. User hace tap "Guardar" en runner → onComplete(entry) fires
     4. handler POST /me/program/reEval con score+level+answers
     5. on success → onComplete(entry) propagado al parent + onClose
     6. on fail → mostrar error overlay sin cerrar (user puede reintentar)
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import dynamic from "next/dynamic";
import { PSS4, scorePss4 } from "@/lib/instruments";
import { csrfFetch } from "@/components/app/v2/profile/modals/ModalShell";
import { colors, typography, spacing, radii, withAlpha } from "../tokens";

// Dynamic import del runner — evita bundle bloat al inicio + matches
// el patrón de AppV2Root (mismo InstrumentRunner ya es lazy-loaded ahí).
const InstrumentRunner = dynamic(
  () => import("@/components/InstrumentRunner"),
  { ssr: false, loading: () => <RunnerLoading /> }
);

export default function ProgramReEvalPrompt({ activeProgram, onClose, onComplete }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!activeProgram || !activeProgram.programId) return null;

  const handleInstrumentComplete = async (entry) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/v1/me/program/reEval", {
        method: "POST",
        body: JSON.stringify({
          instrumentId: "pss-4",
          score: entry.score,
          level: entry.level,
          answers: entry.answers,
        }),
      });

      if (!res.ok) {
        let msg = "No pudimos guardar tu re-evaluación.";
        try {
          const errBody = await res.json();
          if (errBody?.error === "no_reeval_due") {
            msg = "Esta re-evaluación ya no está disponible.";
          } else if (errBody?.error === "reeval_already_completed") {
            msg = "Ya completaste esta re-evaluación.";
          } else if (errBody?.error === "no_active_program") {
            msg = "Tu programa ya no está activo.";
          } else if (res.status === 401) {
            msg = "Tu sesión expiró — por favor inicia sesión de nuevo.";
          }
        } catch { /* leave default */ }
        throw new Error(msg);
      }

      // Éxito: parent refetch + close. Pasamos entry al parent por si
      // quiere mostrar toast de confirmación o actualizar UI optimistic.
      onComplete?.(entry);
      onClose?.();
    } catch (err) {
      setError(err?.message || "No pudimos guardar tu re-evaluación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <InstrumentRunner
        show={true}
        instrument={PSS4}
        scorer={scorePss4}
        onComplete={handleInstrumentComplete}
        onClose={() => {
          // Si está submitting, no permitimos cerrar (avoid race con POST).
          if (submitting) return;
          onClose?.();
        }}
      />

      {(submitting || error) && (
        <SubmitOverlay
          submitting={submitting}
          error={error}
          onRetry={() => setError(null)}
          onDismiss={() => {
            setError(null);
            onClose?.();
          }}
        />
      )}
    </>
  );
}

/* ─── UI bits ─── */

function SubmitOverlay({ submitting, error, onRetry, onDismiss }) {
  return (
    <div
      data-v2-program-reeval-overlay
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,8,10,0.7)",
        zIndex: 230, // sobre InstrumentRunner (zIndex 220)
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.s24,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          background: colors.bg.base,
          border: `0.5px solid ${error ? withAlpha(colors.semantic.dangerRgb, 30) : colors.separator}`,
          borderRadius: radii.panelLg,
          padding: spacing.s32,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s16,
        }}
      >
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: error ? colors.semantic.danger : colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
          }}
        >
          {error ? "ERROR AL GUARDAR" : "GUARDANDO RE-EVALUACIÓN"}
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.regular,
            color: colors.text.strong,
            lineHeight: 1.5,
          }}
        >
          {error || "Tu respuesta se está enviando. No cierres la ventana."}
        </p>
        {error && (
          <div style={{ display: "flex", gap: spacing.s8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onRetry}
              style={ctaStyle("primary")}
              data-testid="reeval-retry"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={onDismiss}
              style={ctaStyle("outlined")}
              data-testid="reeval-dismiss"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RunnerLoading() {
  return (
    <div
      data-v2-modal-loading
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,8,10,0.92)",
        zIndex: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.accent.phosphorCyan,
          fontWeight: typography.weight.medium,
        }}
      >
        Cargando PSS-4…
      </span>
    </div>
  );
}

function ctaStyle(variant) {
  const isPrimary = variant === "primary";
  return {
    appearance: "none",
    background: isPrimary ? colors.accent.phosphorCyan : "transparent",
    color: isPrimary ? colors.bg.base : colors.text.strong,
    border: isPrimary ? "none" : `0.5px solid ${colors.separator}`,
    borderRadius: radii.pill,
    cursor: "pointer",
    paddingBlock: 12,
    paddingInline: 20,
    minBlockSize: 44,
    fontFamily: typography.family,
    fontSize: 12,
    fontWeight: typography.weight.medium,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  };
}
