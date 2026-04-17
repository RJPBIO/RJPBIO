"use client";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    try { fetch("/api/vitals", { method: "POST", body: JSON.stringify({ name: "app-error", value: 1, rating: "poor" }) }); } catch {}
    if (typeof window !== "undefined" && window.Sentry) window.Sentry.captureException(error);
  }, [error]);
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui", padding: 24 }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <h1 style={{ fontSize: 22 }}>Algo falló</h1>
        <p style={{ color: "#94A3B8" }}>{error?.digest ? `Ref: ${error.digest}` : "Intenta de nuevo."}</p>
        <button onClick={() => reset()} style={{ marginTop: 16, padding: "10px 18px", background: "#10B981", border: "none", borderRadius: 8, color: "#fff" }}>Reintentar</button>
      </div>
    </main>
  );
}
