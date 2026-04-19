import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font } from "@/components/ui/tokens";
import { tLocale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Precios",
  description: "Planes B2B para equipos que entrenan el sistema nervioso. Seats anuales con descuento por volumen.",
  openGraph: {
    title: "BIO-IGNICIÓN · Precios",
    description: "Starter, Growth, Enterprise. Menos fricción, más entrenamiento.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const COPY = {
  es: {
    eyebrow: "Precios",
    title: "Menos fricción, más entrenamiento",
    sub: "Pagas por usuario activo. 20 % de descuento en facturación anual. Sin setup fees, sin mínimos.",
    unit: "por usuario / mes",
    unitYear: "facturación anual",
    annualHint: (m, a) => `o ${a} / mes con facturación anual · ahorra 20 %`,
    featured: "Más elegido",
    faqTitle: "Preguntas frecuentes",
    plans: {
      starter: {
        tagline: "Para equipos de hasta 25 personas que quieren empezar.",
        features: [
          "Protocolos neurales ilimitados",
          "Audio + haptics + binaural",
          "Dashboard personal con histórico",
          "PWA local-first (offline)",
          "Soporte por email (48 h SLA)",
        ],
        cta: "Empezar",
      },
      growth: {
        tagline: "Para empresas con equipos distribuidos que miden impacto.",
        features: [
          "Todo en Starter",
          "Panel de equipo con k-anonymity ≥5",
          "Tap-to-Ignite (estaciones físicas NFC/QR)",
          "Reporte NOM-035 automatizado",
          "Integraciones Slack + Google Calendar",
          "API pública + webhooks",
          "SSO (Google, Microsoft)",
        ],
        cta: "Agenda demo",
      },
      enterprise: {
        tagline: "Para organizaciones con requisitos de compliance y seguridad.",
        features: [
          "Todo en Growth",
          "SAML + SCIM 2.0 + federación OIDC",
          "DPA negociable + BAA (HIPAA)",
          "Audit log verificable (hash chain)",
          "Residencia de datos (US, EU, LATAM)",
          "99.95 % uptime SLA",
          "Gerente de cuenta dedicado",
          "Pentest anual + SOC 2 Type II",
        ],
        cta: "Hablar con ventas",
      },
    },
    faqs: [
      { q: "¿Puedo cambiar de plan sin costo?", a: "Sí, los upgrades aplican de inmediato (prorrateo). Los downgrades al próximo ciclo." },
      { q: "¿Qué pasa con mis datos si cancelo?", a: "Exportas en JSON + CSV desde el panel; eliminamos los datos a los 30 días (o al momento, según DPA)." },
      { q: "¿Facturan en MXN?", a: "Sí. Stripe soporta MXN, USD, EUR y CAD. CFDI 4.0 disponible para clientes mexicanos." },
      { q: "¿Es HIPAA / GDPR compliant?", a: "Growth y Enterprise cumplen GDPR (procesamiento en EU opcional). HIPAA requiere BAA — disponible en Enterprise." },
    ],
  },
  en: {
    eyebrow: "Pricing",
    title: "Less friction, more training",
    sub: "You pay per active user. 20% off on annual billing. No setup fees, no minimums.",
    unit: "per user / month",
    unitYear: "annual billing",
    annualHint: (m, a) => `or ${a} / mo billed annually · save 20%`,
    featured: "Most chosen",
    faqTitle: "Frequently asked questions",
    plans: {
      starter: {
        tagline: "For teams of up to 25 people getting started.",
        features: [
          "Unlimited neural protocols",
          "Audio + haptics + binaural",
          "Personal dashboard with history",
          "Local-first PWA (offline)",
          "Email support (48 h SLA)",
        ],
        cta: "Get started",
      },
      growth: {
        tagline: "For companies with distributed teams that measure impact.",
        features: [
          "Everything in Starter",
          "Team panel with k-anonymity ≥5",
          "Tap-to-Ignite (physical NFC/QR stations)",
          "Automated NOM-035 report",
          "Slack + Google Calendar integrations",
          "Public API + webhooks",
          "SSO (Google, Microsoft)",
        ],
        cta: "Book a demo",
      },
      enterprise: {
        tagline: "For organizations with compliance and security requirements.",
        features: [
          "Everything in Growth",
          "SAML + SCIM 2.0 + OIDC federation",
          "Negotiable DPA + BAA (HIPAA)",
          "Verifiable audit log (hash chain)",
          "Data residency (US, EU, LATAM)",
          "99.95% uptime SLA",
          "Dedicated account manager",
          "Annual pentest + SOC 2 Type II",
        ],
        cta: "Talk to sales",
      },
    },
    faqs: [
      { q: "Can I change plans at no cost?", a: "Yes — upgrades apply immediately (prorated). Downgrades take effect next cycle." },
      { q: "What happens to my data if I cancel?", a: "You export JSON + CSV from the panel; we delete data within 30 days (or immediately, per your DPA)." },
      { q: "Do you bill in MXN?", a: "Yes. Stripe supports MXN, USD, EUR and CAD. CFDI 4.0 available for Mexican customers." },
      { q: "Is it HIPAA / GDPR compliant?", a: "Growth and Enterprise are GDPR-compliant (optional EU processing). HIPAA requires a BAA — available on Enterprise." },
    ],
  },
};

export default async function PricingPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const fmt = (n) => `$ ${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.00$/, "")}`;
  const annualOf = (monthly) => fmt(monthly * 0.8);
  const plans = [
    { id: "starter", name: "Starter", priceMonthly: 9, price: "$ 9", unit: c.unit, tagline: c.plans.starter.tagline, features: c.plans.starter.features, cta: { href: "/signup", label: c.plans.starter.cta }, featured: false },
    { id: "growth", name: "Growth", priceMonthly: 19, price: "$ 19", unit: c.unit, tagline: c.plans.growth.tagline, features: c.plans.growth.features, cta: { href: "/demo", label: c.plans.growth.cta }, featured: true },
    { id: "enterprise", name: "Enterprise", priceMonthly: null, price: "Custom", unit: c.unitYear, tagline: c.plans.enterprise.tagline, features: c.plans.enterprise.features, cta: { href: "mailto:enterprise@bio-ignicion.app", label: c.plans.enterprise.cta }, featured: false },
  ];
  return (
    <PublicShell activePath="/pricing">
      <Container size="xl" className="bi-prose">
        <header style={{ textAlign: "center", marginBottom: space[10] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            {c.eyebrow}
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>{c.title}</h1>
          <p style={{ maxWidth: 640, marginInline: "auto" }}>{c.sub}</p>
        </header>

        <section
          aria-label={L === "en" ? "Plans" : "Planes"}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: space[5] }}
        >
          {plans.map((p) => (
            <Card as="article" key={p.id} featured={p.featured} aria-labelledby={`plan-${p.id}`} padding={6}>
              {p.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    insetInlineStart: 20,
                    background: cssVar.accent,
                    color: cssVar.accentInk,
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: font.weight.bold,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {c.featured}
                </div>
              )}
              <h2 id={`plan-${p.id}`} style={{ margin: 0, fontSize: 22 }}>{p.name}</h2>
              <p style={{ minHeight: 52, color: cssVar.textDim, fontSize: 13, lineHeight: 1.5 }}>{p.tagline}</p>
              <div style={{ marginBlockStart: space[3], display: "flex", alignItems: "baseline", gap: space[2] }}>
                <span style={{ fontSize: 42, fontWeight: font.weight.black, fontFamily: cssVar.fontMono, letterSpacing: "-1px" }}>
                  {p.price}
                </span>
                <span style={{ fontSize: 13, color: cssVar.textDim }}>{p.unit}</span>
              </div>
              <p
                aria-live="polite"
                style={{
                  minHeight: 18,
                  margin: `${space[1]}px 0 ${space[3]}px`,
                  fontSize: 12,
                  color: cssVar.textMuted,
                }}
              >
                {p.priceMonthly ? c.annualHint(fmt(p.priceMonthly), annualOf(p.priceMonthly)) : "\u00A0"}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: `0 0 ${space[5]}px`, fontSize: 14, lineHeight: 1.8 }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: space[2] }}>
                    <span aria-hidden style={{ color: cssVar.accent }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant={p.featured ? "primary" : "secondary"} href={p.cta.href} block>
                {p.cta.label}
              </Button>
            </Card>
          ))}
        </section>

        <section aria-labelledby="faq" style={{ marginTop: space[12], maxWidth: 720, marginInline: "auto" }}>
          <h2 id="faq" style={{ marginBottom: space[4] }}>{c.faqTitle}</h2>
          {c.faqs.map((f, i) => (
            <details key={i} style={{ borderTop: `1px solid ${cssVar.border}`, padding: "4px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: font.weight.semibold, padding: "10px 0" }}>{f.q}</summary>
              <p style={{ margin: `${space[1]}px 0 ${space[2]}px` }}>{f.a}</p>
            </details>
          ))}
        </section>
      </Container>
    </PublicShell>
  );
}
