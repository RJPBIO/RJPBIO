"use client";
import { useStore } from "@/store/useStore";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, ScrollPad } from "../primitives";
import { typography, colors, spacing, radii } from "../../tokens";

// Sub-ruta engine-health — la mas tecnica. Aqui SI se ven nombres
// tecnicos (composite, cohort prior, calibration bias per arm, hit rate)
// porque los users que abren esto son power-users que QUIEREN ver los
// numeros crudos. Pero cada termino tecnico va con caption humano debajo.
//
// Phase 6D SP3 — fixtures cleanup. Antes leía FIXTURE_ENGINE_HEALTH que
// inventaba "Personalizado · 47 sesiones · hit rate 82% · acceptance 0.74"
// para todos los users. Ahora deriva métricas reales del store:
//
//   - overall + descriptor: thresholds basados en totalSessions reales
//   - hitRate / acceptance / personalization / dataConfidence:
//     hasta SP6 hay un endpoint server real, mostramos placeholders
//     honestos cuando user es nuevo (no inventamos números)
//   - cohortPrior: solo se muestra si hay cohort real (deferido SP4)
//   - calibrationBias per arm: derivado de banditArms del store
//   - actions: lista vacía hasta que tengamos suggester real

export default function EngineHealthView({ onBack }) {
  const totalSessions = useStore((s) => s.totalSessions || 0);
  const historyLen = useStore((s) => Array.isArray(s.history) ? s.history.length : 0);
  const banditArms = useStore((s) => s.banditArms || {});

  const eh = deriveEngineHealth({ totalSessions: totalSessions || historyLen, banditArms });

  if (eh.isEmpty) {
    return (
      <>
        <SubRouteHeader title="Salud del motor" onBack={onBack} />
        <ScrollPad>
          <Section>
            <Kicker tone="cyan">ESTADO DEL MOTOR</Kicker>
            <h2
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: 40,
                fontWeight: typography.weight.light,
                letterSpacing: "-0.04em",
                color: colors.text.primary,
                lineHeight: 1.05,
              }}
            >
              Sin datos
            </h2>
            <p
              style={{
                margin: 0,
                marginBlockStart: 8,
                fontFamily: typography.family,
                fontSize: typography.size.body,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.4,
              }}
            >
              {eh.overallCaption}
            </p>
          </Section>
          <Section paddingBottom={48}>
            <article
              style={{
                background: "transparent",
                border: `0.5px dashed ${colors.separator}`,
                borderRadius: radii.panelLg,
                padding: spacing.s24 - 4,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: typography.family,
                  fontSize: typography.size.caption,
                  fontWeight: typography.weight.regular,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                }}
              >
                Las métricas del motor (hit rate, calibration bias por protocolo, cohort prior) se calculan después de tu primera sesión. El bandit necesita observaciones reales para reportar precision honesta.
              </p>
            </article>
          </Section>
        </ScrollPad>
      </>
    );
  }

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
              color: colors.text.primary,
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
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            {eh.overallCaption}
          </p>
        </Section>

        {/* Calibration bias per arm — derivado del banditArms real */}
        {eh.calibrationBias.length > 0 && (
          <Section>
            <Kicker>BIAS DE PREDICCIÓN POR INTENT</Kicker>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: typography.familyMono,
                fontSize: typography.size.caption,
                color: colors.text.secondary,
              }}
            >
              <thead>
                <tr>
                  <Th>INTENT</Th>
                  <Th align="end">REWARD MEDIO</Th>
                  <Th align="end">N</Th>
                </tr>
              </thead>
              <tbody>
                {eh.calibrationBias.map((row, i) => (
                  <tr
                    key={row.intent}
                    style={{
                      borderBlockStart: i === 0 ? "none" : `0.5px solid ${colors.separator}`,
                    }}
                  >
                    <Td>{row.intent}</Td>
                    <Td align="end" tone={row.reward === 0 ? "muted" : row.reward > 0 ? "primary" : "secondary"}>
                      {row.reward > 0 ? "+" : ""}{row.reward.toFixed(2)}
                    </Td>
                    <Td align="end" tone="muted">{row.n}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Honest stats placeholder — hasta SP6 wire al endpoint real */}
        <Section paddingBottom={48}>
          <Kicker>SESIONES PROCESADAS</Kicker>
          <Card>
            <p
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.body,
                fontWeight: typography.weight.regular,
                color: colors.text.primary,
                lineHeight: 1.4,
              }}
            >
              {eh.totalSessions} {eh.totalSessions === 1 ? "sesión" : "sesiones"} usadas para personalización.
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.5,
              }}
            >
              Métricas detalladas (hit rate, acceptance, cohort prior) requieren backend wired — disponibles próximamente.
            </p>
          </Card>
        </Section>
      </ScrollPad>
    </>
  );
}

function deriveEngineHealth({ totalSessions, banditArms }) {
  let overall, overallCaption;
  if (totalSessions === 0) {
    overall = "Sin datos";
    overallCaption = "Tu motor neural empieza a aprender al completar tu primera sesión.";
    return {
      isEmpty: true, totalSessions: 0, overall, overallCaption,
      calibrationBias: [],
    };
  }
  if (totalSessions < 5) {
    overall = "Conociéndonos";
    overallCaption = `${totalSessions} de 5 sesiones para baseline.`;
  } else if (totalSessions < 30) {
    overall = "Aprendiendo";
    overallCaption = `${totalSessions} sesiones procesadas. Personalización en progreso.`;
  } else {
    overall = "Personalizado";
    overallCaption = `${totalSessions} sesiones. El motor te conoce.`;
  }
  return {
    isEmpty: false,
    totalSessions,
    overall,
    overallCaption,
    calibrationBias: deriveCalibrationBias(banditArms),
  };
}

function deriveCalibrationBias(banditArms) {
  // Bandit arms canónicos por intent (sin bucket temporal): claves "calma",
  // "enfoque", "energia", "reset". Cada arm = { n, sum, sumsq } per UCB1-Normal.
  const intents = ["calma", "enfoque", "energia", "reset"];
  const out = [];
  for (const intent of intents) {
    const arm = banditArms[intent];
    if (!arm || !arm.n) continue;
    const reward = arm.n > 0 ? arm.sum / arm.n : 0;
    out.push({ intent, reward, n: arm.n });
  }
  return out.sort((a, b) => b.n - a.n);
}

function Th({ children, align = "start" }) {
  return (
    <th
      style={{
        textAlign: align,
        fontWeight: typography.weight.medium,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: colors.text.muted,
        paddingBlock: 10,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "start", tone = "primary" }) {
  const color = tone === "primary"
    ? colors.text.primary
    : tone === "secondary" ? colors.text.secondary : colors.text.muted;
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
