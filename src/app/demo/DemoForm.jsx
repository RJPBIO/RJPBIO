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

const NOTE_MAX = 1200;

const I18N = {
  es: {
    name: "Nombre", email: "Email corporativo", company: "Empresa",
    size: "Tamaño del equipo",
    role: "Tu rol",
    roleHint: "Opcional. Nos ayuda a enfocar la demo.",
    roleOptions: [
      { v: "", label: "— Prefiero no decir —" },
      { v: "champion", label: "Champion / driver del proyecto" },
      { v: "buyer", label: "Decisor · presupuesto" },
      { v: "it-security", label: "IT · Security · CISO" },
      { v: "people", label: "People Ops · HR · L&D" },
      { v: "user", label: "Usuario final" },
      { v: "other", label: "Otro" },
    ],
    urgency: "Urgencia",
    urgencyHint: "Opcional. Define tiempos realistas.",
    urgencyOptions: [
      { v: "", label: "— Sin presión —" },
      { v: "approved", label: "Piloto aprobado — necesito empezar" },
      { v: "this-quarter", label: "Este trimestre" },
      { v: "next-quarter", label: "Próximo trimestre" },
      { v: "exploring", label: "Explorando el espacio" },
    ],
    note: "¿Qué quieres lograr?",
    noteHint: "Opcional. Ayuda a preparar la sesión.",
    noteCount: (n) => `${n} / ${NOTE_MAX}`,
    submit: "Agenda demo", submitting: "Enviando…",
    errSummary: "No pudimos enviar el formulario.",
    errFields: "Revisa los campos marcados.",
    errName: "Mínimo 2 caracteres.", errEmail: "Email inválido.",
    errNetwork: "Error de red",
    sentTitle: (n) => (n ? `Gracias, ${n}` : "Recibido"),
    sentBody: (<>Un humano te responde en &lt; 24 h hábiles para confirmar horario. Si es urgente, escribe a{" "}<a href="mailto:sales@bio-ignicion.app">sales@bio-ignicion.app</a>.</>),
    prepTitle: "Mientras tanto",
    prepItems: [
      "Agenda 30 min sin interrupciones — el protocolo requiere foco continuo.",
      "Auriculares (si los tienes) — el binaural se siente mejor sin parlantes.",
      "Espacio tranquilo — cámara opcional, voz y panel son lo que importa.",
      "Si usas wearable (Apple Watch, Fitbit, Oura), tenlo a mano para HRV en vivo.",
    ],
    prepNoneTitle: "Qué NO preparar",
    prepNone: "No mandes slides, deck ni agenda previa. Venimos a sentirlo contigo — no a presentarte un pitch.",
    deliverablesTitle: "Al terminar recibes",
    deliverables: [
      "Recap escrito en < 24 h — resumen, decisiones y próximos pasos.",
      "ROI personalizado a tu tamaño — rango de ahorro con sus supuestos explícitos.",
      "Draft de pilot agreement si aplica — alcance, métricas, ventanas de salida.",
      "Security package — DPA, resumen SOC 2, pentest summary y lista de subprocesadores.",
    ],
    consent: (<>Al enviar aceptas nuestra <a href="/privacy">política de privacidad</a>. No vendemos ni cedemos tus datos a terceros para marketing ni venta. Subprocesadores operacionales listados en el <a href="/trust">DPA</a>.</>),
  },
  en: {
    name: "Name", email: "Work email", company: "Company",
    size: "Team size",
    role: "Your role",
    roleHint: "Optional. Helps us focus the demo.",
    roleOptions: [
      { v: "", label: "— Rather not say —" },
      { v: "champion", label: "Champion / project driver" },
      { v: "buyer", label: "Decision maker · budget" },
      { v: "it-security", label: "IT · Security · CISO" },
      { v: "people", label: "People Ops · HR · L&D" },
      { v: "user", label: "End user" },
      { v: "other", label: "Other" },
    ],
    urgency: "Urgency",
    urgencyHint: "Optional. Sets realistic timelines.",
    urgencyOptions: [
      { v: "", label: "— No pressure —" },
      { v: "approved", label: "Pilot approved — ready to start" },
      { v: "this-quarter", label: "This quarter" },
      { v: "next-quarter", label: "Next quarter" },
      { v: "exploring", label: "Exploring the space" },
    ],
    note: "What are you trying to achieve?",
    noteHint: "Optional. Helps us prep the session.",
    noteCount: (n) => `${n} / ${NOTE_MAX}`,
    submit: "Book a demo", submitting: "Sending…",
    errSummary: "We couldn't submit the form.",
    errFields: "Please review the highlighted fields.",
    errName: "At least 2 characters.", errEmail: "Invalid email.",
    errNetwork: "Network error",
    sentTitle: (n) => (n ? `Thanks, ${n}` : "Received"),
    sentBody: (<>A human replies within 24 business hours to confirm a slot. If it's urgent, write to{" "}<a href="mailto:sales@bio-ignicion.app">sales@bio-ignicion.app</a>.</>),
    prepTitle: "In the meantime",
    prepItems: [
      "Block 30 min without interruptions — the protocol needs continuous focus.",
      "Headphones (if you have them) — binaural feels better than speakers.",
      "Quiet space — camera optional, voice and panel are what matter.",
      "If you use a wearable (Apple Watch, Fitbit, Oura), keep it on hand for live HRV.",
    ],
    prepNoneTitle: "What NOT to prepare",
    prepNone: "Don't send slides, deck or prior agenda. We come to feel it with you — not to pitch at you.",
    deliverablesTitle: "After the session you receive",
    deliverables: [
      "Written recap within 24 h — summary, decisions and next steps.",
      "ROI sized to your team — savings range with explicit assumptions.",
      "Pilot agreement draft if applicable — scope, metrics, exit windows.",
      "Security package — DPA, SOC 2 summary, pentest summary and subprocessor list.",
    ],
    consent: (<>By submitting you accept our <a href="/privacy">privacy policy</a>. We don't sell or share your data with third parties for marketing or sale. Operational subprocessors listed in the <a href="/trust">DPA</a>.</>),
  },
};

export default function DemoForm({ source = "demo", locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const T = I18N[L];
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "26-100", role: "", urgency: "", note: "", website: "" });
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
    const firstName = form.name.trim().split(/\s+/)[0] || "";
    return (
      <div role="status" aria-live="polite" className="bi-demo-sent">
        <div className="bi-demo-sent-head">
          <div className="bi-demo-sent-dot" aria-hidden />
          <h2 className="bi-demo-sent-title">{T.sentTitle(firstName)}</h2>
        </div>
        <p className="bi-demo-sent-body">{T.sentBody}</p>

        <div className="bi-demo-prep bi-demo-prep--deliver">
          <div className="bi-demo-prep-kicker">{T.deliverablesTitle}</div>
          <ul className="bi-demo-prep-list">
            {T.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bi-demo-prep">
          <div className="bi-demo-prep-kicker">{T.prepTitle}</div>
          <ul className="bi-demo-prep-list">
            {T.prepItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bi-demo-prep bi-demo-prep--none">
          <div className="bi-demo-prep-kicker">{T.prepNoneTitle}</div>
          <p>{T.prepNone}</p>
        </div>
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

      <Field label={T.role} hint={T.roleHint}>
        {(p) => (
          <select {...p} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
            {T.roleOptions.map((o) => (
              <option key={o.v} value={o.v}>{o.label}</option>
            ))}
          </select>
        )}
      </Field>

      <Field label={T.urgency} hint={T.urgencyHint}>
        {(p) => (
          <select {...p} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} style={inputStyle}>
            {T.urgencyOptions.map((o) => (
              <option key={o.v} value={o.v}>{o.label}</option>
            ))}
          </select>
        )}
      </Field>

      <Field label={T.note} hint={T.noteHint}>
        {(p) => (
          <textarea
            {...p}
            rows={3}
            maxLength={NOTE_MAX}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        )}
      </Field>
      <div
        aria-live="polite"
        style={{
          textAlign: "end",
          fontSize: 11,
          color: form.note.length >= NOTE_MAX ? cssVar.danger : cssVar.textMuted,
          fontFamily: cssVar.fontMono,
          marginBlockStart: `calc(${space[2]}px * -1)`,
          marginBlockEnd: space[3],
        }}
      >
        {T.noteCount(form.note.length)}
      </div>

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

      <div className="bi-demo-alt-paths" role="group" aria-label={L === "en" ? "Alternate paths" : "Rutas alternativas"}>
        <span className="bi-demo-alt-sep" aria-hidden>{L === "en" ? "or" : "o"}</span>
        <a className="bi-demo-alt-link" href="mailto:sales@bio-ignicion.app?subject=Async%20demo%20—%20BIO-IGNICION">
          {L === "en" ? "Prefer async? Email sales" : "¿Prefieres async? Escribe a sales"}
        </a>
        <span className="bi-demo-alt-dot" aria-hidden>·</span>
        <a className="bi-demo-alt-link" href="/signup?plan=starter">
          {L === "en" ? "Try self-serve first" : "Prueba self-serve primero"}
        </a>
      </div>
    </form>
  );
}
