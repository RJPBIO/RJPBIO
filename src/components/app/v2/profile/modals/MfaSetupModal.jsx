"use client";
import { useEffect, useState } from "react";
import ModalShell, { ModalCta, ModalRow, ModalText, csrfFetch } from "./ModalShell";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4b — MfaSetupModal con flow de 4 steps:
//   1. intro     — explicación + CTA "Empezar"
//   2. qr-secret — render QR + manual entry secret + CTA "Continuar"
//   3. verify    — input TOTP code + verify
//   4. backup    — display 10 backup codes one-time + copy/download
//
// Wiring:
//   - GET  /api/auth/mfa/setup  → retorna {qrDataURL, secret, backupCodes}
//   - POST /api/auth/mfa/setup body {code} → verifica + flips mfaEnabled
//
// IMPORTANT: el server pre-genera QR como data URL base64 (ya rendered),
// así que no necesitamos qrcode lib client-side. El secret viene en
// plaintext (one-time) para manual entry. Los backup codes vienen en
// step 1 GET — los mostramos en step 4 después del verify exitoso.

export default function MfaSetupModal({ onClose, onComplete }) {
  const [step, setStep] = useState("intro"); // intro | qr-secret | verify | backup
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Step 1 → 2: GET setup endpoint para iniciar flow.
  const handleStart = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/setup", { credentials: "include" });
      if (res.status === 401) {
        setError("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }
      if (res.status === 409) {
        setError("MFA ya está activo en tu cuenta.");
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}. Intenta de nuevo.`);
        return;
      }
      const data = await res.json();
      setSetupData(data);
      setStep("qr-secret");
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 → 4: POST setup verify code.
  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Ingresa un código de 6 dígitos.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/mfa/setup", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (res.status === 401) {
        const j = await safeJson(res);
        setError(j?.error === "invalid"
          ? "Código incorrecto. Verifica que tu app esté en hora."
          : "Sesión expirada.");
        return;
      }
      if (!res.ok) {
        setError(`Error ${res.status}.`);
        return;
      }
      // Activated. Show backup codes.
      setStep("backup");
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopySecret = async () => {
    if (!setupData?.secret) return;
    try {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      // clipboard puede fallar en non-https; mostrar el secret inline ya es fallback
    }
  };

  const handleDownloadBackup = () => {
    if (!setupData?.backupCodes) return;
    const text = [
      "Bio-Ignición — Códigos de respaldo MFA",
      `Generados: ${new Date().toISOString()}`,
      "",
      "Cada código solo se puede usar UNA vez.",
      "Guárdalos en un lugar seguro (gestor de contraseñas, papel impreso).",
      "",
      ...setupData.backupCodes,
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

  // Step 1 — intro
  if (step === "intro") {
    return (
      <ModalShell
        title="Activar autenticación de dos pasos"
        eyebrow="SEGURIDAD · MFA SETUP"
        eyebrowTone="cyan"
        onClose={submitting ? undefined : onClose}
        testId="mfa-setup-intro"
      >
        <ModalText>
          Te pediremos un código de 6 dígitos cada vez que inicies sesión, además de tu método actual. Necesitas una app autenticadora como Google Authenticator, Authy o 1Password.
        </ModalText>
        <ModalText tone="muted">
          Recibirás 10 códigos de respaldo de un solo uso por si pierdes acceso a tu app.
        </ModalText>
        {error && <ErrorBox>{error}</ErrorBox>}
        <ModalRow>
          <ModalCta variant="outlined" onClick={onClose} disabled={submitting} testId="mfa-setup-cancel">
            Cancelar
          </ModalCta>
          <ModalCta onClick={handleStart} disabled={submitting} testId="mfa-setup-start">
            {submitting ? "Generando…" : "Empezar setup"}
          </ModalCta>
        </ModalRow>
      </ModalShell>
    );
  }

  // Step 2 — QR + manual secret
  if (step === "qr-secret") {
    return (
      <ModalShell
        title="Escanea con tu app"
        eyebrow="MFA · PASO 2 DE 3"
        eyebrowTone="cyan"
        onClose={onClose}
        testId="mfa-setup-qr"
        maxWidth={420}
      >
        <ModalText tone="secondary">
          Abre tu app autenticadora (Authy, Google Authenticator, 1Password) y escanea el código.
        </ModalText>
        {setupData?.qrDataURL && (
          <div
            style={{
              alignSelf: "center",
              padding: spacing.s16,
              background: "#FFFFFF",
              borderRadius: radii.panel,
            }}
          >
            <img
              src={setupData.qrDataURL}
              alt="Código QR para configurar MFA"
              data-testid="mfa-qr-image"
              style={{ display: "block", width: 200, height: 200 }}
            />
          </div>
        )}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `0.5px solid ${colors.separator}`,
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
              color: colors.text.muted,
              fontWeight: typography.weight.medium,
            }}
          >
            O INGRESA MANUALMENTE
          </span>
          <code
            data-testid="mfa-secret-text"
            style={{
              fontFamily: typography.familyMono,
              fontSize: 14,
              fontWeight: typography.weight.medium,
              color: colors.text.strong,
              letterSpacing: "0.06em",
              wordBreak: "break-all",
              lineHeight: 1.5,
            }}
          >
            {setupData?.secret || "—"}
          </code>
          <button
            type="button"
            onClick={handleCopySecret}
            data-testid="mfa-copy-secret"
            style={{
              appearance: "none",
              alignSelf: "flex-start",
              background: "transparent",
              border: "none",
              color: colors.accent.phosphorCyan,
              cursor: "pointer",
              padding: "4px 0",
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: typography.weight.medium,
            }}
          >
            {copiedSecret ? "✓ COPIADO" : "COPIAR CÓDIGO"}
          </button>
        </div>
        <ModalRow>
          <ModalCta variant="outlined" onClick={onClose} testId="mfa-setup-qr-cancel">
            Cancelar
          </ModalCta>
          <ModalCta onClick={() => { setStep("verify"); setError(null); }} testId="mfa-setup-qr-continue">
            Ya lo escaneé
          </ModalCta>
        </ModalRow>
      </ModalShell>
    );
  }

  // Step 3 — verify
  if (step === "verify") {
    return (
      <ModalShell
        title="Verifica el código"
        eyebrow="MFA · PASO 3 DE 3"
        eyebrowTone="cyan"
        onClose={submitting ? undefined : onClose}
        testId="mfa-setup-verify"
      >
        <ModalText>
          Ingresa el código de 6 dígitos que muestra tu app ahora mismo.
        </ModalText>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={submitting}
          data-testid="mfa-setup-code-input"
          placeholder="000000"
          style={{
            appearance: "none",
            background: "rgba(255,255,255,0.04)",
            border: `0.5px solid ${colors.separator}`,
            borderRadius: radii.panel,
            color: colors.text.strong,
            fontFamily: typography.familyMono,
            fontSize: 22,
            fontWeight: typography.weight.medium,
            padding: "14px 16px",
            letterSpacing: "0.3em",
            textAlign: "center",
            outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent.phosphorCyan; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = colors.separator; }}
        />
        {error && <ErrorBox>{error}</ErrorBox>}
        <ModalRow>
          <ModalCta variant="outlined" onClick={() => setStep("qr-secret")} disabled={submitting} testId="mfa-setup-verify-back">
            Volver
          </ModalCta>
          <ModalCta onClick={handleVerify} disabled={submitting || !/^\d{6}$/.test(code)} testId="mfa-setup-verify-submit">
            {submitting ? "Verificando…" : "Activar MFA"}
          </ModalCta>
        </ModalRow>
      </ModalShell>
    );
  }

  // Step 4 — backup codes
  return (
    <ModalShell
      title="Guarda tus códigos de respaldo"
      eyebrow="MFA · ACTIVADO"
      eyebrowTone="cyan"
      onClose={() => { onComplete?.({ mfaEnabled: true }); onClose?.(); }}
      testId="mfa-setup-backup"
      maxWidth={420}
    >
      <ModalText>
        MFA está activo. Guarda estos códigos de respaldo en un lugar seguro — son tu única forma de recuperar acceso si pierdes tu app.
      </ModalText>
      <ModalText tone="danger">
        Cada código solo se puede usar UNA vez. Esta es la única vez que los verás.
      </ModalText>
      <div
        data-testid="mfa-setup-backup-list"
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
        {(setupData?.backupCodes || []).map((c, i) => (
          <span key={i} style={{ paddingBlock: 4 }}>{c}</span>
        ))}
      </div>
      <ModalRow>
        <ModalCta variant="outlined" onClick={handleDownloadBackup} testId="mfa-setup-download-codes">
          Descargar TXT
        </ModalCta>
        <ModalCta onClick={() => { onComplete?.({ mfaEnabled: true }); onClose?.(); }} testId="mfa-setup-finish">
          He guardado mis códigos
        </ModalCta>
      </ModalRow>
    </ModalShell>
  );
}

function ErrorBox({ children }) {
  return (
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
      {children}
    </div>
  );
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
