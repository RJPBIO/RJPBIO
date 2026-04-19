"use client";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

export default function GlobalError({ error, reset }) {
  const [en, setEn] = useState(false);

  useEffect(() => {
    try {
      const lang = (typeof navigator !== "undefined" && navigator.language) || "es";
      setEn(lang.toLowerCase().startsWith("en"));
    } catch {}
  }, []);

  return (
    <html lang={en ? "en" : "es"}>
      <body
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0B0E14",
          color: "#E2E8F0",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 24,
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 44, height: 44, borderRadius: 999,
              background: "radial-gradient(closest-side, rgba(245,158,11,0.8), rgba(245,158,11,0.15) 70%, transparent)",
              marginBottom: 20,
            }}
          />
          <div style={{ fontSize: 12, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 2, fontWeight: 800, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {en ? "Critical error" : "Error crítico"}
          </div>
          <h1 style={{ margin: "8px 0", fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: "#F8FAFC" }}>
            {en ? "The app failed to start" : "La aplicación no pudo iniciar"}
          </h1>
          <p style={{ margin: "8px 0 16px", color: "#94A3B8", fontSize: 14, lineHeight: 1.6 }}>
            {en ? "Reload or check " : "Recarga o revisa "}
            <a href="/status" style={{ color: "#10B981", fontWeight: 600 }}>/status</a>.
          </p>
          {error?.digest && (
            <p style={{ margin: "0 0 18px", color: "#64748B", fontSize: 11, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              Ref: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "10px 18px", background: "#10B981",
                border: "none", borderRadius: 10, color: "#0B0E14",
                fontSize: 14, fontWeight: 800, cursor: "pointer",
                minHeight: 44,
              }}
            >
              {en ? "Reload" : "Recargar"}
            </button>
            <a
              href="/"
              style={{
                padding: "10px 18px", background: "transparent",
                border: "1px solid #1E2330", borderRadius: 10, color: "#E2E8F0",
                fontSize: 14, fontWeight: 600, textDecoration: "none",
                minHeight: 44, display: "inline-flex", alignItems: "center",
              }}
            >
              {en ? "Back home" : "Volver al inicio"}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
