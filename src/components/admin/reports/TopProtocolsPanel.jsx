/* TopProtocolsPanel — Phase 6F SP-D
   Top 5 protocolos por effectiveness. Server component.
   Backend SP-C retorna `meanLift`, `cohensD`, `magnitude`, `significant`.
   Sub-prompt mencionaba `effectiveness` pero el shape real usa `meanLift`+`cohensD`. */

import { P as PROTOCOLS } from "@/lib/protocols";
import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";
import SectionHeader from "./SectionHeader";

const PROTOCOL_NAMES = Object.fromEntries(PROTOCOLS.map((p) => [p.id, p.n]));

const MAGNITUDE_LABELS = {
  "no-effect": "Sin efecto detectable",
  small: "Efecto pequeño",
  moderate: "Efecto moderado",
  large: "Efecto grande",
};

export default function TopProtocolsPanel({ topProtocols }) {
  if (!Array.isArray(topProtocols) || topProtocols.length === 0) {
    return null;
  }

  return (
    <section
      data-v2-top-protocols
      style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
    >
      <SectionHeader
        eyebrow="Protocolos · Top 5"
        italic="Efectividad medida."
        title="Lift mood pre/post"
        subtitle="Cohen's d paired · k-anon ≥ 5 sesiones por protocolo · IC95% no cruza 0"
      />
      <article
        style={{
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          padding: space[3],
        }}
      >
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: font.size.sm,
        }}>
          <thead>
            <tr style={{ background: cssVar.surface2 }}>
              <th style={thStyle} scope="col">#</th>
              <th style={thStyle} scope="col">Protocolo</th>
              <th style={{ ...thStyle, textAlign: "right" }} scope="col">Δ mood</th>
              <th style={{ ...thStyle, textAlign: "right" }} scope="col">Cohen's d</th>
              <th style={thStyle} scope="col">Magnitud</th>
              <th style={{ ...thStyle, textAlign: "right" }} scope="col">N</th>
            </tr>
          </thead>
          <tbody>
            {topProtocols.slice(0, 5).map((p, i) => (
              <ProtocolRow key={p.protocolId} index={i} protocol={p} />
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}

function ProtocolRow({ index, protocol }) {
  const name = PROTOCOL_NAMES[protocol.protocolId] || `Protocolo ${protocol.protocolId}`;
  const magnitudeLabel = MAGNITUDE_LABELS[protocol.magnitude] || protocol.magnitude || "—";
  const accent = protocol.significant
    ? bioSignal.phosphorCyanInk
    : cssVar.textMuted;

  return (
    <tr style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
      <td style={tdStyle}>
        <span style={{
          fontFamily: cssVar.fontMono,
          color: cssVar.textMuted,
          fontSize: font.size.xs,
        }}>
          {index + 1}
        </span>
      </td>
      <td style={{ ...tdStyle, color: cssVar.text }}>
        {name}
      </td>
      <td style={{ ...tdStyle, textAlign: "right", fontFamily: cssVar.fontMono, color: accent }}>
        {protocol.meanLift > 0 ? "+" : ""}
        {Number(protocol.meanLift).toFixed(2)}
      </td>
      <td style={{ ...tdStyle, textAlign: "right", fontFamily: cssVar.fontMono, color: cssVar.text }}>
        {Number(protocol.cohensD).toFixed(2)}
      </td>
      <td style={{ ...tdStyle, color: cssVar.textDim, fontSize: font.size.xs }}>
        {magnitudeLabel}
      </td>
      <td style={{ ...tdStyle, textAlign: "right", fontFamily: cssVar.fontMono, color: cssVar.textMuted }}>
        {protocol.n}
      </td>
    </tr>
  );
}

const thStyle = {
  textAlign: "left",
  padding: `${space[2]}px ${space[3]}px`,
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const tdStyle = {
  padding: `${space[3]}px ${space[3]}px`,
  fontVariantNumeric: "tabular-nums",
};
