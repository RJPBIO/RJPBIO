"use client";
import { useState } from "react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch } from "./ModalShell";
import StepUpInline from "./StepUpInline";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4b — MfaDisableModal. Endpoint POST /api/auth/mfa/disable
// requiere step-up fresh (mfaVerifiedAt < 10min). Si stale → server
// retorna 401 {error:"stale", needsStepUp:true} → mostramos StepUpInline,
// user verifica TOTP, retry disable.
//
// stepUpFresh prop pre-checked en SecurityView (de /api/v1/me/security):
// si > 0, podemos saltarnos el step-up inicial y mostrar el confirm directo.

export default function MfaDisableModal({ stepUpFresh = false, onClose, onComplete }) {
  // Si server ya nos dijo que estamos fresh, vamos directo a confirm.
  // Si stale, mostramos StepUpInline primero.
  const [needsStepUp, setNeedsStepUp] = useState(!stepUpFresh);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleDisable = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/mfa/disable", { method: "POST" });
      if (res.status === 401) {
        const j = await safeJson(res);
        if (j?.needsStepUp) {
          // Nuestro stepUpFresh estaba estale; pedir verificación.
          setNeedsStepUp(true);
          setError(null);
          return;
        }
        setError("Sesión expirada.");
        return;
      }
      if (res.status === 409) {
        setError("MFA no está activo en tu cuenta.");
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}.`);
        return;
      }
      setSuccess(true);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <ModalShell
        title="MFA desactivado"
        eyebrow="SEGURIDAD · MFA"
        eyebrowTone="cyan"
        onClose={() => { onComplete?.({ mfaEnabled: false }); onClose?.(); }}
        testId="mfa-disable-success"
      >
        <ModalText>
          La autenticación de dos pasos está desactivada. Tus dispositivos confiables también fueron revocados — recomendamos volver a activar MFA pronto.
        </ModalText>
        <ModalRow justify="flex-end">
          <ModalCta onClick={() => { onComplete?.({ mfaEnabled: false }); onClose?.(); }} testId="mfa-disable-success-close">
            Entendido
          </ModalCta>
        </ModalRow>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Desactivar MFA"
      eyebrow="SEGURIDAD · MFA"
      eyebrowTone="danger"
      onClose={submitting ? undefined : onClose}
      testId="mfa-disable"
    >
      <ModalText tone="danger">
        Desactivar MFA reduce significativamente la seguridad de tu cuenta. Cualquier persona con acceso a tu email + provider podrá iniciar sesión sin código.
      </ModalText>
      <ModalText tone="secondary">
        También se revocarán todos tus dispositivos confiables.
      </ModalText>

      {needsStepUp && (
        <StepUpInline onSuccess={() => { setNeedsStepUp(false); setError(null); }} />
      )}

      {error && (
        <div
          role="alert"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: `0.5px solid ${colors.semantic.danger}`,
            borderRadius: radii.panel,
            padding: spacing.s16,
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            color: colors.semantic.danger,
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      <ModalRow>
        <ModalCta variant="outlined" onClick={onClose} disabled={submitting} testId="mfa-disable-cancel">
          Cancelar
        </ModalCta>
        <ModalCta
          variant="danger"
          onClick={handleDisable}
          disabled={submitting || needsStepUp}
          testId="mfa-disable-confirm"
        >
          {submitting ? "Desactivando…" : "Desactivar MFA"}
        </ModalCta>
      </ModalRow>
    </ModalShell>
  );
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
