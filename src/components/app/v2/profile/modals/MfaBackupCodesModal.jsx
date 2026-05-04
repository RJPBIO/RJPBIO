"use client";
import { useState } from "react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch } from "./ModalShell";
import StepUpInline from "./StepUpInline";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4b — MfaBackupCodesModal. Endpoint POST /api/auth/mfa/backup-codes
// regenera 10 nuevos códigos. Requiere step-up fresh (mfaVerifiedAt < 10min).
// Si stale → StepUpInline → user verifica → retry.
//
// Después de regen exitoso: muestra los códigos + descarga + warning de
// "los anteriores ya no funcionan".

export default function MfaBackupCodesModal({ stepUpFresh = false, onClose, onComplete }) {
  const [needsStepUp, setNeedsStepUp] = useState(!stepUpFresh);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newCodes, setNewCodes] = useState(null);

  const handleRegenerate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/mfa/backup-codes", { method: "POST" });
      if (res.status === 401) {
        const j = await safeJson(res);
        if (j?.needsStepUp) {
          setNeedsStepUp(true);
          return;
        }
        setError("Sesión expirada.");
        return;
      }
      if (res.status === 409) {
        setError("MFA no está activo.");
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}.`);
        return;
      }
      const data = await res.json();
      setNewCodes(data?.backupCodes || []);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!newCodes || newCodes.length === 0) return;
    const text = [
      "Bio-Ignición — Códigos de respaldo MFA (regenerados)",
      `Generados: ${new Date().toISOString()}`,
      "",
      "Los códigos anteriores YA NO FUNCIONAN.",
      "Cada código solo se puede usar UNA vez.",
      "",
      ...newCodes,
      "",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bio-ignicion-mfa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Estado: códigos generados → mostrar lista
  if (newCodes) {
    return (
      <ModalShell
        title="Nuevos códigos de respaldo"
        eyebrow="MFA · BACKUP CODES"
        eyebrowTone="cyan"
        onClose={() => { onComplete?.(); onClose?.(); }}
        testId="mfa-backup-success"
        maxWidth={420}
      >
        <ModalText tone="danger">
          Los códigos anteriores YA NO FUNCIONAN. Guarda estos nuevos en un lugar seguro — son tu única forma de recuperar acceso si pierdes tu app.
        </ModalText>
        <div
          data-testid="mfa-backup-list"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `0.5px solid ${colors.separator}`,
            borderRadius: radii.panel,
            padding: spacing.s16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: spacing.s8,
            fontFamily: typography.familyMono,
            fontSize: 14,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "0.04em",
          }}
        >
          {newCodes.map((c, i) => (
            <span key={i} style={{ paddingBlock: 4 }}>{c}</span>
          ))}
        </div>
        <ModalRow>
          <ModalCta variant="outlined" onClick={handleDownload} testId="mfa-backup-download">
            Descargar TXT
          </ModalCta>
          <ModalCta onClick={() => { onComplete?.(); onClose?.(); }} testId="mfa-backup-finish">
            He guardado los códigos
          </ModalCta>
        </ModalRow>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Regenerar códigos de respaldo"
      eyebrow="MFA · BACKUP CODES"
      eyebrowTone="cyan"
      onClose={submitting ? undefined : onClose}
      testId="mfa-backup-regen"
    >
      <ModalText>
        Genera 10 nuevos códigos de respaldo para usar si pierdes acceso a tu app autenticadora. Los códigos actuales dejarán de funcionar.
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
        <ModalCta variant="outlined" onClick={onClose} disabled={submitting} testId="mfa-backup-cancel">
          Cancelar
        </ModalCta>
        <ModalCta onClick={handleRegenerate} disabled={submitting || needsStepUp} testId="mfa-backup-regen-confirm">
          {submitting ? "Regenerando…" : "Regenerar códigos"}
        </ModalCta>
      </ModalRow>
    </ModalShell>
  );
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
