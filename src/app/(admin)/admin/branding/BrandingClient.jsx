"use client";
import { useState } from "react";

const DEFAULTS = { logoUrl: "", primaryColor: "#059669", accentColor: "#10B981", customDomain: "", coachPersona: "" };

export default function BrandingClient({ initial, saveAction, resetAction }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initial });
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(280px, 1fr)", gap: 24, alignItems: "start" }}>
      <form action={saveAction} style={{ display: "grid", gap: 12 }}>
        <Field label="Logo URL" name="logoUrl" value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://cdn.empresa.com/logo.svg" />
        <ColorField label="Color primario" name="primaryColor" value={form.primaryColor} onChange={set("primaryColor")} />
        <ColorField label="Color acento" name="accentColor" value={form.accentColor} onChange={set("accentColor")} />
        <Field label="Dominio personalizado" name="customDomain" value={form.customDomain} onChange={set("customDomain")} placeholder="app.tu-empresa.com" />
        <Field label="Persona del coach (opcional)" name="coachPersona" value={form.coachPersona} onChange={set("coachPersona")} placeholder="ej. tono Kaizen, referencias a mushin" textarea />
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button style={btnPrimary}>Guardar</button>
          <button type="button" onClick={() => setForm({ ...DEFAULTS })} style={btnGhost}>Limpiar campos</button>
          <button formAction={resetAction} style={{ ...btnGhost, color: "#FCA5A5", borderColor: "#7F1D1D" }}>Restaurar defaults</button>
        </div>
      </form>

      <aside aria-label="Preview" style={{ position: "sticky", top: 20, padding: 18, background: "#020617", border: "1px solid #1E293B", borderRadius: 14 }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#6EE7B7" }}>Preview</p>
        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: `linear-gradient(135deg, ${form.primaryColor}15, ${form.accentColor}10)`, border: `1px solid ${form.primaryColor}40` }}>
          {form.logoUrl
            ? <img src={form.logoUrl} alt="logo" style={{ maxHeight: 36, maxWidth: "100%" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            : <div style={{ height: 36, width: 120, borderRadius: 6, background: form.primaryColor, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700 }}>TU LOGO</div>
          }
          <h3 style={{ margin: "12px 0 4px", color: "#E2E8F0" }}>Bienvenido de vuelta</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>Hoy es un buen día para avanzar.</p>
          <button type="button" style={{ marginTop: 12, padding: "8px 14px", background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`, border: 0, color: "#fff", borderRadius: 999, fontWeight: 700, cursor: "pointer" }}>
            Empezar sesión
          </button>
        </div>
        {form.customDomain && (
          <p style={{ marginTop: 12, fontSize: 12, color: "#A7F3D0" }}>
            Dominio: <code>{form.customDomain}</code>
          </p>
        )}
        {form.coachPersona && (
          <div style={{ marginTop: 12, padding: 12, background: "#0F172A", borderRadius: 10, borderLeft: `3px solid ${form.accentColor}` }}>
            <p style={{ margin: 0, fontSize: 11, color: "#6EE7B7" }}>COACH</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#E2E8F0" }}>{form.coachPersona}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Field({ label, textarea, ...props }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
      <span style={{ color: "#A7F3D0" }}>{label}</span>
      {textarea
        ? <textarea {...props} rows={3} style={input} />
        : <input {...props} style={input} />}
    </label>
  );
}

function ColorField({ label, ...props }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
      <span style={{ color: "#A7F3D0" }}>{label}</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input {...props} type="color" style={{ width: 48, height: 38, padding: 0, border: "1px solid #064E3B", borderRadius: 8, background: "#052E16" }} />
        <input {...props} type="text" style={{ ...input, flex: 1, fontFamily: "ui-monospace" }} />
      </div>
    </label>
  );
}

const input = { padding: "10px 12px", borderRadius: 10, background: "#052E16", color: "#ECFDF5", border: "1px solid #064E3B", fontFamily: "inherit", fontSize: 14 };
const btnPrimary = { padding: "10px 18px", borderRadius: 999, fontWeight: 700, background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", border: 0, cursor: "pointer" };
const btnGhost = { padding: "10px 18px", borderRadius: 999, background: "transparent", color: "#A7F3D0", border: "1px solid #064E3B", cursor: "pointer" };
