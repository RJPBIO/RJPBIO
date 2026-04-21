"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, space, font } from "@/components/ui/tokens";

const I18N = {
  es: {
    kicker: "SEGURIDAD · DOS PASOS",
    titleOn: "Autenticación en dos pasos activa",
    titleOff: "Activa tu segundo factor",
    subOn: "Añade una capa extra a cada inicio de sesión.",
    subOff: "Escanea el QR con tu app de autenticación y confirma con un código.",
    setupStart: "Empezar configuración",
    setupCancel: "Cancelar",
    stepScan: "Paso 1 · Escanea el QR",
    stepCode: "Paso 2 · Ingresa el código",
    stepBackup: "Paso 3 · Guarda tus códigos de respaldo",
    scanHint: "Usa Authy, 1Password, Google Authenticator o cualquier app TOTP compatible.",
    manualLabel: "¿No puedes escanear?",
    manualSecretLabel: "Secreto (entrada manual)",
    codeLabel: "Código de 6 dígitos",
    codePlaceholder: "000000",
    verifyBtn: "Verificar y activar",
    verifying: "Verificando…",
    confirmedBtn: "He guardado mis códigos",
    backupTitle: "Códigos de respaldo",
    backupHint: "Úsalos cuando pierdas tu dispositivo. Cada código sirve UNA sola vez.",
    backupWarning: "Solo los verás ahora. Guárdalos en un gestor de contraseñas o imprímelos.",
    copyAll: "Copiar todos",
    copied: "Copiado",
    downloadTxt: "Descargar .txt",
    printable: "Imprimir",
    statusTitle: "Estado actual",
    statusEnabled: "Activado",
    statusVerified: "Última verificación",
    statusCodes: "Códigos de respaldo restantes",
    regenBtn: "Generar nuevos códigos",
    regenStale: "Ingresa tu código TOTP primero para generar nuevos respaldos.",
    disableBtn: "Desactivar MFA",
    disableConfirm: "¿Desactivar MFA? Se borrarán tus códigos de respaldo y dispositivos de confianza.",
    devicesTitle: "Dispositivos de confianza",
    devicesHint: "Estos dispositivos omiten el segundo factor durante 30 días.",
    devicesEmpty: "Sin dispositivos de confianza registrados.",
    revokeDevice: "Revocar",
    revokeAll: "Revocar todos",
    errGeneric: "Algo falló",
    errInvalidCode: "Código inválido. Revisa la hora de tu dispositivo.",
    okEnabled: "MFA activado correctamente.",
    okRegen: "Códigos regenerados. Los anteriores ya no sirven.",
    okDisabled: "MFA desactivado.",
  },
  en: {
    kicker: "SECURITY · TWO-STEP",
    titleOn: "Two-factor authentication is on",
    titleOff: "Turn on your second factor",
    subOn: "Adds an extra layer to every sign-in.",
    subOff: "Scan the QR with your authenticator app and confirm with a code.",
    setupStart: "Start setup",
    setupCancel: "Cancel",
    stepScan: "Step 1 · Scan the QR",
    stepCode: "Step 2 · Enter the code",
    stepBackup: "Step 3 · Save your backup codes",
    scanHint: "Use Authy, 1Password, Google Authenticator or any TOTP-compatible app.",
    manualLabel: "Can't scan?",
    manualSecretLabel: "Manual-entry secret",
    codeLabel: "6-digit code",
    codePlaceholder: "000000",
    verifyBtn: "Verify and enable",
    verifying: "Verifying…",
    confirmedBtn: "I saved my codes",
    backupTitle: "Backup codes",
    backupHint: "Use these when you lose your device. Each code is single-use.",
    backupWarning: "You'll only see them now. Save them in a password manager or print them.",
    copyAll: "Copy all",
    copied: "Copied",
    downloadTxt: "Download .txt",
    printable: "Print",
    statusTitle: "Current state",
    statusEnabled: "Enabled",
    statusVerified: "Last verified",
    statusCodes: "Backup codes remaining",
    regenBtn: "Generate new codes",
    regenStale: "Enter a TOTP code first to generate new backup codes.",
    disableBtn: "Disable MFA",
    disableConfirm: "Disable MFA? We'll wipe backup codes and trusted devices.",
    devicesTitle: "Trusted devices",
    devicesHint: "These devices skip the second factor for 30 days.",
    devicesEmpty: "No trusted devices on file.",
    revokeDevice: "Revoke",
    revokeAll: "Revoke all",
    errGeneric: "Something failed",
    errInvalidCode: "Invalid code. Check your device's clock.",
    okEnabled: "MFA enabled successfully.",
    okRegen: "Codes regenerated. The old ones no longer work.",
    okDisabled: "MFA disabled.",
  },
};

