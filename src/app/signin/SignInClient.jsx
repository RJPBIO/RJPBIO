"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { describeAuthError } from "@/lib/authErrors";

const RESEND_COOLDOWN_MS = 30_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const I18N = {
  es: {
    title: "Entrar a BIO-IGNICIÓN",
    subtitle: "Te enviaremos un enlace mágico, usa tu passkey o SSO corporativo.",
    footerFirst: "¿Primera vez?",
    footerCreate: "Crea tu organización",
    emailLabel: "Correo de trabajo",
    emailPlaceholder: "tú@empresa.com",
    emailInvalid: "Ingresa un correo con formato válido.",
    ssoBtn: (provider) => `Continuar con SSO (${provider})`,
    ssoLoading: "Abriendo SSO…",
    magicBtn: "Enviar enlace mágico",
    magicResendIn: (s) => `Reenviar en ${s}s`,
    magicSending: "Enviando…",
    passkeyBtn: "Usar passkey",
    passkeyVerifying: "Verificando passkey…",
    lastBadge: "Último",
    idpDivider: "O CON TU IDP",
    idpLoading: "…",
    recoverLink: "¿Problemas para entrar?",
    errTooMany: (s) => `Demasiados intentos. Intenta en ${s}s.`,
    errSend: "Error al enviar",
    errGeneric: "Error",
    errNoEmail: "Ingresa tu correo primero",
    errPasskeyNotFound: "No hay passkey registrado para este correo. Usa el enlace mágico.",
    errPasskeyStart: "No pudimos iniciar el passkey. Intenta de nuevo.",
    errPasskeyVerify: "Falló la verificación",
    errPasskeyCancel: "Cancelaste el passkey o no está disponible.",
    errPasskeyGeneric: "Error con passkey",
    okMagicSent: "Enlace enviado. Revisa tu correo.",
  },
  en: {
    title: "Sign in to BIO-IGNITION",
    subtitle: "We'll send a magic link, use your passkey, or corporate SSO.",
    footerFirst: "First time?",
    footerCreate: "Create your organization",
    emailLabel: "Work email",
    emailPlaceholder: "you@company.com",
    emailInvalid: "Enter a valid email address.",
    ssoBtn: (provider) => `Continue with SSO (${provider})`,
    ssoLoading: "Opening SSO…",
    magicBtn: "Send magic link",
    magicResendIn: (s) => `Resend in ${s}s`,
    magicSending: "Sending…",
    passkeyBtn: "Use passkey",
    passkeyVerifying: "Verifying passkey…",
    lastBadge: "Last used",
    idpDivider: "OR WITH YOUR IDP",
    idpLoading: "…",
    recoverLink: "Having trouble signing in?",
    errTooMany: (s) => `Too many attempts. Try again in ${s}s.`,
    errSend: "Failed to send",
    errGeneric: "Error",
    errNoEmail: "Enter your email first",
    errPasskeyNotFound: "No passkey registered for this email. Use the magic link.",
    errPasskeyStart: "We couldn't start the passkey. Try again.",
    errPasskeyVerify: "Verification failed",
    errPasskeyCancel: "You cancelled the passkey or it isn't available.",
    errPasskeyGeneric: "Passkey error",
    okMagicSent: "Link sent. Check your inbox.",
  },
};

