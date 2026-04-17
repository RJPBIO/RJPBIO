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
      <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 0 }}>
        Transparencia: ninguna certificación se declara hasta contar con reporte auditado disponible. Las
        fechas listadas son objetivos públicos, no estado vigente. Última revisión: 2026-04.
      </p>

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

      <section id="methodology">
        <h2>Metodología e instrumentos</h2>
        <p style={{ color: "#94A3B8", fontSize: 13 }}>
          Cada métrica reportable está anclada a literatura revisada por pares. Ningún claim usa
          score propietario sin referencia. Los detalles permiten a RH/Salud Laboral validar el
          reporte contra sus propios estándares.
        </p>

        <h3 id="instruments" style={{ marginTop: 20 }}>Instrumentos psicométricos</h3>
        <table style={table}>
          <thead><tr><th>Instrumento</th><th>Rango</th><th>Periodicidad</th><th>Referencia</th></tr></thead>
          <tbody>
            <tr><td>PSS-4 (estrés percibido)</td><td>0–16</td><td>Mensual</td><td>Cohen & Williamson 1988</td></tr>
            <tr><td>SWEMWBS (bienestar)</td><td>7–35 (Rasch)</td><td>Trimestral</td><td>Stewart-Brown et al. 2009</td></tr>
            <tr><td>PHQ-2 (screener depresión)</td><td>0–6 · cutoff ≥3</td><td>A demanda</td><td>Kroenke, Spitzer & Williams 2003</td></tr>
            <tr><td>NOM-035-STPS Guía II</td><td>46 ítems</td><td>Anual legal</td><td>STPS México 2018</td></tr>
          </tbody>
        </table>

        <h3 id="hrv" style={{ marginTop: 20 }}>HRV (variabilidad de frecuencia cardíaca)</h3>
        <ul>
          <li><strong>Conexión:</strong> Web Bluetooth GATT Heart Rate Service (Polar, Wahoo, Garmin, CooSpo).</li>
          <li><strong>Métricas:</strong> RMSSD, SDNN, pNN50, ln(RMSSD) (Task Force 1996; Shaffer & Ginsberg 2017).</li>
          <li><strong>Filtro de artefactos:</strong> regla Malik (20%) sobre intervalos RR.</li>
          <li><strong>Cambio significativo:</strong> sólo se reporta como efecto si |Δ RMSSD| ≥ MDC95 personal (Haley & Fragala-Pinkham 2006). Debajo del umbral = "no change", no "lift".</li>
          <li><strong>Agregación:</strong> media, IC95%, % con lift vagal; mínimo k=5 para reporte.</li>
        </ul>

        <h3 id="effectiveness" style={{ marginTop: 20 }}>Efectividad de protocolo (lift estado)</h3>
        <ul>
          <li><strong>Diseño:</strong> pre/post mood auto-reportado, emparejado por sesión.</li>
          <li><strong>Significancia:</strong> IC95% del mean difference no cruza 0 (equivalente a t-test unilateral simple).</li>
          <li><strong>Tamaño de efecto:</strong> Cohen's d paired; umbrales 0.2/0.5/0.8 (Cohen 1988; Lakens 2013).</li>
          <li><strong>Mínimo muestra:</strong> n=5 pares por protocolo/usuario.</li>
          <li><strong>Limitación reconocida:</strong> auto-reporte de mood infla efectos leves — ver ROI cap (siguiente sección).</li>
        </ul>

        <h3 id="roi" style={{ marginTop: 20 }}>Modelo ROI — horas de foco recuperadas</h3>
        <p style={{ color: "#94A3B8", fontSize: 13 }}>
          Fórmula publicada, parámetros conservadores, sensibilidad auditable:
        </p>
        <pre style={{ background: "#0F172A", border: "1px solid #1E2330", borderRadius: 8, padding: 12, fontSize: 12, overflowX: "auto" }}>
{`recoveredHours = sessionsMinutes × observedLift × residualFactor / 60

observedLift      — 0..1, capsulado en 0.35 (effectSizeCap)
                    evita sobre-reporte por self-report inflado
residualFactor    — default 2.0× duración de sesión
                    persistencia de carryover post-intervención breve
minSessions       — 30 (no se reporta ROI debajo de este umbral)
hourlyLoadedCost  — default USD 60 (knowledge worker global 2026)`}
        </pre>
        <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 10 }}>
          Base empírica del residualFactor: Zeidan et al. 2010 (<em>Consciousness & Cognition</em> 19:597-605);
          Basso et al. 2019 (<em>Behavioural Brain Research</em> 356:208-220). Los valores del cliente
          son ajustables: RH/Finanzas pueden sustituir defaults con su propio costo cargado y tolerancia
          a efecto observado, y ver sensibilidad directamente en el dashboard.
        </p>

        <h3 id="anti-claims" style={{ marginTop: 20 }}>Lo que BIO-IGNICIÓN NO declara</h3>
        <ul>
          <li>No somos diagnóstico clínico. PHQ-2 positivo deriva a recursos; no sustituye a un profesional.</li>
          <li>No vendemos puntajes opacos. Si una métrica aparece en el reporte, su fuente es pública.</li>
          <li>No prometemos efectos sin muestra mínima. Debajo de k=5 respuestas o n=30 sesiones, el dashboard muestra "insuficiente", no extrapola.</li>
          <li>No convertimos ΔHRV debajo del MDC95 en "lift vagal" para quedar bien.</li>
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
