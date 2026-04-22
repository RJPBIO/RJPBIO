"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, space, font } from "@/components/ui/tokens";
import { MailMark, KeyMark, ShieldMark } from "@/components/ui/BrandIcons";
import AuthHero from "@/components/brand/AuthHero";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROVIDER_MAP = [
  { match: /@gmail\.com$|@googlemail\.com$/i, label: "Gmail", href: "https://mail.google.com/" },
  { match: /@(outlook|hotmail|live|msn)\./i,  label: "Outlook", href: "https://outlook.live.com/mail/" },
  { match: /@yahoo\./i,                        label: "Yahoo",  href: "https://mail.yahoo.com/" },
  { match: /@icloud\.com$|@me\.com$|@mac\.com$/i, label: "iCloud", href: "https://www.icloud.com/mail" },
];

function detectProviders(email) {
  if (!email) return [];
  const [, domain] = email.split("@");
  if (!domain) return [];
  const matched = PROVIDER_MAP.find((p) => p.match.test(email));
  if (matched) return [matched];
  return [
    { label: "Gmail",   href: "https://mail.google.com/" },
    { label: "Outlook", href: "https://outlook.office.com/mail/" },
  ];
}

const I18N = {
  es: {
    kicker: "RECUPERAR · ACCESO",
    title: "Volvamos a encender.",
    subtitle: "Elige la opción que mejor describa tu situación.",
    heroKicker: "BIO-IGNICIÓN · RECUPERACIÓN AUDITADA",
    heroStatement: "Sin contraseñas que robar.",
    heroTagline: "Solo enlaces de un uso y aprobaciones de admin registradas en el audit log.",
    heroTrust: "Cada solicitud queda con hash-chain verificable · nunca pedimos tu contraseña.",
    heroChips: ["SOC 2", "HIPAA-ready", "Audit log", "Zero telemetry"],
    footerBack: "Volver a entrar",
    stepForgot: "No recuerdo mi método",
    stepForgotHint: "Enviaremos un enlace mágico a tu correo. No necesitas contraseña.",
    emailLabel: "Correo",
    emailPlaceholder: "tú@empresa.com",
    emailInvalid: "Ingresa un correo con formato válido.",
    sendBtn: "Enviarme un enlace",
    sending: "Enviando…",
    stepLost: "Perdí mi dispositivo TOTP o passkey",
    stepLostHint: "Envía una solicitud auditada. Tu administrador la aprueba desde el panel de miembros y recibes un correo al completarse.",
    lostEmailLabel: "Correo corporativo",
    lostReasonLabel: "Contexto (opcional)",
    lostReasonPlaceholder: "Ej: cambio de teléfono, robo, etc.",
    lostBtn: "Enviar solicitud de reset",
    lostBtnSending: "Enviando…",
    lostOk: "Solicitud registrada. Tu administrador la verá en su bandeja y recibirás un correo al aprobarse.",
    lostExisting: "Ya tienes una solicitud pendiente — te avisaremos por correo al aprobarse.",
    lostRateLimited: "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
    lostInvalidEmail: "Ingresa un correo válido.",
    lostErrGeneric: "No pudimos registrar la solicitud. Intenta de nuevo.",
    lostAudited: "Toda solicitud queda registrada en el audit log con hash verificable.",
    stepBlocked: "Bloqueado por un admin",
    stepBlockedHint: "Tu administrador puede reactivar tu cuenta desde el panel de miembros.",
    blockedBtn: "Contactar soporte",
    okSent: "Enlace enviado. Revisa tu correo.",
    errGeneric: "Error",
    spam: "¿No llegó? Revisa la carpeta de spam o promociones.",
    providerLabel: "Abrir tu correo",
    openIn: "Abrir {p}",
    trustKicker: "ESTA PÁGINA · GARANTÍAS",
    trustItems: [
      "Nunca pedimos tu contraseña — solo enlaces de un solo uso.",
      "Tus datos no salen a terceros en el flujo de recuperación.",
      "Cada solicitud queda en el audit log con hash-chain.",
      "Tu administrador aprueba resets de MFA · nosotros no.",
    ],
  },
  en: {
    kicker: "RECOVER · ACCESS",
    title: "Let's re-ignite.",
    subtitle: "Pick the option that best describes your situation.",
    heroKicker: "BIO-IGNICIÓN · AUDITED RECOVERY",
    heroStatement: "No passwords to steal.",
    heroTagline: "Only one-time links and admin-approved resets recorded in the audit log.",
    heroTrust: "Every request signed with a verifiable hash chain · we never ask for your password.",
    heroChips: ["SOC 2", "HIPAA-ready", "Audit log", "Zero telemetry"],
    footerBack: "Back to sign in",
    stepForgot: "I don't remember my method",
    stepForgotHint: "We'll send a magic link to your email. No password needed.",
    emailLabel: "Email",
    emailPlaceholder: "you@company.com",
    emailInvalid: "Enter a valid email address.",
    sendBtn: "Send me a link",
    sending: "Sending…",
    stepLost: "I lost my TOTP / passkey device",
    stepLostHint: "Send an audited request. Your admin approves it from the members panel and you'll get an email once it's done.",
    lostEmailLabel: "Work email",
    lostReasonLabel: "Context (optional)",
    lostReasonPlaceholder: "E.g., phone replacement, theft, etc.",
    lostBtn: "Send reset request",
    lostBtnSending: "Sending…",
    lostOk: "Request logged. Your admin will see it in their queue and you'll get an email once approved.",
    lostExisting: "You already have a pending request — we'll email you once it's approved.",
    lostRateLimited: "Too many attempts. Try again in a few minutes.",
    lostInvalidEmail: "Enter a valid email.",
    lostErrGeneric: "Could not log the request. Please try again.",
    lostAudited: "Every request is recorded in the audit log with verifiable hash chain.",
    stepBlocked: "Blocked by an admin",
    stepBlockedHint: "Your admin can reactivate your account from the members panel.",
    blockedBtn: "Contact support",
    okSent: "Link sent. Check your inbox.",
    errGeneric: "Error",
    spam: "Didn't arrive? Check spam or promotions.",
    providerLabel: "Open your mail",
    openIn: "Open {p}",
    trustKicker: "THIS PAGE · GUARANTEES",
    trustItems: [
      "We never ask for your password — only one-time links.",
      "Your data never leaves us during recovery.",
      "Every request lands in the audit log with hash chain.",
      "Your admin approves MFA resets · we don't.",
    ],
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

  const [lostEmail, setLostEmail] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [lostTouched, setLostTouched] = useState(false);
  const [lostBusy, setLostBusy] = useState(false);
  const [lostMsg, setLostMsg] = useState("");
  const [lostErr, setLostErr] = useState("");

  const emailError = emailTouched && email && !EMAIL_RE.test(email) ? T.emailInvalid : null;
  const lostEmailError = lostTouched && lostEmail && !EMAIL_RE.test(lostEmail) ? T.lostInvalidEmail : null;
  const providers = useMemo(() => detectProviders(email), [email]);

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

  async function requestMfaReset(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(lostEmail)) { setLostTouched(true); return; }
    setLostBusy(true); setLostMsg(""); setLostErr("");
    try {
      const r = await fetch("/api/v1/mfa-reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lostEmail, reason: lostReason }),
      });
      if (r.status === 429) { setLostErr(T.lostRateLimited); return; }
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json().catch(() => ({}));
      setLostMsg(j?.already ? T.lostExisting : T.lostOk);
    } catch (e) {
      setLostErr(T.lostErrGeneric);
    } finally {
      setLostBusy(false);
    }
  }

  return (
    <AuthShell
      locale={L}
      kicker={T.kicker}
      title={T.title}
      subtitle={T.subtitle}
      hero={<AuthHero kicker={T.heroKicker} statement={T.heroStatement} tagline={T.heroTagline} trust={T.heroTrust} chips={T.heroChips} />}
      footer={
        <span>
          <Link href="/signin" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>{T.footerBack}</Link>
        </span>
      }
    >
      <AnimatePresence initial={false}>
        {msg && (
          <motion.div key="ok" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: "hidden" }} role="status">
            <Alert kind="success">{msg}</Alert>
            {providers.length > 0 && (
              <nav className="bi-verify-providers" aria-label={T.providerLabel} style={{ marginTop: space[3] }}>
                {providers.map((p) => (
                  <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer">
                    {T.openIn.replace("{p}", p.label)}
                  </a>
                ))}
              </nav>
            )}
            <p style={{ marginTop: space[3], color: cssVar.textMuted, fontSize: font.size.sm }}>{T.spam}</p>
          </motion.div>
        )}
        {err && (
          <motion.div key="err" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: "hidden" }} role="alert">
            <Alert kind="danger">{err}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={sendLink} noValidate>
        <Step icon={<MailMark size={14} />} label={T.stepForgot} hint={T.stepForgotHint}>
          <Field label={T.emailLabel} required error={emailError}>
            {(a) => <Input {...a} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} placeholder={T.emailPlaceholder} autoFocus />}
          </Field>
          <Button
            type="submit" variant="primary" block
            className="bi-ignite"
            loading={busy}
            loadingLabel={T.sending}
            disabled={!email || !!emailError}
            style={{ height: 52, fontWeight: font.weight.bold, fontSize: font.size.md }}
          >
            {T.sendBtn}
          </Button>
        </Step>
      </form>

      <hr style={divider} />

      <Step icon={<KeyMark size={14} />} label={T.stepLost} hint={T.stepLostHint}>
        <AnimatePresence initial={false}>
          {lostMsg && (
            <motion.div key="lost-ok" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 12 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: "hidden" }} role="status">
              <Alert kind="success">{lostMsg}</Alert>
            </motion.div>
          )}
          {lostErr && (
            <motion.div key="lost-err" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 12 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ overflow: "hidden" }} role="alert">
              <Alert kind="danger">{lostErr}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {!lostMsg && (
          <form onSubmit={requestMfaReset} noValidate>
            <Field label={T.lostEmailLabel} required error={lostEmailError}>
              {(a) => <Input {...a} type="email" autoComplete="email" value={lostEmail} onChange={(e) => setLostEmail(e.target.value)} onBlur={() => setLostTouched(true)} placeholder={T.emailPlaceholder} />}
            </Field>
            <Field label={T.lostReasonLabel}>
              {(a) => <Textarea {...a} rows={2} value={lostReason} onChange={(e) => setLostReason(e.target.value.slice(0, 500))} placeholder={T.lostReasonPlaceholder} />}
            </Field>
            <Button
              type="submit" variant="secondary" block className="bi-refined"
              loading={lostBusy}
              loadingLabel={T.lostBtnSending}
              disabled={!lostEmail || !!lostEmailError}
            >
              {T.lostBtn}
            </Button>
            <p style={{
              margin: `${space[2]}px 0 0`,
              fontSize: 11,
              color: cssVar.textMuted,
              fontFamily: cssVar.fontMono,
              letterSpacing: "0.08em",
              lineHeight: 1.5,
            }}>
              {T.lostAudited}
            </p>
          </form>
        )}
      </Step>

      <hr style={divider} />

      <Step icon={<ShieldMark size={14} />} label={T.stepBlocked} hint={T.stepBlockedHint}>
        <Button href="mailto:soporte@bio-ignicion.app" variant="secondary" block className="bi-refined">
          {T.blockedBtn}
        </Button>
      </Step>

      <section className="bi-recover-trust" aria-labelledby="bi-recover-trust-h">
        <div id="bi-recover-trust-h" className="bi-recover-trust-kicker">{T.trustKicker}</div>
        <ul className="bi-recover-trust-list">
          {T.trustItems.map((t, i) => (<li key={i}>{t}</li>))}
        </ul>
      </section>
    </AuthShell>
  );
}

function Step({ icon, label, hint, children }) {
  return (
    <section style={{ marginBottom: space[2] }}>
      <div className="bi-section-mark" style={{ marginBlockEnd: space[3] }}>
        {icon}
        <span>{label}</span>
      </div>
      {hint && <p style={{ margin: `0 0 ${space[4]}px`, fontSize: font.size.sm, color: cssVar.textDim, lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </section>
  );
}

const divider = { border: 0, borderTop: `1px solid ${cssVar.border}`, margin: `${space[6]}px 0` };
