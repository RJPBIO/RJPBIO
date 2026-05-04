"use client";
import { useState } from "react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch } from "./ModalShell";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4b — RemoveTrustedDeviceModal: confirma remoción de un
// trusted device + DELETE /api/auth/mfa/trusted-devices/[id] (existente).
//
// Trusted devices permiten al user saltarse el challenge MFA durante 30
// días. Removerlos es seguridad-positiva (el next sign-in en ese device
// requerirá MFA otra vez). Sin anti lock-out porque trusted devices
// SIEMPRE son optional (MFA sigue funcional sin ellos).

export default function RemoveTrustedDeviceModal({ device, onClose, onComplete }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!device?.id) return null;

  const handleRemove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch(
        `/api/auth/mfa/trusted-devices/${encodeURIComponent(device.id)}`,
        { method: "DELETE" },
      );
      if (res.status === 401) {
        setError("Sesión expirada.");
        return;
      }
      if (res.status === 404) {
        setError("Este dispositivo ya no está registrado.");
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}.`);
        return;
      }
      onComplete?.({ removedDeviceId: device.id });
      onClose?.();
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="Quitar dispositivo confiable"
      eyebrow="MFA · TRUSTED DEVICES"
      eyebrowTone="cyan"
      onClose={submitting ? undefined : onClose}
      testId="remove-trusted-device"
    >
      <ModalText>
        El próximo inicio de sesión en este dispositivo requerirá tu código MFA. Recomendado si lo perdiste o lo prestaste.
      </ModalText>
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panel,
          padding: spacing.s16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
          }}
        >
          {device.label || "Dispositivo sin nombre"}
        </span>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.06em",
            color: colors.text.muted,
            fontWeight: typography.weight.regular,
          }}
        >
          {device.ip || "—"}
          {device.lastUsedAt && ` · usado ${formatRelative(device.lastUsedAt)}`}
        </span>
      </div>
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
        <ModalCta variant="outlined" onClick={onClose} disabled={submitting} testId="remove-trusted-device-cancel">
          Cancelar
        </ModalCta>
        <ModalCta variant="danger" onClick={handleRemove} disabled={submitting} testId="remove-trusted-device-confirm">
          {submitting ? "Quitando…" : "Quitar dispositivo"}
        </ModalCta>
      </ModalRow>
    </ModalShell>
  );
}

function formatRelative(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}
