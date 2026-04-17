export default async function Verify({ searchParams }) {
  const { email } = (await searchParams) || {};
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 22 }}>Revisa tu correo</h1>
        <p style={{ color: "#94A3B8" }}>Enviamos un enlace a <b>{email || "tu correo"}</b>. Se vence en 10 minutos.</p>
        <p style={{ color: "#64748B", fontSize: 13, marginTop: 24 }}>¿No llegó? Revisa spam o <a href="/signin" style={{ color: "#10B981" }}>intenta de nuevo</a>.</p>
      </div>
    </main>
  );
}
