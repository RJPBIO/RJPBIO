import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Subprocesadores",
  description: "Lista pública y auditable de subencargados. Notificamos cambios con 30 días de antelación.",
  alternates: { canonical: "/trust/subprocessors" },
  openGraph: {
    title: "BIO-IGNICIÓN · Subprocesadores",
    description: "Subencargados operacionales con propósito, región y DPA vigente.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const kickerStyle = {
  fontSize: font.size.xs,
  fontFamily: cssVar.fontMono,
  color: bioSignal.phosphorCyan,
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  fontWeight: font.weight.bold,
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(26px, 3.2vw, 36px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.12,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const SUBS = [
  { name: "Amazon Web Services", slug: "aws", purpose: { es: "Hosting, storage, KMS", en: "Hosting, storage, KMS" }, data: { es: "Datos cifrados en reposo", en: "Encrypted data at rest" }, region: "US / EU / APAC", dpa: "https://aws.amazon.com/service-terms/", category: "infra" },
  { name: "Vercel", slug: "vercel", purpose: { es: "Edge runtime, CDN", en: "Edge runtime, CDN" }, data: { es: "Tráfico HTTP + logs", en: "HTTP traffic + logs" }, region: "Global", dpa: "https://vercel.com/legal/dpa", category: "infra" },
  { name: "Cloudflare", slug: "cloudflare", purpose: { es: "WAF, DDoS, DNS", en: "WAF, DDoS, DNS" }, data: { es: "IP + headers (no cuerpo)", en: "IP + headers (no body)" }, region: "Global edge", dpa: "https://www.cloudflare.com/cloudflare-customer-dpa/", category: "infra" },
  { name: "Auth0 / Okta", slug: "auth0", purpose: { es: "Identidad OIDC / SAML", en: "OIDC / SAML identity" }, data: { es: "Email + credenciales federadas", en: "Email + federated credentials" }, region: "US / EU", dpa: "https://www.okta.com/trust/privacy/", category: "auth" },
  { name: "Stripe", slug: "stripe", purpose: { es: "Facturación y cobro", en: "Billing and payments" }, data: { es: "Datos de pago (nunca tocamos PAN)", en: "Payment data (we never touch PAN)" }, region: "US / EU", dpa: "https://stripe.com/legal/dpa", category: "billing" },
  { name: "Datadog", slug: "datadog", purpose: { es: "Observabilidad (sin PII)", en: "Observability (no PII)" }, data: { es: "Métricas + logs scrubados", en: "Metrics + scrubbed logs" }, region: "US / EU", dpa: "https://www.datadoghq.com/legal/dpa/", category: "ops" },
  { name: "Postmark", slug: "postmark", purpose: { es: "Email transaccional", en: "Transactional email" }, data: { es: "Email + contenido del mensaje", en: "Email + message content" }, region: "US", dpa: "https://postmarkapp.com/dpa", category: "ops" },
  { name: "Anthropic", slug: "anthropic", purpose: { es: "LLM Coach (opt-in · zero-retention)", en: "LLM Coach (opt-in · zero-retention)" }, data: { es: "Prompt del usuario (no training · zero-retention)", en: "User prompt (no training · zero-retention)" }, region: "US", dpa: "https://www.anthropic.com/legal/dpa", category: "ai" },
];

const CHANGELOG = [
  { date: "2026-04-20", tone: "initial", es: "Publicación inicial de la lista pública (ocho subencargados).", en: "Initial publication of the public list (eight subprocessors)." },
];

const CATEGORY_IDS = ["infra", "auth", "billing", "ops", "ai"];
const categoryCount = (id) => SUBS.filter((s) => s.category === id).length;

const COPY = {
  es: {
    crumbBack: "← Volver al Trust Center",
    eyebrow: "TRUST · SUBPROCESADORES",
    h1: "Subencargados, con propósito y región.",
    editorial: "Quién toca qué — y dónde firma la obligación.",
    p: "Lista completa y auditable de los subencargados operacionales que procesan datos personales para prestar el servicio. Cada uno está sujeto al DPA que firmamos contigo, con la misma obligación contractual de confidencialidad, seguridad y notificación de brechas.",
    updatedLabel: "ACTUALIZADA",
    updatedDate: "2026-04-20",
    updatedFmt: "20 · abril · 2026",
    noticeLabel: "AVISO",
    noticeValue: "30 días",
    countLabel: "SUBENCARGADOS",
    countValue: String(SUBS.length),
    contactLabel: "Cambios",
    contactEmail: "trust-announce@bio-ignicion.app",

    statsKicker: "RESUMEN",
    statsH: "Tres números que tu DPO puede revisar de un vistazo.",
    stats: [
      { v: String(SUBS.length), l: "Subencargados operacionales", s: "cada uno bajo DPA con el cliente" },
      { v: "30d", l: "Aviso anticipado", s: "antes de alta o cambio material de subencargado" },
      { v: "4", l: "Regiones de residencia", s: "US · EU · APAC · LATAM seleccionables por proyecto" },
    ],

    breakdownKicker: "DESGLOSE POR CATEGORÍA",
    breakdownH: "Cinco categorías, ocho proveedores.",

    anthropicKicker: "TRANSPARENCIA · IA",
    anthropicTitle: "El único subencargado que toca prompt de usuario es opt-in.",
    anthropicBody: "La funcionalidad de LLM Coach usa Anthropic como subencargado. Aplica únicamente si el usuario activa la capa de IA — no hay llamadas al modelo con datos de clientes fuera de esa acción explícita. Política de zero-retention contractual: Anthropic no almacena el prompt después de devolver la respuesta, y no lo usa para entrenar modelos.",
    anthropicChips: [
      { k: "Opt-in", v: "El usuario activa la capa explícitamente" },
      { k: "Zero-retention", v: "No hay almacenamiento del prompt" },
      { k: "Sin training", v: "Anthropic no entrena con datos de clientes" },
    ],
    anthropicCta: "Leer el DPA de Anthropic",
    anthropicCtaHref: "https://www.anthropic.com/legal/dpa",

    tableKicker: "LISTA",
    tableH: "Los ocho subencargados operacionales.",
    tableIntro: "Todos procesan datos personales bajo contrato con obligaciones equivalentes a las del DPA principal. Ninguno vende ni cede los datos a terceros. Cada fila es citable por ID (#sub-stripe, #sub-anthropic, etc.).",
    tableHead: {
      provider: "Proveedor",
      purpose: "Propósito + datos tocados",
      region: "Región",
      dpa: "DPA vigente",
    },
    categoryLabels: {
      infra: "INFRAESTRUCTURA",
      auth: "IDENTIDAD",
      billing: "FACTURACIÓN",
      ops: "OPERACIÓN",
      ai: "IA · OPT-IN",
    },
    dpaLink: "Ver DPA",
    anchorLabel: "Copiar enlace permanente",

    changelogKicker: "CAMBIOS",
    changelogH: "Historia pública de esta lista.",
    changelogIntro: "Cada alta, baja o cambio material se registra aquí y se notifica por email 30 días antes.",
    changelogToneLabels: {
      initial: "PUBLICACIÓN INICIAL",
      add: "ALTA",
      remove: "BAJA",
      change: "CAMBIO",
    },

    changesKicker: "SUSCRIPCIÓN",
    changesH: "Recibe los cambios antes de que apliquen.",
    changesBody: "Publicamos altas, bajas y cambios materiales de subencargados en esta página con 30 días de antelación. Para recibirlos también por email, suscríbete a la lista de trust-announce.",
    changesPrimary: "Suscribirse a cambios",
    changesPrimaryHref: "mailto:trust-announce@bio-ignicion.app?subject=Subscribe%20to%20subprocessor%20changes",
    changesSecondary: "Leer DPA",
    changesSecondaryHref: "/trust/dpa",
    changesNote: "Puedes objetar un nuevo subencargado por escrito durante la ventana de aviso.",

    legalKicker: "AVISO LEGAL · ALCANCE",
    legalHint: "Leer",
    legalItems: [
      "No vendemos ni cedemos tus datos personales a terceros para marketing ni venta. Los subencargados listados arriba son operacionales y necesarios para prestar el servicio; todos están sujetos al DPA.",
      "La categoría «IA · opt-in» aplica únicamente cuando el cliente o usuario activa explícitamente la funcionalidad de LLM Coach. No entrenamos modelos con datos de clientes — el DPA lo formaliza por escrito.",
      "Las marcas mencionadas (AWS, Vercel, Stripe, Anthropic, Auth0, Okta, Datadog, Postmark, Cloudflare) pertenecen a sus respectivos titulares. Su mención tiene propósito informativo sobre el tratamiento de datos y no implica asociación ni respaldo comercial.",
      "La fecha de última actualización (2026-04-20) refleja el estado al día de la publicación. Los cambios materiales se notifican en esta página y por email a la lista de trust-announce con 30 días de antelación.",
    ],
    legalTailLink: "Documentos vinculantes:",
    legalTailLinks: [
      { label: "Trust Center", href: "/trust" },
      { label: "DPA", href: "/trust/dpa" },
      { label: "Privacidad", href: "/privacy" },
    ],
  },

  en: {
    crumbBack: "← Back to Trust Center",
    eyebrow: "TRUST · SUBPROCESSORS",
    h1: "Subprocessors, with purpose and region.",
    editorial: "Who touches what — and where the obligation is signed.",
    p: "Complete auditable list of the operational subprocessors that process personal data to deliver the service. Each is subject to the DPA we sign with you, with equivalent contractual obligations of confidentiality, security and breach notification.",
    updatedLabel: "UPDATED",
    updatedDate: "2026-04-20",
    updatedFmt: "April 20, 2026",
    noticeLabel: "NOTICE",
    noticeValue: "30 days",
    countLabel: "SUBPROCESSORS",
    countValue: String(SUBS.length),
    contactLabel: "Changes",
    contactEmail: "trust-announce@bio-ignicion.app",

    statsKicker: "AT A GLANCE",
    statsH: "Three numbers your DPO can verify at a glance.",
    stats: [
      { v: String(SUBS.length), l: "Operational subprocessors", s: "each bound by DPA with the customer" },
      { v: "30d", l: "Advance notice", s: "before onboarding or material change of a subprocessor" },
      { v: "4", l: "Residency regions", s: "US · EU · APAC · LATAM selectable per project" },
    ],

    breakdownKicker: "BREAKDOWN BY CATEGORY",
    breakdownH: "Five categories, eight providers.",

    anthropicKicker: "AI · TRANSPARENCY",
    anthropicTitle: "The only subprocessor that touches user prompts is opt-in.",
    anthropicBody: "The LLM Coach feature uses Anthropic as a subprocessor. It applies only when the user enables the AI layer — there are no model calls with customer data outside that explicit action. Contractual zero-retention policy: Anthropic does not store the prompt after returning the response, and does not use it to train models.",
    anthropicChips: [
      { k: "Opt-in", v: "User enables the layer explicitly" },
      { k: "Zero-retention", v: "No prompt storage" },
      { k: "No training", v: "Anthropic does not train on customer data" },
    ],
    anthropicCta: "Read Anthropic's DPA",
    anthropicCtaHref: "https://www.anthropic.com/legal/dpa",

    tableKicker: "LIST",
    tableH: "The eight operational subprocessors.",
    tableIntro: "All process personal data under contract with obligations equivalent to the master DPA. None sells or transfers data to third parties. Each row is citable by ID (#sub-stripe, #sub-anthropic, etc.).",
    tableHead: {
      provider: "Provider",
      purpose: "Purpose + data touched",
      region: "Region",
      dpa: "Active DPA",
    },
    categoryLabels: {
      infra: "INFRASTRUCTURE",
      auth: "IDENTITY",
      billing: "BILLING",
      ops: "OPERATIONS",
      ai: "AI · OPT-IN",
    },
    dpaLink: "View DPA",
    anchorLabel: "Copy permanent link",

    changelogKicker: "CHANGELOG",
    changelogH: "Public history of this list.",
    changelogIntro: "Every addition, removal or material change is logged here and notified by email 30 days in advance.",
    changelogToneLabels: {
      initial: "INITIAL PUBLICATION",
      add: "ADDED",
      remove: "REMOVED",
      change: "CHANGED",
    },

    changesKicker: "SUBSCRIBE",
    changesH: "Get changes before they apply.",
    changesBody: "We publish additions, removals and material changes to subprocessors on this page 30 days in advance. To also receive them by email, subscribe to the trust-announce list.",
    changesPrimary: "Subscribe to changes",
    changesPrimaryHref: "mailto:trust-announce@bio-ignicion.app?subject=Subscribe%20to%20subprocessor%20changes",
    changesSecondary: "Read DPA",
    changesSecondaryHref: "/trust/dpa",
    changesNote: "You can object to a new subprocessor in writing during the notice window.",

    legalKicker: "LEGAL NOTICE · SCOPE",
    legalHint: "Read",
    legalItems: [
      "We do not sell or share your personal data with third parties for marketing or sale. The subprocessors listed above are operational and necessary to deliver the service; all are subject to the DPA.",
      "The «AI · opt-in» category applies only when the customer or user explicitly activates the LLM Coach feature. We do not train models on customer data — the DPA formalizes this in writing.",
      "The mentioned trademarks (AWS, Vercel, Stripe, Anthropic, Auth0, Okta, Datadog, Postmark, Cloudflare) belong to their respective owners. Their mention is informational about data processing and does not imply partnership or commercial endorsement.",
      "The last-updated date (2026-04-20) reflects status as of publication. Material changes are notified on this page and by email to the trust-announce list 30 days in advance.",
    ],
    legalTailLink: "Binding documents:",
    legalTailLinks: [
      { label: "Trust Center", href: "/trust" },
      { label: "DPA", href: "/trust/dpa" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
};

export default async function Subprocessors() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];

  return (
    <PublicShell activePath="/trust/subprocessors">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <div style={{ position: "relative", paddingBlock: space[8] }}>
          <div aria-hidden className="bi-trust-lattice">
            <BioglyphLattice variant="ambient" />
          </div>

          <IgnitionReveal sparkOrigin="30% 40%">
            <div style={{ position: "relative", zIndex: 1, maxInlineSize: 760 }}>
              <Link href="/trust" className="bi-trust-crumb">
                <span aria-hidden>←</span> {c.crumbBack}
              </Link>
              <div style={{ ...kickerStyle, marginBlockStart: space[3] }}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 62px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.04,
                }}
              >
                {c.h1}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2.2vw, 22px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  margin: `0 0 ${space[4]}px`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ margin: `0 0 ${space[5]}px`, lineHeight: 1.6, color: cssVar.textDim }}>
                {c.p}
              </p>

              <div className="bi-trust-meta" role="group" aria-label={c.updatedLabel}>
                <span className="bi-trust-meta-kicker">{c.updatedLabel}</span>
                <time className="bi-trust-meta-time" dateTime={c.updatedDate}>{c.updatedFmt}</time>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.noticeLabel}</span>
                <span className="bi-trust-meta-time">{c.noticeValue}</span>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.countLabel}</span>
                <span className="bi-trust-meta-time">{c.countValue}</span>
                <span className="bi-trust-meta-dot" aria-hidden>·</span>
                <span className="bi-trust-meta-kicker">{c.contactLabel}</span>
                <a className="bi-trust-meta-mail" href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a>
              </div>
            </div>
          </IgnitionReveal>
        </div>
      </Container>

      {/* ═══ Proof stats ═══ */}
      <section aria-label={c.statsKicker} style={{ marginBlockStart: space[6] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-trust-live-kicker" role="status" aria-live="off">
            <span className="bi-trust-live-dot" aria-hidden />
            <span className="bi-trust-live-label">LIVE</span>
            <span className="bi-trust-live-sep" aria-hidden>·</span>
            <span className="bi-trust-live-when">{c.updatedLabel} {c.updatedFmt}</span>
          </div>
          <div className="bi-proof-stats">
            {c.stats.map((s) => (
              <div key={s.l}>
                <span className="v">{s.v}</span>
                <span className="l">{s.l}</span>
                <span className="s">{s.s}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ Category breakdown ═══ */}
      <section aria-labelledby="subs-breakdown" style={{ paddingBlockStart: space[7], paddingInline: space[5] }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[5] }}>
              <div style={kickerStyle}>{c.breakdownKicker}</div>
              <h2 id="subs-breakdown" style={{ ...sectionHeading, fontSize: "clamp(22px, 2.6vw, 28px)" }}>{c.breakdownH}</h2>
            </div>
            <ul className="bi-trust-breakdown" role="list">
              {CATEGORY_IDS.map((id) => (
                <li key={id} className="bi-trust-breakdown-chip" data-cat={id}>
                  <span className="bi-trust-breakdown-count">{categoryCount(id)}</span>
                  <span className="bi-trust-breakdown-label">{c.categoryLabels[id]}</span>
                </li>
              ))}
            </ul>
          </IgnitionReveal>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Anthropic / AI transparency callout ═══ */}
      <section aria-labelledby="subs-anthropic" style={{ paddingInline: space[5], paddingBlockEnd: space[5] }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div className="bi-trust-ai-callout">
              <div className="bi-trust-ai-callout-head">
                <span className="bi-trust-ai-callout-kicker">{c.anthropicKicker}</span>
                <h2 id="subs-anthropic" className="bi-trust-ai-callout-title">{c.anthropicTitle}</h2>
              </div>
              <p className="bi-trust-ai-callout-body">{c.anthropicBody}</p>
              <ul className="bi-trust-ai-chips" role="list">
                {c.anthropicChips.map((ch) => (
                  <li key={ch.k} className="bi-trust-ai-chip">
                    <span className="bi-trust-ai-chip-k">{ch.k}</span>
                    <span className="bi-trust-ai-chip-v">{ch.v}</span>
                  </li>
                ))}
              </ul>
              <a
                className="bi-trust-ai-callout-cta"
                href={c.anthropicCtaHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.anthropicCta} <span aria-hidden>↗</span>
              </a>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Table ═══ */}
      <section className="bi-trust-section bi-trust-section--tint" aria-labelledby="subs-table" style={{ paddingBlock: space[9], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="lg">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[6] }}>
              <div style={kickerStyle}>{c.tableKicker}</div>
              <h2 id="subs-table" style={sectionHeading}>{c.tableH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 640,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.tableIntro}
              </p>
            </div>
            <div className="bi-trust-table-wrap">
              <table className="bi-trust-table bi-trust-table--subs">
                <thead>
                  <tr>
                    <th scope="col">{c.tableHead.provider}</th>
                    <th scope="col">{c.tableHead.purpose}</th>
                    <th scope="col">{c.tableHead.region}</th>
                    <th scope="col">{c.tableHead.dpa}</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBS.map((s) => (
                    <tr key={s.name} id={`sub-${s.slug}`} data-sub-cat={s.category}>
                      <th scope="row" className="bi-trust-table-rowh">
                        <span className="bi-trust-sub-name">
                          {s.name}
                          <a className="bi-trust-anchor" href={`#sub-${s.slug}`} aria-label={c.anchorLabel}>#</a>
                        </span>
                        <span className="bi-trust-sub-cat" data-cat={s.category}>
                          {c.categoryLabels[s.category]}
                        </span>
                      </th>
                      <td>
                        <span className="bi-trust-sub-purpose">{s.purpose[L]}</span>
                        <span className="bi-trust-sub-data">{s.data[L]}</span>
                      </td>
                      <td className="bi-trust-table-target">{s.region}</td>
                      <td>
                        <a
                          className="bi-trust-sub-dpa"
                          href={s.dpa}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {c.dpaLink} <span aria-hidden>↗</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Changelog ═══ */}
      <section aria-labelledby="subs-changelog" style={{ paddingBlock: space[8], paddingInline: space[5], scrollMarginBlockStart: 80 }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center", marginBlockEnd: space[5] }}>
              <div style={kickerStyle}>{c.changelogKicker}</div>
              <h2 id="subs-changelog" style={{ ...sectionHeading, fontSize: "clamp(22px, 2.6vw, 28px)" }}>{c.changelogH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 560,
                color: cssVar.textDim,
                fontSize: font.size.sm,
                lineHeight: 1.6,
              }}>
                {c.changelogIntro}
              </p>
            </div>
            <ol className="bi-trust-changelog" role="list">
              {CHANGELOG.map((e) => (
                <li key={e.date} className="bi-trust-changelog-item" data-tone={e.tone}>
                  <time className="bi-trust-changelog-date" dateTime={e.date}>{e.date}</time>
                  <span className="bi-trust-changelog-tag">{c.changelogToneLabels[e.tone]}</span>
                  <span className="bi-trust-changelog-body">{e[L]}</span>
                </li>
              ))}
            </ol>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Subscribe to changes ═══ */}
      <section className="bi-trust-section bi-trust-section--tint bi-trust-section--tint-alt" aria-labelledby="subs-changes" style={{ paddingBlock: space[8], paddingInline: space[5] }}>
        <Container size="md">
          <IgnitionReveal sparkOrigin="50% 30%">
            <div style={{ textAlign: "center" }}>
              <div style={kickerStyle}>{c.changesKicker}</div>
              <h2 id="subs-changes" style={sectionHeading}>{c.changesH}</h2>
              <p style={{
                marginBlockStart: space[3],
                marginInline: "auto",
                maxInlineSize: 600,
                color: cssVar.textDim,
                fontSize: font.size.md,
                lineHeight: 1.6,
              }}>
                {c.changesBody}
              </p>
              <div className="bi-trust-hero-ctas" style={{ justifyContent: "center", marginBlockStart: space[5] }}>
                <a className="bi-trust-hero-cta bi-trust-hero-cta--primary" href={c.changesPrimaryHref}>
                  {c.changesPrimary}
                  <span className="bi-trust-hero-cta-arrow" aria-hidden>→</span>
                </a>
                <Link className="bi-trust-hero-cta bi-trust-hero-cta--ghost" href={c.changesSecondaryHref}>
                  {c.changesSecondary}
                </Link>
              </div>
              <span className="bi-trust-hero-cta-note" style={{ display: "block", marginBlockStart: space[3] }}>
                {c.changesNote}
              </span>
            </div>
          </IgnitionReveal>
        </Container>
      </section>

      {/* ═══ Legal disclaimer ═══ */}
      <Container size="md" style={{ paddingInline: space[5], paddingBlockEnd: space[8], paddingBlockStart: space[7] }}>
        <details className="bi-pricing-legal" role="note">
          <summary className="bi-pricing-legal-summary">
            <span className="bi-pricing-legal-kicker">{c.legalKicker}</span>
            <span className="bi-pricing-legal-hint">
              {c.legalHint}
              <span className="chev" aria-hidden>▾</span>
            </span>
          </summary>
          <ul className="bi-trust-legal-list">
            {c.legalItems.map((item, i) => <li key={i}>{item}</li>)}
            <li>
              {c.legalTailLink}{" "}
              {c.legalTailLinks.map((l, i) => (
                <span key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                  {i < c.legalTailLinks.length - 1 ? " · " : "."}
                </span>
              ))}
            </li>
          </ul>
        </details>
      </Container>
    </PublicShell>
  );
}
