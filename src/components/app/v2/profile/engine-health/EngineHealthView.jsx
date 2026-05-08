"use client";
/* ═══════════════════════════════════════════════════════════════
   EngineHealthView — Phase 6J-2 HIGH-3 refactor.
   ───────────────────────────────────────────────────────────────
   Closes Engine Audit HIGH-3: ANTES re-implementaba `deriveEngineHealth`
   shallow basado solo en `totalSessions` + `banditArms` reward, ignorando
   el output completo de `evaluateEngineHealth(state)` que calcula:
     - predictionAccuracy (hitRate, meanError, sampleSize)
     - recommendationAcceptance (diversity + qualityRate)
     - personalization.signals (5 booleanos: sensitivity / peakWindow /
       weeklyDensity / residualCalibration / bandit)
     - staleness {days, status} + recalibrationNeeded flag
     - fatigue {level, partialRatio, avgPauses, signals}
     - actions[] (sugerencias accionables)

   AHORA invoca `evaluateEngineHealth(state)` directo (mismo source of
   truth que NeuralSettingsClient web). Mobile parity completa.

   Caveats heredados:
     - banditArms calibrationBias preserved (info adicional útil)
     - schema v1 (campo schemaVersion del output)
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { evaluateEngineHealth } from "@/lib/neural/health";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, ScrollPad } from "../primitives";
import { typography, colors, spacing, radii } from "../../tokens";

// Labels humanos para los 5 personalization signals (matching NeuralSettings web).
const SIGNAL_LABELS = {
  sensitivity: "Sensibilidad por protocolo",
  peakWindow: "Ventana óptima personal",
  weeklyDensity: "Patrón semanal",
  residualCalibration: "Calibración de predicciones",
  bandit: "Exploración personalizada",
};

// dataMaturity → copy humano + tone marker.
const MATURITY_COPY = {
  "cold-start": { label: "Cold-start", caption: "Aprendiendo tus primeras señales" },
  learning: { label: "Aprendiendo", caption: "Personalización en progreso" },
  personalized: { label: "Personalizado", caption: "El motor te conoce" },
};

// overall verdict del synthesizeOverall.
const OVERALL_LABEL = {
  healthy: "Saludable",
  operational: "Operativo",
  calibrating: "Calibrando",
  underperforming: "Bajo rendimiento",
  stale: "Datos antiguos",
  fatigued: "Sistema fatigado",
  "cold-start": "Iniciando",
};

// Action kind → tone visual del card (sin colores nuevos — phosphorCyan único).
const ACTION_TONE = {
  ok: "muted",
  info: "primary",
  warn: "warn",
  danger: "warn",
};

export default function EngineHealthView({ onBack }) {
  // Granular selectors para evitar recompute en cada render del store.
  const history = useStore((s) => s.history);
  const moodLog = useStore((s) => s.moodLog);
  const banditArms = useStore((s) => s.banditArms);
  const predictionResiduals = useStore((s) => s.predictionResiduals);
  const totalSessions = useStore((s) => s.totalSessions || 0);

  // Phase 6J-2 HIGH-3 — evaluateEngineHealth direct.
  // Construimos snapshot mínimo del state para el evaluator (es función pura).
  const health = useMemo(
    () => evaluateEngineHealth({
      history,
      moodLog,
      banditArms,
      predictionResiduals,
      totalSessions,
    }),
    [history, moodLog, banditArms, predictionResiduals, totalSessions]
  );

  // Empty state — sin sesiones aún.
  if (totalSessions === 0 && health.dataMaturity === "cold-start") {
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
                color: colors.text.strong,
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
              Tu motor neural empieza a aprender al completar tu primera sesión.
            </p>
          </Section>
        </ScrollPad>
      </>
    );
  }

  const maturity = MATURITY_COPY[health.dataMaturity] || MATURITY_COPY["cold-start"];
  const overall = OVERALL_LABEL[health.overall] || health.overall;
  const accuracy = health.predictionAccuracy || {};
  const acceptance = health.recommendationAcceptance || {};
  const personalization = health.personalization || { signals: {}, activeSignals: 0 };
  const fatigue = health.fatigue || { level: "none" };
  const actions = Array.isArray(health.actions) ? health.actions : [];
  const calibrationBias = deriveCalibrationBias(banditArms);

  return (
    <>
      <SubRouteHeader title="Salud del motor" onBack={onBack} />
      <ScrollPad>
        {/* HERO — overall verdict */}
        <Section>
          <Kicker tone="cyan">ESTADO DEL MOTOR</Kicker>
          <h2
            data-testid="engine-health-overall"
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: 48,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.04em",
              color: colors.text.strong,
              lineHeight: 1.05,
            }}
          >
            {overall}
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
            {maturity.caption} · {totalSessions} {totalSessions === 1 ? "sesión" : "sesiones"}.
          </p>
        </Section>

        {/* MATURITY + ACCURACY + ACCEPTANCE — KPI grid 2 cols */}
        <Section>
          <Kicker>MÉTRICAS PRINCIPALES</Kicker>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: spacing.s16,
            }}
          >
            <KPI
              label="Cohort"
              value={maturity.label}
              caption={`${health.moodSamples || 0} muestras mood`}
              testid="engine-health-cohort"
            />
            <KPI
              label="Precisión"
              value={
                typeof accuracy.hitRate === "number"
                  ? `${Math.round(accuracy.hitRate * 100)}%`
                  : "—"
              }
              caption={
                accuracy.status === "good"
                  ? "Buena calibración"
                  : accuracy.status === "fair"
                    ? "Calibrando"
                    : accuracy.status === "poor"
                      ? "En aprendizaje"
                      : `n=${accuracy.sampleSize || 0}`
              }
              testid="engine-health-accuracy"
            />
            <KPI
              label="Aceptación"
              value={
                typeof acceptance.value === "number"
                  ? `${Math.round(acceptance.value * 100)}%`
                  : "—"
              }
              caption={
                acceptance.status === "good"
                  ? "Diversidad activa"
                  : acceptance.status === "fair"
                    ? "Patrón estable"
                    : acceptance.sampleSize
                      ? "Acumulando datos"
                      : "Sin datos"
              }
              testid="engine-health-acceptance"
            />
            <KPI
              label="Fatiga"
              value={fatigue.level === "none" ? "Estable" : fatigue.level === "mild" ? "Leve" : "Severa"}
              caption={
                fatigue.level === "none"
                  ? "Sin patrón anómalo"
                  : `${Math.round((fatigue.partialRatio || 0) * 100)}% sesiones parciales`
              }
              testid="engine-health-fatigue"
              tone={fatigue.level === "severe" ? "warn" : fatigue.level === "mild" ? "soft" : "muted"}
            />
          </div>
        </Section>

        {/* PERSONALIZATION SIGNALS — 5 booleanos checklist */}
        <Section>
          <Kicker>SEÑALES PERSONALIZADAS</Kicker>
          <Card padding={spacing.s16}>
            <div
              data-testid="engine-health-signals"
              style={{ display: "flex", flexDirection: "column", gap: spacing.s12 }}
            >
              {Object.entries(personalization.signals || {}).map(([key, active]) => (
                <SignalRow
                  key={key}
                  label={SIGNAL_LABELS[key] || key}
                  active={!!active}
                  testid={`engine-health-signal-${key}`}
                />
              ))}
            </div>
            <p
              style={{
                margin: 0,
                marginBlockStart: spacing.s12,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                color: colors.text.muted,
                lineHeight: 1.4,
              }}
            >
              {personalization.activeSignals} de 5 señales activas
            </p>
          </Card>
        </Section>

        {/* RECALIBRATION BANNER inline */}
        {health.recalibrationNeeded && (
          <Section>
            <Kicker tone="cyan">RECALIBRACIÓN</Kicker>
            <Card padding={spacing.s16}>
              <p
                data-testid="engine-health-recalibration"
                style={{
                  margin: 0,
                  fontFamily: typography.family,
                  fontSize: typography.size.body,
                  color: colors.text.primary,
                  lineHeight: 1.4,
                }}
              >
                {health.recalibrationSeverity === "hard"
                  ? `${health.staleness.days} días de pausa. Tus patrones pueden haber cambiado — una sesión corta nos ayuda a recalibrar.`
                  : "Datos en proceso de enfriamiento. Una sesión nos ayuda a confirmar que tus protocolos siguen siendo los más efectivos."}
              </p>
            </Card>
          </Section>
        )}

        {/* ACTIONS LIST — sugerencias accionables del engine */}
        {actions.length > 0 && (
          <Section>
            <Kicker>ACCIONES SUGERIDAS</Kicker>
            <div
              data-testid="engine-health-actions"
              style={{ display: "flex", flexDirection: "column", gap: spacing.s12 }}
            >
              {actions.map((action, idx) => (
                <ActionRow key={idx} action={action} index={idx} />
              ))}
            </div>
          </Section>
        )}

        {/* CALIBRATION BIAS POR INTENT — info técnica preservada */}
        {calibrationBias.length > 0 && (
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
                {calibrationBias.map((row, i) => (
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
                    <Td align="end" tone="muted">{row.n.toFixed(0)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Schema version footer (debug honesto) */}
        <Section paddingBottom={48}>
          <p
            style={{
              margin: 0,
              fontFamily: typography.familyMono,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: colors.text.muted,
              textAlign: "center",
            }}
          >
            Schema v{health.schemaVersion || 1} · cálculo local · sin envío al servidor
          </p>
        </Section>
      </ScrollPad>
    </>
  );
}

// ─── Helpers internos ────────────────────────────────────────────

function KPI({ label, value, caption, testid, tone = "default" }) {
  const valueColor =
    tone === "warn"
      ? colors.semantic.warning
      : tone === "soft"
        ? colors.text.primary
        : colors.text.strong;
  return (
    <article
      data-testid={testid}
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minHeight: 96,
      }}
    >
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontWeight: typography.weight.medium,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: 22,
          fontWeight: typography.weight.medium,
          color: valueColor,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      {caption && (
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            color: colors.text.muted,
            lineHeight: 1.3,
          }}
        >
          {caption}
        </span>
      )}
    </article>
  );
}

