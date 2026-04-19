"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyle } from "@/components/ui/Field";
import { cssVar, space, font } from "@/components/ui/tokens";

function csrfHeaders() {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|; )bio-csrf=([^;]+)/);
  return m ? { "x-csrf-token": decodeURIComponent(m[1]) } : {};
}

const I18N = {
  es: {
    name: "Nombre", email: "Email corporativo", company: "Empresa",
    size: "Tamaño del equipo", note: "¿Qué quieres lograr?",
    submit: "Agenda demo", submitting: "Enviando…",
    errSummary: "No pudimos enviar el formulario.",
    errFields: "Revisa los campos marcados.",
    errName: "Mínimo 2 caracteres.", errEmail: "Email inválido.",
    errNetwork: "Error de red",
    sentTitle: "Recibido",
    sentBody: (<>Un humano te responde en &lt; 24 h hábiles para confirmar horario. Si es urgente, escribe a{" "}<a href="mailto:sales@bio-ignicion.app">sales@bio-ignicion.app</a>.</>),
    consent: (<>Al enviar aceptas nuestra <a href="/privacy">política de privacidad</a>. No compartimos tu información con terceros.</>),
  },
  en: {
    name: "Name", email: "Work email", company: "Company",
    size: "Team size", note: "What are you trying to achieve?",
    submit: "Book a demo", submitting: "Sending…",
    errSummary: "We couldn't submit the form.",
    errFields: "Please review the highlighted fields.",
    errName: "At least 2 characters.", errEmail: "Invalid email.",
    errNetwork: "Network error",
    sentTitle: "Received",
    sentBody: (<>A human replies within 24 business hours to confirm a slot. If it's urgent, write to{" "}<a href="mailto:sales@bio-ignicion.app">sales@bio-ignicion.app</a>.</>),
    consent: (<>By submitting you accept our <a href="/privacy">privacy policy</a>. We don't share your information with third parties.</>),
  },
};

export default function DemoForm({ source = "demo", locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "26-100", note: "", website: "" });
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const errSummaryRef = useRef(null);

  useEffect(() => {
    // Mueve foco al resumen de error cuando aparezca — patrón GDS/gov.uk
    if (status === "error" && errSummaryRef.current) errSummaryRef.current.focus();
  }, [status]);

  async function submit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrMsg("");
    setFieldErrors({});

    const errs = {};
    if (form.name.trim().length < 2) errs.name = T.errName;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = T.errEmail;
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setStatus("error");
      setErrMsg(T.errFields);
      return;
    }

    try {
      const r = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "content-type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ ...form, source }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrMsg(err.message || T.errNetwork);
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: space[5],
          background: cssVar.accentSoft,
          border: `1px solid ${cssVar.accent}`,
          borderRadius: 14,
          color: cssVar.text,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>{T.sentTitle}</h2>
        <p style={{ marginTop: space[2] }}>{T.sentBody}</p>
      </div>
    );
  }

  const hasErr = status === "error" && (errMsg || Object.keys(fieldErrors).length > 0);

  return (
    <form onSubmit={submit} noValidate aria-describedby="form-err-summary">
      {hasErr && (
        <div
          id="form-err-summary"
          ref={errSummaryRef}
          tabIndex={-1}
          role="alert"
          style={{
            padding: space[3],
            marginBottom: space[4],
            background: "color-mix(in srgb, var(--bi-danger) 12%, transparent)",
            border: `1px solid ${cssVar.danger}`,
            borderRadius: 10,
            color: cssVar.text,
          }}
        >
          <strong style={{ color: cssVar.danger }}>{T.errSummary}</strong>
          <div style={{ fontSize: 13, marginTop: 4 }}>{errMsg}</div>
        </div>
      )}

      <Field label={T.name} required error={fieldErrors.name}>
        {(p) => (
          <input
            {...p}
            minLength={2}
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            autoComplete="name"
          />
        )}
      </Field>

      <Field label={T.email} required error={fieldErrors.email}>
        {(p) => (
          <input
            {...p}
            type="email"
            maxLength={200}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
            autoComplete="email"
          />
        )}
      </Field>

      <Field label={T.company}>
        {(p) => (
          <input
            {...p}
            maxLength={160}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            style={inputStyle}
            autoComplete="organization"
          />
        )}
      </Field>

      <Field label={T.size}>
        {(p) => (
          <select {...p} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} style={inputStyle}>
            <option value="1-25">1 – 25</option>
            <option value="26-100">26 – 100</option>
            <option value="101-500">101 – 500</option>
            <option value="501-2000">501 – 2 000</option>
            <option value="2000+">2 000+</option>
          </select>
        )}
      </Field>

      <Field label={T.note}>
        {(p) => (
          <textarea
            {...p}
            rows={3}
            maxLength={1200}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        )}
      </Field>

      {/* Honeypot: label + input sacados del accessibility tree */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </label>
      </div>

      <Button type="submit" loading={status === "sending"} loadingLabel={T.submitting}>
        {T.submit}
      </Button>
      <p style={{ fontSize: 11, color: cssVar.textMuted, marginTop: space[3] }}>
        {T.consent}
      </p>
    </form>
  );
}
