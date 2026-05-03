"use client";
/* ═══════════════════════════════════════════════════════════════
   ProtocolPlayer — Phase 4 SP3
   Reemplaza SessionRunner. Shell fullscreen que orquesta el hook
   useProtocolPlayer + las primitivas SP2 vía PrimitiveSwitcher.

   ADN visual:
   - Bg #08080A
   - phosphorCyan acento (≤4 lugares)
   - Inter Tight 200/400/500
   - Cero glow / glassmorphism / aurora
   - Header sutil: Exit X + TransitionDots + Crisis "Estoy bien"
   - Center: primitiva activa
   - Footer: botón Continuar (cuando validation.canAdvance)
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { useProtocolPlayer } from "../../../hooks/useProtocolPlayer";
import { getUseCase } from "../../../lib/protocols";
import { colors, typography, spacing, layout } from "../../app/v2/tokens";
import PrimitiveSwitcher from "./PrimitiveSwitcher";
import TransitionDots from "./primitives/TransitionDots";

const ACCENT = colors.accent.phosphorCyan;

function ExitButton({ onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || "Salir"}
      style={{
        appearance: "none",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        padding: 8,
        color: colors.text.muted,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

/* ─── Pause / Resume toggle button (training only) ─── */
function PauseButton({ paused, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="pause-button"
      aria-label={paused ? "Reanudar sesión" : "Pausar sesión"}
      style={{
        appearance: "none",
        cursor: "pointer",
        background: "rgba(255,255,255,0.06)",
        border: `0.5px solid ${colors.separator}`,
        borderRadius: 999,
        padding: 8,
        minBlockSize: 36,
        minInlineSize: 36,
        color: colors.text.secondary,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {paused ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="6" y1="4" x2="6" y2="20" />
          <line x1="18" y1="4" x2="18" y2="20" />
        </svg>
      )}
    </button>
  );
}

/* ─── Paused overlay full-viewport ─── */
function PausedOverlay({ onResume }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="paused-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,8,10,0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.light,
          fontSize: 32,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: ACCENT,
        }}
      >
        Pausado
      </h2>
      <button
        type="button"
        onClick={onResume}
        data-testid="resume-button"
        style={{
          appearance: "none",
          cursor: "pointer",
          padding: "14px 32px",
          background: ACCENT,
          color: "#08080A",
          border: "none",
          borderRadius: 999,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 14,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Reanudar
      </button>
    </div>
  );
}

/* ─── Partial credit indicator (training cancel) ─── */
function PartialCreditIndicator({ percent, willCredit }) {
  return (
    <div
      role="status"
      data-testid="partial-credit-indicator"
      style={{
        margin: spacing.s16,
        padding: "8px 16px",
        background: "transparent",
        border: `0.5px solid ${ACCENT}`,
        borderRadius: 999,
        color: ACCENT,
        fontFamily: typography.family,
        fontWeight: typography.weight.medium,
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        textAlign: "center",
        alignSelf: "center",
      }}
    >
      {willCredit
        ? `Vas a recibir crédito parcial (${Math.round(percent * 100)}%)`
        : "Menos del 50% — no se acreditará"}
    </div>
  );
}

function ImOKButton({ onClick }) {
  // Quick fix post-SP3 — Opción B. Botón outlined secundario que vive
  // dentro del footer como peer del CONTINUAR. El position:fixed previo
  // overlapeaba con CONTINUAR e interceptaba pointer events (riesgo
  // clínico: user en crisis tap CONTINUAR → disparaba "Estoy bien"
  // accidentalmente). Hierarchy visual: CONTINUAR cyan filled = primary
  // action, "Estoy bien" outlined = escape secundario.
  return (
    <button
      type="button"
      onClick={onClick}
      data-test="im-ok-button"
      style={{
        appearance: "none",
        cursor: "pointer",
        padding: "12px 24px",
        background: "transparent",
        color: colors.text.secondary,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: 999,
        fontFamily: typography.family,
        fontWeight: typography.weight.medium,
        fontSize: 13,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        minBlockSize: 44,
        minInlineSize: 132,
      }}
    >
      Estoy bien
    </button>
  );
}

function ContinueButton({ onClick, label = "Continuar", primary = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: "none",
        cursor: "pointer",
        padding: "12px 28px",
        background: primary ? ACCENT : "transparent",
        color: primary ? "#08080A" : colors.text.secondary,
        border: primary ? "none" : `0.5px solid ${colors.separator}`,
        borderRadius: 999,
        fontFamily: typography.family,
        fontWeight: typography.weight.medium,
        fontSize: 13,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        transition: "background 120ms linear",
      }}
    >
      {label}
    </button>
  );
}

