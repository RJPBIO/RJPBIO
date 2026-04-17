export const metadata = { title: "Acuerdo de Procesamiento de Datos (DPA)" };

export default function DPA() {
  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui", lineHeight: 1.6 }}>
      <h1>DPA — Data Processing Addendum</h1>
      <p style={{ color: "#94A3B8" }}>Anexo al contrato de servicios. Aplica GDPR, LFPDPPP, LGPD, CCPA.</p>
      <h2>1. Roles</h2>
      <p>El cliente es <b>controlador</b>; BIO-IGNICIÓN es <b>encargado</b>. Los subencargados están en <a href="/trust/subprocessors" style={{ color: "#10B981" }}>/trust/subprocessors</a>.</p>
      <h2>2. Instrucciones</h2>
      <p>Solo procesamos datos personales conforme a las instrucciones documentadas del cliente, salvo obligación legal.</p>
      <h2>3. Confidencialidad</h2>
      <p>Todo el personal con acceso a datos firma acuerdos de confidencialidad perpetuos.</p>
      <h2>4. Seguridad</h2>
      <p>TLS 1.3, AES-256-GCM en reposo, SSO, MFA, auditoría append-only con cadena SHA-256, RLS en Postgres, BYOK opcional. Ver <a href="/SECURITY.md" style={{ color: "#10B981" }}>SECURITY.md</a>.</p>
      <h2>5. Subencargados</h2>
      <p>Notificamos nuevos subencargados con <b>30 días</b> de antelación en /trust/subprocessors; el cliente puede objetar.</p>
      <h2>6. Transferencias internacionales</h2>
      <p>SCCs UE 2021/914 + evaluación TIA cuando aplique; datos residen en la región elegida (US/EU/APAC/LATAM).</p>
      <h2>7. Derechos del titular</h2>
      <p>Acceso, rectificación, supresión, portabilidad vía API: ver <a href="/API.md" style={{ color: "#10B981" }}>API.md</a>.</p>
      <h2>8. Brechas</h2>
      <p>Notificación dentro de <b>72 horas</b> al contacto designado por el cliente.</p>
      <h2>9. Auditoría</h2>
      <p>Reportes SOC 2 Type II disponibles bajo NDA; auditoría in-situ cuando lo requiera ley.</p>
      <h2>10. Retención</h2>
      <p>Devolución o supresión certificada de datos dentro de 30 días al término del contrato.</p>
      <p style={{ marginTop: 32, color: "#64748B", fontSize: 13 }}>Para firmar el DPA contacta <a href="mailto:legal@bio-ignicion.app" style={{ color: "#10B981" }}>legal@bio-ignicion.app</a>.</p>
    </article>
  );
}
