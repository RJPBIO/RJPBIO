/* ═══════════════════════════════════════════════════════════════
   /status — Transparencia operativa. Probes reales desde este edge.

   Nada de números inventados. El estado se deriva de probes en vivo
   (favicon, /api/ready, /api/health, /status/feed.xml). Cuando no
   tenemos datos históricos los decimos; no pintamos gráficos falsos.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { fmtDateL } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Status",
  description: "Estado en tiempo real — probes desde este edge, sin números de placeholder.",
  openGraph: {
    title: "BIO-IGNICIÓN · Status",
    description: "Transparencia operativa en vivo.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
  alternates: { canonical: "/status", types: { "application/rss+xml": "/status/feed.xml" } },
};

export const revalidate = 30;

const STATUS_LIVE_SINCE = "2025-11-01";

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

const INCIDENTS = [];

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyan,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(24px, 3vw, 34px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.15,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const COPY = {
  es: {
    eyebrow: "STATUS · LIVE",
    titleOk: "Todos los sistemas operativos.",
    titleProblem: "Estamos viendo un problema.",
    editorial: "Probes desde este edge. Sin SLOs inventados.",
    intro:
      "Cada componente debajo se prueba independientemente en cada petición a esta página. Threshold de operativo: respuesta en < 2.5 s. Degradado: timeout, 5xx o health-check fallido.",

    statLiveSince: "En vivo desde",
    statLiveSinceSub: "día cero de transparencia pública",
    statTimeout: "Threshold operativo",
    statTimeoutSub: "desde este edge, por componente",
    statRefresh: "Cadencia de refresco",
    statRefreshSub: "revalidate edge cache",
    statChannels: "Canales de notificación",
    statChannelsSub: "RSS · Email · Webhook",

    componentsKicker: "COMPONENTES · PROBED LIVE",
    componentsH: "Seis superficies. Una verdad.",
    componentsBody:
      "Lectura desde el mismo edge que sirve esta página. Latencia en ms cuando aplica; detalle técnico cuando el probe lo devuelve.",
    statusOperational: "Operativo",
    statusDegraded: "Degradado",
    lastCheck: "Última verificación",
    refreshEvery: "actualiza cada 30 s",

    slaKicker: "OBJETIVOS · MENSUAL RODANTE",
    slaH: "SLA publicado, reporte auditado en camino.",
    slaBody:
      "Los objetivos abajo son públicos; el reporte auditado de disponibilidad llega Q3 2026. Enterprise incluye SLA contractual con créditos — escribe a trust@bio-ignicion.app.",
    slaRolling: (w) => `rodante ${w}`,

    historyKicker: "DISPONIBILIDAD HISTÓRICA",
    historyH: "Franja de 90 días al lanzar beta público.",
    historyBody:
      "No pintamos datos placeholder antes del audit. Clientes en beta privada pueden solicitar atestaciones mensuales bajo NDA a ",
    historyEmail: "trust@bio-ignicion.app",

    incidentsKicker: "INCIDENTES · ORDEN CRONOLÓGICO",
    incidentsH: "Línea de incidentes.",
    incidentsEmptyLabel: "Sin incidentes registrados",
    incidentsEmptyBody: (since) =>
      `Desde ${since}. Cuando ocurra un evento operativo que afecte producción aparecerá aquí con timestamp ISO, alcance, impacto y nota de resolución — y simultáneamente en el feed RSS y el webhook status.incident.`,

    closingKicker: "SUSCRÍBETE",
    closingHLead: "Enterarte cuando cambie el estado.",
    closingHBody: "Tres canales, sin polling.",
    closingBody:
      "Feed RSS estándar, notificación por email o webhook firmado status.incident — elige el que ya tengas conectado.",
    closingPrimary: "Feed RSS",
    closingSecondary: "Email",
    closingTertiary: "Webhook status.incident",

    footerStatus: "Probado desde",
    footerStatusMeta: "este edge en tiempo real",
  },
  en: {
    eyebrow: "STATUS · LIVE",
    titleOk: "All systems operational.",
    titleProblem: "We're seeing an issue.",
    editorial: "Probes from this edge. No fabricated SLOs.",
    intro:
      "Each component below is probed independently on every request to this page. Operational threshold: response under 2.5 s. Degraded: timeout, 5xx, or failed health check.",

    statLiveSince: "Live since",
    statLiveSinceSub: "day zero of public transparency",
    statTimeout: "Operational threshold",
    statTimeoutSub: "from this edge, per component",
    statRefresh: "Refresh cadence",
    statRefreshSub: "revalidate edge cache",
    statChannels: "Notification channels",
    statChannelsSub: "RSS · Email · Webhook",

    componentsKicker: "COMPONENTS · PROBED LIVE",
    componentsH: "Six surfaces. One truth.",
    componentsBody:
      "Read from the same edge that serves this page. Latency in ms when applicable; technical detail when the probe returns one.",
    statusOperational: "Operational",
    statusDegraded: "Degraded",
    lastCheck: "Last check",
    refreshEvery: "refreshes every 30 s",

    slaKicker: "TARGETS · ROLLING MONTHLY",
    slaH: "Published SLA, audited report on the way.",
    slaBody:
      "The targets below are public; the audited uptime report arrives Q3 2026. Enterprise tier includes contractual SLA with credits — write to trust@bio-ignicion.app.",
    slaRolling: (w) => `rolling ${w}`,

    historyKicker: "HISTORICAL UPTIME",
    historyH: "90-day strip when public beta ships.",
    historyBody:
      "We won't render placeholder data before the audit. Private-beta customers can request monthly uptime attestations under NDA at ",
    historyEmail: "trust@bio-ignicion.app",

    incidentsKicker: "INCIDENTS · CHRONOLOGICAL",
    incidentsH: "Incident timeline.",
    incidentsEmptyLabel: "No incidents reported",
    incidentsEmptyBody: (since) =>
      `Since ${since}. When an operational event affects production, it appears here with ISO timestamp, scope, impact and resolution — and simultaneously on the RSS feed and the status.incident webhook.`,

    closingKicker: "SUBSCRIBE",
    closingHLead: "Hear about it when status changes.",
    closingHBody: "Three channels, no polling.",
    closingBody:
      "Standard RSS feed, email notification, or signed status.incident webhook — pick the one you already have wired.",
    closingPrimary: "RSS feed",
    closingSecondary: "Email",
    closingTertiary: "Webhook status.incident",

    footerStatus: "Probed from",
    footerStatusMeta: "this edge in real time",
  },
};

const SLA_TARGETS = [
  { surface: "API v1", target: "99.9%", window_es: "mensual", window_en: "monthly" },
  { surface: "Web (SSR)", target: "99.9%", window_es: "mensual", window_en: "monthly" },
  { surface: "Webhooks", target: "99.5%", window_es: "mensual", window_en: "monthly" },
  { surface: "Workers batch", target: "99.0%", window_es: "mensual", window_en: "monthly" },
];

function latencyBand(ms) {
  if (ms == null) return null;
  if (ms < 200) return "fast";
  if (ms < 800) return "ok";
  return "slow";
}

export default async function StatusPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const en = L === "en";
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
    { name: "Web (SSR)",      ok: web.ok,    latency: web.latencyMs,   detail: web.status ? `HTTP ${web.status}` : null },
    { name: "API v1",         ok: ready.ok,  latency: ready.latencyMs, detail: ready.body?.status || (ready.status ? `HTTP ${ready.status}` : null) },
    { name: "Health (edge)",  ok: health.ok, latency: health.latencyMs, detail: health.body?.version ? `v${health.body.version}` : null },
    { name: "DB (lectura)",   ok: dbOk,      latency: null,            detail: dbCheck || (en ? "unknown" : "desconocido") },
    { name: "Webhooks",       ok: ready.ok,  latency: null,            detail: en ? "depends on API" : "depende de API" },
    { name: "RSS feed",       ok: feed.ok,   latency: feed.latencyMs,  detail: feed.status ? `HTTP ${feed.status}` : null },
  ];
  const allOk = components.every((x) => x.ok);
  const now = new Date();
  const liveSinceDate = new Date(STATUS_LIVE_SINCE).toLocaleDateString(
    en ? "en-US" : "es-MX",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <PublicShell activePath="/status">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <header className={`bi-status-hero ${allOk ? "bi-status-hero--ok" : "bi-status-hero--problem"}`}>
          <div aria-hidden className="bi-status-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-status-hero-aura" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <IgnitionReveal sparkOrigin="50% 30%">
              <div className="bi-status-live-eyebrow" style={kickerStyle}>
                <span aria-hidden className="bi-status-live-dot" />
                <span>{c.eyebrow}</span>
              </div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 64px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.02,
                  color: allOk ? cssVar.text : cssVar.warn,
                }}
              >
                {allOk ? c.titleOk : c.titleProblem}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 24px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  maxWidth: "44ch",
                  margin: `0 auto ${space[4]}`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ color: cssVar.textDim, maxWidth: "58ch", margin: "0 auto" }}>
                {c.intro}
              </p>
              <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: space[4], fontFamily: cssVar.fontMono }}>
                <time dateTime={now.toISOString()}>
                  {c.lastCheck}: {fmtDateL(locale, now, { dateStyle: "medium", timeStyle: "short" })}
                </time>
                {" · "}{c.refreshEvery}
              </p>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      {/* ═══ Stat strip — real operational facts only ═══ */}
      <section aria-label={c.statLiveSince} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats bi-proof-stats--label">
            <div>
              <span className="v">{liveSinceDate}</span>
              <span className="l">{c.statLiveSince}</span>
              <span className="s">{c.statLiveSinceSub}</span>
            </div>
            <div>
              <span className="v">&lt; 2.5 s</span>
              <span className="l">{c.statTimeout}</span>
              <span className="s">{c.statTimeoutSub}</span>
            </div>
            <div>
              <span className="v">30 s</span>
              <span className="l">{c.statRefresh}</span>
              <span className="s">{c.statRefreshSub}</span>
            </div>
            <div>
              <span className="v">3</span>
              <span className="l">{c.statChannels}</span>
              <span className="s">{c.statChannelsSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Components — probed live ═══ */}
      <Container size="lg" className="bi-prose">
        <section aria-labelledby="status-components" style={{ marginBlockEnd: space[7] }}>
          <div style={kickerStyle}>{c.componentsKicker}</div>
          <h2 id="status-components" style={sectionHeading}>{c.componentsH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "58ch" }}>
            {c.componentsBody}
          </p>

          <ul className="bi-status-components" aria-label={c.componentsH}>
            {components.map((comp) => {
              const band = latencyBand(comp.latency);
              return (
                <li
                  key={comp.name}
                  className={`bi-status-component ${comp.ok ? "bi-status-component--ok" : "bi-status-component--degraded"}`}
                >
                  <span aria-hidden className="bi-status-component-stripe" />
                  <span className="bi-status-component-left">
                    <span className="bi-status-component-name">{comp.name}</span>
                    {comp.detail && (
                      <span className="bi-status-component-detail">{comp.detail}</span>
                    )}
                  </span>
                  <span className="bi-status-component-right">
                    {typeof comp.latency === "number" && (
                      <span className="bi-status-component-latency" data-band={band}>
                        {comp.latency} ms
                      </span>
                    )}
                    <span className="bi-status-component-state">
                      <span aria-hidden className="bi-status-component-pulse">
                        <span className="bi-status-component-dot" />
                      </span>
                      {comp.ok ? c.statusOperational : c.statusDegraded}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ SLA targets ═══ */}
        <section aria-labelledby="status-sla" style={{ marginBlock: space[7] }}>
          <div style={kickerStyle}>{c.slaKicker}</div>
          <h2 id="status-sla" style={sectionHeading}>{c.slaH}</h2>
          <p style={{ marginBlockStart: space[3], color: cssVar.textDim, maxWidth: "62ch" }}>
            {c.slaBody}
          </p>
          <div className="bi-status-sla-grid">
            {SLA_TARGETS.map((s) => (
              <div key={s.surface} className="bi-status-sla-card">
                <div className="bi-status-sla-surface">{s.surface}</div>
                <div className="bi-status-sla-target">{s.target}</div>
                <div className="bi-status-sla-window">{c.slaRolling(en ? s.window_en : s.window_es)}</div>
              </div>
            ))}
          </div>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ Historical uptime ═══ */}
        <section aria-labelledby="status-history" style={{ marginBlock: space[7] }}>
          <div style={kickerStyle}>{c.historyKicker}</div>
          <h2 id="status-history" style={sectionHeading}>{c.historyH}</h2>
          <div className="bi-status-history-note">
            <p style={{ margin: 0 }}>
              {c.historyBody}
              <a href={`mailto:${c.historyEmail}`} className="bi-status-inline-link">{c.historyEmail}</a>.
            </p>
          </div>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ Incidents ═══ */}
        <section aria-labelledby="status-incidents" style={{ marginBlock: space[7] }}>
          <div style={kickerStyle}>{c.incidentsKicker}</div>
          <h2 id="status-incidents" style={sectionHeading}>{c.incidentsH}</h2>
          {INCIDENTS.length === 0 ? (
            <div className="bi-status-incident-empty" role="status">
              <span aria-hidden className="bi-status-incident-empty-pulse">
                <span className="bi-status-incident-empty-dot" />
              </span>
              <div>
                <div className="bi-status-incident-empty-label">{c.incidentsEmptyLabel}</div>
                <p className="bi-status-incident-empty-body">
                  {c.incidentsEmptyBody(liveSinceDate)}
                </p>
              </div>
            </div>
          ) : (
            <ol className="bi-status-incident-list">
              {INCIDENTS.map((inc) => (
                <li key={inc.id} className="bi-status-incident" data-severity={inc.severity}>
                  <div className="bi-status-incident-head">
                    <strong>{inc.title}</strong>
                    <time dateTime={inc.startedAt}>
                      {fmtDateL(locale, new Date(inc.startedAt), { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </div>
                  <p className="bi-status-incident-body">{inc.summary}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA ═══ */}
      <section aria-labelledby="status-closing" className="bi-demo-closing-section">
        <Container size="lg" style={{ paddingBlock: `clamp(48px, 7vw, 96px)` }}>
          <IgnitionReveal sparkOrigin="50% 20%">
            <div className="bi-demo-closing">
              <div aria-hidden className="bi-demo-closing-lattice">
                <BioglyphLattice variant="ambient" />
              </div>
              <span aria-hidden className="bi-demo-closing-aura" />
              <span aria-hidden className="bi-demo-closing-aura bi-demo-closing-aura--spark" />

              <div className="bi-demo-closing-mark" aria-hidden>
                <span className="bi-demo-closing-mark-core" />
                <span className="bi-demo-closing-mark-ring" />
              </div>

              <div style={{ ...kickerStyle, marginBottom: space[4] }}>{c.closingKicker}</div>

              <h2 id="status-closing" className="bi-demo-closing-h">
                <span className="bi-demo-closing-h-lead">{c.closingHLead}</span>{" "}
                <span className="bi-demo-closing-h-body">{c.closingHBody}</span>
              </h2>

              <p className="bi-demo-closing-body">{c.closingBody}</p>

              <div className="bi-demo-closing-actions">
                <Link href="/status/feed.xml" className="bi-demo-closing-primary">
                  <span className="bi-demo-closing-primary-label">{c.closingPrimary}</span>
                  <span aria-hidden className="bi-demo-closing-primary-sep" />
                  <svg aria-hidden width="15" height="15" viewBox="0 0 15 15" className="bi-demo-closing-primary-arrow">
                    <path d="M2 13c0-6 5-11 11-11M2 8c0-3.3 2.7-6 6-6M3 13a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                  </svg>
                </Link>
                <Link href="mailto:status@bio-ignicion.app?subject=subscribe" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M1.5 3.5h10v6h-10z M1.5 3.5l5 3.5 5-3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingSecondary}</span>
                </Link>
                <Link href="/docs#webhooks" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M3 6.5a2.5 2.5 0 115 0v3M6.5 1.5v4M1.5 9.5h10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingTertiary}</span>
                </Link>
              </div>

              <div className="bi-demo-closing-meta">
                <div className="bi-demo-closing-avail">
                  <span aria-hidden className="bi-demo-closing-avail-pulse">
                    <span className="bi-demo-closing-avail-dot" />
                  </span>
                  <span className="bi-demo-closing-avail-label">{c.footerStatus}</span>
                  <span className="bi-demo-closing-avail-meta">{c.footerStatusMeta}</span>
                </div>
                <div className="bi-demo-closing-sig">
                  <span className="bi-demo-closing-sig-name">{c.lastCheck}</span>
                  <span className="bi-demo-closing-sig-meta">
                    {fmtDateL(locale, now, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
