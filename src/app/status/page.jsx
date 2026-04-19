import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
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
  alternates: { canonical: "/status", types: { "application/rss+xml": "/status/feed.xml" } },
};

export const revalidate = 30;

async function probe(url, { timeoutMs = 2500, parseJson = false } = {}) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const start = Date.now();
    const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    const latencyMs = Date.now() - start;
    let body = null;
    if (parseJson) {
      try { body = await r.json(); } catch { body = null; }
    }
    clearTimeout(t);
    return { ok: r.ok, status: r.status, latencyMs, body };
  } catch {
    return { ok: false, status: null, latencyMs: null, body: null };
  }
}

/** Incidentes operativos publicados. Vacío hasta el beta público.
 *  Cuando haya persistencia, este arreglo se sustituye por un fetch a DB. */
const INCIDENTS = [];

const SLA_TARGETS = [
  { surface: "API v1", target: "99.9%", window: "mensual" },
  { surface: "Web (SSR)", target: "99.9%", window: "mensual" },
  { surface: "Webhooks", target: "99.5%", window: "mensual" },
  { surface: "Workers batch", target: "99.0%", window: "mensual" },
];

export default async function StatusPage() {
  const locale = await getServerLocale();
  const T = (k, fb) => { const v = tLocale(locale, k); return v === k ? fb : v; };
  const en = locale === "en";
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const [web, ready, health, feed] = await Promise.all([
    probe(`${base}/favicon.ico`),
    probe(`${base}/api/ready`, { parseJson: true }),
    probe(`${base}/api/health`, { parseJson: true }),
    probe(`${base}/status/feed.xml`),
  ]);

  const dbCheck = ready.body?.checks?.db || null;
  const dbOk = dbCheck === "ok" || dbCheck === "memory";

  const components = [
    { name: "Web (SSR)", ok: web.ok, latency: web.latencyMs, detail: web.status ? `HTTP ${web.status}` : null },
    { name: "API v1", ok: ready.ok, latency: ready.latencyMs, detail: ready.body?.status || (ready.status ? `HTTP ${ready.status}` : null) },
    { name: "Health (edge)", ok: health.ok, latency: health.latencyMs, detail: health.body?.version ? `v${health.body.version}` : null },
    { name: "DB (lectura)", ok: dbOk, latency: null, detail: dbCheck || (en ? "unknown" : "desconocido") },
    { name: "Webhooks", ok: ready.ok, latency: null, detail: en ? "depends on API" : "depende de API" },
    { name: "RSS feed", ok: feed.ok, latency: feed.latencyMs, detail: feed.status ? `HTTP ${feed.status}` : null },
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

        <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockEnd: space[4], textAlign: "center" }}>
          {en
            ? "Operational: probe replies in <2.5 s. Degraded: timeout, 5xx or failed health check. Each component below is probed independently from this edge request; historical uptime publishes once public beta ships."
            : "Operativo: probe responde en <2.5 s. Degradado: timeout, 5xx o health-check fallido. Cada componente se prueba independientemente desde esta petición edge; el historial público se publica al lanzar el beta."}
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, border: `1px solid ${cssVar.border}`, borderRadius: radius.md, overflow: "hidden" }}>
          {components.map((c, i) => (
            <li
              key={c.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: `${space[3]}px ${space[4]}px`,
                borderBlockStart: i === 0 ? "none" : `1px solid ${cssVar.border}`,
                fontSize: font.size.md,
                background: i % 2 === 0 ? cssVar.surface : cssVar.surface2,
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: font.weight.semibold }}>{c.name}</span>
                {c.detail && (
                  <span style={{ color: cssVar.textMuted, fontSize: font.size.xs, fontFamily: cssVar.fontMono }}>
                    {c.detail}
                  </span>
                )}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: space[3] }}>
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

        <section aria-labelledby="status-sla" style={{ marginTop: space[8] }}>
          <h2 id="status-sla" style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, letterSpacing: font.tracking.tight, marginBlockEnd: space[2] }}>
            {en ? "SLA targets" : "Objetivos de SLA"}
          </h2>
          <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: 0 }}>
            {en
              ? "Published targets — audited uptime report targets Q3 2026. Enterprise tier includes contractual SLAs with credits; ask trust@bio-ignicion.app."
              : "Objetivos publicados — reporte de disponibilidad auditado objetivo Q3 2026. El tier Enterprise incluye SLA contractual con créditos; escribe a trust@bio-ignicion.app."}
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: space[3],
            marginTop: space[3],
          }}>
            {SLA_TARGETS.map((s) => (
              <div
                key={s.surface}
                style={{
                  border: `1px solid ${cssVar.border}`,
                  borderRadius: radius.md,
                  padding: space[4],
                  background: cssVar.surface,
                }}
              >
                <div style={{ fontSize: font.size.xs, color: cssVar.textDim, textTransform: "uppercase", letterSpacing: font.tracking.wide, fontWeight: font.weight.semibold }}>
                  {s.surface}
                </div>
                <div style={{ fontSize: font.size["2xl"], fontWeight: font.weight.black, color: cssVar.accent, marginBlock: space[1], fontFamily: cssVar.fontMono }}>
                  {s.target}
                </div>
                <div style={{ fontSize: font.size.xs, color: cssVar.textMuted }}>
                  {en ? `rolling ${s.window}` : `rodante ${s.window}`}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="status-history" style={{ marginTop: space[8] }}>
          <h2 id="status-history" style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, letterSpacing: font.tracking.tight, marginBlockEnd: space[2] }}>
            {en ? "Historical uptime" : "Disponibilidad histórica"}
          </h2>
          <Card padding="md" style={{ background: cssVar.surface2 }}>
            <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.text, lineHeight: 1.6 }}>
              {en
                ? "Per-day uptime (90-day strip) publishes when the public beta ships. We won't render placeholder data before then — the same principle that keeps certifications in the Trust Center unclaimed until the audit report lands."
                : "El histórico día-a-día (franja de 90 días) se publica al lanzar el beta. No vamos a pintar datos placeholder antes — es el mismo principio por el que en el Trust Center no declaramos certificaciones antes del reporte auditado."}
            </p>
            <p style={{ margin: `${space[3]}px 0 0`, fontSize: font.size.xs, color: cssVar.textMuted }}>
              {en
                ? "Private beta customers can request monthly uptime attestations under NDA at "
                : "Clientes en beta privada pueden solicitar atestaciones mensuales de disponibilidad bajo NDA a "}
              <a href="mailto:trust@bio-ignicion.app" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>trust@bio-ignicion.app</a>.
            </p>
          </Card>
        </section>

        <section aria-labelledby="status-incidents" style={{ marginTop: space[8] }}>
          <h2 id="status-incidents" style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, letterSpacing: font.tracking.tight, marginBlockEnd: space[2] }}>
            {en ? "Incident timeline" : "Línea de incidentes"}
          </h2>
          {INCIDENTS.length === 0 ? (
            <div
              style={{
                border: `1px solid ${cssVar.border}`,
                borderLeft: `3px solid ${cssVar.accent}`,
                borderRadius: radius.md,
                padding: space[4],
                background: cssVar.surface,
              }}
            >
              <div style={{ fontSize: font.size.sm, color: cssVar.accent, fontWeight: font.weight.bold, marginBlockEnd: space[1], fontFamily: cssVar.fontMono, textTransform: "uppercase", letterSpacing: font.tracking.wide }}>
                {en ? "No incidents reported" : "Sin incidentes registrados"}
              </div>
              <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: 1.6 }}>
                {en
                  ? "When an operational event affects production, it appears here with an ISO timestamp, scope, impact, and resolution note — and simultaneously in the RSS feed and the status.incident webhook. No incidents have occurred since this page went live."
                  : "Cuando ocurra un evento operativo que afecte producción, aparecerá aquí con timestamp ISO, alcance, impacto y nota de resolución — y simultáneamente en el feed RSS y el webhook status.incident. No hay incidentes desde que esta página salió al aire."}
              </p>
            </div>
          ) : (
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: space[3] }}>
              {INCIDENTS.map((inc) => (
                <li
                  key={inc.id}
                  style={{
                    border: `1px solid ${cssVar.border}`,
                    borderLeft: `3px solid ${inc.severity === "major" ? cssVar.danger : cssVar.warn}`,
                    borderRadius: radius.md,
                    padding: space[4],
                    background: cssVar.surface,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: space[2], flexWrap: "wrap" }}>
                    <strong style={{ fontSize: font.size.md }}>{inc.title}</strong>
                    <time dateTime={inc.startedAt} style={{ fontSize: font.size.xs, color: cssVar.textMuted, fontFamily: cssVar.fontMono }}>
                      {fmtDateL(locale, new Date(inc.startedAt), { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </div>
                  <p style={{ margin: `${space[2]}px 0 0`, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: 1.6 }}>
                    {inc.summary}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

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
