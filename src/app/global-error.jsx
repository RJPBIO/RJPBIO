"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui", padding: 24, margin: 0 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ fontSize: 22 }}>Error crítico</h1>
          <p style={{ color: "#94A3B8" }}>{error?.digest ? `Ref: ${error.digest}` : "La aplicación no pudo iniciar."}</p>
          <button onClick={() => reset()} style={{ marginTop: 16, padding: "10px 18px", background: "#10B981", border: "none", borderRadius: 8, color: "#fff" }}>Recargar</button>
        </div>
      </body>
    </html>
  );
}
