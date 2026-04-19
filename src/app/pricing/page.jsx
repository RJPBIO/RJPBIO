import { Fragment } from "react";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import PricingCards from "./PricingCards";

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
    cadenceLabel: "Facturación",
    cadenceMonthly: "Mensual",
    cadenceAnnual: "Anual · −20 %",
    plansLabel: "Planes",
    unitMonthly: "por usuario / mes",
    unitAnnualBilled: "por usuario / mes · anual",
    unitYear: "facturación anual",
    featured: "Más elegido",
    savingsHint: (m, a) => `${a} × 12 en vez de ${m} × 12 · ahorras 20 %`,
    crossSellHint: (a) => `o ${a} / mes con facturación anual · ahorra 20 %`,
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
    compareTitle: "Comparativa completa",
    compareCols: ["Starter", "Growth", "Enterprise"],
    compareGroups: [
      {
        title: "Plataforma",
        rows: [
          ["Protocolos neurales ilimitados", true, true, true],
          ["Audio + haptics + binaural", true, true, true],
          ["PWA offline (local-first)", true, true, true],
          ["Histórico personal", true, true, true],
          ["Límite de asientos", "25", "250", "Sin límite"],
        ],
      },
      {
        title: "Equipos y analytics",
        rows: [
          ["Panel de equipo (k-anonymity ≥5)", false, true, true],
          ["Tap-to-Ignite (estaciones NFC/QR)", false, true, true],
          ["Reporte NOM-035 automatizado", false, true, true],
          ["Exportación de datos", "Personal", "Equipo", "Organización"],
        ],
      },
      {
        title: "API e integraciones",
        rows: [
          ["API pública REST", false, true, true],
          ["Webhooks firmados HMAC", false, true, true],
          ["Slack + Google Calendar", false, true, true],
          ["SSO (Google, Microsoft)", false, true, true],
          ["SAML / OIDC federado", false, false, true],
          ["SCIM 2.0", false, false, true],
        ],
      },
      {
        title: "Seguridad y compliance",
        rows: [
          ["Cifrado AES-256 en reposo + TLS 1.3", true, true, true],
          ["Audit log (hash chain)", false, "Estándar", "Verificable"],
          ["DPA", false, "Estándar", "Negociable"],
          ["Residencia de datos (US/EU/LATAM)", false, false, true],
          ["BAA (HIPAA)", false, false, true],
          ["SOC 2 Type II", false, false, true],
        ],
      },
      {
        title: "Soporte y SLA",
        rows: [
          ["Respuesta email", "48 h", "24 h", "4 h"],
          ["Chat en vivo", false, true, true],
          ["Gerente de cuenta dedicado", false, false, true],
          ["Onboarding", "Self-serve", "Guiado", "Dedicado"],
          ["Uptime SLA", "99.9 %", "99.9 %", "99.95 %"],
        ],
      },
    ],
    trustTitle: "Cumplimiento y confianza",
    trustSub: "Los controles que ya vienen por default y los que se activan con tu plan.",
    trustBadges: [
      { label: "SOC 2 Type II", hint: "Auditoría anual · Enterprise" },
      { label: "GDPR", hint: "Residencia UE opcional" },
      { label: "HIPAA", hint: "BAA disponible" },
      { label: "NOM-035 STPS", hint: "Reporte automatizado" },
      { label: "CFDI 4.0", hint: "Facturación MX" },
      { label: "Audit log", hint: "Hash chain verificable" },
    ],
    faqs: [
      { q: "¿Puedo cambiar de plan sin costo?", a: "Sí. Los upgrades aplican de inmediato con prorrateo automático; los downgrades toman efecto al próximo ciclo, sin penalizaciones." },
      { q: "¿Qué pasa con mis datos si cancelo?", a: "Exportas en JSON + CSV desde el panel antes de terminar el ciclo. Eliminamos los datos a los 30 días — o al momento si tu DPA lo especifica." },
      { q: "¿Facturan en MXN?", a: "Sí. Stripe soporta MXN, USD, EUR y CAD. Emitimos CFDI 4.0 para clientes mexicanos; solo necesitamos tu RFC y uso de CFDI." },
      { q: "¿Es HIPAA / GDPR compliant?", a: "Growth y Enterprise cumplen GDPR con residencia de datos en UE opcional. HIPAA requiere BAA firmado — disponible únicamente en Enterprise." },
      { q: "¿Cómo se cuenta un \"usuario activo\"?", a: "Un usuario que completó al menos una sesión en los últimos 30 días. Los invitados que nunca entraron no se cobran." },
      { q: "¿Tienen trial gratuito?", a: "Starter incluye 14 días de trial sin tarjeta. Growth ofrece un piloto de 30 días con hasta 10 asientos para que tu equipo lo evalúe." },
      { q: "¿Aceptan transferencia o NET 30?", a: "Enterprise: sí, con factura mensual y términos NET 30. Starter y Growth se pagan con tarjeta vía Stripe." },
      { q: "¿Qué pasa si excedo el límite de asientos?", a: "Te avisamos al 80 % y 100 % de tu cuota. No bloqueamos accesos — facturamos el overage proporcional al ciclo actual." },
    ],
  },
  en: {
    eyebrow: "Pricing",
    title: "Less friction, more training",
    sub: "You pay per active user. 20% off on annual billing. No setup fees, no minimums.",
    cadenceLabel: "Billing",
    cadenceMonthly: "Monthly",
    cadenceAnnual: "Annual · −20%",
    plansLabel: "Plans",
    unitMonthly: "per user / mo",
    unitAnnualBilled: "per user / mo · annual",
    unitYear: "annual billing",
    featured: "Most chosen",
    savingsHint: (m, a) => `${a} × 12 instead of ${m} × 12 · you save 20%`,
    crossSellHint: (a) => `or ${a} / mo billed annually · save 20%`,
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
    compareTitle: "Full comparison",
    compareCols: ["Starter", "Growth", "Enterprise"],
    compareGroups: [
      {
        title: "Platform",
        rows: [
          ["Unlimited neural protocols", true, true, true],
          ["Audio + haptics + binaural", true, true, true],
          ["Offline PWA (local-first)", true, true, true],
          ["Personal history", true, true, true],
          ["Seat limit", "25", "250", "Unlimited"],
        ],
      },
      {
        title: "Teams & analytics",
        rows: [
          ["Team panel (k-anonymity ≥5)", false, true, true],
          ["Tap-to-Ignite (NFC/QR stations)", false, true, true],
          ["Automated NOM-035 report", false, true, true],
          ["Data export", "Personal", "Team", "Organization"],
        ],
      },
      {
        title: "API & integrations",
        rows: [
          ["Public REST API", false, true, true],
          ["HMAC-signed webhooks", false, true, true],
          ["Slack + Google Calendar", false, true, true],
          ["SSO (Google, Microsoft)", false, true, true],
          ["SAML / OIDC federation", false, false, true],
          ["SCIM 2.0", false, false, true],
        ],
      },
      {
        title: "Security & compliance",
        rows: [
          ["AES-256 at rest + TLS 1.3", true, true, true],
          ["Audit log (hash chain)", false, "Standard", "Verifiable"],
          ["DPA", false, "Standard", "Negotiable"],
          ["Data residency (US/EU/LATAM)", false, false, true],
          ["BAA (HIPAA)", false, false, true],
          ["SOC 2 Type II", false, false, true],
        ],
      },
      {
        title: "Support & SLA",
        rows: [
          ["Email response", "48 h", "24 h", "4 h"],
          ["Live chat", false, true, true],
          ["Dedicated account manager", false, false, true],
          ["Onboarding", "Self-serve", "Guided", "Dedicated"],
          ["Uptime SLA", "99.9%", "99.9%", "99.95%"],
        ],
      },
    ],
    trustTitle: "Compliance & trust",
    trustSub: "The controls that ship by default — and the ones your plan unlocks.",
    trustBadges: [
      { label: "SOC 2 Type II", hint: "Annual audit · Enterprise" },
      { label: "GDPR", hint: "Optional EU residency" },
      { label: "HIPAA", hint: "BAA available" },
      { label: "NOM-035 STPS", hint: "Automated report" },
      { label: "CFDI 4.0", hint: "MX invoicing" },
      { label: "Audit log", hint: "Verifiable hash chain" },
    ],
    faqs: [
      { q: "Can I change plans at no cost?", a: "Yes. Upgrades apply immediately with automatic proration; downgrades take effect next cycle — no penalties." },
      { q: "What happens to my data if I cancel?", a: "You export JSON + CSV from the panel before your cycle ends. We delete data within 30 days — or immediately if your DPA specifies so." },
      { q: "Do you bill in MXN?", a: "Yes. Stripe supports MXN, USD, EUR and CAD. We issue CFDI 4.0 for Mexican customers — we just need your RFC and CFDI use code." },
      { q: "Is it HIPAA / GDPR compliant?", a: "Growth and Enterprise are GDPR-compliant with optional EU data residency. HIPAA requires a signed BAA — available only on Enterprise." },
      { q: "How is an \"active user\" counted?", a: "A user who completed at least one session in the last 30 days. Invited users who never logged in are not billed." },
      { q: "Do you offer a free trial?", a: "Starter includes a 14-day trial with no credit card. Growth offers a 30-day pilot with up to 10 seats so your team can evaluate it." },
      { q: "Do you accept wire transfer or NET 30?", a: "Enterprise: yes, with monthly invoicing and NET 30 terms. Starter and Growth are paid by card via Stripe." },
      { q: "What if I exceed my seat limit?", a: "We alert you at 80% and 100% of your quota. We don't block access — we bill overage prorated to the current cycle." },
    ],
  },
};

