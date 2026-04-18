export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 22 }}>404</h1>
        <p style={{ color: "#94A3B8" }}>La ruta no existe.</p>
        <a href="/" style={{ color: "#10B981" }}>Ir al inicio</a>
      </div>
    </main>
  );
}
