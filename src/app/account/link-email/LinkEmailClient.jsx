"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, space, font } from "@/components/ui/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const I18N = {
  es: {
    kicker: "CUENTA · VINCULAR",
    title: "Añade tu correo.",
    subtitle: "Entraste por SMS. Vincula un correo real para usar enlace mágico, passkey o SSO la próxima vez — con la misma cuenta.",
    emailLabel: "Correo de trabajo",
    emailPlaceholder: "tú@empresa.com",
    submit: "Enviar enlace de verificación",
    submitting: "Enviando…",
    skip: "Ahora no",
    ok: "Listo. Revisa tu correo y confirma desde ese dispositivo.",
    errInvalid: "Correo inválido.",
    errInUse: "Ese correo ya pertenece a otra cuenta.",
    errGeneric: "No pudimos vincular el correo.",
  },
  en: {
    kicker: "ACCOUNT · LINK",
    title: "Add your email.",
    subtitle: "You signed in via SMS. Link a real email so you can use magic link, passkey or SSO next time — same account.",
    emailLabel: "Work email",
    emailPlaceholder: "you@company.com",
    submit: "Send verification link",
    submitting: "Sending…",
    skip: "Not now",
    ok: "Done. Check your inbox and confirm from that device.",
    errInvalid: "Invalid email.",
    errInUse: "That email is already in use.",
    errGeneric: "Could not link the email.",
  },
};

export default function LinkEmailClient({ locale = "es", next = "/app", currentEmail }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const invalid = touched && email && !EMAIL_RE.test(email);

  async function submit(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setTouched(true); return; }
    setBusy(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/account/link-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j?.error === "email_invalid") throw new Error(T.errInvalid);
        if (j?.error === "email_in_use") throw new Error(T.errInUse);
        throw new Error(T.errGeneric);
      }
      setOk(T.ok);
    } catch (e) { setErr(e.message || T.errGeneric); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell
      locale={L}
      kicker={T.kicker}
      title={T.title}
      subtitle={T.subtitle}
      size="md"
      footer={<Link href={next} className="bi-auth-link" style={{ color: cssVar.textDim }}>{T.skip} →</Link>}
    >
      {err && <div style={{ marginBottom: space[4] }} role="alert"><Alert kind="danger">{err}</Alert></div>}
      {ok && <div style={{ marginBottom: space[4] }} role="status"><Alert kind="success">{ok}</Alert></div>}

      <form onSubmit={submit} noValidate>
        <Field label={T.emailLabel} required error={invalid ? T.errInvalid : null}>
          {(a) => (
            <Input
              {...a}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={T.emailPlaceholder}
              autoComplete="email"
              autoFocus
            />
          )}
        </Field>
        <Button
          type="submit" variant="primary" block
          loading={busy}
          loadingLabel={T.submitting}
          disabled={busy || !email || invalid}
          style={{ marginTop: space[3], height: 48, fontWeight: font.weight.bold }}
        >
          {T.submit}
        </Button>
      </form>

      {currentEmail?.endsWith?.("@phone.bio-ignicion.app") && (
        <p style={{ marginBlockStart: space[4], color: cssVar.textMuted, fontSize: font.size.xs, textAlign: "center" }}>
          {L === "en" ? "Linked to: " : "Vinculado a: "}<code style={{ fontFamily: cssVar.fontMono }}>{currentEmail}</code>
        </p>
      )}
    </AuthShell>
  );
}
