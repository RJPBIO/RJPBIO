"use client";
import { useState } from "react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch } from "./ModalShell";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4a — DsarRequestModal único con 3 types (access/portability/erasure).
// Wired al endpoint REAL /api/v1/me/dsar (ya existente desde Phase 2 backend).
// El endpoint auto-resuelve ACCESS y PORTABILITY (artifact URL inmediato);
// ERASURE queda PENDING para admin approval.

const KIND_CONFIG = {
  access: {
    apiKind: "ACCESS",
    eyebrow: "GDPR ART. 15 · ACCESO",
    title: "Solicitar acceso a tus datos",
    description: "Recibirás un archivo con todos los datos que Bio-Ignición tiene sobre ti. Para ACCESO el sistema genera el export automáticamente.",
    cta: "Solicitar acceso",
    successHeadline: "Solicitud creada",
    successMessage: "Recibirás el archivo de acceso en máximo 7 días. La URL del export estará disponible en Mis datos > Historial.",
    eyebrowTone: "cyan",
    requireConfirm: false,
  },
  portability: {
    apiKind: "PORTABILITY",
    eyebrow: "GDPR ART. 20 · PORTABILIDAD",
    title: "Solicitar portabilidad de datos",
    description: "Recibirás tus datos en formato JSON estructurado para transferirlos a otro servicio. Auto-resuelto.",
    cta: "Solicitar portabilidad",
    successHeadline: "Solicitud creada",
    successMessage: "El archivo JSON estará disponible en Mis datos > Historial dentro de 7 días.",
    eyebrowTone: "cyan",
    requireConfirm: false,
  },
  erasure: {
    apiKind: "ERASURE",
    eyebrow: "GDPR ART. 17 · ELIMINACIÓN",
    title: "Eliminar mi cuenta y datos",
    description: "Esta acción inicia el proceso de eliminación. Un administrador revisará la solicitud (puede tomar hasta 30 días). Tras aprobación, todos tus datos personales se eliminan; los datos agregados anonimizados se retienen bajo Recital 26 GDPR.",
    cta: "Solicitar eliminación",
    successHeadline: "Solicitud enviada",
    successMessage: "Un administrador revisará tu solicitud. Recibirás notificación al completar. Tu cuenta sigue activa hasta la aprobación.",
    eyebrowTone: "danger",
    requireConfirm: true,
  },
};

export default function DsarRequestModal({ type, onClose, onComplete }) {
  const config = KIND_CONFIG[type];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!config) return null;

  const canSubmit = !submitting && (!config.requireConfirm || confirmed);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/v1/me/dsar", {
        method: "POST",
        body: JSON.stringify({ kind: config.apiKind }),
      });
      if (res.status === 401) {
        setError("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }
      if (res.status === 403) {
        setError("Acceso denegado.");
        return;
      }
      if (!res.ok) {
        const j = await safeJson(res);
        setError(j?.message || j?.error || `Error ${res.status}. Intenta de nuevo.`);
        return;
      }
      const data = await safeJson(res);
      setSuccess(data?.request || { id: "—", kind: config.apiKind });
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  // Estado success — UI de confirmación con close.
  if (success) {
    return (
      <ModalShell
        title={config.successHeadline}
        eyebrow={config.eyebrow}
        eyebrowTone="cyan"
        onClose={() => { onComplete?.(success); onClose?.(); }}
        testId={`dsar-${type}-success`}
      >
        <ModalText>{config.successMessage}</ModalText>
        <ModalRow justify="flex-end">
          <ModalCta
            onClick={() => { onComplete?.(success); onClose?.(); }}
            testId="dsar-success-close"
          >
            Entendido
          </ModalCta>
        </ModalRow>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title={config.title}
      eyebrow={config.eyebrow}
      eyebrowTone={config.eyebrowTone}
      onClose={submitting ? undefined : onClose}
      testId={`dsar-${type}`}
    >
      <ModalText>{config.description}</ModalText>

      {config.requireConfirm && (
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: spacing.s8,
            cursor: "pointer",
            paddingBlock: spacing.s8,
            borderBlockStart: `0.5px solid ${colors.separator}`,
            borderBlockEnd: `0.5px solid ${colors.separator}`,
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            data-testid="dsar-erasure-confirm"
            style={{
              accentColor: colors.semantic.danger,
              width: 16,
              height: 16,
              marginBlockStart: 2,
            }}
          />
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: colors.text.strong,
              lineHeight: 1.5,
            }}
          >
            Entiendo que esta acción inicia un proceso irreversible de eliminación de mi cuenta y datos personales.
          </span>
        </label>
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
            fontWeight: typography.weight.regular,
            color: colors.semantic.danger,
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      <ModalRow>
        <ModalCta variant="outlined" onClick={onClose} disabled={submitting} testId="dsar-cancel">
          Cancelar
        </ModalCta>
        <ModalCta
          variant={type === "erasure" ? "danger" : "primary"}
          onClick={handleSubmit}
          disabled={!canSubmit}
          testId="dsar-submit"
        >
          {submitting ? "Procesando…" : config.cta}
        </ModalCta>
      </ModalRow>
    </ModalShell>
  );
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
