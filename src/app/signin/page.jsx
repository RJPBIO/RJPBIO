"use client";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true); setErr("");
    try {
      const r = await fetch("/api/auth/signin/email", { method: "POST", body: new URLSearchParams({ email }) });
      if (!r.ok) throw new Error(await r.text());
      location.href = "/verify?email=" + encodeURIComponent(email);
    } catch (e) { setErr(e.message || "Error"); } finally { setSubmitting(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <form onSubmit={onSubmit} style={{ width: 360, padding: 32, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Entrar a BIO-IGNICIÓN</h1>
        <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>Te enviaremos un enlace mágico.</p>
        <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tú@empresa.com"
          style={{ width: "100%", marginTop: 20, padding: "10px 12px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" }} />
        <button disabled={submitting} style={{ width: "100%", marginTop: 16, padding: 10, background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600 }}>
          {submitting ? "Enviando…" : "Enviar enlace"}
        </button>
        {err && <p style={{ color: "#F87171", fontSize: 13, marginTop: 8 }}>{err}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <a href="/api/auth/signin/okta" style={btn}>Okta</a>
          <a href="/api/auth/signin/azure-ad" style={btn}>Azure AD</a>
          <a href="/api/auth/signin/google" style={btn}>Google</a>
        </div>
        <p style={{ color: "#64748B", fontSize: 12, marginTop: 24, textAlign: "center" }}>
          <a href="/terms" style={{ color: "#94A3B8" }}>Términos</a> · <a href="/privacy" style={{ color: "#94A3B8" }}>Privacidad</a>
        </p>
      </form>
    </main>
  );
}

const btn = { flex: 1, padding: "8px 10px", background: "#1E293B", borderRadius: 8, textAlign: "center", color: "#E2E8F0", fontSize: 13, textDecoration: "none" };
