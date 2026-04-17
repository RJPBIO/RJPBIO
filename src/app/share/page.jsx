export const metadata = { title: "Compartir a BIO-IGNICIÓN" };

export default async function Share({ searchParams }) {
  const { title, text, url } = (await searchParams) || {};
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui", padding: 24 }}>
      <article style={{ maxWidth: 520, padding: 24, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Contenido recibido</h1>
        {title && <p><b>Título:</b> {title}</p>}
        {text && <p><b>Texto:</b> {text}</p>}
        {url && <p><b>URL:</b> <a href={url} style={{ color: "#10B981" }}>{url}</a></p>}
        <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 16 }}>Guardado como nota en tu perfil.</p>
        <a href="/" style={{ color: "#10B981" }}>Volver</a>
      </article>
    </main>
  );
}
