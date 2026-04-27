"use client";
/* ═══════════════════════════════════════════════════════════════
   /signin — BIO-IGNICIÓN auth entry.
   Top-tier identity discipline: one brand gesture (the ignite
   button), one type family, no decoration on the card. Social
   buttons respect Google/Microsoft/Apple brand guidelines. SMS
   and enterprise SSO live behind a single collapsed disclosure so
   nothing competes for attention with the primary moment.
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font, bioSignal } from "@/components/ui/tokens";
import { describeAuthError } from "@/lib/authErrors";
import { GoogleMark, MicrosoftMark, AppleMark, KeyMark, PhoneMark, ShieldMark } from "@/components/ui/BrandIcons";
import { CountryPicker } from "@/components/ui/CountryPicker";
import { OtpInput } from "@/components/ui/OtpInput";
import { BY_ISO, detectIso } from "@/data/countries";
import AuthHero from "@/components/brand/AuthHero";

const RESEND_COOLDOWN_MS = 30_000;
const PHONE_RESEND_COOLDOWN_MS = 30_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const I18N = {
  es: {
    kicker: "ENCIENDE · SIN CONTRASEÑA",
    title: "Enciende tu sesión.",
    subtitle: "Continúa con tu identidad.",
    heroKicker: "BIO-IGNICIÓN · NEURAL PLATFORM",
    heroStatement: "La ignición biológica de tu organización.",
    heroTagline: "Cada latido, medido. Cada decisión, informada.",
    heroTrust: "Diseñado para equipos de alto rendimiento, clínicas y atletas.",
    heroChips: ["SOC 2", "HIPAA-ready", "GDPR", "NOM-035"],
    footerFirst: "¿Primera vez?",
    footerCreate: "Crea tu organización",
    googleBtn: "Continuar con Google",
    microsoftBtn: "Continuar con Microsoft",
    appleBtn: "Continuar con Apple",
    orDivider: "O CON TU CORREO",
    emailLabel: "Correo de trabajo",
    emailPlaceholder: "tú@empresa.com",
    emailInvalid: "Ingresa un correo válido.",
    ssoBtn: (provider) => `Continuar con ${provider}`,
    ssoLoading: "Abriendo…",
    ignite: "Encender sesión",
    magicResendIn: (s) => `Reenviar en ${s}s`,
    magicSending: "Enviando…",
    passkeyBtn: "Continuar con passkey",
    passkeyVerifying: "Verificando…",
    moreOpen: "Otras formas de entrar",
    moreClose: "Ocultar otras formas",
    smsLabel: "Código por SMS",
    smsIntro: "Te enviamos un código de 6 dígitos.",
    phoneLabel: "Teléfono",
    phonePlaceholder: "614 123 4567",
    phoneSendBtn: "Enviar código",
    phoneSending: "Enviando…",
    phoneResendIn: (s) => `Reenviar en ${s}s`,
    codeLabel: "Código recibido",
    codeVerifyBtn: "Entrar",
    codeVerifying: "Verificando…",
    codeChangePhone: "Usar otro número",
    phoneDisabled: "SMS no disponible en este entorno.",
    ssoEnterpriseLabel: "SSO empresarial",
    ssoEnterpriseBtn: "Continuar con SSO corporativo",
    ssoProviders: ["Okta", "Azure AD", "Entra ID", "OneLogin"],
    recoverLink: "¿Problemas para entrar?",
    errTooMany: (s) => `Demasiados intentos. Intenta en ${s}s.`,
    errSend: "Error al enviar.",
    errGeneric: "Algo salió mal.",
    errPhoneInvalid: "Ingresa un número válido.",
    errCodeInvalid: "Código inválido.",
    errCodeExpired: "Código expirado.",
    errPasskeyNotFound: "No hay passkey registrado.",
    errPasskeyStart: "No pudimos iniciar el passkey.",
    errPasskeyVerify: "Falló la verificación.",
    errPasskeyCancel: "Cancelaste el passkey.",
    errPasskeyGeneric: "Error con passkey.",
    okMagicSent: "Enlace enviado. Revisa tu correo.",
    okPhoneSent: (p) => `Código enviado a ${p}.`,
  },
  en: {
    kicker: "IGNITE · PASSWORDLESS",
    title: "Ignite your session.",
    subtitle: "Continue with your identity.",
    heroKicker: "BIO-IGNICIÓN · NEURAL PLATFORM",
    heroStatement: "The biological ignition of your organization.",
    heroTagline: "Every heartbeat measured. Every decision informed.",
    heroTrust: "Built for high-performance teams, clinics and athletes.",
    heroChips: ["SOC 2", "HIPAA-ready", "GDPR", "NOM-035"],
    footerFirst: "First time?",
    footerCreate: "Create your organization",
    googleBtn: "Continue with Google",
    microsoftBtn: "Continue with Microsoft",
    appleBtn: "Continue with Apple",
    orDivider: "OR WITH YOUR EMAIL",
    emailLabel: "Work email",
    emailPlaceholder: "you@company.com",
    emailInvalid: "Enter a valid email.",
    ssoBtn: (provider) => `Continue with ${provider}`,
    ssoLoading: "Opening…",
    ignite: "Ignite session",
    magicResendIn: (s) => `Resend in ${s}s`,
    magicSending: "Sending…",
    passkeyBtn: "Continue with passkey",
    passkeyVerifying: "Verifying…",
    moreOpen: "Other ways to sign in",
    moreClose: "Hide other ways",
    smsLabel: "SMS code",
    smsIntro: "We'll text you a 6-digit code.",
    phoneLabel: "Phone",
    phonePlaceholder: "614 123 4567",
    phoneSendBtn: "Send code",
    phoneSending: "Sending…",
    phoneResendIn: (s) => `Resend in ${s}s`,
    codeLabel: "Code received",
    codeVerifyBtn: "Sign in",
    codeVerifying: "Verifying…",
    codeChangePhone: "Use a different number",
    phoneDisabled: "SMS not available in this environment.",
    ssoEnterpriseLabel: "Enterprise SSO",
    ssoEnterpriseBtn: "Continue with corporate SSO",
    ssoProviders: ["Okta", "Azure AD", "Entra ID", "OneLogin"],
    recoverLink: "Trouble signing in?",
    errTooMany: (s) => `Too many attempts. Try again in ${s}s.`,
    errSend: "Send failed.",
    errGeneric: "Something went wrong.",
    errPhoneInvalid: "Enter a valid phone.",
    errCodeInvalid: "Invalid code.",
    errCodeExpired: "Code expired.",
    errPasskeyNotFound: "No passkey registered.",
    errPasskeyStart: "Couldn't start the passkey.",
    errPasskeyVerify: "Verification failed.",
    errPasskeyCancel: "Passkey cancelled.",
    errPasskeyGeneric: "Passkey error.",
    okMagicSent: "Link sent. Check your inbox.",
    okPhoneSent: (p) => `Code sent to ${p}.`,
  },
};

/* SignInHero — thin wrapper over the shared AuthHero. */
function SignInHero({ T }) {
  return (
    <AuthHero
      kicker={T.heroKicker}
      statement={T.heroStatement}
      tagline={T.heroTagline}
      trust={T.heroTrust}
      chips={T.heroChips}
    />
  );
}

