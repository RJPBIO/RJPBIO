"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { cssVar, radius, space, font, bioSignal } from "@/components/ui/tokens";
import { GoogleMark, MicrosoftMark, AppleMark } from "@/components/ui/BrandIcons";
import AuthHero from "@/components/brand/AuthHero";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const I18N = {
  es: {
    kicker: "CREAR · UNA ORGANIZACIÓN",
    title: "Enciende tu organización.",
    subtitle: "Una cuenta, todo el equipo. Invita miembros desde el panel de admin después.",
    heroKicker: "BIO-IGNICIÓN · NEURAL PLATFORM",
    heroStatement: "Del primer pulso al despliegue de equipo.",
    heroTagline: "25 usuarios en minutos, no en trimestres. El piloto arranca al firmar.",
    heroTrust: "DPA personalizado · residencia de datos a elección · SLA 99.9 %.",
    heroChips: ["SOC 2", "HIPAA-ready", "GDPR", "NOM-035"],
    footerHave: "¿Ya tienes cuenta?",
    footerSignin: "Entrar",
    ssoEyebrow: "REGÍSTRATE CON",
    ssoGoogle: "Continuar con Google",
    ssoMicrosoft: "Continuar con Microsoft",
    ssoApple: "Continuar con Apple",
    ssoDivider: "O CON EMAIL",
    ssoHint: "Al usar SSO, creamos tu cuenta y te traemos aquí para nombrar la organización.",
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
    planSuggested: "SUGERIDO PARA TU EQUIPO",
    region: "Residencia de datos",
    teamSize: "Tamaño del equipo (opcional)",
    teamSizeHint: "Nos ayuda a dimensionar el piloto. Puedes cambiarlo después.",
    teamSizeOpts: {
      "": "Prefiero no decir",
      "solo": "Solo yo",
      "2-25": "2 – 25 personas",
      "26-100": "26 – 100 personas",
      "101-500": "101 – 500 personas",
      "500+": "500+ personas",
    },
    nextKicker: "LO QUE SIGUE · 3 PASOS",
    nextSteps: [
      { t: "Verificas tu email", d: "Enviamos un magic link de un solo uso. Válido 15 minutos." },
      { t: "Nombras tu espacio", d: "Slug de organización, región de datos y preferencias de notificación." },
      { t: "Invitas a tu equipo", d: "Correo, SCIM, o CSV. Roles OWNER · ADMIN · MEMBER configurables." },
    ],
    trustChips: ["SOC 2 Type II", "HIPAA · BAA", "GDPR · UE", "NOM-035 STPS", "Cero telemetría"],
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
    kicker: "CREATE · AN ORGANIZATION",
    title: "Ignite your organization.",
    subtitle: "One account, whole team. Invite members from the admin panel afterwards.",
    heroKicker: "BIO-IGNICIÓN · NEURAL PLATFORM",
    heroStatement: "From the first pulse to a team deployment.",
    heroTagline: "25 users in minutes, not quarters. The pilot begins at signature.",
    heroTrust: "Custom DPA · data residency of choice · 99.9 % SLA.",
    heroChips: ["SOC 2", "HIPAA-ready", "GDPR", "NOM-035"],
    footerHave: "Already have an account?",
    footerSignin: "Sign in",
    ssoEyebrow: "SIGN UP WITH",
    ssoGoogle: "Continue with Google",
    ssoMicrosoft: "Continue with Microsoft",
    ssoApple: "Continue with Apple",
    ssoDivider: "OR WITH EMAIL",
    ssoHint: "When using SSO we create your account and bring you here to name the organization.",
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
    planSuggested: "SUGGESTED FOR YOUR TEAM",
    region: "Data residency",
    teamSize: "Team size (optional)",
    teamSizeHint: "Helps us size the pilot. You can change it later.",
    teamSizeOpts: {
      "": "Prefer not to say",
      "solo": "Just me",
      "2-25": "2 – 25 people",
      "26-100": "26 – 100 people",
      "101-500": "101 – 500 people",
      "500+": "500+ people",
    },
    nextKicker: "WHAT'S NEXT · 3 STEPS",
    nextSteps: [
      { t: "You verify your email", d: "We send a one-time magic link. Valid for 15 minutes." },
      { t: "You name your workspace", d: "Organization slug, data region and notification preferences." },
      { t: "You invite your team", d: "Email, SCIM, or CSV. OWNER · ADMIN · MEMBER roles configurable." },
    ],
    trustChips: ["SOC 2 Type II", "HIPAA · BAA", "GDPR · EU", "NOM-035 STPS", "Zero telemetry"],
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

/* SignUpHero — thin wrapper over the shared AuthHero. */
function SignUpHero({ T }) {
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

export default function SignUpClient({ locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const [form, setForm] = useState({ email: "", name: "", orgName: "", plan: "STARTER", region: "US", teamSize: "" });
  const [touched, setTouched] = useState({ email: false, name: false, orgName: false });
  const [planDirty, setPlanDirty] = useState(false);
  const suggestedPlan = form.teamSize === "solo" || form.teamSize === "2-25" ? "STARTER"
                      : form.teamSize === "26-100" || form.teamSize === "101-500" ? "GROWTH"
                      : form.teamSize === "500+" ? "ENTERPRISE"
                      : null;
  useEffect(() => {
    if (suggestedPlan && !planDirty) {
      setForm((f) => (f.plan === suggestedPlan ? f : { ...f, plan: suggestedPlan }));
    }
  }, [suggestedPlan, planDirty]);
  const [dpa, setDpa] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState({ google: true, microsoft: true, apple: false });
  const [sso, setSso] = useState("");

  useEffect(() => {
    fetch("/api/auth/providers-available", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j) setProviders((p) => ({ ...p, ...j })); })
      .catch(() => {});
  }, []);

  function startIdp(key) {
    setSso(key);
    location.href = `/api/auth/signin/${key}?callbackUrl=${encodeURIComponent("/signup?sso=1")}`;
  }

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
      const payload = { ...form, dpaAccepted: new Date().toISOString() };
      if (!payload.teamSize) delete payload.teamSize;
      const r = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      kicker={T.kicker}
      title={T.title}
      subtitle={T.subtitle}
      hero={<SignUpHero T={T} />}
      footer={
        <span>
          {T.footerHave}{" "}
          <Link href="/signin" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>
            {T.footerSignin}
          </Link>
        </span>
      }
    >
      <AnimatePresence initial={false}>
        {err && (
          <motion.div
            key="err"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ overflow: "hidden" }}
            role="alert"
          >
            <Alert kind="danger">{err}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {(providers.google || providers.microsoft || providers.apple) && (
        <div style={{ marginBottom: space[4] }}>
          <div style={{
            fontFamily: cssVar.fontMono,
            fontSize: font.size.xs,
            color: cssVar.textMuted,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: font.weight.bold,
            marginBlockEnd: space[3],
          }}>
            {T.ssoEyebrow}
          </div>
          <div style={{ display: "grid", gap: space[2] }}>
            {providers.google && (
              <Button type="button" block className="bi-oauth bi-oauth-google" onClick={() => startIdp("google")} loading={sso === "google"} disabled={busy}>
                <GoogleMark size={18} />
                <span>{T.ssoGoogle}</span>
              </Button>
            )}
            {providers.microsoft && (
              <Button type="button" block className="bi-oauth bi-oauth-microsoft" onClick={() => startIdp("azure-ad")} loading={sso === "azure-ad"} disabled={busy}>
                <MicrosoftMark size={18} />
                <span>{T.ssoMicrosoft}</span>
              </Button>
            )}
            {providers.apple && (
              <Button type="button" block className="bi-oauth bi-oauth-apple" onClick={() => startIdp("apple")} loading={sso === "apple"} disabled={busy}>
                <AppleMark size={18} color="#FFFFFF" />
                <span>{T.ssoApple}</span>
              </Button>
            )}
          </div>
          <p style={{
            marginBlockStart: space[3],
            fontSize: 11,
            color: cssVar.textMuted,
            lineHeight: 1.45,
            fontFamily: cssVar.fontMono,
            letterSpacing: "0.02em",
          }}>
            {T.ssoHint}
          </p>
          <div className="bi-divider" role="separator" aria-label={T.ssoDivider}>
            <span>{T.ssoDivider}</span>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <Field label={T.email} required error={emailError}>
          {(a) => <Input {...a} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, email: true }))} placeholder={T.emailPlaceholder} autoFocus />}
        </Field>
        <Field label={T.name} required error={nameError}>
          {(a) => <Input {...a} type="text" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, name: true }))} placeholder={T.namePlaceholder} />}
        </Field>
        <Field label={T.org} required error={orgError}>
          {(a) => <Input {...a} type="text" autoComplete="organization" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, orgName: true }))} placeholder={T.orgPlaceholder} />}
        </Field>

        <Field label={T.teamSize} hint={T.teamSizeHint}>
          {(a) => (
            <Select {...a} value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })}>
              {Object.entries(T.teamSizeOpts).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          )}
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[4] }}>
          <Field
            label={T.plan}
            hint={suggestedPlan && !planDirty && form.plan === suggestedPlan ? T.planSuggested : undefined}
          >
            {(a) => (
              <Select
                {...a}
                value={form.plan}
                onChange={(e) => { setPlanDirty(true); setForm({ ...form, plan: e.target.value }); }}
              >
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

        <div
          style={{
            marginTop: space[4],
            padding: space[4],
            borderRadius: radius.sm,
            background: cssVar.surface2,
            border: `1px solid ${cssVar.border}`,
          }}
        >
          <Checkbox
            checked={dpa}
            onChange={(e) => setDpa(e.target.checked)}
            label={
              <span style={{ fontSize: font.size.sm, color: cssVar.textDim, fontWeight: font.weight.normal, lineHeight: font.leading.normal }}>
                {T.dpaPrefix} <Link href="/trust/dpa" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>{T.dpaLink}</Link>,
                {" "}{T.dpaAnd} <Link href="/privacy" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>{T.privacyLink}</Link>{" "}
                {T.dpaAnd2} <Link href="/terms" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>{T.termsLink}</Link>.
              </span>
            }
          />
        </div>

        <Button
          type="submit" variant="primary" block
          className="bi-ignite"
          loading={busy}
          loadingLabel={T.submitting}
          disabled={!dpa || !!emailError || !!nameError || !!orgError}
          style={{ marginTop: space[5], height: 52, fontWeight: font.weight.bold, fontSize: font.size.md }}
        >
          {T.submit}
        </Button>

        <div className="bi-signup-trust" role="list" aria-label={T.trustChips.join(", ")}>
          {T.trustChips.map((t) => (
            <span key={t} className="bi-signup-trust-chip" role="listitem">
              <span className="dot" aria-hidden />
              {t}
            </span>
          ))}
        </div>

        <div className="bi-signup-next" aria-labelledby="bi-signup-next-h">
          <div id="bi-signup-next-h" className="bi-signup-next-kicker">{T.nextKicker}</div>
          <ol className="bi-signup-next-list">
            {T.nextSteps.map((s, i) => (
              <li key={i}>
                <span className="t">{s.t}</span>
                <span className="d">{s.d}</span>
              </li>
            ))}
          </ol>
        </div>
      </form>
    </AuthShell>
  );
}

const linkStyle = { color: cssVar.accent, fontWeight: font.weight.semibold };
