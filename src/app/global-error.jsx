"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({ error, reset }) {
  return (
    <html>
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
              background: "radial-gradient(closest-side, rgba(220,38,38,0.8), rgba(220,38,38,0.15) 70%, transparent)",
              marginBottom: 20,
            }}
          />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#F8FAFC" }}>
            Error crítico
          </h1>
          <p style={{ margin: "10px 0 18px", color: "#94A3B8", fontSize: 14, lineHeight: 1.5 }}>
            La aplicación no pudo iniciar.
          </p>
          {error?.digest && (
            <p style={{ margin: "0 0 18px", color: "#64748B", fontSize: 11, fontFamily: "monospace" }}>
              Ref: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "10px 18px", background: "#10B981",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                minHeight: 44,
              }}
            >
              Recargar
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
              Volver al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
