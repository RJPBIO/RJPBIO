"use client";
import { useState, useEffect } from "react";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, space, font } from "@/components/ui/tokens";

const I18N = {
  es: {
    title: "Verificación en dos pasos",
    subtitle: "Ingresa el código TOTP de 6 dígitos o usa tu passkey.",
    totpLabel: "Código TOTP",
    verifyBtn: "Verificar",
    verifying: "Verificando…",
    divider: "O BIEN",
    emailLabel: "Correo",
    emailHint: "Necesario para ubicar tu passkey",
    emailPlaceholder: "tú@empresa.com",
    passkeyBtn: "Usar passkey",
    passkeyVerifying: "Verificando passkey…",
    errInvalidCode: "Código inválido",
    errNoEmail: "Falta tu correo para ubicar la passkey.",
    errPasskeyNotFound: "No hay passkey registrada para este correo.",
    errPasskeyVerify: "Falló la verificación",
    errPasskeyGeneric: "Error con passkey",
    okTotp: "Verificado. Redirigiendo…",
    okPasskey: "Passkey verificada. Redirigiendo…",
  },
  en: {
    title: "Two-factor verification",
    subtitle: "Enter your 6-digit TOTP code or use your passkey.",
    totpLabel: "TOTP code",
    verifyBtn: "Verify",
    verifying: "Verifying…",
    divider: "OR",
    emailLabel: "Email",
    emailHint: "Needed to locate your passkey",
    emailPlaceholder: "you@company.com",
    passkeyBtn: "Use passkey",
    passkeyVerifying: "Verifying passkey…",
    errInvalidCode: "Invalid code",
    errNoEmail: "Missing your email to locate the passkey.",
    errPasskeyNotFound: "No passkey registered for this email.",
    errPasskeyVerify: "Verification failed",
    errPasskeyGeneric: "Passkey error",
    okTotp: "Verified. Redirecting…",
    okPasskey: "Passkey verified. Redirecting…",
  },
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
  const busy = busyTotp || busyPasskey;

  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search);
      const e = q.get("email");
      if (e) setEmail(e);
    } catch {}
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setBusyTotp(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!r.ok) throw new Error((await r.text()) || T.errInvalidCode);
      setOk(T.okTotp);
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
      title={T.title}
      subtitle={T.subtitle}
    >
      <form onSubmit={onSubmit} noValidate>
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

        <Button
          type="submit"
          variant="primary"
          block
          loading={busyTotp}
          loadingLabel={T.verifying}
          disabled={busy || code.length !== 6}
        >
          {T.verifyBtn}
        </Button>

        {err && <div style={{ marginTop: space[4] }}><Alert kind="danger">{err}</Alert></div>}
        {ok  && <div style={{ marginTop: space[4] }}><Alert kind="success">{ok}</Alert></div>}

        <div style={{
          display: "flex", alignItems: "center", gap: space[3],
          margin: `${space[5]}px 0 ${space[3]}px`,
          color: cssVar.textMuted, fontSize: font.size.xs, letterSpacing: font.tracking.widest,
        }}>
          <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${cssVar.border}` }} />
          <span>{T.divider}</span>
          <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${cssVar.border}` }} />
        </div>

        <Field label={T.emailLabel} hint={T.emailHint}>
          {(a) => <Input {...a} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.emailPlaceholder} />}
        </Field>

        <Button
          type="button"
          variant="secondary"
          block
          onClick={usePasskey}
          loading={busyPasskey}
          loadingLabel={T.passkeyVerifying}
          disabled={busy || !email}
        >
          <span aria-hidden>🔑</span> {T.passkeyBtn}
        </Button>
      </form>
    </AuthShell>
  );
}