export default async function PricingPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];

  const plans = [
    {
      id: "starter",
      name: "Starter",
      priceMonthly: 9,
      tagline: c.plans.starter.tagline,
      features: c.plans.starter.features,
      cta: { href: "/signup", label: c.plans.starter.cta },
      featured: false,
    },
    {
      id: "growth",
      name: "Growth",
      priceMonthly: 19,
      tagline: c.plans.growth.tagline,
      features: c.plans.growth.features,
      cta: { href: "/demo", label: c.plans.growth.cta },
      featured: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceMonthly: null,
      customLabel: "Custom",
      tagline: c.plans.enterprise.tagline,
      features: c.plans.enterprise.features,
      cta: { href: "mailto:enterprise@bio-ignicion.app", label: c.plans.enterprise.cta },
      featured: false,
    },
  ];

  const cardsCopy = {
    featured: c.featured,
    cadenceLabel: c.cadenceLabel,
    cadenceMonthly: c.cadenceMonthly,
    cadenceAnnual: c.cadenceAnnual,
    plansLabel: c.plansLabel,
    unitMonthly: c.unitMonthly,
    unitAnnualBilled: c.unitAnnualBilled,
    unitYear: c.unitYear,
    savingsHint: c.savingsHint,
    crossSellHint: c.crossSellHint,
  };

  return (
    <PublicShell activePath="/pricing">
      <Container size="xl" className="bi-prose">
        <header style={{ textAlign: "center", marginBottom: space[8] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            {c.eyebrow}
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>{c.title}</h1>
          <p style={{ maxWidth: 640, marginInline: "auto" }}>{c.sub}</p>
        </header>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <PricingCards plans={plans} copy={cardsCopy} />
        </div>

        <section
          aria-labelledby="compare"
          style={{ marginTop: space[12] }}
        >
          <h2 id="compare" style={{ marginBottom: space[4], textAlign: "center" }}>
            {c.compareTitle}
          </h2>
          <CompareTable groups={c.compareGroups} cols={c.compareCols} />
        </section>

        <section
          aria-labelledby="trust"
          style={{ marginTop: space[12], textAlign: "center" }}
        >
          <h2 id="trust" style={{ marginBottom: space[2] }}>{c.trustTitle}</h2>
          <p style={{ color: cssVar.textDim, maxWidth: 640, marginInline: "auto", marginBlockEnd: space[5] }}>
            {c.trustSub}
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: space[3],
              maxWidth: 900,
              marginInline: "auto",
            }}
          >
            {c.trustBadges.map((b) => (
              <li
                key={b.label}
                style={{
                  padding: space[4],
                  borderRadius: radius.md,
                  border: `1px solid ${cssVar.border}`,
                  background: cssVar.surface,
                  textAlign: "start",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: cssVar.text, letterSpacing: "0.5px" }}>
                  {b.label}
                </span>
                <span style={{ fontSize: font.size.xs, color: cssVar.textMuted }}>
                  {b.hint}
                </span>
              </li>
            ))}
          </ul>
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

function CompareTable({ groups, cols }) {
  return (
    <div
      className="bi-table-wrap"
      style={{
        borderRadius: radius.lg,
        border: `1px solid ${cssVar.border}`,
        background: cssVar.surface,
        overflow: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: font.size.sm, minWidth: 640 }}>
        <thead>
          <tr style={{ background: cssVar.surface2 }}>
            <th style={{ ...thStyle, textAlign: "start" }}>&nbsp;</th>
            {cols.map((col, i) => (
              <th key={col} style={{ ...thStyle, color: i === 1 ? cssVar.accent : cssVar.text }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.title}>
              <tr>
                <th
                  colSpan={cols.length + 1}
                  scope="colgroup"
                  style={{
                    textAlign: "start",
                    padding: `${space[4]}px ${space[4]}px ${space[2]}px`,
                    fontSize: font.size.xs,
                    fontWeight: font.weight.bold,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    color: cssVar.textMuted,
                    background: cssVar.surface,
                    borderBlockStart: `1px solid ${cssVar.border}`,
                  }}
                >
                  {g.title}
                </th>
              </tr>
              {g.rows.map((row, rIdx) => {
                const [label, ...vals] = row;
                return (
                  <tr key={`r-${g.title}-${rIdx}`}>
                    <th scope="row" style={{ ...tdStyle, textAlign: "start", fontWeight: font.weight.medium, color: cssVar.text }}>
                      {label}
                    </th>
                    {vals.map((v, i) => (
                      <td key={i} style={{ ...tdStyle, textAlign: "center", background: i === 1 ? cssVar.accentSoft : "transparent" }}>
                        <CellValue v={v} emphasis={i === 1} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CellValue({ v, emphasis }) {
  if (v === true) {
    return <span aria-label="Incluido" style={{ color: cssVar.accent, fontWeight: font.weight.bold, fontSize: 16 }}>✓</span>;
  }
  if (v === false || v == null) {
    return <span aria-label="No incluido" style={{ color: cssVar.textMuted }}>—</span>;
  }
  return <span style={{ fontWeight: emphasis ? font.weight.semibold : font.weight.normal, color: cssVar.text }}>{v}</span>;
}

const thStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  fontSize: font.size.xs,
  fontWeight: font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  textAlign: "center",
};

const tdStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  borderBlockStart: `1px solid ${cssVar.border}`,
  color: cssVar.textDim,
};
