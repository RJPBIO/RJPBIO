"use client";
import { useState, useEffect } from "react";

/* MFA page — TOTP primary + WebAuthn passkey fallback.
   Lee email del query o session-cookie leída vía /api/auth/me liviano. */
export default function Mfa() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search);
      const e = q.get("email");
      if (e) setEmail(e);
    } catch {}
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!r.ok) throw new Error((await r.text()) || "Código inválido");
      setOk("Verificado. Redirigiendo…");
      setTimeout(() => { location.href = "/"; }, 400);
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  async function usePasskey() {
    setBusy(true); setErr(""); setOk("");
    try {
      if (!email) throw new Error("Falta tu correo para ubicar la passkey.");
      const optsR = await fetch("/api/webauthn/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!optsR.ok) throw new Error("No hay passkey registrada para este correo.");
      const opts = await optsR.json();
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const assertion = await startAuthentication({ optionsJSON: opts });
      const verifyR = await fetch("/api/webauthn/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!verifyR.ok) throw new Error((await verifyR.text()) || "Falló la verificación");
      setOk("Passkey verificada. Redirigiendo…");
      setTimeout(() => { location.href = "/"; }, 400);
    } catch (e) {
      setErr(e.message || "Error con passkey");
    } finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <form onSubmit={onSubmit} style={{ width: 360, padding: 32, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Verificación en dos pasos</h1>
        <p style={{ color: "#94A3B8", fontSize: 14 }}>
          Ingresa el código TOTP de 6 dígitos o usa tu passkey.
        </p>
        <input
          inputMode="numeric" autoFocus pattern="[0-9]{6}" maxLength={6} required
          value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          aria-label="Código de 6 dígitos"
          style={{ width: "100%", marginTop: 16, padding: 12, background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0", fontSize: 24, letterSpacing: 8, textAlign: "center" }}
        />
        <button disabled={busy || code.length !== 6} style={{ width: "100%", marginTop: 16, padding: 10, background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: (busy || code.length !== 6) ? 0.6 : 1 }}>
          {busy ? "Verificando…" : "Verificar"}
        </button>
        {err && <p role="alert" style={{ color: "#F87171", fontSize: 13, marginTop: 8 }}>{err}</p>}
        {ok && <p role="status" style={{ color: "#34D399", fontSize: 13, marginTop: 8 }}>{ok}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 12px", color: "#475569", fontSize: 11 }}>
          <hr style={{ flex: 1, border: 0, borderTop: "1px solid #1E293B" }} />
          <span>O BIEN</span>
          <hr style={{ flex: 1, border: 0, borderTop: "1px solid #1E293B" }} />
        </div>

        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="tú@empresa.com"
          aria-label="Correo para passkey"
          style={{ width: "100%", marginBottom: 8, padding: "8px 10px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0", fontSize: 13 }}
        />
        <button
          type="button"
          disabled={busy || !email}
          onClick={usePasskey}
          style={{ width: "100%", padding: 10, background: "transparent", color: "#A7F3D0", border: "1px solid #10B981", borderRadius: 8, cursor: busy ? "wait" : "pointer", opacity: (busy || !email) ? 0.5 : 1, fontWeight: 600 }}
        >
          Usar passkey
        </button>
      </form>
    </main>
  );
}
