"use client";
import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // null | "pending" | "exists" | "error"
  const [errorMsg, setErrorMsg] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    setErrorMsg(null);
    try {
      const r = await fetch("/api/v1/status/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error === "invalid_input"
          ? "Email inválido"
          : (j?.error || `HTTP ${r.status}`));
      }
      const j = await r.json();
      setResult(j.alreadyExists ? "exists" : "pending");
    } catch (err) {
      setResult("error");
      setErrorMsg(err?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  if (result === "pending") {
    return (
      <p style={{ color: "#10B981", fontSize: 14, margin: 0 }}>
        ✓ Revisa tu email para confirmar la suscripción.
      </p>
    );
  }
  if (result === "exists") {
    return (
      <p style={{ color: "#F59E0B", fontSize: 14, margin: 0 }}>
        Este email ya está registrado. Si no te llegan emails, revisa tu spam.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{
      display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch",
    }}>
      <input
        type="email"
        required
        placeholder="tu@empresa.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
        style={{
          flex: "1 1 220px", minWidth: 180,
          padding: "10px 14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          color: "#E2E8F0",
          fontSize: 14,
          fontFamily: "inherit",
        }}
      />
      <button
        type="submit"
        disabled={busy || !email}
        style={{
          padding: "10px 20px",
          background: "linear-gradient(135deg,#059669,#10B981)",
          border: 0, color: "#fff",
          borderRadius: 8, fontWeight: 600,
          cursor: busy ? "wait" : "pointer",
          fontSize: 14,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Enviando…" : "Suscribirse"}
      </button>
      {result === "error" && (
        <p style={{ color: "#EF4444", fontSize: 13, margin: 0, width: "100%" }}>
          {errorMsg}
        </p>
      )}
    </form>
  );
}
