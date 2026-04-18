import { cssVar, radius, space, font } from "@/components/ui/tokens";

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
    <article style={{
      maxWidth: 860,
      margin: "0 auto",
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
    }}>
      <h1 style={{
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
        margin: 0,
      }}>
        Subprocesadores
      </h1>
      <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[2] }}>
        Actualizada: 2026-04-16. Notificamos cambios con 30 días de antelación via email y en esta página.
      </p>

      <div style={{
        marginTop: space[4],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: font.size.sm,
        }}>
          <thead>
            <tr style={{ background: cssVar.surface2 }}>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Propósito</th>
              <th style={thStyle}>Región</th>
              <th style={thStyle}>DPA</th>
            </tr>
          </thead>
          <tbody>
            {SUBS.map((s) => (
              <tr key={s.name} style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
                <td style={{ ...tdStyle, fontWeight: font.weight.semibold }}>{s.name}</td>
                <td style={tdStyle}>{s.purpose}</td>
                <td style={tdStyle}>{s.region}</td>
                <td style={tdStyle}>
                  <a href={s.dpa} target="_blank" rel="noopener noreferrer" style={{
                    color: cssVar.accent,
                    fontWeight: font.weight.semibold,
                  }}>
                    Link ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: space[5], color: cssVar.textMuted, fontSize: font.size.sm }}>
        Subscríbete a cambios: <a href="mailto:trust-announce@bio-ignicion.app" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>trust-announce@bio-ignicion.app</a>
      </p>
    </article>
  );
}

const thStyle = {
  textAlign: "left",
  padding: `${space[2]}px ${space[3]}px`,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
};

const tdStyle = {
  padding: `${space[2]}px ${space[3]}px`,
  color: cssVar.text,
};
