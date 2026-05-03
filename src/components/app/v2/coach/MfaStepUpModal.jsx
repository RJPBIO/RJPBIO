"use client";
import { useState } from "react";
import { colors, typography, spacing, radii, motion as motionTok } from "../tokens";

export default function MfaStepUpModal({ onVerify, onCancel }) {
  const [code, setCode] = useState("");
  const canVerify = /^\d{6}$/.test(code);

  return (
    <div
      data-v2-mfa-modal
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.s24,
        zIndex: 100,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          maxWidth: 360,
          width: "100%",
          background: colors.bg.base,
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panelLg,
          padding: spacing.s32,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s16,
        }}
      >
        <div
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
          }}
        >
          VERIFICACIÓN REQUERIDA
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: "rgba(255,255,255,0.96)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          Confirma tu identidad
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.5,
          }}
        >
          Para usar el coach, verifica con tu autenticador.
        </p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          autoFocus
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `0.5px solid ${colors.separator}`,
            borderRadius: radii.panel,
            padding: "14px 16px",
            fontFamily: typography.familyMono,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.96)",
            letterSpacing: "0.5em",
            textAlign: "center",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => canVerify && onVerify && onVerify(code)}
          disabled={!canVerify}
          style={{
            appearance: "none",
            width: "100%",
            padding: "14px 0",
            background: canVerify ? colors.accent.phosphorCyan : "rgba(255,255,255,0.06)",
            color: canVerify ? "#08080A" : "rgba(255,255,255,0.32)",
            border: "none",
            borderRadius: radii.pill,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            cursor: canVerify ? "pointer" : "not-allowed",
            transition: `background 200ms ${motionTok.ease.out}`,
          }}
        >
          Verificar
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            appearance: "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.55)",
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: typography.weight.medium,
            padding: spacing.s8,
            alignSelf: "center",
          }}
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
}
