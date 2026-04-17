export const metadata = { title: "Subprocesadores" };

const SUBS = [
  { name: "Amazon Web Services", purpose: "Hosting, storage, KMS", region: "US / EU / APAC", dpa: "https://aws.amazon.com/service-terms/" },
  { name: "Vercel", purpose: "Edge runtime, CDN", region: "Global", dpa: "https://vercel.com/legal/dpa" },
  { name: "Stripe", purpose: "Facturación", region: "US / EU", dpa: "https://stripe.com/legal/dpa" },
  { name: "Anthropic", purpose: "LLM Coach (opt-in, no training)", region: "US", dpa: "https://www.anthropic.com/legal/dpa" },
  { name: "Auth0 / Okta", purpose: "Identidad OIDC/SAML", region: "US / EU", dpa: "https://www.okta.com/trust/privacy/" },
  { name: "Datadog", purpose: "Observabilidad (sin PII)", region: "US / EU", dpa: "https://www.datadoghq.com/legal/dpa/" },
  { name: "Postmark", purpose: "Email transaccional", region: "US", dpa: "https://postmarkapp.com/dpa" },
  { name: "Cloudflare", purpose: "WAF, DDoS, DNS", region: "Global edge", dpa: "https://www.cloudflare.com/cloudflare-customer-dpa/" },
];

export default function Subprocessors() {
  return (
    <article style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <h1>Subprocesadores</h1>
      <p style={{ color: "#94A3B8" }}>Actualizada: 2026-04-16. Notificamos cambios con 30 días de antelación via email y en esta página.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr><th>Proveedor</th><th>Propósito</th><th>Región</th><th>DPA</th></tr></thead>
        <tbody>
          {SUBS.map((s) => (
            <tr key={s.name}>
              <td>{s.name}</td><td>{s.purpose}</td><td>{s.region}</td>
              <td><a href={s.dpa} style={{ color: "#10B981" }}>Link</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 24, color: "#94A3B8" }}>Subscríbete a cambios: trust-announce@bio-ignicion.app</p>
    </article>
  );
}
