"use client";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    try { fetch("/api/vitals", { method: "POST", body: JSON.stringify({ name: "app-error", value: 1, rating: "poor", msg: String(error?.message || "").slice(0, 200) }) }); } catch {}
    if (typeof window !== "undefined" && window.Sentry) window.Sentry.captureException(error);
    if (typeof console !== "undefined") console.error("[app-error]", error);
  }, [error]);
  const msg = String(error?.message || error || "").slice(0, 240);
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui", padding: 24 }}>
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Algo falló</h1>
        {error?.digest && <p style={{ color: "#94A3B8", fontSize: 12, margin: "4px 0" }}>Ref: {error.digest}</p>}
        {msg && <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#FCA5A5", background: "#1E1E2F", padding: 12, borderRadius: 8, fontSize: 11, textAlign: "left", maxHeight: 200, overflow: "auto" }}>{msg}</pre>}
        <button onClick={() => reset()} style={{ marginTop: 16, padding: "10px 18px", background: "#10B981", border: "none", borderRadius: 8, color: "#fff" }}>Reintentar</button>
      </div>
    </main>
  );
}
