import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font } from "@/components/ui/tokens";
import { tLocale, fmtDateL } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Status",
  description: "Estado en tiempo real de API, web, webhooks y workers.",
  openGraph: {
    title: "BIO-IGNICIÓN · Status",
    description: "Transparencia operativa en vivo.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
  alternates: { types: { "application/rss+xml": "/status/feed.xml" } },
};

// Cada visita re-fetcha cada 30 s (server-side cache)
export const revalidate = 30;

async function probe(url, timeoutMs = 2500) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const start = Date.now();
    const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    return { ok: r.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: null };
  }
}

export default async function StatusPage() {
  const locale = await getServerLocale();
  const T = (k, fb) => { const v = tLocale(locale, k); return v === k ? fb : v; };
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const [web, ready] = await Promise.all([
    probe(`${base}/favicon.ico`),
    probe(`${base}/api/ready`),
  ]);
  const components = [
    { name: "Web (SSR)", ok: web.ok, latency: web.latencyMs },
    { name: "API v1",   ok: ready.ok, latency: ready.latencyMs },
    { name: "Webhooks", ok: ready.ok },
    { name: "DB (read)", ok: ready.ok },
  ];
  const allOk = components.every((c) => c.ok);
  const now = new Date();

  return (
    <PublicShell activePath="/status">
      <Container size="md" className="bi-prose">
        <header style={{ textAlign: "center", marginBottom: space[8] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            {T("status.title", "Status")}
          </div>
          <h1 style={{ margin: `${space[2]}px 0`, color: allOk ? cssVar.text : cssVar.warn }}>
            {allOk ? T("status.allOk", "Todos los sistemas operativos") : T("status.problem", "Estamos viendo un problema")}
          </h1>
          <p style={{ color: cssVar.textDim }}>
            <time dateTime={now.toISOString()}>
              {T("status.lastCheck", "Última verificación")}: {fmtDateL(locale, now, { dateStyle: "medium", timeStyle: "short" })}
            </time>
            {" · "}{T("status.refreshEvery", "actualiza cada 30 s")}
          </p>
        </header>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {components.map((c) => (
            <li
              key={c.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: `${space[3]}px ${space[4]}px`,
                borderBottom: `1px solid ${cssVar.border}`,
                fontSize: font.size.lg,
              }}
            >
              <span>{c.name}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: space[2] }}>
                {typeof c.latency === "number" && (
                  <span style={{ color: cssVar.textMuted, fontSize: 12, fontFamily: cssVar.fontMono }}>{c.latency} ms</span>
                )}
                <span style={{ color: c.ok ? cssVar.accent : cssVar.danger, fontWeight: font.weight.bold, fontSize: 13 }} aria-label={c.ok ? T("status.operational", "Operativo") : T("status.degraded", "Degradado")}>
                  {c.ok ? `● ${T("status.operational", "Operativo")}` : `● ${T("status.degraded", "Degradado")}`}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <Card as="section" style={{ marginTop: space[8] }} aria-labelledby="status-subs">
          <h2 id="status-subs" style={{ marginTop: 0, fontSize: 18 }}>{T("status.subscribe", "Suscripción a incidentes")}</h2>
          <p style={{ fontSize: 14 }}>
            {T("status.subscribeBody", "Recibe notificación cuando cambie el estado. Tres canales disponibles:")}
          </p>
          <div style={{ display: "flex", gap: space[2], flexWrap: "wrap", marginTop: space[3] }}>
            <Button href="mailto:status@bio-ignicion.app?subject=subscribe" size="sm">Email</Button>
            <Button href="/status/feed.xml" variant="secondary" size="sm">RSS</Button>
            <Button href="/docs#webhooks" variant="secondary" size="sm">Webhook (status.incident)</Button>
          </div>
        </Card>
      </Container>
    </PublicShell>
  );
}
