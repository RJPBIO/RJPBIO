import { cssVar, radius, space, font } from "@/components/ui/tokens";

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
      <h1 style={{
        fontSize: font.size["3xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
        margin: 0,
      }}>
        Trust Center
      </h1>
      <p style={{ color: cssVar.textDim, fontSize: font.size.md, marginTop: space[2] }}>
        Seguridad, privacidad y resiliencia operativa. Todo a la vista.
      </p>
      <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: 0 }}>
        Transparencia: ninguna certificación se declara hasta contar con reporte auditado disponible. Las
        fechas listadas son objetivos públicos, no estado vigente. Última revisión: 2026-04.
      </p>

      <section>
        <h2 style={h2Style}>Certificaciones y marcos</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={thStyle}>Marco</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Objetivo</th>
            </tr>
          </thead>
          <tbody>
            {CERTS.map((c) => (
              <tr key={c.name} style={trStyle}>
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{c.status}</td>
                <td style={tdStyle}>{c.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={h2Style}>Controles clave</h2>
        <ul style={ulStyle}>
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

      <section id="methodology">
        <h2 style={h2Style}>Metodología e instrumentos</h2>
        <p style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
          Cada métrica reportable está anclada a literatura revisada por pares. Ningún claim usa
          score propietario sin referencia. Los detalles permiten a RH/Salud Laboral validar el
          reporte contra sus propios estándares.
        </p>

        <h3 id="instruments" style={h3Style}>Instrumentos psicométricos</h3>
        <table style={table}>
          <thead>
            <tr>
              <th style={thStyle}>Instrumento</th>
              <th style={thStyle}>Rango</th>
              <th style={thStyle}>Periodicidad</th>
              <th style={thStyle}>Referencia</th>
            </tr>
          </thead>
          <tbody>
            <tr style={trStyle}><td style={tdStyle}>PSS-4 (estrés percibido)</td><td style={tdStyle}>0–16</td><td style={tdStyle}>Mensual</td><td style={tdStyle}>Cohen & Williamson 1988</td></tr>
            <tr style={trStyle}><td style={tdStyle}>SWEMWBS (bienestar)</td><td style={tdStyle}>7–35 (Rasch)</td><td style={tdStyle}>Trimestral</td><td style={tdStyle}>Stewart-Brown et al. 2009</td></tr>
            <tr style={trStyle}><td style={tdStyle}>PHQ-2 (screener depresión)</td><td style={tdStyle}>0–6 · cutoff ≥3</td><td style={tdStyle}>A demanda</td><td style={tdStyle}>Kroenke, Spitzer & Williams 2003</td></tr>
            <tr style={trStyle}><td style={tdStyle}>NOM-035-STPS Guía II</td><td style={tdStyle}>46 ítems</td><td style={tdStyle}>Anual legal</td><td style={tdStyle}>STPS México 2018</td></tr>
          </tbody>
        </table>

        <h3 id="hrv" style={h3Style}>HRV (variabilidad de frecuencia cardíaca)</h3>
        <ul style={ulStyle}>
          <li><strong>Conexión:</strong> Web Bluetooth GATT Heart Rate Service (Polar, Wahoo, Garmin, CooSpo).</li>
          <li><strong>Métricas:</strong> RMSSD, SDNN, pNN50, ln(RMSSD) (Task Force 1996; Shaffer & Ginsberg 2017).</li>
          <li><strong>Filtro de artefactos:</strong> regla Malik (20%) sobre intervalos RR.</li>
          <li><strong>Cambio significativo:</strong> sólo se reporta como efecto si |Δ RMSSD| ≥ MDC95 personal (Haley & Fragala-Pinkham 2006). Debajo del umbral = "no change", no "lift".</li>
          <li><strong>Agregación:</strong> media, IC95%, % con lift vagal; mínimo k=5 para reporte.</li>
        </ul>

        <h3 id="effectiveness" style={h3Style}>Efectividad de protocolo (lift estado)</h3>
        <ul style={ulStyle}>
          <li><strong>Diseño:</strong> pre/post mood auto-reportado, emparejado por sesión.</li>
          <li><strong>Significancia:</strong> IC95% del mean difference no cruza 0 (equivalente a t-test unilateral simple).</li>
          <li><strong>Tamaño de efecto:</strong> Cohen's d paired; umbrales 0.2/0.5/0.8 (Cohen 1988; Lakens 2013).</li>
          <li><strong>Mínimo muestra:</strong> n=5 pares por protocolo/usuario.</li>
          <li><strong>Limitación reconocida:</strong> auto-reporte de mood infla efectos leves — ver ROI cap (siguiente sección).</li>
        </ul>

        <h3 id="roi" style={h3Style}>Modelo ROI — horas de foco recuperadas</h3>
        <p style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
          Fórmula publicada, parámetros conservadores, sensibilidad auditable:
        </p>
        <pre style={{
          background: cssVar.surface2,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.sm,
          padding: space[3],
          fontSize: font.size.xs,
          fontFamily: cssVar.fontMono,
          color: cssVar.text,
          overflowX: "auto",
        }}>
{`recoveredHours = sessionsMinutes × observedLift × residualFactor / 60

observedLift      — 0..1, capsulado en 0.35 (effectSizeCap)
                    evita sobre-reporte por self-report inflado
residualFactor    — default 2.0× duración de sesión
                    persistencia de carryover post-intervención breve
minSessions       — 30 (no se reporta ROI debajo de este umbral)
hourlyLoadedCost  — default USD 60 (knowledge worker global 2026)`}
        </pre>
        <p style={{ color: cssVar.textMuted, fontSize: font.size.xs, marginTop: space[2] }}>
          Base empírica del residualFactor: Zeidan et al. 2010 (<em>Consciousness & Cognition</em> 19:597-605);
          Basso et al. 2019 (<em>Behavioural Brain Research</em> 356:208-220). Los valores del cliente
          son ajustables: RH/Finanzas pueden sustituir defaults con su propio costo cargado y tolerancia
          a efecto observado, y ver sensibilidad directamente en el dashboard.
        </p>

        <h3 id="anti-claims" style={h3Style}>Lo que BIO-IGNICIÓN NO declara</h3>
        <ul style={ulStyle}>
          <li>No somos diagnóstico clínico. PHQ-2 positivo deriva a recursos; no sustituye a un profesional.</li>
          <li>No vendemos puntajes opacos. Si una métrica aparece en el reporte, su fuente es pública.</li>
          <li>No prometemos efectos sin muestra mínima. Debajo de k=5 respuestas o n=30 sesiones, el dashboard muestra "insuficiente", no extrapola.</li>
          <li>No convertimos ΔHRV debajo del MDC95 en "lift vagal" para quedar bien.</li>
        </ul>
      </section>

      <section>
        <h2 style={h2Style}>Documentación</h2>
        <ul style={ulStyle}>
          {LINKS.map((l) => {
            const external = /^https?:\/\//.test(l.href);
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  style={linkStyle}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
                >
                  {l.label}
                  {external && <span aria-hidden="true"> ↗</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}

const wrap = {
  maxWidth: 860,
  margin: "0 auto",
  padding: `${space[6]}px ${space[4]}px`,
  color: cssVar.text,
  fontFamily: cssVar.fontSans,
  lineHeight: 1.6,
};

const h2Style = {
  fontSize: font.size.xl,
  fontWeight: font.weight.bold,
  letterSpacing: font.tracking.tight,
  marginTop: space[6],
  marginBottom: space[3],
};

const h3Style = {
  fontSize: font.size.lg,
  fontWeight: font.weight.semibold,
  marginTop: space[5],
  marginBottom: space[2],
  color: cssVar.text,
};

const ulStyle = {
  paddingInlineStart: space[5],
  lineHeight: 1.7,
  color: cssVar.text,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: space[2],
  fontSize: font.size.sm,
  background: cssVar.surface,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.md,
  overflow: "hidden",
};

const thStyle = {
  textAlign: "left",
  padding: `${space[2]}px ${space[3]}px`,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
  background: cssVar.surface2,
};

const trStyle = {
  borderBlockStart: `1px solid ${cssVar.border}`,
};

const tdStyle = {
  padding: `${space[2]}px ${space[3]}px`,
  color: cssVar.text,
};

const linkStyle = {
  color: cssVar.accent,
  fontWeight: font.weight.semibold,
};
