export const metadata = {
  title: "Precios · BIO-IGNICIÓN",
  description: "Planes B2B para equipos que entrenan el sistema nervioso. Seats anuales con descuento por volumen.",
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$ 9",
    unit: "por usuario / mes",
    tagline: "Para equipos de hasta 25 personas que quieren empezar.",
    features: [
      "Protocolos neurales ilimitados",
      "Audio + haptics + binaural",
      "Dashboard personal con histórico",
      "PWA local-first (offline)",
      "Soporte por email (48 h SLA)",
    ],
    cta: { href: "/signup", label: "Empezar" },
    featured: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$ 19",
    unit: "por usuario / mes",
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
    cta: { href: "/demo", label: "Agenda demo" },
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    unit: "facturación anual",
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
    cta: { href: "mailto:enterprise@bio-ignicion.app", label: "Hablar con ventas" },
    featured: false,
  },
];

const faqs = [
  {
    q: "¿Puedo cambiar de plan sin costo?",
    a: "Sí, los upgrades aplican de inmediato (prorrateo). Los downgrades aplican al próximo ciclo.",
  },
  {
    q: "¿Qué pasa con mis datos si cancelo?",
    a: "Exportas en JSON + CSV desde el panel; eliminamos los datos a los 30 días (o al momento, según DPA).",
  },
  {
    q: "¿Facturan en MXN?",
    a: "Sí. Stripe soporta MXN, USD, EUR y CAD. Factura CFDI 4.0 disponible para clientes mexicanos.",
  },
  {
    q: "¿Es HIPAA / GDPR compliant?",
    a: "Growth y Enterprise cumplen GDPR (procesamiento en EU opcional). HIPAA requiere BAA — disponible en Enterprise.",
  },
];

export default function PricingPage() {
  return (
    <main style={page}>
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>Precios</div>
        <h1 style={{ margin: "8px 0", fontSize: 38, fontWeight: 800 }}>Menos fricción, más entrenamiento</h1>
        <p style={{ color: "#A7F3D0", maxWidth: 640, margin: "0 auto", lineHeight: 1.55 }}>
          Pagas por usuario activo. 20 % de descuento en facturación anual. Sin setup fees, sin mínimos.
        </p>
      </header>

      <section style={grid}>
        {plans.map((p) => (
          <article key={p.id} style={{ ...card, ...(p.featured ? cardFeatured : {}) }}>
            {p.featured && <div style={ribbon}>Más elegido</div>}
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{p.name}</h2>
            <p style={{ color: "#A7F3D0", fontSize: 13, minHeight: 36 }}>{p.tagline}</p>
            <div style={{ margin: "14px 0" }}>
              <span style={{ fontSize: 42, fontWeight: 800 }}>{p.price}</span>
              <span style={{ fontSize: 13, color: "#A7F3D0", marginLeft: 6 }}>{p.unit}</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", fontSize: 14, lineHeight: 1.8 }}>
              {p.features.map((f, i) => (
                <li key={i} style={{ display: "flex", gap: 8 }}>
                  <span aria-hidden style={{ color: "#10B981" }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a href={p.cta.href} style={p.featured ? btnPrimary : btnSecondary}>{p.cta.label}</a>
          </article>
        ))}
      </section>

      <section style={{ marginTop: 60, maxWidth: 720, marginInline: "auto" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Preguntas frecuentes</h2>
        {faqs.map((f, i) => (
          <details key={i} style={faq}>
            <summary style={{ cursor: "pointer", fontWeight: 600, padding: "10px 0" }}>{f.q}</summary>
            <p style={{ color: "#D1FAE5", lineHeight: 1.6, margin: "6px 0 10px" }}>{f.a}</p>
          </details>
        ))}
      </section>

      <footer style={{ textAlign: "center", marginTop: 50, color: "#6B7280", fontSize: 13 }}>
        ¿Dudas? <a href="mailto:sales@bio-ignicion.app" style={{ color: "#6EE7B7" }}>sales@bio-ignicion.app</a> ·
        <a href="/trust" style={{ color: "#6EE7B7", marginLeft: 6 }}>Trust Center</a> ·
        <a href="/roi-calculator" style={{ color: "#6EE7B7", marginLeft: 6 }}>Calculadora ROI</a>
      </footer>
    </main>
  );
}

const page = { minHeight: "100dvh", background: "#0B0E14", color: "#ECFDF5", padding: "48px 24px", maxWidth: 1100, margin: "0 auto" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 };
const card = { position: "relative", padding: 24, background: "rgba(5,150,105,.06)", border: "1px solid #064E3B", borderRadius: 18, display: "flex", flexDirection: "column" };
const cardFeatured = { borderColor: "#10B981", boxShadow: "0 0 0 1px #10B981, 0 18px 40px -20px rgba(16,185,129,.5)" };
const ribbon = { position: "absolute", top: -12, left: 20, background: "#10B981", color: "#052E16", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 };
const btnPrimary = { display: "inline-block", background: "#10B981", color: "#052E16", textDecoration: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 700, textAlign: "center" };
const btnSecondary = { display: "inline-block", background: "transparent", border: "1px solid #065F46", color: "#A7F3D0", textDecoration: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 600, textAlign: "center" };
const faq = { borderTop: "1px solid #064E3B", padding: "4px 0" };
