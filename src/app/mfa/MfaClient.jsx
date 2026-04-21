"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, space, font } from "@/components/ui/tokens";
import { KeyMark } from "@/components/ui/BrandIcons";
import AuthHero from "@/components/brand/AuthHero";

const I18N = {
  es: {
    kicker: "SEGUNDO FACTOR · MFA",
    title: "Verificación en dos pasos",
    subtitle: "Ingresa el código TOTP de 6 dígitos o usa tu passkey.",
    heroKicker: "BIO-IGNICIÓN · DEFENSA EN PROFUNDIDAD",
    heroStatement: "Dos factores, un gesto.",
    heroTagline: "Passkey hardware-bound o TOTP de tu app — sin SMS como factor primario.",
    heroTrust: "Rate-limit de 5 intentos · bloqueo de 15 min · audit log firmado en cada evento.",
    heroChips: ["Passkey", "TOTP", "FIDO2", "Audit log"],
    totpLabel: "Código TOTP",
    backupLabel: "Código de respaldo",
    backupPlaceholder: "xxxx-xxxx",
    verifyBtn: "Verificar",
    verifying: "Verificando…",
    divider: "O BIEN",
    emailLabel: "Correo",
    emailHint: "Necesario para ubicar tu passkey",
    emailPlaceholder: "tú@empresa.com",
    passkeyBtn: "Usar passkey",
    passkeyVerifying: "Verificando passkey…",
    errInvalidCode: "Código inválido",
    errLocked: "Demasiados intentos. Espera 15 minutos o usa un código de respaldo.",
    remainingLabel: (n) => n === 1 ? "1 intento restante" : `${n} intentos restantes`,
    lockedBanner: "Cuenta bloqueada temporalmente. Usa un código de respaldo o espera 15 min.",
    errNoEmail: "Falta tu correo para ubicar la passkey.",
    errPasskeyNotFound: "No hay passkey registrada para este correo.",
    errPasskeyVerify: "Falló la verificación",
    errPasskeyGeneric: "Error con passkey",
    okTotp: "Verificado. Redirigiendo…",
    okPasskey: "Passkey verificada. Redirigiendo…",
    remember: "Confiar en este dispositivo por 30 días",
    rememberHint: "No te pediremos el 2FA aquí en 30 días. Úsalo solo en equipos personales.",
    useBackup: "¿Perdiste tu dispositivo? Usa un código de respaldo",
    useTotp: "← Volver al código TOTP",
    backupHint: "Cada código de respaldo sirve una sola vez. Los generaste al configurar MFA.",
    ctxTitle: "Confirmación adicional",
    ctxNewDevice: "Detectamos un inicio desde un dispositivo nuevo.",
    ctxNewLocation: "Detectamos un inicio desde una ubicación nueva.",
    ctxSensitive: "Esta acción requiere confirmar tu identidad.",
    ctxAdmin: "Estás accediendo a funciones de administración.",
  },
  en: {
    kicker: "SECOND FACTOR · MFA",
    title: "Two-factor verification",
    subtitle: "Enter your 6-digit TOTP code or use your passkey.",
    heroKicker: "BIO-IGNICIÓN · DEFENSE IN DEPTH",
    heroStatement: "Two factors, one gesture.",
    heroTagline: "Hardware-bound passkey or authenticator-app TOTP — SMS never as primary.",
    heroTrust: "5-attempt rate-limit · 15-min lockout · signed audit log on every event.",
    heroChips: ["Passkey", "TOTP", "FIDO2", "Audit log"],
    totpLabel: "TOTP code",
    backupLabel: "Backup code",
    backupPlaceholder: "xxxx-xxxx",
    verifyBtn: "Verify",
    verifying: "Verifying…",
    divider: "OR",
    emailLabel: "Email",
    emailHint: "Needed to locate your passkey",
    emailPlaceholder: "you@company.com",
    passkeyBtn: "Use passkey",
    passkeyVerifying: "Verifying passkey…",
    errInvalidCode: "Invalid code",
    errLocked: "Too many attempts. Wait 15 minutes or use a backup code.",
    remainingLabel: (n) => n === 1 ? "1 attempt left" : `${n} attempts left`,
    lockedBanner: "Temporarily locked. Use a backup code or wait 15 min.",
    errNoEmail: "Missing your email to locate the passkey.",
    errPasskeyNotFound: "No passkey registered for this email.",
    errPasskeyVerify: "Verification failed",
    errPasskeyGeneric: "Passkey error",
    okTotp: "Verified. Redirecting…",
    okPasskey: "Passkey verified. Redirecting…",
    remember: "Trust this device for 30 days",
    rememberHint: "We won't ask for 2FA here for 30 days. Only use on personal machines.",
    useBackup: "Lost your device? Use a backup code",
    useTotp: "← Back to TOTP code",
    backupHint: "Each backup code is single-use. You generated them when setting up MFA.",
    ctxTitle: "Additional confirmation",
    ctxNewDevice: "We detected a sign-in from a new device.",
    ctxNewLocation: "We detected a sign-in from a new location.",
    ctxSensitive: "This action requires confirming your identity.",
    ctxAdmin: "You're accessing admin features.",
  },
};

const REASON_KEY = {
  "new-device":   "ctxNewDevice",
  "new-location": "ctxNewLocation",
  "sensitive":    "ctxSensitive",
  "admin":        "ctxAdmin",
};

