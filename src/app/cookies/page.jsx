import { cssVar, radius, space, font } from "@/components/ui/tokens";

export const metadata = { title: "Política de Cookies" };

export default function Cookies() {
  return (
    <article style={{
      maxWidth: 760,
      margin: "0 auto",
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
      lineHeight: 1.6,
    }}>
      <h1 style={{
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
        margin: 0,
      }}>
        Cookies
      </h1>
      <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[2] }}>
        Qué guardamos y por qué.
      </p>

      <div style={{
        marginTop: space[4],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: font.size.sm }}>
          <thead>
            <tr style={{ background: cssVar.surface2 }}>
              <th style={th}>Nombre</th>
              <th style={th}>Categoría</th>
              <th style={th}>Propósito</th>
              <th style={th}>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr style={tr}><td style={{ ...td, fontFamily: cssVar.fontMono }}>authjs.session-token</td><td style={td}>Estrictamente necesaria</td><td style={td}>Mantener sesión</td><td style={td}>8 h</td></tr>
            <tr style={tr}><td style={{ ...td, fontFamily: cssVar.fontMono }}>bio-csrf</td><td style={td}>Estrictamente necesaria</td><td style={td}>Protección CSRF</td><td style={td}>8 h</td></tr>
            <tr style={tr}><td style={{ ...td, fontFamily: cssVar.fontMono }}>bio-locale</td><td style={td}>Preferencia</td><td style={td}>Idioma elegido</td><td style={td}>1 año</td></tr>
            <tr style={tr}><td style={{ ...td, fontFamily: cssVar.fontMono }}>bio-consent</td><td style={td}>Preferencia</td><td style={td}>Decisión de cookies</td><td style={td}>1 año</td></tr>
          </tbody>
        </table>
      </div>

      <p style={{ color: cssVar.textMuted, marginTop: space[4], fontSize: font.size.sm }}>
        No usamos cookies de publicidad ni rastreo de terceros. Nuestra telemetría es opt-in y se envía solo si consientes.
      </p>
    </article>
  );
}

const th = {
  textAlign: "left",
  padding: `${space[2]}px ${space[3]}px`,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
};

const tr = {
  borderBlockStart: `1px solid ${cssVar.border}`,
};

const td = {
  padding: `${space[2]}px ${space[3]}px`,
  color: cssVar.text,
};
