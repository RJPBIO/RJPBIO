"use client";
import { useState } from "react";

export default function SignUp() {
  const [form, setForm] = useState({ email: "", name: "", orgName: "", plan: "STARTER", region: "US" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error(await r.text());
      location.href = "/verify?email=" + encodeURIComponent(form.email);
    } finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <form onSubmit={onSubmit} style={{ width: 400, padding: 32, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Crea tu organización</h1>
        {[
          ["email", "Email de trabajo", "email"],
          ["name", "Tu nombre", "text"],
          ["orgName", "Nombre de la organización", "text"],
        ].map(([k, label, type]) => (
          <label key={k} style={{ display: "block", marginTop: 16, fontSize: 13, color: "#94A3B8" }}>{label}
            <input required type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              style={{ width: "100%", marginTop: 4, padding: "10px 12px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" }} />
          </label>
        ))}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <label style={{ flex: 1, fontSize: 13, color: "#94A3B8" }}>Plan
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} style={sel}>
              <option>STARTER</option><option>GROWTH</option><option>ENTERPRISE</option>
            </select>
          </label>
          <label style={{ flex: 1, fontSize: 13, color: "#94A3B8" }}>Residencia
            <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} style={sel}>
              <option>US</option><option>EU</option><option>APAC</option><option>LATAM</option>
            </select>
          </label>
        </div>
        <button disabled={busy} style={{ width: "100%", marginTop: 20, padding: 10, background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600 }}>
          {busy ? "Creando…" : "Crear"}
        </button>
      </form>
    </main>
  );
}

const sel = { width: "100%", marginTop: 4, padding: "10px 12px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" };
