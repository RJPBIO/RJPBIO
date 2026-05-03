"use client";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, ScrollPad } from "../primitives";
import { typography, colors, spacing, radii } from "../../tokens";
import { FIXTURE_ENGINE_HEALTH } from "../fixtures";

// Sub-ruta engine-health — la mas tecnica. Aqui SI se ven nombres
// tecnicos (composite, cohort prior, calibration bias per arm, hit rate)
// porque los users que abren esto son power-users que QUIEREN ver los
// numeros crudos. Pero cada termino tecnico va con caption humano debajo.

export default function EngineHealthView({ onBack }) {
  const eh = FIXTURE_ENGINE_HEALTH;

  return (
    <>
      <SubRouteHeader title="Salud del motor" onBack={onBack} />
      <ScrollPad>
        {/* Hero — overall verdict */}
        <Section>
          <Kicker tone="cyan">ESTADO DEL MOTOR</Kicker>
          <h2
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: 48,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.04em",
              color: "rgba(255,255,255,0.96)",
              lineHeight: 1.05,
            }}
          >
            {eh.overall}
          </h2>
          <p
            style={{
              margin: 0,
              marginBlockStart: 8,
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.regular,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.4,
            }}
          >
            {eh.overallCaption}
          </p>
        </Section>

        {/* Metrics grid 2x2 */}
        <Section>
          <Kicker>MÉTRICAS</Kicker>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              borderBlock: `0.5px solid ${colors.separator}`,
            }}
          >
            <MetricCell value={`${eh.hitRate}%`}      label="PRECISIÓN DE PREDICCIÓN" right bottom />
            <MetricCell value={eh.acceptance.toFixed(2)}     label="ACEPTACIÓN DE RECOMENDACIONES"     bottom />
            <MetricCell value={eh.personalization} label="FUERZA DE PERSONALIZACIÓN" right />
            <MetricCell value={eh.dataConfidence.toFixed(2)} label="CONFIANZA EN DATOS" />
          </div>
        </Section>

        {/* Cohort prior */}
        {eh.cohortPrior?.available && (
          <Section>
            <Kicker>COHORT PRIOR · LO QUE APRENDEMOS DEL EQUIPO</Kicker>
            <Card>
              <p
                style={{
                  margin: 0,
                  fontFamily: typography.family,
                  fontSize: typography.size.bodyMin,
                  fontWeight: typography.weight.regular,
                  color: "rgba(255,255,255,0.96)",
                  lineHeight: 1.5,
                }}
              >
                {eh.cohortPrior.summary}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  rowGap: 8,
                  columnGap: spacing.s16,
                }}
              >
                {eh.cohortPrior.buckets.map((b) => (
                  <BucketRow key={b.bucket} bucket={b.bucket} intent={b.intent} />
                ))}
              </ul>
            </Card>
          </Section>
        )}

        {/* Calibration bias per arm */}
        <Section>
          <Kicker>BIAS DE PREDICCIÓN POR PROTOCOLO</Kicker>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: typography.familyMono,
              fontSize: typography.size.caption,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            <thead>
              <tr>
                <Th>PROTOCOLO</Th>
                <Th align="end">BIAS</Th>
                <Th align="end">N</Th>
              </tr>
            </thead>
            <tbody>
              {eh.calibrationBias.map((row, i) => (
                <tr
                  key={row.protocol}
                  style={{
                    borderBlockStart: i === 0 ? "none" : `0.5px solid ${colors.separator}`,
                  }}
                >
                  <Td>{row.protocol}</Td>
                  <Td align="end" tone={row.bias === 0 ? "muted" : row.bias > 0 ? "primary" : "secondary"}>
                    {row.bias > 0 ? "+" : ""}{row.bias.toFixed(1)}
                  </Td>
                  <Td align="end" tone="muted">{row.n}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Suggested actions */}
        <Section paddingBottom={48}>
          <Kicker>ACCIONES SUGERIDAS</Kicker>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {eh.actions.map((a, i) => (
              <li
                key={i}
                style={{
                  paddingBlock: 12,
                  borderBlockEnd: i === eh.actions.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
                  fontFamily: typography.family,
                  fontSize: typography.size.bodyMin,
                  fontWeight: typography.weight.regular,
                  color: "rgba(255,255,255,0.96)",
                  lineHeight: 1.4,
                }}
              >
                {a}
              </li>
            ))}
          </ul>
        </Section>
      </ScrollPad>
    </>
  );
}

function MetricCell({ value, label, right = false, bottom = false }) {
  return (
    <div
      style={{
        padding: spacing.s24,
        borderInlineEnd: right ? `0.5px solid ${colors.separator}` : "none",
        borderBlockEnd: bottom ? `0.5px solid ${colors.separator}` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: 32,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,0.96)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function BucketRow({ bucket, intent }) {
  return (
    <>
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
        }}
      >
        {bucket}
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.96)",
          textTransform: "capitalize",
        }}
      >
        {intent}
      </span>
    </>
  );
}

function Th({ children, align = "start" }) {
  return (
    <th
      style={{
        textAlign: align,
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.32)",
        paddingBlock: 10,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "start", tone = "primary" }) {
  const color = tone === "primary"
    ? "rgba(255,255,255,0.96)"
    : tone === "secondary" ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.32)";
  return (
    <td
      style={{
        textAlign: align,
        color,
        paddingBlock: 12,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </td>
  );
}
