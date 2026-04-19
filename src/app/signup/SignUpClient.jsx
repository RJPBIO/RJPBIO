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

export default function SignUpClient() {
  const [form, setForm] = useState({ email: "", name: "", orgName: "", plan: "STARTER", region: "US" });
  const [touched, setTouched] = useState({ email: false, name: false, orgName: false });
  const [dpa, setDpa] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const emailError = touched.email && form.email && !EMAIL_RE.test(form.email)
    ? "Ingresa un correo con formato válido."
    : null;
  const nameError = touched.name && !form.name.trim() ? "Ingresa tu nombre." : null;
  const orgError = touched.orgName && !form.orgName.trim() ? "Ingresa el nombre de la organización." : null;

  async function onSubmit(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(form.email) || !form.name.trim() || !form.orgName.trim()) {
      setTouched({ email: true, name: true, orgName: true });
      return;
    }
    if (!dpa) { setErr("Debes aceptar el DPA para continuar."); return; }
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
      setErr(e?.message || "No se pudo crear la organización");
    } finally { setBusy(false); }
  }

  return (
    <AuthShell
      size="lg"
      title="Crea tu organización"
      subtitle="Una cuenta por organización. Invita al equipo desde el panel de admin después."
      footer={
        <span>
          ¿Ya tienes cuenta? <Link href="/signin" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>Entrar</Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Field label="Email de trabajo" required error={emailError}>
          {(a) => <Input {...a} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, email: true }))} placeholder="tú@empresa.com" />}
        </Field>
        <Field label="Tu nombre" required error={nameError}>
          {(a) => <Input {...a} type="text" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, name: true }))} placeholder="Nombre y apellido" />}
        </Field>
        <Field label="Nombre de la organización" required error={orgError}>
          {(a) => <Input {...a} type="text" autoComplete="organization" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} onBlur={() => setTouched((t) => ({ ...t, orgName: true }))} placeholder="Acme Corp" />}
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[4] }}>
          <Field label="Plan">
            {(a) => (
              <Select {...a} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </Select>
            )}
          </Field>
          <Field label="Residencia de datos">
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
            Acepto el <Link href="/trust/dpa" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>Data Processing Agreement</Link>,
            la <Link href="/privacy" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>Política de Privacidad</Link> y los{" "}
            <Link href="/terms" target="_blank" rel="noopener" className="bi-auth-link" style={linkStyle}>Términos</Link>.
          </span>
        </label>

        {err && <div style={{ marginTop: space[4] }} role="alert"><Alert kind="danger">{err}</Alert></div>}

        <Button
          type="submit" variant="primary" block
          loading={busy}
          loadingLabel="Creando…"
          disabled={!dpa || !!emailError || !!nameError || !!orgError}
          style={{ marginTop: space[5] }}
        >
          Crear organización
        </Button>
      </form>
    </AuthShell>
  );
}

const linkStyle = { color: "var(--bi-accent)", fontWeight: 600 };
