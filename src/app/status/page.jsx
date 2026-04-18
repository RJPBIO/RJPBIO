export const metadata = {
  title: "Status · BIO-IGNICIÓN",
  description: "Estado en tiempo real de API, web, webhooks y workers.",
};

export const revalidate = 30; // segundos

// En producción esto consulta un status page externo (Statuspage, BetterStack).
// Por ahora, check local vía /api/ready y semáforos derivados.
async function probe(url, timeoutMs = 2500) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    return { ok: r.ok, latencyMs: null };
  } catch {
    return { ok: false, latencyMs: null };
  }
}

export default async function StatusPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const [web, ready] = await Promise.all([
    probe(`${base}/favicon.ico`),
    probe(`${base}/api/ready`),
  ]);
  const components = [
    { name: "Web (SSR)", ok: web.ok },
    { name: "API v1",   ok: ready.ok },
    { name: "Webhooks", ok: ready.ok },
    { name: "DB (read)", ok: ready.ok },
  ];
  const allOk = components.every((c) => c.ok);

  return (
    <main style={page}>
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>Status</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "6px 0 10px" }}>
          {allOk ? "Todos los sistemas operativos" : "Estamos viendo un problema"}
        </h1>
        <p style={{ color: "#A7F3D0" }}>
          Última verificación: {new Date().toLocaleString("es-MX")} · actualiza cada 30 s
        </p>
      </header>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, maxWidth: 640, marginInline: "auto" }}>
        {components.map((c) => (
          <li key={c.name} style={row}>
            <span>{c.name}</span>
            <span style={{ color: c.ok ? "#10B981" : "#F87171", fontWeight: 700, fontSize: 13 }}>
              {c.ok ? "● Operativo" : "● Degradado"}
            </span>
          </li>
        ))}
      </ul>

      <section style={{ maxWidth: 640, marginInline: "auto", marginTop: 32, padding: 16, background: "rgba(5,150,105,.06)", border: "1px solid #064E3B", borderRadius: 12, fontSize: 13, color: "#A7F3D0", lineHeight: 1.6 }}>
        Suscríbete a incidentes en{" "}
        <a href="mailto:status@bio-ignicion.app?subject=subscribe" style={link}>status@bio-ignicion.app</a> o
        vía <a href="/api/openapi" style={link}>webhook</a> (evento <code>status.incident</code>).
        RSS: <a href="/status/feed.xml" style={link}>/status/feed.xml</a> (próximamente).
      </section>
    </main>
  );
}

const page = { minHeight: "100dvh", background: "#0B0E14", color: "#ECFDF5", padding: "48px 24px" };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #064E3B" };
const link = { color: "#6EE7B7", textDecoration: "underline" };
