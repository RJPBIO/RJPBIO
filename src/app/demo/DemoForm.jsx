"use client";
import { useState } from "react";

function csrfHeaders() {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|; )bio-csrf=([^;]+)/);
  return m ? { "x-csrf-token": decodeURIComponent(m[1]) } : {};
}

export default function DemoForm({ source = "demo" }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "26-100", note: "", website: "" });
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrMsg("");
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
      setErrMsg(err.message || "Error de red");
    }
  }

  if (status === "sent") {
    return (
      <div style={{ padding: 24, background: "#064E3B", border: "1px solid #10B981", borderRadius: 14, color: "#D1FAE5" }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Recibido</h2>
        <p style={{ marginTop: 8 }}>
          Un humano te responde en &lt; 24 h hábiles para confirmar horario. Si es urgente, escribe a{" "}
          <a href="mailto:sales@bio-ignicion.app" style={{ color: "#6EE7B7" }}>sales@bio-ignicion.app</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label style={lbl}>Nombre
        <input required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} autoComplete="name" />
      </label>
      <label style={lbl}>Email corporativo
        <input required type="email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} autoComplete="email" />
      </label>
      <label style={lbl}>Empresa
        <input maxLength={160} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} style={inp} autoComplete="organization" />
      </label>
      <label style={lbl}>Tamaño del equipo
        <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} style={inp}>
          <option value="1-25">1 – 25</option>
          <option value="26-100">26 – 100</option>
          <option value="101-500">101 – 500</option>
          <option value="501-2000">501 – 2 000</option>
          <option value="2000+">2 000+</option>
        </select>
      </label>
      <label style={lbl}>¿Qué quieres lograr?
        <textarea rows={3} maxLength={1200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={{ ...inp, resize: "vertical" }} />
      </label>

      {/* honeypot: oculto para humanos, tentador para bots */}
      <label style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }} aria-hidden tabIndex={-1}>
        Website
        <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
      </label>

      <button type="submit" disabled={status === "sending"} style={btn}>
        {status === "sending" ? "Enviando…" : "Agenda demo"}
      </button>
      {status === "error" && (
        <p role="alert" style={{ color: "#FCA5A5", marginTop: 10, fontSize: 13 }}>No pudimos enviar: {errMsg}</p>
      )}
      <p style={{ fontSize: 11, color: "#6B7280", marginTop: 14 }}>
        Al enviar aceptas nuestra <a href="/privacy" style={{ color: "#6EE7B7" }}>política de privacidad</a>.
        No compartimos tu información con terceros.
      </p>
    </form>
  );
}

const lbl = { display: "block", fontSize: 12, color: "#A7F3D0", marginBottom: 12, fontWeight: 600 };
const inp = { display: "block", width: "100%", marginTop: 4, background: "#0B0E14", color: "#ECFDF5", border: "1px solid #064E3B", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit" };
const btn = { background: "#10B981", color: "#052E16", border: 0, borderRadius: 10, padding: "12px 22px", fontWeight: 700, fontSize: 15, cursor: "pointer" };
