"use client";
import { useState } from "react";
import { csrfFetch } from "./ModalShell";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4b — StepUpInline: form inline para verificar TOTP/backup
// code antes de operaciones MFA-sensitive (disable, regenerate backup
// codes). Reutilizable.
//
// Flow:
//   1. User abre MfaDisableModal o MfaBackupCodesModal
//   2. Si /api/v1/me/security.mfa.stepUpFreshSeconds > 0, NO se muestra
//      este componente (la operación procede directo).
//   3. Si stale (=0), MfaDisableModal/MfaBackupCodesModal renderizan
//      este componente, el user ingresa TOTP, click "Verificar".
//   4. POST /api/auth/mfa/verify { code }. Si ok, onSuccess() callback —
//      el padre re-trigger la operación primary.
//   5. Si invalid → mostrar error + counter de attempts restantes.
//   6. Si locked (429) → mostrar "Cuenta bloqueada por X minutos".
//
// El padre controla el state `needsStepUp` y monta este componente
// condicionalmente.

export default function StepUpInline({ onSuccess, autoFocus = true }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null); // attempts left
  const [lockedSeconds, setLockedSeconds] = useState(0);

  const valid = /^\d{6}$/.test(code);
  const canSubmit = valid && !submitting && lockedSeconds === 0;

  const handleVerify = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (res.status === 429) {
        const j = await safeJson(res);
        setLockedSeconds(j?.retryAfter || 900);
        setError("Cuenta bloqueada temporalmente por demasiados intentos.");
        return;
      }
      if (res.status === 401) {
        const j = await safeJson(res);
        setRemaining(j?.remaining ?? null);
        setError(j?.remaining != null
          ? `Código inválido. Te quedan ${j.remaining} intentos.`
          : "Código inválido.");
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}.`);
        return;
      }
      // Success — limpia y notifica
      setCode("");
      setError(null);
      onSuccess?.();
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-v2-step-up-inline
      style={{
        background: "rgba(34,211,238,0.04)",
        border: `0.5px solid ${colors.accent.phosphorCyan}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s8,
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
        VERIFICACIÓN REQUERIDA
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.regular,
          color: colors.text.secondary,
          lineHeight: 1.5,
        }}
      >
        Ingresa el código de 6 dígitos de tu app autenticadora.
      </p>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        disabled={submitting || lockedSeconds > 0}
        data-testid="stepup-code-input"
        placeholder="000000"
        style={{
          appearance: "none",
          background: "rgba(255,255,255,0.04)",
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panel,
          color: colors.text.strong,
          fontFamily: typography.familyMono,
          fontSize: 18,
          fontWeight: typography.weight.medium,
          padding: "12px 14px",
          letterSpacing: "0.3em",
          textAlign: "center",
          outline: "none",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent.phosphorCyan; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = colors.separator; }}
      />
      {error && (
        <span
          role="alert"
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            color: colors.semantic.danger,
            lineHeight: 1.4,
          }}
        >
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={handleVerify}
        disabled={!canSubmit}
        data-testid="stepup-verify"
        style={{
          appearance: "none",
          cursor: canSubmit ? "pointer" : "not-allowed",
          background: canSubmit ? colors.accent.phosphorCyan : "rgba(34,211,238,0.32)",
          color: canSubmit ? colors.bg.base : "rgba(255,255,255,0.45)",
          border: "none",
          borderRadius: radii.pill,
          padding: "10px 18px",
          minBlockSize: 44,
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {submitting ? "Verificando…" : "Verificar"}
      </button>
    </div>
  );
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