export default function MfaClient({ locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [busyTotp, setBusyTotp] = useState(false);
  const [busyPasskey, setBusyPasskey] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [remember, setRemember] = useState(false);
  const [mode, setMode] = useState("totp"); // "totp" | "backup"
  const [reason, setReason] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const busy = busyTotp || busyPasskey;
  const locked = lockedUntil > Date.now();

  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search);
      const e = q.get("email");
      if (e) setEmail(e);
      const r = q.get("reason");
      if (r && REASON_KEY[r]) setReason(r);
    } catch {}
  }, []);

  const ctxMsg = reason && T[REASON_KEY[reason]] ? T[REASON_KEY[reason]] : "";

  async function onSubmit(e) {
    e.preventDefault();
    setBusyTotp(true); setErr(""); setOk("");
    try {
      const payload = mode === "backup"
        ? { backupCode: code.trim(), rememberDevice: remember }
        : { code, rememberDevice: remember };
      const r = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        let body = {};
        try { body = await r.json(); } catch {}
        if (r.status === 429) {
          const retryAfter = Number(r.headers.get("retry-after") || 0) * 1000;
          setLockedUntil(Date.now() + (retryAfter || 15 * 60 * 1000));
          setRemaining(0);
          throw new Error(T.errLocked);
        }
        if (typeof body.remaining === "number") setRemaining(body.remaining);
        throw new Error(T.errInvalidCode);
      }
      setOk(T.okTotp);
      setRemaining(null);
      setLockedUntil(0);
      setTimeout(() => { location.href = "/"; }, 400);
    } catch (e) {
      setErr(e.message);
    } finally { setBusyTotp(false); }
  }

  async function usePasskey() {
    setBusyPasskey(true); setErr(""); setOk("");
    try {
      if (!email) throw new Error(T.errNoEmail);
      const optsR = await fetch("/api/webauthn/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!optsR.ok) throw new Error(T.errPasskeyNotFound);
      const opts = await optsR.json();
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const assertion = await startAuthentication({ optionsJSON: opts });
      const verifyR = await fetch("/api/webauthn/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!verifyR.ok) throw new Error((await verifyR.text()) || T.errPasskeyVerify);
      setOk(T.okPasskey);
      setTimeout(() => { location.href = "/"; }, 400);
    } catch (e) {
      setErr(e.message || T.errPasskeyGeneric);
    } finally { setBusyPasskey(false); }
  }

  return (
    <AuthShell
      locale={L}
      size="sm"
      kicker={T.kicker}
      title={T.title}
      subtitle={T.subtitle}
      hero={<AuthHero kicker={T.heroKicker} statement={T.heroStatement} tagline={T.heroTagline} trust={T.heroTrust} chips={T.heroChips} />}
    >
      {ctxMsg && (
        <div className="bi-mfa-context" role="note">
          <span className="dot" aria-hidden />
          <div>
            <strong>{T.ctxTitle}</strong>
            <span>{ctxMsg}</span>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {err && (
          <motion.div key="err" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: "hidden" }} role="alert">
            <Alert kind="danger">{err}</Alert>
          </motion.div>
        )}
        {ok && (
          <motion.div key="ok" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: "hidden" }} role="status">
            <Alert kind="success">{ok}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} noValidate>
        {mode === "totp" ? (
          <Field label={T.totpLabel} required>
            {(a) => (
              <Input
                {...a}
                inputMode="numeric" autoFocus pattern="[0-9]{6}" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoComplete="one-time-code"
                style={{
                  fontFamily: cssVar.fontMono,
                  fontSize: 26,
                  letterSpacing: "12px",
                  textAlign: "center",
                  paddingInlineStart: "1ch",
                }}
              />
            )}
          </Field>
        ) : (
          <Field label={T.backupLabel} required hint={T.backupHint}>
            {(a) => (
              <Input
                {...a}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={T.backupPlaceholder}
                autoComplete="off"
                spellCheck={false}
                style={{
                  fontFamily: cssVar.fontMono,
                  fontSize: 20,
                  letterSpacing: "4px",
                  textAlign: "center",
                }}
              />
            )}
          </Field>
        )}

        <label className="bi-remember-row">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>
            <strong>{T.remember}</strong>
            <em>{T.rememberHint}</em>
          </span>
        </label>

        {locked && (
          <div className="bi-mfa-locked" role="alert">
            <span className="dot" aria-hidden />
            {T.lockedBanner}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          block
          className="bi-ignite"
          loading={busyTotp}
          loadingLabel={T.verifying}
          disabled={busy || locked || (mode === "totp" ? code.length !== 6 : code.trim().length < 6)}
          style={{ height: 52, fontWeight: font.weight.bold, fontSize: font.size.md }}
        >
          {T.verifyBtn}
        </Button>

        {typeof remaining === "number" && remaining > 0 && !locked && (
          <p className="bi-mfa-remaining" aria-live="polite">{T.remainingLabel(remaining)}</p>
        )}

        <div className="bi-mfa-backup-toggle">
          <button
            type="button"
            onClick={() => { setMode(mode === "totp" ? "backup" : "totp"); setCode(""); setErr(""); }}
          >
            {mode === "totp" ? T.useBackup : T.useTotp}
          </button>
        </div>

        <div className="bi-divider" role="separator" aria-label={T.divider}>
          <span>{T.divider}</span>
        </div>

        <Field label={T.emailLabel} hint={T.emailHint}>
          {(a) => <Input {...a} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.emailPlaceholder} />}
        </Field>

        <Button
          type="button"
          block
          className="bi-oauth bi-oauth-passkey"
          onClick={usePasskey}
          loading={busyPasskey}
          loadingLabel={T.passkeyVerifying}
          disabled={busy || !email}
        >
          <KeyMark size={16} />
          <span>{T.passkeyBtn}</span>
        </Button>
      </form>
    </AuthShell>
  );
}
