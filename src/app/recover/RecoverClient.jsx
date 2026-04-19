"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const I18N = {
  es: {
    title: "Recuperar acceso",
    subtitle: "Elige la opción que mejor describa tu situación.",
    footerBack: "Volver a entrar",
    stepForgot: "No recuerdo mi método",
    stepForgotHint: "Enviaremos un enlace mágico a tu correo. No necesitas contraseña.",
    emailLabel: "Correo",
    emailPlaceholder: "tú@empresa.com",
    emailInvalid: "Ingresa un correo con formato válido.",
    sendBtn: "Enviarme un enlace",
    sending: "Enviando…",
    stepLost: "Perdí mi dispositivo con TOTP / passkey",
    stepLostHint: "Tu administrador puede reiniciar el segundo factor desde el panel de miembros, o contacta a soporte con tu correo corporativo.",
    lostBtn: "Pedir reset de MFA",
    stepBlocked: "Bloqueado por un admin",
    stepBlockedHint: "Tu administrador puede reactivar tu cuenta desde el panel de miembros.",
    blockedBtn: "Contactar soporte",
    okSent: "Enlace enviado. Revisa tu correo.",
    errGeneric: "Error",
  },
  en: {
    title: "Recover access",
    subtitle: "Pick the option that best describes your situation.",
    footerBack: "Back to sign in",
    stepForgot: "I don't remember my method",
    stepForgotHint: "We'll send a magic link to your email. No password needed.",
    emailLabel: "Email",
    emailPlaceholder: "you@company.com",
    emailInvalid: "Enter a valid email address.",
    sendBtn: "Send me a link",
    sending: "Sending…",
    stepLost: "I lost my TOTP / passkey device",
    stepLostHint: "Your admin can reset the second factor from the members panel, or contact support with your corporate email.",
    lostBtn: "Request MFA reset",
    stepBlocked: "Blocked by an admin",
    stepBlockedHint: "Your admin can reactivate your account from the members panel.",
    blockedBtn: "Contact support",
    okSent: "Link sent. Check your inbox.",
    errGeneric: "Error",
  },
};

export default function RecoverClient({ locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const emailError = emailTouched && email && !EMAIL_RE.test(email) ? T.emailInvalid : null;

  async function sendLink(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setEmailTouched(true); return; }
    setBusy(true); setMsg(""); setErr("");
    try {
      const r = await fetch("/api/auth/signin/email", { method: "POST", body: new URLSearchParams({ email }) });
      if (!r.ok) throw new Error(await r.text());
      setMsg(T.okSent);
    } catch (e) { setErr(e.message || T.errGeneric); } finally { setBusy(false); }
  }

  return (
    <AuthShell
      locale={L}
      title={T.title}
      subtitle={T.subtitle}
      footer={
        <span>
          <Link href="/signin" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>{T.footerBack}</Link>
        </span>
      }
    >
      <form onSubmit={sendLink} noValidate>
        <Step label={T.stepForgot} hint={T.stepForgotHint}>
          <Field label={T.emailLabel} required error={emailError}>
            {(a) => <Input {...a} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} placeholder={T.emailPlaceholder} />}
          </Field>
          <Button type="submit" variant="primary" block loading={busy} loadingLabel={T.sending} disabled={!email || !!emailError}>
            {T.sendBtn}
          </Button>
        </Step>
      </form>

      <hr style={divider} />

      <Step label={T.stepLost} hint={T.stepLostHint}>
        <Button href="mailto:soporte@bio-ignicion.app?subject=Reset%20MFA" variant="secondary" size="sm">{T.lostBtn}</Button>
      </Step>

      <hr style={divider} />

      <Step label={T.stepBlocked} hint={T.stepBlockedHint}>
        <Button href="mailto:soporte@bio-ignicion.app" variant="secondary" size="sm">{T.blockedBtn}</Button>
      </Step>

      {msg && <div style={{ marginTop: space[4] }} role="status"><Alert kind="success">{msg}</Alert></div>}
      {err && <div style={{ marginTop: space[4] }} role="alert"><Alert kind="danger">{err}</Alert></div>}
    </AuthShell>
  );
}

function Step({ label, hint, children }) {
  return (
    <section style={{ marginBottom: space[2] }}>
      <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text }}>{label}</h2>
      {hint && <p style={{ margin: `${space[1]}px 0 ${space[3]}px`, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: font.leading.normal }}>{hint}</p>}
      {children}
    </section>
  );
}

const divider = { border: 0, borderTop: "1px solid var(--bi-border)", margin: `${space[5]}px 0` };
