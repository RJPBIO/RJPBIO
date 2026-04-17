"use client";
import { useState } from "react";

export default function Mfa() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth/mfa/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      if (!r.ok) throw new Error(await r.text());
      location.href = "/";
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <form onSubmit={onSubmit} style={{ width: 360, padding: 32, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Verificación en dos pasos</h1>
        <p style={{ color: "#94A3B8", fontSize: 14 }}>Código TOTP o passkey.</p>
        <input inputMode="numeric" autoFocus pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="000000" style={{ width: "100%", marginTop: 16, padding: 12, background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0", fontSize: 24, letterSpacing: 8, textAlign: "center" }} />
        <button disabled={busy} style={{ width: "100%", marginTop: 16, padding: 10, background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600 }}>
          {busy ? "Verificando…" : "Verificar"}
        </button>
        {err && <p style={{ color: "#F87171", fontSize: 13 }}>{err}</p>}
        <button type="button" onClick={async () => {
          const opts = await (await fetch("/api/webauthn/auth", { method: "POST", body: JSON.stringify({ email: "" }) })).json();
          console.log("passkey", opts);
        }} style={{ width: "100%", marginTop: 12, padding: 10, background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 8 }}>
          Usar passkey
        </button>
      </form>
    </main>
  );
}