export default function SignInClient({ locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const searchParams = useSearchParams();
  const callbackError = describeAuthError(searchParams?.get("error"));
  const callbackUrl = searchParams?.get("callbackUrl") || "/app";

  const [providers, setProviders] = useState({ google: true, microsoft: true, apple: false, okta: true, email: true, phone: false });
  const [moreOpen, setMoreOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [sso, setSso] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const [iso, setIso] = useState(detectIso());
  const [phone, setPhone] = useState("");
  const [phoneStage, setPhoneStage] = useState("enter");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [code, setCode] = useState("");

  const conditionalAbortRef = useRef(null);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem("bio-magic-cooldown") || 0);
      const left = until - Date.now();
      if (left > 0) setCooldownLeft(Math.ceil(left / 1000));
    } catch {}
    fetch("/api/auth/providers-available", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : {})
      .then((j) => setProviders((p) => ({ ...p, ...j })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const iv = setInterval(() => setCooldownLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(iv);
  }, [cooldownLeft]);

  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const iv = setInterval(() => setPhoneCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(iv);
  }, [phoneCooldown]);

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

  // WebAuthn conditional UI — silent. If the platform offers a discoverable
  // credential, the browser autofills it when the email input is focused.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === "undefined") return;
        if (!window.PublicKeyCredential?.isConditionalMediationAvailable) return;
        const ok = await window.PublicKeyCredential.isConditionalMediationAvailable();
        if (!ok || cancelled) return;
        const optsR = await fetch("/api/webauthn/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!optsR.ok || cancelled) return;
        const optionsJSON = await optsR.json();
        const ac = new AbortController();
        conditionalAbortRef.current = ac;
        const { startAuthentication } = await import("@simplewebauthn/browser");
        const assertion = await startAuthentication({ optionsJSON, useBrowserAutofill: true, signal: ac.signal });
        if (cancelled) return;
        setPasskeyBusy(true);
        const verifyR = await fetch("/api/webauthn/auth", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assertion),
        });
        if (!verifyR.ok) return;
        try { localStorage.setItem("bio-last-signin", "passkey"); } catch {}
        const j = await verifyR.json().catch(() => ({}));
        location.href = j?.redirect || callbackUrl;
      } catch { /* silent */ }
      finally { if (!cancelled) setPasskeyBusy(false); }
    })();
    return () => { cancelled = true; conditionalAbortRef.current?.abort(); };
  }, [callbackUrl]);

  function startIdp(provider, url) {
    setSsoLoading(provider);
    setErr("");
    try { localStorage.setItem("bio-last-signin", provider); } catch {}
    location.href = url;
  }

  async function onEmailSubmit(e) {
    e.preventDefault();
    if (cooldownLeft > 0) return;
    if (!EMAIL_RE.test(email)) { setEmailTouched(true); return; }
    setSubmitting(true); setErr(""); setOk("");
    try {
      const csrfR = await fetch("/api/auth/csrf", { cache: "no-store" });
      const { csrfToken } = await csrfR.json();
      const r = await fetch("/api/auth/signin/email", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, csrfToken, callbackUrl }),
      });
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
    } catch (e) { setErr(e.message || T.errGeneric); }
    finally { setSubmitting(false); }
  }

  async function usePasskey() {
    conditionalAbortRef.current?.abort();
    setPasskeyBusy(true); setErr(""); setOk("");
    try {
      const optsR = await fetch("/api/webauthn/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      if (optsR.status === 404) throw new Error(T.errPasskeyNotFound);
      if (!optsR.ok) throw new Error(T.errPasskeyStart);
      const optionsJSON = await optsR.json();
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const assertion = await startAuthentication({ optionsJSON });
      const verifyR = await fetch("/api/webauthn/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!verifyR.ok) throw new Error((await verifyR.text()) || T.errPasskeyVerify);
      try { localStorage.setItem("bio-last-signin", "passkey"); } catch {}
      const j = await verifyR.json().catch(() => ({}));
      location.href = j?.redirect || callbackUrl;
    } catch (e) {
      const msg = e?.name === "NotAllowedError" ? T.errPasskeyCancel : (e.message || T.errPasskeyGeneric);
      setErr(msg);
    } finally { setPasskeyBusy(false); }
  }

  function e164() {
    const dial = BY_ISO[iso]?.dial || "52";
    const digits = phone.replace(/\D/g, "");
    return { pretty: `+${dial} ${phone}`, raw: `+${dial}${digits}`, digits };
  }

  async function onPhoneSend(e) {
    e?.preventDefault?.();
    if (phoneCooldown > 0) return;
    const { raw, pretty, digits } = e164();
    if (digits.length < 7) { setErr(T.errPhoneInvalid); return; }
    setErr(""); setOk(""); setPhoneSending(true);
    try {
      const r = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: raw, locale: L }),
      });
      if (r.status === 429) {
        const retry = Number(r.headers.get("Retry-After") || 60);
        throw new Error(T.errTooMany(retry));
      }
      if (r.status === 503) throw new Error(T.phoneDisabled);
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j?.error === "phone_invalid") throw new Error(T.errPhoneInvalid);
        throw new Error(T.errSend);
      }
      setOk(T.okPhoneSent(pretty));
      setPhoneStage("verify");
      setCode("");
      setPhoneCooldown(Math.ceil(PHONE_RESEND_COOLDOWN_MS / 1000));
    } catch (e) { setErr(e.message || T.errGeneric); }
    finally { setPhoneSending(false); }
  }

  async function onPhoneVerify(e) {
    e?.preventDefault?.();
    const { raw } = e164();
    const c = code.replace(/\D/g, "");
    if (c.length !== 6) { setErr(T.errCodeInvalid); return; }
    setErr(""); setOk(""); setPhoneVerifying(true);
    try {
      const r = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: raw, code: c }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j?.error === "code_expired") throw new Error(T.errCodeExpired);
        if (j?.error === "attempts_exceeded") throw new Error(T.errTooMany(60));
        throw new Error(T.errCodeInvalid);
      }
      try { localStorage.setItem("bio-last-signin", "phone"); } catch {}
      const j = await r.json();
      location.href = j?.redirect || callbackUrl;
    } catch (e) { setErr(e.message || T.errGeneric); }
    finally { setPhoneVerifying(false); }
  }

  const emailError = emailTouched && email && !EMAIL_RE.test(email) ? T.emailInvalid : null;
  const anyBusy = submitting || passkeyBusy || ssoLoading !== null || phoneSending || phoneVerifying;
  const canSubmit = !anyBusy && !!email && !emailError && cooldownLeft === 0;

  return (
    <AuthShell
      locale={L}
      kicker={T.kicker}
      title={T.title}
      subtitle={T.subtitle}
      size="md"
      hero={<SignInHero T={T} />}
      footer={
        <span>
          {T.footerFirst}{" "}
          <Link href="/signup" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>
            {T.footerCreate}
          </Link>
        </span>
      }
    >
      {/* Inline messages — top of form. Animated in/out. */}
      <AnimatePresence initial={false}>
        {callbackError && (
          <motion.div key="cb" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: "hidden" }} role="alert">
            <Alert kind="danger">{callbackError}</Alert>
          </motion.div>
        )}
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

      {/* Social row — Google / Microsoft / Apple, each on-brand. */}
      <div style={{ display: "grid", gap: space[2] }}>
        {providers.google && (
          <Button
            type="button" block
            className="bi-oauth bi-oauth-google"
            onClick={() => startIdp("google", `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            disabled={anyBusy}
            loading={ssoLoading === "google"}
            loadingLabel={T.ssoLoading}
          >
            <GoogleMark size={18} />
            <span>{T.googleBtn}</span>
          </Button>
        )}
        {providers.microsoft && (
          <Button
            type="button" block
            className="bi-oauth bi-oauth-microsoft"
            onClick={() => startIdp("azure-ad", `/api/auth/signin/azure-ad?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            disabled={anyBusy}
            loading={ssoLoading === "azure-ad"}
            loadingLabel={T.ssoLoading}
          >
            <MicrosoftMark size={18} />
            <span>{T.microsoftBtn}</span>
          </Button>
        )}
        {providers.apple && (
          <Button
            type="button" block
            className="bi-oauth bi-oauth-apple"
            onClick={() => startIdp("apple", `/api/auth/signin/apple?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            disabled={anyBusy}
            loading={ssoLoading === "apple"}
            loadingLabel={T.ssoLoading}
          >
            <AppleMark size={18} color="#FFFFFF" />
            <span>{T.appleBtn}</span>
          </Button>
        )}
        {/* Passkey — always visible alongside the branded identity providers.
            It's another passwordless path, so it belongs in this row, not as
            an afterthought link. Phosphor-tinged border signals it's ours. */}
        <Button
          type="button" block
          className="bi-oauth bi-oauth-passkey"
          onClick={usePasskey}
          loading={passkeyBusy}
          loadingLabel={T.passkeyVerifying}
          disabled={anyBusy && !passkeyBusy}
        >
          <KeyMark size={16} />
          <span>{T.passkeyBtn}</span>
        </Button>
      </div>

      {/* Divider — quiet mono caps. */}
      <div style={{
        display: "flex", alignItems: "center", gap: space[3],
        margin: `${space[5]}px 0 ${space[4]}px`,
        color: cssVar.textMuted, fontSize: font.size.xs, letterSpacing: "0.18em",
        fontFamily: cssVar.fontMono,
      }}>
        <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${cssVar.border}` }} />
        <span>{T.orDivider}</span>
        <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${cssVar.border}` }} />
      </div>

      {/* Email + ignite — the one brand moment. */}
      <form onSubmit={onEmailSubmit} noValidate>
        <Field label={T.emailLabel} required error={emailError}>
          {(a) => (
            <Input
              {...a}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder={T.emailPlaceholder}
              autoComplete="username webauthn"
              autoFocus
            />
          )}
        </Field>

        {sso && (
          <Button
            type="button" block
            onClick={() => startIdp("sso", `/api/auth/signin/${sso.provider}?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            loading={ssoLoading === "sso"}
            loadingLabel={T.ssoLoading}
            disabled={anyBusy && ssoLoading !== "sso"}
            style={{ marginTop: space[3], height: 48 }}
          >
            {T.ssoBtn(sso.provider.toUpperCase())}
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          block
          className="bi-ignite"
          loading={submitting}
          loadingLabel={T.magicSending}
          disabled={!canSubmit}
          style={{ marginTop: space[3], height: 52, fontWeight: font.weight.bold, fontSize: font.size.md }}
        >
          {cooldownLeft > 0 ? T.magicResendIn(cooldownLeft) : T.ignite}
        </Button>

      </form>

      {/* Single "more options" disclosure — SMS + enterprise SSO live here
          so they never compete with the primary moment. */}
      {(providers.phone || providers.okta) && (
        <div style={{ marginTop: space[5], paddingTop: space[4], borderTop: `1px solid ${cssVar.border}` }}>
          <button
            type="button"
            onClick={() => { setMoreOpen((v) => !v); setErr(""); setOk(""); }}
            aria-expanded={moreOpen}
            aria-controls="more-panel"
            className="bi-disclosure-btn"
            style={{
              width: "100%",
              display: "inline-flex", alignItems: "center", justifyContent: "space-between",
              background: "transparent",
              border: 0,
              padding: `${space[1]}px 0`,
              color: cssVar.textDim,
              fontSize: font.size.sm,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <span>{moreOpen ? T.moreClose : T.moreOpen}</span>
            <span className="bi-disclosure-sigil" aria-hidden>+</span>
          </button>

          <AnimatePresence initial={false}>
            {moreOpen && (
              <motion.div
                key="more"
                id="more-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ paddingBlockStart: space[5], display: "grid", gap: space[6] }}>
                  {providers.phone && (
                    <div>
                      <div className="bi-section-mark" style={{ marginBlockEnd: space[3] }}>
                        <PhoneMark size={14} />
                        <span>{T.smsLabel}</span>
                      </div>
                      {phoneStage === "enter" && (
                        <form onSubmit={onPhoneSend} noValidate>
                          <Field label={T.phoneLabel} required>
                            {(a) => (
                              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: space[2] }}>
                                <CountryPicker value={iso} onChange={setIso} locale={L} />
                                <Input
                                  {...a}
                                  type="tel"
                                  inputMode="tel"
                                  autoComplete="tel-national"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder={T.phonePlaceholder}
                                />
                              </div>
                            )}
                          </Field>
                          <Button
                            type="submit" variant="secondary" block
                            className="bi-refined"
                            loading={phoneSending}
                            loadingLabel={T.phoneSending}
                            disabled={anyBusy || !phone || phoneCooldown > 0}
                            style={{ marginTop: space[3] }}
                          >
                            {phoneCooldown > 0 ? T.phoneResendIn(phoneCooldown) : T.phoneSendBtn}
                          </Button>
                        </form>
                      )}
                      {phoneStage === "verify" && (
                        <form onSubmit={onPhoneVerify} noValidate>
                          <p style={{ margin: 0, color: cssVar.textDim, fontSize: font.size.sm, lineHeight: 1.5 }}>
                            {T.okPhoneSent(e164().pretty)}
                          </p>
                          <div style={{ marginTop: space[4] }}>
                            <Field label={T.codeLabel} required>
                              {() => <OtpInput value={code} onChange={setCode} />}
                            </Field>
                          </div>
                          <Button
                            type="submit" variant="primary" block
                            loading={phoneVerifying}
                            loadingLabel={T.codeVerifying}
                            disabled={anyBusy || code.length !== 6}
                            style={{ marginTop: space[4], height: 48 }}
                          >
                            {T.codeVerifyBtn}
                          </Button>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: space[3], fontSize: font.size.sm }}>
                            <button
                              type="button"
                              onClick={() => { setPhoneStage("enter"); setCode(""); setErr(""); setOk(""); }}
                              className="bi-auth-link"
                              style={{ background: "none", border: 0, padding: 0, color: cssVar.textDim, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
                            >
                              ← {T.codeChangePhone}
                            </button>
                            <button
                              type="button"
                              onClick={() => onPhoneSend()}
                              disabled={phoneCooldown > 0 || phoneSending}
                              className="bi-auth-link"
                              style={{
                                background: "none", border: 0, padding: 0,
                                color: phoneCooldown > 0 ? cssVar.textMuted : cssVar.accent,
                                cursor: phoneCooldown > 0 ? "default" : "pointer",
                                fontFamily: "inherit", fontSize: "inherit",
                              }}
                            >
                              {phoneCooldown > 0 ? T.phoneResendIn(phoneCooldown) : T.phoneSendBtn}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {providers.okta && (
                    <div>
                      <div className="bi-section-mark" style={{ marginBlockEnd: space[3] }}>
                        <ShieldMark size={14} />
                        <span>{T.ssoEnterpriseLabel}</span>
                      </div>
                      <Button
                        type="button" variant="secondary" block
                        className="bi-refined"
                        onClick={() => startIdp("okta", `/api/auth/signin/okta?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
                        disabled={anyBusy}
                        loading={ssoLoading === "okta"}
                        loadingLabel={T.ssoLoading}
                      >
                        <ShieldMark size={16} />
                        <span>{T.ssoEnterpriseBtn}</span>
                      </Button>
                      <div className="bi-sso-chips" aria-label="Supported enterprise identity providers">
                        {T.ssoProviders.map((p) => (
                          <span key={p} className="bi-sso-chip">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Recover link — always reachable, regardless of whether SMS/SSO
          are configured and independent of disclosure state. */}
      <p style={{ margin: `${space[5]}px 0 0`, textAlign: "center" }}>
        <Link href="/recover" className="bi-auth-link" style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
          {T.recoverLink}
        </Link>
      </p>
    </AuthShell>
  );
}
