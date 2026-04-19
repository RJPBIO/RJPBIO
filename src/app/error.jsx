"use client";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    try {
      fetch("/api/vitals", {
        method: "POST",
        body: JSON.stringify({
          name: "app-error",
          value: 1,
          rating: "poor",
          msg: String(error?.message || "").slice(0, 200),
        }),
      });
    } catch {}
    if (typeof window !== "undefined" && window.Sentry) window.Sentry.captureException(error);
    if (typeof console !== "undefined") console.error("[app-error]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";
  const msg = isDev ? String(error?.message || error || "").slice(0, 600) : null;

  return (
    <main
      role="alert"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0B0E14",
        color: "#E2E8F0",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            inlineSize: 44, blockSize: 44, borderRadius: 999,
            background: "radial-gradient(closest-side, rgba(220,38,38,0.8), rgba(220,38,38,0.15) 70%, transparent)",
            marginBlockEnd: 20,
          }}
        />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#F8FAFC" }}>
          Algo falló
        </h1>
        <p style={{ margin: "10px 0 18px", color: "#94A3B8", fontSize: 14, lineHeight: 1.5 }}>
          Tuvimos un problema inesperado. Puedes reintentar o volver al inicio.
        </p>
        {error?.digest && (
          <p style={{ margin: "0 0 18px", color: "#64748B", fontSize: 11, fontFamily: "var(--font-mono), monospace" }}>
            Ref: {error.digest}
          </p>
        )}
        {msg && (
          <pre
            style={{
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              color: "#FCA5A5", background: "#1E1E2F",
              padding: 12, borderRadius: 8, fontSize: 11,
              textAlign: "left", maxHeight: 240, overflow: "auto",
              marginBlockEnd: 20,
            }}
          >
            {msg}
          </pre>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 18px", background: "#10B981",
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              minBlockSize: 44,
            }}
          >
            Reintentar
          </button>
          <a
            href="/"
            style={{
              padding: "10px 18px", background: "transparent",
              border: "1px solid #1E2330", borderRadius: 10, color: "#E2E8F0",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
              minBlockSize: 44, display: "inline-flex", alignItems: "center",
            }}
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </main>
  );
}
