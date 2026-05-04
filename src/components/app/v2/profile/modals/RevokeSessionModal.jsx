"use client";
import { useState } from "react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch } from "./ModalShell";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4b — RevokeSessionModal: confirma revocación de una session
// específica + DELETE /api/v1/me/sessions/[id] (endpoint existente).
// El padre (SecurityView) provee la session info para mostrarla en el
// modal. El user actual NO se puede revocar a sí mismo (server lo
// bloquea — pero la lista en SecurityView debería filtrarlo).

export default function RevokeSessionModal({ session, onClose, onComplete }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!session?.id) return null;

  const handleRevoke = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch(`/api/v1/me/sessions/${encodeURIComponent(session.id)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        setError("Sesión expirada.");
        return;
      }
      if (res.status === 404) {
        setError("Esta sesión ya no existe.");
        return;
      }
      if (res.status === 409) {
        setError("No puedes revocar tu sesión actual desde aquí. Usa 'Cerrar sesión' en su lugar.");
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}.`);
        return;
      }
      onComplete?.({ revokedSessionId: session.id });
      onClose?.();
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="Revocar sesión"
      eyebrow="SEGURIDAD · SESIÓN"
      eyebrowTone="cyan"
      onClose={submitting ? undefined : onClose}
      testId="revoke-session"
    >
      <ModalText>
        Cerrarás la sesión en este dispositivo de forma inmediata. La persona que esté usándolo necesitará volver a iniciar sesión.
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
          {session.label || session.userAgent || "Dispositivo desconocido"}
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
          {session.ip || "—"}
          {session.lastSeenAt && ` · activo ${formatRelative(session.lastSeenAt)}`}
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
        <ModalCta variant="outlined" onClick={onClose} disabled={submitting} testId="revoke-session-cancel">
          Cancelar
        </ModalCta>
        <ModalCta variant="danger" onClick={handleRevoke} disabled={submitting} testId="revoke-session-confirm">
          {submitting ? "Revocando…" : "Revocar sesión"}
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
