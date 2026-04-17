export const metadata = { title: "Trust Center" };

const CERTS = [
  { name: "SOC 2 Type II", status: "In audit", target: "2026-Q3" },
  { name: "ISO 27001", status: "Gap assessment", target: "2026-Q4" },
  { name: "ISO 27701", status: "Scoped", target: "2027-Q1" },
  { name: "HIPAA", status: "BAA disponible", target: "Vigente" },
  { name: "GDPR / LFPDPPP / LGPD / CCPA", status: "Alineado", target: "Vigente" },
];

const LINKS = [
  { label: "Política de privacidad", href: "/privacy" },
  { label: "Subprocesadores", href: "/trust/subprocessors" },
  { label: "DPA descargable", href: "/trust/dpa" },
  { label: "Reporte de pentest (NDA)", href: "mailto:trust@bio-ignicion.app" },
  { label: "Security questionnaire (CAIQ/SIG, NDA)", href: "mailto:trust@bio-ignicion.app" },
  { label: "Status page", href: "https://status.bio-ignicion.app" },
  { label: "Responsible disclosure", href: "/trust/security" },
];

export default function TrustCenter() {
  return (
    <article style={wrap}>
      <h1 style={{ fontSize: 32, margin: 0 }}>Trust Center</h1>
      <p style={{ color: "#A7F3D0" }}>Seguridad, privacidad y resiliencia operativa. Todo a la vista.</p>

      <section>
        <h2>Certificaciones y marcos</h2>
        <table style={table}>
          <thead><tr><th>Marco</th><th>Estado</th><th>Objetivo</th></tr></thead>
          <tbody>{CERTS.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.status}</td><td>{c.target}</td></tr>)}</tbody>
        </table>
      </section>

      <section>
        <h2>Controles clave</h2>
        <ul>
          <li><strong>Cifrado:</strong> TLS 1.3 en tránsito · AES-GCM 256 en reposo · Claves por tenant en KMS.</li>
          <li><strong>Identidad:</strong> SSO SAML/OIDC · SCIM 2.0 · MFA TOTP/WebAuthn · rotación de sesiones.</li>
          <li><strong>Acceso:</strong> RBAC granular · least-privilege · break-glass auditado.</li>
          <li><strong>Auditoría:</strong> append-only con hash chain verificable.</li>
          <li><strong>Resiliencia:</strong> RPO 15 min · RTO 4 h · multi-AZ · respaldo inmutable 30 días.</li>
          <li><strong>Data residency:</strong> US · EU · APAC · LATAM bajo demanda.</li>
          <li><strong>Privacidad agregada:</strong> k-anonymity k≥5 · noise diferencial ε=1.0.</li>
          <li><strong>Continuidad:</strong> BCP/DRP documentados · ejercicios trimestrales.</li>
        </ul>
      </section>

      <section>
        <h2>Documentación</h2>
        <ul>{LINKS.map((l) => <li key={l.href}><a href={l.href} style={{ color: "#10B981" }}>{l.label}</a></li>)}</ul>
      </section>
    </article>
  );
}

const wrap = { maxWidth: 860, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui" };
const table = { width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 14 };