function SignalRow({ label, active, testid }) {
  return (
    <div
      data-testid={testid}
      data-active={active ? "true" : "false"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.s12,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: active ? colors.accent.phosphorCyan : "transparent",
          border: active ? "none" : `0.5px solid ${colors.separator}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: active ? colors.bg.base : colors.text.muted,
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {active ? "·" : ""}
      </span>
      <span
        style={{
          flex: 1,
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: active ? colors.text.strong : colors.text.muted,
          fontWeight: active ? typography.weight.medium : typography.weight.regular,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: active ? colors.accent.phosphorCyan : colors.text.muted,
          fontWeight: typography.weight.medium,
        }}
      >
        {active ? "Activa" : "Pendiente"}
      </span>
    </div>
  );
}

function ActionRow({ action, index }) {
  const tone = ACTION_TONE[action.kind] || "muted";
  const accentColor =
    tone === "warn" ? colors.semantic.warning : colors.accent.phosphorCyan;
  return (
    <article
      data-testid={`engine-health-action-${index}`}
      data-kind={action.kind}
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${tone === "warn" ? `${colors.semantic.warning}40` : colors.separator}`,
        borderLeft: `2px solid ${accentColor}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          fontWeight: typography.weight.medium,
          color: colors.text.strong,
          lineHeight: 1.3,
        }}
      >
        {action.title}
      </span>
      {action.detail && (
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            color: colors.text.secondary,
            lineHeight: 1.4,
          }}
        >
          {action.detail}
        </span>
      )}
    </article>
  );
}

function deriveCalibrationBias(banditArms) {
  // Bandit arms canónicos por intent (sin bucket temporal): claves "calma",
  // "enfoque", "energia", "reset". Cada arm = { n, sum, sumsq } per UCB1-Normal.
  const intents = ["calma", "enfoque", "energia", "reset"];
  const out = [];
  const arms = banditArms || {};
  for (const intent of intents) {
    const arm = arms[intent];
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
