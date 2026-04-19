"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const I18N = {
  es: {
    title: "Crea tu organización",
    subtitle: "Una cuenta por organización. Invita al equipo desde el panel de admin después.",
    footerHave: "¿Ya tienes cuenta?",
    footerSignin: "Entrar",
    email: "Email de trabajo",
    emailPlaceholder: "tú@empresa.com",
    emailInvalid: "Ingresa un correo con formato válido.",
    name: "Tu nombre",
    namePlaceholder: "Nombre y apellido",
    nameInvalid: "Ingresa tu nombre.",
    org: "Nombre de la organización",
    orgPlaceholder: "Acme Corp",
    orgInvalid: "Ingresa el nombre de la organización.",
    plan: "Plan",
    region: "Residencia de datos",
    dpaPrefix: "Acepto el",
    dpaLink: "Data Processing Agreement",
    dpaAnd: "la",
    privacyLink: "Política de Privacidad",
    dpaAnd2: "y los",
    termsLink: "Términos",
    errDpa: "Debes aceptar el DPA para continuar.",
    errGeneric: "No se pudo crear la organización",
    submit: "Crear organización",
    submitting: "Creando…",
  },
  en: {
    title: "Create your organization",
    subtitle: "One account per organization. Invite your team from the admin panel afterwards.",
    footerHave: "Already have an account?",
    footerSignin: "Sign in",
    email: "Work email",
    emailPlaceholder: "you@company.com",
    emailInvalid: "Enter a valid email address.",
    name: "Your name",
    namePlaceholder: "First and last name",
    nameInvalid: "Enter your name.",
    org: "Organization name",
    orgPlaceholder: "Acme Corp",
    orgInvalid: "Enter the organization name.",
    plan: "Plan",
    region: "Data residency",
    dpaPrefix: "I accept the",
    dpaLink: "Data Processing Agreement",
    dpaAnd: "the",
    privacyLink: "Privacy Policy",
    dpaAnd2: "and the",
    termsLink: "Terms",
    errDpa: "You must accept the DPA to continue.",
    errGeneric: "Could not create the organization",
    submit: "Create organization",
    submitting: "Creating…",
  },
};

export default function SignUpClient({ locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const [form, setForm] = useState({ email: "", name: "", orgName: "", plan: "STARTER", region: "US" });
  const [touched, setTouched] = useState({ email: false, name: false, orgName: false });
  const [dpa, setDpa] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const emailError = touched.email && form.email && !EMAIL_RE.test(form.email) ? T.emailInvalid : null;
  const nameError = touched.name && !form.name.trim() ? T.nameInvalid : null;
  const orgError = touched.orgName && !form.orgName.trim() ? T.orgInvalid : null;

  async function onSubmit(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(form.email) || !form.name.trim() || !form.orgName.trim()) {
      setTouched({ email: true, name: true, orgName: true });
      return;
    }
    if (!dpa) { setErr(T.errDpa); return; }
    setErr(null); setBusy(true);
    try {
      const r = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dpaAccepted: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
      location.href = "/verify?email=" + encodeURIComponent(form.email);
    } catch (e) {
      setErr(e?.message || T.errGeneric);
    } finally { setBusy(false); }
  }

  return (
    <AuthShell
      locale={L}
      size="lg"
      title={T.title}
      subtitle={T.subtitle}
      footer={
        <span>
          {T.footerHave} <Link href="/signin" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>{T.footerSignin}</Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Field label={T.email} required error={emailError}>
          {(a) => <Input {...a} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, email: true }))} placeholder={T.emailPlaceholder} />}
        </Field>
        <Field label={T.name} required error={nameError}>
          {(a) => <Input {...a} type="text" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, name: true }))} placeholder={T.namePlaceholder} />}
        </Field>
        <Field label={T.org} required error={orgError}>
          {(a) => <Input {...a} type="text" autoComplete="organization" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, orgName: true }))} placeholder={T.orgPlaceholder} />}
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[4] }}>
          <Field label={T.plan}>
            {(a) => (
              <Select {...a} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </Select>
            )}
          </Field>
          <Field label={T.region}>
            {(a) => (
              <Select {...a} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="APAC">APAC</option>
                <option value="LATAM">LATAM</option>
              </Select>
            )}
          </Field>
        </div>

        <label style={{
          display: "grid", gridTemplateColumns: "auto 1fr", gap: space[3],
          alignItems: "flex-start", marginTop: space[4],
          padding: space[3], borderRadius: radius.sm,
          background: cssVar.surface2, border: `1px solid ${cssVar.border}`,
          fontSize: font.size.sm, color: cssVar.textDim, lineHeight: font.leading.normal, cursor: "pointer",
        }}>
          <input type="checkbox" checked={dpa} onChange={(e) => setDpa(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--bi-accent)" }} />
          <span>
            {T.dpaPrefix} <Link href="/trust/dpa" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>{T.dpaLink}</Link>,
            {" "}{T.dpaAnd} <Link href="/privacy" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>{T.privacyLink}</Link>{" "}
            {T.dpaAnd2} <Link href="/terms" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>{T.termsLink}</Link>.
          </span>
        </label>

        {err && <div style={{ marginTop: space[4] }} role="alert"><Alert kind="danger">{err}</Alert></div>}

        <Button
          type="submit" variant="primary" block
          loading={busy}
          loadingLabel={T.submitting}
          disabled={!dpa || !!emailError || !!nameError || !!orgError}
          style={{ marginTop: space[5] }}
        >
          {T.submit}
        </Button>
      </form>
    </AuthShell>
  );
}

const linkStyle = { color: "var(--bi-accent)", fontWeight: 600 };
