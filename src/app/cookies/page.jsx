export const metadata = { title: "Política de Cookies" };

export default function Cookies() {
  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui", lineHeight: 1.6 }}>
      <h1>Cookies</h1>
      <p style={{ color: "#94A3B8" }}>Qué guardamos y por qué.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 14 }}>
        <thead><tr><th style={th}>Nombre</th><th style={th}>Categoría</th><th style={th}>Propósito</th><th style={th}>Duración</th></tr></thead>
        <tbody>
          <tr><td style={td}>authjs.session-token</td><td style={td}>Estrictamente necesaria</td><td style={td}>Mantener sesión</td><td style={td}>8 h</td></tr>
          <tr><td style={td}>bio-csrf</td><td style={td}>Estrictamente necesaria</td><td style={td}>Protección CSRF</td><td style={td}>8 h</td></tr>
          <tr><td style={td}>bio-locale</td><td style={td}>Preferencia</td><td style={td}>Idioma elegido</td><td style={td}>1 año</td></tr>
          <tr><td style={td}>bio-consent</td><td style={td}>Preferencia</td><td style={td}>Decisión de cookies</td><td style={td}>1 año</td></tr>
        </tbody>
      </table>
      <p style={{ color: "#64748B", marginTop: 16, fontSize: 13 }}>No usamos cookies de publicidad ni rastreo de terceros. Nuestra telemetría es opt-in y se envía solo si consientes.</p>
    </article>
  );
}
const th = { textAlign: "left", borderBottom: "1px solid #1E293B", padding: "8px 4px", color: "#64748B" };
const td = { borderBottom: "1px solid #1E293B", padding: "8px 4px" };