export default function SignInClient({ locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const searchParams = useSearchParams();
  const callbackError = describeAuthError(searchParams?.get("error"));
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [sso, setSso] = useState(null);
  const [lastMethod, setLastMethod] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    try {
      const v = localStorage.getItem("bio-last-signin");
      if (v) setLastMethod(v);
      const until = Number(localStorage.getItem("bio-magic-cooldown") || 0);
      const left = until - Date.now();
      if (left > 0) setCooldownLeft(Math.ceil(left / 1000));
    } catch {}
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const iv = setInterval(() => {
      setCooldownLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [cooldownLeft]);

  const probeSso = useCallback(async (value) => {
    const at = value.indexOf("@");
    if (at < 0 || at === value.length - 1) { setSso(null); return; }
    const domain = value.slice(at + 1).toLowerCase().trim();
    if (!domain.includes(".")) { setSso(null); return; }
    try {
      const r = await fetch(`/api/auth/sso-discover?domain=${encodeURIComponent(domain)}`);
      if (!r.ok) { setSso(null); return; }
      const j = await r.json();
      if (j?.provider) setSso({ provider: j.provider, domain });
      else setSso(null);
    } catch { setSso(null); }
  }, []);

  useEffect(() => {
    if (!email) { setSso(null); return; }
    const t = setTimeout(() => probeSso(email), 400);
    return () => clearTimeout(t);
  }, [email, probeSso]);

  async function onSubmit(e) {
    e.preventDefault();
    if (cooldownLeft > 0) return;
    if (!EMAIL_RE.test(email)) { setEmailTouched(true); return; }
    setSubmitting(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/auth/signin/email", { method: "POST", body: new URLSearchParams({ email, callbackUrl }) });
      if (r.status === 429) {
        const retry = Number(r.headers.get("Retry-After") || 60);
        throw new Error(T.errTooMany(retry));
      }
      if (!r.ok) throw new Error((await r.text()) || T.errSend);
      try {
        localStorage.setItem("bio-last-signin", "magic-link");
        localStorage.setItem("bio-magic-cooldown", String(Date.now() + RESEND_COOLDOWN_MS));
      } catch {}
      setCooldownLeft(Math.ceil(RESEND_COOLDOWN_MS / 1000));
      setOk(T.okMagicSent);
      setTimeout(() => { location.href = "/verify?email=" + encodeURIComponent(email); }, 500);
    } catch (e) { setErr(e.message || T.errGeneric); } finally { setSubmitting(false); }
  }

  async function usePasskey() {
    setPasskeyBusy(true); setErr(""); setOk("");
    try {
      if (!email) throw new Error(T.errNoEmail);
      const optsR = await fetch("/api/webauthn/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (optsR.status === 404) throw new Error(T.errPasskeyNotFound);
      if (!optsR.ok) throw new Error(T.errPasskeyStart);
      const opts = await optsR.json();
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const assertion = await startAuthentication({ optionsJSON: opts });
      const verifyR = await fetch("/api/webauthn/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!verifyR.ok) throw new Error((await verifyR.text()) || T.errPasskeyVerify);
      try { localStorage.setItem("bio-last-signin", "passkey"); } catch {}
      location.href = callbackUrl;
    } catch (e) {
      const msg = e?.name === "NotAllowedError" ? T.errPasskeyCancel : (e.message || T.errPasskeyGeneric);
      setErr(msg);
    } finally { setPasskeyBusy(false); }
  }

  function startIdp(provider, url) {
    setSsoLoading(provider);
    setErr("");
    try { localStorage.setItem("bio-last-signin", provider); } catch {}
    location.href = url;
  }

  const emailError = emailTouched && email && !EMAIL_RE.test(email) ? T.emailInvalid : null;
  const anyBusy = submitting || passkeyBusy || ssoLoading !== null;
  const canSubmit = !anyBusy && !!email && !emailError && cooldownLeft === 0;

  return (
    <AuthShell
      locale={L}
      title={T.title}
      subtitle={T.subtitle}
      footer={
        <span>
          {T.footerFirst} <Link href="/signup" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>{T.footerCreate}</Link>
        </span>
      }
    >
      {callbackError && (
        <div style={{ marginBottom: space[4] }} role="alert">
          <Alert kind="danger">{callbackError}</Alert>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <Field label={T.emailLabel} required error={emailError}>
          {(a) => (
            <Input
              {...a}
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder={T.emailPlaceholder}
              autoComplete="email" autoFocus
            />
          )}
        </Field>

        {sso && (
          <Button
            type="button"
            variant="primary" block
            onClick={() => startIdp("sso", `/api/auth/signin/${sso.provider}?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            loading={ssoLoading === "sso"}
            loadingLabel={T.ssoLoading}
            disabled={anyBusy && ssoLoading !== "sso"}
            style={{ marginTop: space[2] }}
          >
            {T.ssoBtn(sso.provider.toUpperCase())}
          </Button>
        )}

        <Button
          type="submit" variant="primary" block
          loading={submitting}
          loadingLabel={T.magicSending}
          disabled={!canSubmit}
          style={{ marginTop: space[3] }}
        >
          {cooldownLeft > 0 ? T.magicResendIn(cooldownLeft) : T.magicBtn}
          {lastMethod === "magic-link" && cooldownLeft === 0 && !submitting && (
            <Badge variant="soft" size="sm" style={{ marginInlineStart: space[2] }}>{T.lastBadge}</Badge>
          )}
        </Button>

        <Button
          type="button" variant="secondary" block
          onClick={usePasskey}
          loading={passkeyBusy}
          loadingLabel={T.passkeyVerifying}
          disabled={(anyBusy && !passkeyBusy) || !email}
          style={{ marginTop: space[2] }}
        >
          <span aria-hidden>🔑</span> {T.passkeyBtn}
          {lastMethod === "passkey" && <Badge variant="soft" size="sm" style={{ marginInlineStart: space[2] }}>{T.lastBadge}</Badge>}
        </Button>

        {err && <div style={{ marginTop: space[4] }} role="alert"><Alert kind="danger">{err}</Alert></div>}
        {ok  && <div style={{ marginTop: space[4] }} role="status"><Alert kind="success">{ok}</Alert></div>}

        <div style={{
          display: "flex", alignItems: "center", gap: space[3],
          margin: `${space[5]}px 0 ${space[3]}px`,
          color: cssVar.textMuted, fontSize: font.size.xs, letterSpacing: font.tracking.widest,
        }}>
          <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${cssVar.border}` }} />
          <span>{T.idpDivider}</span>
          <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${cssVar.border}` }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: space[2] }}>
          <Button
            type="button" variant="secondary" size="sm"
            onClick={() => startIdp("okta", `/api/auth/signin/okta?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            disabled={ssoLoading !== null}
          >
            {ssoLoading === "okta" ? T.idpLoading : "Okta"}
          </Button>
          <Button
            type="button" variant="secondary" size="sm"
            onClick={() => startIdp("azure-ad", `/api/auth/signin/azure-ad?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            disabled={ssoLoading !== null}
          >
            {ssoLoading === "azure-ad" ? T.idpLoading : "Azure AD"}
          </Button>
          <Button
            type="button" variant="secondary" size="sm"
            onClick={() => startIdp("google", `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            disabled={ssoLoading !== null}
          >
            {ssoLoading === "google" ? T.idpLoading : "Google"}
          </Button>
        </div>

        <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[5], textAlign: "center" }}>
          <Link href="/recover" className="bi-auth-link" style={{ color: cssVar.textDim }}>{T.recoverLink}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