async function csrfHeaders() {
  const r = await fetch("/api/auth/csrf");
  const j = await r.json().catch(() => ({}));
  return { "x-csrf-token": j?.csrfToken || "", "content-type": "application/json" };
}

export default function MfaSettingsClient({ locale = "es", email, state }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];

  const [mode, setMode] = useState(state.mfaEnabled ? "manage" : "idle"); // idle | enroll | manage
  const [enroll, setEnroll] = useState(null); // { otpauthURL, secret, backupCodes }
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [copied, setCopied] = useState(false);
  const [codesCount, setCodesCount] = useState(state.backupCodesCount);
  const [devices, setDevices] = useState(state.trustedDevices);
  const [verifiedAt, setVerifiedAt] = useState(state.mfaVerifiedAt);
  const [enabled, setEnabled] = useState(state.mfaEnabled);

  const qrSrc = enroll?.qrDataURL || "";

  async function startEnroll() {
    setBusy(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/auth/mfa/setup");
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setEnroll(j);
      setMode("enroll");
    } catch (e) { setErr(e.message || T.errGeneric); }
    finally { setBusy(false); }
  }

  async function verifyEnroll() {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: await csrfHeaders(),
        body: JSON.stringify({ code }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t.includes("invalid") ? T.errInvalidCode : T.errInvalidCode);
      }
      setBackupCodes(enroll.backupCodes);
      setCodesCount(enroll.backupCodes.length);
      setEnabled(true);
      setVerifiedAt(new Date().toISOString());
      setOk(T.okEnabled);
    } catch (e) { setErr(e.message || T.errGeneric); }
    finally { setBusy(false); }
  }

  async function finishEnroll() {
    setBackupCodes(null);
    setEnroll(null);
    setCode("");
    setMode("manage");
  }

  async function regenerate() {
    setBusy(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/auth/mfa/backup-codes", {
        method: "POST",
        headers: await csrfHeaders(),
      });
      if (r.status === 401) { setErr(T.regenStale); return; }
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setBackupCodes(j.backupCodes);
      setCodesCount(j.backupCodes.length);
      setOk(T.okRegen);
    } catch (e) { setErr(e.message || T.errGeneric); }
    finally { setBusy(false); }
  }

  async function disableMfa() {
    if (!confirm(T.disableConfirm)) return;
    setBusy(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: await csrfHeaders(),
      });
      if (r.status === 401) { setErr(T.regenStale); return; }
      if (!r.ok) throw new Error(await r.text());
      setEnabled(false);
      setCodesCount(0);
      setDevices([]);
      setMode("idle");
      setOk(T.okDisabled);
    } catch (e) { setErr(e.message || T.errGeneric); }
    finally { setBusy(false); }
  }

  function copyAllCodes() {
    if (!backupCodes) return;
    navigator.clipboard?.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  function downloadTxt() {
    if (!backupCodes) return;
    const body = `BIO-IGNICIÓN · ${T.backupTitle}\n${email}\n${new Date().toISOString()}\n\n${backupCodes.join("\n")}\n`;
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bio-ignicion-backup-codes.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AuthShell
      locale={L}
      size="lg"
      kicker={T.kicker}
      title={enabled ? T.titleOn : T.titleOff}
      subtitle={enabled ? T.subOn : T.subOff}
      footer={
        <Link href="/account" className="bi-auth-link" style={{ color: cssVar.textDim }}>
          ← Volver a tu cuenta
        </Link>
      }
    >
      <AnimatePresence initial={false}>
        {err && <motion.div key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 16 }}><Alert kind="danger">{err}</Alert></motion.div>}
        {ok && <motion.div key="ok" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 16 }}><Alert kind="success">{ok}</Alert></motion.div>}
      </AnimatePresence>

      {mode === "idle" && (
        <div className="bi-mfa-status">
          <Button variant="primary" onClick={startEnroll} loading={busy} className="bi-ignite" block style={{ height: 52, fontWeight: font.weight.bold }}>
            {T.setupStart}
          </Button>
        </div>
      )}

      {mode === "enroll" && !backupCodes && enroll && (
        <section className="bi-mfa-enroll">
          <h3 className="bi-mfa-step">{T.stepScan}</h3>
          <p className="bi-mfa-hint">{T.scanHint}</p>
          <div className="bi-mfa-qr">
            {qrSrc && <img src={qrSrc} alt="QR" width={200} height={200} />}
          </div>
          <details className="bi-mfa-manual">
            <summary>{T.manualLabel}</summary>
            <div>
              <strong>{T.manualSecretLabel}</strong>
              <code>{enroll.secret}</code>
            </div>
          </details>

          <h3 className="bi-mfa-step">{T.stepCode}</h3>
          <Field label={T.codeLabel} required>
            {(a) => (
              <Input
                {...a}
                inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder={T.codePlaceholder}
                autoComplete="one-time-code"
                style={{
                  fontFamily: cssVar.fontMono,
                  fontSize: 24,
                  letterSpacing: "10px",
                  textAlign: "center",
                }}
              />
            )}
          </Field>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button variant="primary" className="bi-ignite" onClick={verifyEnroll} loading={busy} loadingLabel={T.verifying} disabled={code.length !== 6} style={{ flex: 1, fontWeight: font.weight.bold }}>
              {T.verifyBtn}
            </Button>
            <Button variant="secondary" onClick={() => { setMode("idle"); setEnroll(null); setCode(""); }}>
              {T.setupCancel}
            </Button>
          </div>
        </section>
      )}

      {backupCodes && (
        <section className="bi-mfa-backup">
          <h3 className="bi-mfa-step">{T.stepBackup}</h3>
          <Alert kind="warning">{T.backupWarning}</Alert>
          <p className="bi-mfa-hint">{T.backupHint}</p>
          <ol className="bi-mfa-codes">
            {backupCodes.map((c) => <li key={c}><code>{c}</code></li>)}
          </ol>
          <div className="bi-mfa-codes-actions">
            <Button variant="secondary" onClick={copyAllCodes}>{copied ? T.copied : T.copyAll}</Button>
            <Button variant="secondary" onClick={downloadTxt}>{T.downloadTxt}</Button>
            <Button variant="secondary" onClick={() => window.print()}>{T.printable}</Button>
          </div>
          <Button variant="primary" onClick={finishEnroll} block className="bi-ignite" style={{ marginTop: 14, fontWeight: font.weight.bold }}>
            {T.confirmedBtn}
          </Button>
        </section>
      )}

      {mode === "manage" && !backupCodes && (
        <>
          <section className="bi-mfa-status-card">
            <h3>{T.statusTitle}</h3>
            <dl>
              <div><dt>{T.statusEnabled}</dt><dd className="pos">•</dd></div>
              <div><dt>{T.statusVerified}</dt><dd>{verifiedAt ? new Date(verifiedAt).toLocaleString() : "—"}</dd></div>
              <div><dt>{T.statusCodes}</dt><dd>{codesCount} / 10</dd></div>
            </dl>
            <div className="bi-mfa-status-actions">
              <Button variant="secondary" onClick={regenerate} loading={busy}>{T.regenBtn}</Button>
              <Button variant="danger" onClick={disableMfa} disabled={busy}>{T.disableBtn}</Button>
            </div>
          </section>

          <section className="bi-mfa-devices">
            <h3>{T.devicesTitle}</h3>
            <p className="bi-mfa-hint">{T.devicesHint}</p>
            {devices.length === 0 ? (
              <p className="bi-mfa-empty">{T.devicesEmpty}</p>
            ) : (
              <ul className="bi-mfa-device-list">
                {devices.map((d) => (
                  <li key={d.id}>
                    <div>
                      <strong>{d.label || "—"}</strong>
                      <span>{d.ip || "—"} · {new Date(d.lastUsedAt).toLocaleDateString()}</span>
                    </div>
                    <RevokeDeviceButton id={d.id} onRevoke={() => setDevices((xs) => xs.filter((x) => x.id !== d.id))} label={T.revokeDevice} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AuthShell>
  );
}

function RevokeDeviceButton({ id, onRevoke, label }) {
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const r = await fetch(`/api/auth/mfa/trusted-devices/${id}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      });
      if (r.ok) onRevoke();
    } finally { setBusy(false); }
  }
  return <Button variant="danger" size="sm" onClick={run} loading={busy}>{label}</Button>;
}