/* ─── Safety disclaimer overlay (crisis with safety field) ─── */
function SafetyOverlay({ safetyText, onConfirm, onCancelExit }) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Aviso de seguridad antes de comenzar"
      data-testid="safety-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: colors.bg.base,
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.s32,
        gap: spacing.s32,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 22,
          letterSpacing: "-0.01em",
          color: ACCENT,
          textAlign: "center",
        }}
      >
        Aviso Importante
      </h2>
      <p
        style={{
          margin: 0,
          maxInlineSize: 480,
          fontFamily: typography.family,
          fontWeight: typography.weight.regular,
          fontSize: 16,
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.92)",
          textAlign: "center",
        }}
      >
        {safetyText}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.s16, alignItems: "center" }}>
        <button
          type="button"
          onClick={onConfirm}
          data-testid="safety-confirm"
          style={{
            appearance: "none",
            cursor: "pointer",
            padding: "16px 40px",
            background: ACCENT,
            color: "#08080A",
            border: "none",
            borderRadius: 999,
            fontFamily: typography.family,
            fontWeight: typography.weight.medium,
            fontSize: 14,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            minBlockSize: 48,
            minInlineSize: 200,
          }}
        >
          Estoy listo
        </button>
        <button
          type="button"
          onClick={onCancelExit}
          data-testid="safety-cancel"
          style={{
            appearance: "none",
            cursor: "pointer",
            padding: "12px 24px",
            background: "transparent",
            color: colors.text.secondary,
            border: `0.5px solid ${colors.separator}`,
            borderRadius: 999,
            fontFamily: typography.family,
            fontWeight: typography.weight.medium,
            fontSize: 13,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ProgressIndicator({ progress }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        insetInline: 0,
        insetBlockEnd: 0,
        height: 1,
        background: colors.separator,
      }}
    >
      <div
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`,
          height: "100%",
          background: ACCENT,
          transition: "width 120ms linear",
        }}
      />
    </div>
  );
}

export default function ProtocolPlayer({
  protocol,
  voiceOn = false,
  hapticOn = true,
  binauralOn = true,
  cameraEnabled = false,
  onComplete,
  onCancel,
  autoStart = true,
}) {
  const player = useProtocolPlayer(protocol, {
    voiceOn,
    hapticOn,
    binauralOn,
    cameraEnabled,
    onComplete,
    onCancel,
  });

  const [confirmingExit, setConfirmingExit] = useState(false);
  // Phase 4 SP8 — safety disclaimer pre-mount para protocolos con safety field.
  // Phase 5 quick-fix: gate ampliado de "crisis-only" a "cualquier safety field"
  // para cubrir disclaimers no-crisis (e.g. #21 Threshold Crossing — epilepsia
  // fotosensible). Compliance B2B: cualquier protocolo que declare un riesgo
  // explícito en `safety` debe presentar el overlay antes de start.
  const requiresSafety = !!protocol?.safety;
  const [safetyAccepted, setSafetyAccepted] = useState(!requiresSafety);

  useEffect(() => {
    // No autoStart hasta que safety overlay sea aceptado.
    if (autoStart && player.status === "idle" && safetyAccepted) {
      player.start();
    }
  }, [autoStart, player, safetyAccepted]);

  if (!protocol) return null;

  // Safety overlay pre-mount (crisis con safety field): bloquea TODO
  // hasta que user confirme. "Cancelar" → onCancel sin acreditar.
  if (requiresSafety && !safetyAccepted) {
    return (
      <SafetyOverlay
        safetyText={protocol.safety}
        onConfirm={() => setSafetyAccepted(true)}
        onCancelExit={() => {
          if (typeof onCancel === "function") onCancel();
        }}
      />
    );
  }

  const useCase = getUseCase(protocol);
  const isDone = player.status === "done" || player.status === "cancelled";

  const handleExitTap = () => {
    // active: confirmar salida (no acredita).
    // training: confirmar salida (mostrar partial indicator).
    // crisis: cancela directo (acredita siempre).
    if (useCase === "active" || useCase === "training") {
      if (!confirmingExit) {
        setConfirmingExit(true);
        setTimeout(() => setConfirmingExit(false), 4000);
        return;
      }
    }
    player.cancel();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Sesión ${protocol.n}`}
      style={{
        position: "fixed",
        inset: 0,
        background: colors.bg.base,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        fontFamily: typography.family,
      }}
    >
      {/* Header — exit + transition dots */}
      <header
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBlock: spacing.s16,
          paddingInline: spacing.s16,
          borderBlockEnd: `0.5px solid ${colors.separator}`,
        }}
      >
        <ExitButton
          onClick={handleExitTap}
          ariaLabel={confirmingExit ? "Confirmar salida sin acreditar" : "Salir"}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: colors.text.muted,
            }}
          >
            {protocol.n}
          </span>
          <TransitionDots
            total_acts={Math.max(1, player.totalActsInProtocol)}
            current_act={Math.min(player.completedActs, player.totalActsInProtocol - 1)}
          />
        </div>

        {/* Pause button (training only) o spacer (otros) */}
        {useCase === "training" ? (
          <PauseButton
            paused={player.status === "paused"}
            onClick={() => (player.status === "paused" ? player.resume() : player.pause())}
          />
        ) : (
          <span style={{ inlineSize: 36 }} aria-hidden="true" />
        )}

        <ProgressIndicator progress={player.validation.progress} />
      </header>

      {/* Confirm exit tooltip */}
      {confirmingExit && useCase === "active" && (
        <div
          role="alert"
          style={{
            margin: spacing.s16,
            padding: spacing.s16,
            background: "rgba(255,255,255,0.03)",
            border: `0.5px solid ${colors.separator}`,
            borderRadius: 14,
            color: colors.text.secondary,
            fontSize: 13,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          Salir ahora <strong style={{ color: colors.text.primary }}>no acredita</strong> la sesión. Toca otra vez para confirmar.
        </div>
      )}

      {/* Partial credit indicator (training cancel flow) */}
      {confirmingExit && useCase === "training" && (
        <PartialCreditIndicator
          percent={player.partialPercent}
          willCredit={player.partialPercent >= 0.5}
        />
      )}

      {/* Stage — la primitiva activa */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBlock: spacing.s48,
          paddingInline: spacing.s24,
          maxInlineSize: layout.maxContentWidth,
          marginInline: "auto",
          inlineSize: "100%",
        }}
      >
        <div style={{ inlineSize: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {!isDone && player.currentAct && (
            <PrimitiveSwitcher
              key={`p${player.currentPhaseIndex}-a${player.currentActIndex}`}
              act={player.currentAct}
              phase={player.currentActPhase}
              audioOn={hapticOn}
              hapticOn={hapticOn}
              voiceOn={player.effectiveVoiceOn}
              intent={protocol.int || "calma"}
              onSignal={player.updateActSignal}
              onLocalComplete={() => {
                /* La primitiva avisó que terminó su lifecycle interno;
                   el player evalúa validation y avanza sólo si pasa. */
                if (player.validation.canAdvance) player.advance();
              }}
            />
          )}
          {isDone && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: spacing.s24 }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: typography.family,
                  fontWeight: typography.weight.light,
                  fontSize: 32,
                  letterSpacing: "-0.02em",
                  color: colors.text.primary,
                }}
              >
                {player.status === "cancelled"
                  ? "Sesión cancelada"
                  : player.completionData?.partial
                    ? "Acreditada parcialmente"
                    : player.completionData?.status === "incomplete_uncredited"
                      ? "No acreditada"
                      : "Sesión completa"}
              </h2>
              {player.completionData?.vCoresAward > 0 && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: colors.text.muted,
                    letterSpacing: "0.02em",
                  }}
                >
                  +{player.completionData.vCoresAward} vCores
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer — controles. Quick fix post-SP3:
          "Estoy bien" (crisis) ahora vive aquí como peer del CONTINUAR
          en lugar de position:fixed. Hierarchy: CONTINUAR cyan filled =
          primary, "Estoy bien" outlined = escape secundario. */}
      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.s16,
          paddingBlock: spacing.s24,
          paddingInline: spacing.s16,
          borderBlockStart: `0.5px solid ${colors.separator}`,
          flexWrap: "wrap",
        }}
      >
        {!isDone && useCase === "crisis" && (
          <ImOKButton onClick={() => player.imOK()} />
        )}
        {!isDone && player.validation.canAdvance && (
          <ContinueButton onClick={() => player.advance()} />
        )}
        {!isDone && useCase !== "active" && !player.validation.canAdvance && (
          <ContinueButton onClick={() => player.forceAdvance()} label="Saltar" primary={false} />
        )}
      </footer>

      {/* Paused overlay full-viewport (training only) */}
      {!isDone && useCase === "training" && player.status === "paused" && (
        <PausedOverlay onResume={() => player.resume()} />
      )}
    </div>
  );
}
