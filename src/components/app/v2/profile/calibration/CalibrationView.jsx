"use client";
import { useStore } from "@/store/useStore";
import { isReliableHrvEntry, buildReliableHrvBaseline } from "@/lib/hrvLog";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, ScrollPad } from "../primitives";
import { colors, typography, spacing, radii } from "../../tokens";
import { relativeTime } from "../fixtures";

// Phase 6B SP1 — fixtures → store real.
// Chronotype: deriva de neuralBaseline.rmeq (poblado por NeuralCalibrationV2).
// Resonance: deriva de resonanceFreq (poblado por ResonanceCalibration legacy).
// HRV: deriva de hrvLog filtrado por isReliableHrvEntry (sólo SQI ≥ 60 para
// cámara, todo BLE/legacy). Empty state cuando no hay data.

const CHRONOTYPE_LABELS = {
  definitely_morning: "Definitivamente matutino",
  moderately_morning: "Más matutino",
  intermediate: "Intermedio",
  moderately_evening: "Más vespertino",
  definitely_evening: "Definitivamente vespertino",
};

export default function CalibrationView({ onBack, onNavigate }) {
  const hrvLog = useStore((s) => s.hrvLog || []);
  const neuralBaseline = useStore((s) => s.neuralBaseline);
  const resonanceFreq = useStore((s) => s.resonanceFreq);
  const calibrationHistory = useStore((s) => s.calibrationHistory || []);

  const reliable = hrvLog
    .filter(isReliableHrvEntry)
    .sort((a, b) => b.ts - a.ts);
  const lastHrv = reliable[0] || null;
  const baseline14d = buildReliableHrvBaseline(hrvLog, 14);
  const baselineRmssd = baseline14d.length >= 5
    ? Math.round(Math.exp(baseline14d.reduce((a, b) => a + b, 0) / baseline14d.length))
    : null;

  const rmeq = neuralBaseline?.rmeq;
  const chronotypeLabel = rmeq?.chronotype ? CHRONOTYPE_LABELS[rmeq.chronotype] : null;

  // Resonance lastTs viene del último calibration history entry con kind:resonance,
  // si existe. Si no, mostramos sólo el rate sin "última".
  const lastResonanceCalib = calibrationHistory
    .filter((h) => h && h.kind === "resonance")
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];

  return (
    <>
      <SubRouteHeader title="Calibración" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>CRONOTIPO · rMEQ</Kicker>
          {chronotypeLabel ? (
            <Card>
              <StatLine
                value={`${chronotypeLabel} · score ${rmeq.score}`}
                caption={neuralBaseline?.timestamp
                  ? `Última calibración: ${relativeTime(neuralBaseline.timestamp)}`
                  : "Calibrado en onboarding"}
              />
              <PillButton onClick={() => onNavigate && onNavigate({ action: "retest-chronotype" })}>
                Re-test
              </PillButton>
            </Card>
          ) : (
            <EmptyCard
              message="Sin calibración de cronotipo"
              subMessage="Completa el onboarding o re-calibra para detectar tu ventana óptima."
              ctaLabel="Calibrar ahora"
              onCtaPress={() => onNavigate && onNavigate({ action: "retest-chronotype" })}
            />
          )}
        </Section>

        <Section>
          <Kicker>RESONANCIA · 5 ENSAYOS</Kicker>
          {typeof resonanceFreq === "number" && resonanceFreq > 0 ? (
            <Card>
              <StatLine
                value={`${resonanceFreq.toFixed(1)} rpm óptima`}
                caption={lastResonanceCalib?.ts
                  ? `Última calibración: ${relativeTime(lastResonanceCalib.ts)}`
                  : "Sin fecha registrada"}
              />
              <PillButton onClick={() => onNavigate && onNavigate({ action: "retest-resonance" })}>
                Re-test
              </PillButton>
            </Card>
          ) : (
            <EmptyCard
              message="Sin frecuencia de resonancia calibrada"
              subMessage="5 ensayos de respiración guiada estiman tu ritmo cardiaco-respiratorio óptimo."
              ctaLabel="Calibrar ahora"
              onCtaPress={() => onNavigate && onNavigate({ action: "retest-resonance" })}
            />
          )}
        </Section>

        <Section paddingBottom={48}>
          <Kicker>VARIABILIDAD CARDÍACA</Kicker>
          {lastHrv ? (
            <Card>
              <StatLine
                value={
                  baselineRmssd
                    ? `RMSSD ${Math.round(lastHrv.rmssd)}ms · baseline ${baselineRmssd}ms · n=${reliable.length}`
                    : `RMSSD ${Math.round(lastHrv.rmssd)}ms · n=${reliable.length} mediciones`
                }
                caption={`Última medición: ${relativeTime(lastHrv.ts)}${lastHrv.source ? ` · ${lastHrv.source === "ble" ? "BLE strap" : "cámara"}` : ""}`}
              />
              <PillButton onClick={() => onNavigate && onNavigate({ action: "new-hrv" })}>
                Nueva medición
              </PillButton>
            </Card>
          ) : (
            <EmptyCard
              message="Sin mediciones HRV todavía"
              subMessage="60 segundos con cámara o sensor BLE. Tu ventana parasimpática se calibra después de 5 mediciones confiables."
              ctaLabel="Nueva medición"
              onCtaPress={() => onNavigate && onNavigate({ action: "new-hrv" })}
            />
          )}
        </Section>
      </ScrollPad>
    </>
  );
}

function EmptyCard({ message, subMessage, ctaLabel, onCtaPress }) {
  return (
    <article
      style={{
        background: "transparent",
        border: `0.5px dashed ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: colors.text.secondary,
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
          }}
        >
          {message}
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.regular,
            color: colors.text.muted,
            lineHeight: 1.4,
          }}
        >
          {subMessage}
        </span>
      </div>
      <PillButton onClick={onCtaPress}>{ctaLabel}</PillButton>
    </article>
  );
}
