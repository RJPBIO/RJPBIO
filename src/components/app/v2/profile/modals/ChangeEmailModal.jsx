"use client";
import { useState } from "react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch } from "./ModalShell";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4a — ChangeEmailModal. Wire al endpoint existente
// /api/account/link-email (Phase 2). El backend hace:
//   1. Validar email shape + no-collision con otra cuenta
//   2. Update User.email + reset emailVerified=null
//   3. Audit log "account.email.link.request"
// El magic-link al new email lo dispara el server flow asíncrono;
// el user ve "verifica tu email" como confirmación.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailModal({ currentEmail, onClose, onComplete }) {
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const trimmed = newEmail.trim().toLowerCase();
  const valid = EMAIL_RE.test(trimmed) && trimmed !== (currentEmail || "").toLowerCase();
  const canSubmit = valid && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/account/link-email", {
        method: "POST",
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.status === 401) {
        setError("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }
      if (res.status === 409) {
        setError("Este email ya está registrado en otra cuenta.");
        return;
      }
      if (res.status === 429) {
        setError("Demasiados intentos. Espera 30 minutos antes de reintentar.");
        return;
      }
      if (res.status === 400) {
        const j = await safeJson(res);
        setError(j?.error === "email_invalid" ? "Email inválido." : "Solicitud rechazada.");
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}. Intenta de nuevo.`);
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
        title="Verifica tu nuevo email"
        eyebrow="EMAIL · CONFIRMACIÓN PENDIENTE"
        eyebrowTone="cyan"
        onClose={() => { onComplete?.({ email: trimmed }); onClose?.(); }}
        testId="change-email-success"
      >
        <ModalText>
          Enviamos un link de confirmación a <strong>{trimmed}</strong>. Click el link para completar el cambio. Hasta entonces tu email actual sigue activo.
        </ModalText>
        <ModalRow justify="flex-end">
          <ModalCta
            onClick={() => { onComplete?.({ email: trimmed }); onClose?.(); }}
            testId="change-email-success-close"
          >
            Entendido
          </ModalCta>
        </ModalRow>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Cambiar email"
      eyebrow="CUENTA · EMAIL"
      eyebrowTone="cyan"
      onClose={submitting ? undefined : onClose}
      testId="change-email"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.s8 }}>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
          }}
        >
          EMAIL ACTUAL
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.regular,
            color: colors.text.secondary,
          }}
        >
          {currentEmail || "(sin email)"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.s8 }}>
        <label
          htmlFor="new-email"
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
          }}
        >
          NUEVO EMAIL
        </label>
        <input
          id="new-email"
          type="email"
          autoComplete="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={submitting}
          data-testid="change-email-input"
          style={{
            appearance: "none",
            background: "rgba(255,255,255,0.04)",
            border: `0.5px solid ${colors.separator}`,
            borderRadius: radii.panel,
            color: colors.text.strong,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            padding: "12px 14px",
            outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent.phosphorCyan; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = colors.separator; }}
        />
      </div>

      <ModalText tone="muted">
        Recibirás un link de confirmación al nuevo email. Tu email actual permanece activo hasta que confirmes el cambio.
      </ModalText>

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
          }}
        >
          {error}
        </div>
      )}

      <ModalRow>
        <ModalCta variant="outlined" onClick={onClose} disabled={submitting} testId="change-email-cancel">
          Cancelar
        </ModalCta>
        <ModalCta onClick={handleSubmit} disabled={!canSubmit} testId="change-email-submit">
          {submitting ? "Enviando…" : "Enviar verificación"}
        </ModalCta>
      </ModalRow>
    </ModalShell>
  );
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
