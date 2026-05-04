"use client";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { isReliableHrvEntry, buildReliableHrvBaseline } from "@/lib/hrvLog";
import { chronotypeLabel as resolveChronotypeLabel } from "@/lib/instruments";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, ScrollPad } from "../primitives";
import { colors, typography, spacing, radii } from "../../tokens";
import { relativeTime } from "../fixtures";

// Phase 6B SP1 — fixtures → store real.
// Chronotype: lee state.chronotype (Phase 6D SP1 wiring) primero, con
// fallback a neuralBaseline.rmeq legacy. state.chronotype se actualiza
// inmediato cuando hay retake desde Profile/ColdStart; neuralBaseline
// solo se actualiza en onboarding completo. Antes Phase 6D: solo leía
// neuralBaseline → retake nunca se reflejaba en CalibrationView.
// Resonance: deriva de resonanceFreq (poblado por ResonanceCalibration legacy).
// HRV: deriva de hrvLog filtrado por isReliableHrvEntry (sólo SQI ≥ 60 para
// cámara, todo BLE/legacy). Empty state cuando no hay data.

export default function CalibrationView({ onBack, onNavigate, subAnchor = null }) {
  // Phase 6D SP4c — scroll al sub-anchor cuando se monta vía
  // target:/app/profile/calibration#hrv (ColdStart card "Mide tu HRV").
  useEffect(() => {
    if (!subAnchor) return;
    const el = document.querySelector(`[data-anchor="${subAnchor}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [subAnchor]);
  const hrvLog = useStore((s) => s.hrvLog || []);
  const neuralBaseline = useStore((s) => s.neuralBaseline);
  const chronotype = useStore((s) => s.chronotype);
  const resonanceFreq = useStore((s) => s.resonanceFreq);
  const calibrationHistory = useStore((s) => s.calibrationHistory || []);
  const instruments = useStore((s) => s.instruments || []);

  const reliable = hrvLog
    .filter(isReliableHrvEntry)
    .sort((a, b) => b.ts - a.ts);
  const lastHrv = reliable[0] || null;
  const baseline14d = buildReliableHrvBaseline(hrvLog, 14);
  const baselineRmssd = baseline14d.length >= 5
    ? Math.round(Math.exp(baseline14d.reduce((a, b) => a + b, 0) / baseline14d.length))
    : null;

  // Phase 6D SP1 — chronotype prioriza state.chronotype (record fresh
  // tras retake) y cae a neuralBaseline.rmeq solo si state está vacío
  // (back-compat para users con onboarding pre-SP1 que aún no han
  // recalibrado). Soporta dos shapes: objeto rico (Phase 6D) o categoría
  // string legacy (la lectura usa optional chaining defensiva).
  const rmeq = neuralBaseline?.rmeq;
  const chronoCategory =
    chronotype?.category || chronotype?.type || rmeq?.chronotype || null;
  const chronoScore = chronotype?.score ?? rmeq?.score ?? null;
  const chronoTs = chronotype?.ts || neuralBaseline?.timestamp || null;
  // Última calibración rMEQ via instruments[] como ts más confiable
  // (state.chronotype.ts puede venir del onboarding antiguo sin ts si
  // el record se construyó con shape parcial).
  const lastRmeqEntry = instruments
    .filter((e) => e && e.instrumentId === "rmeq" && typeof e.ts === "number")
    .sort((a, b) => b.ts - a.ts)[0];
  const chronoTsFinal = lastRmeqEntry?.ts || chronoTs;
  const chronotypeLabel = chronoCategory ? resolveChronotypeLabel(chronoCategory) : null;

  // Resonance lastTs viene del último calibration history entry con kind:resonance,
  // si existe. Si no, mostramos sólo el rate sin "última".
  const lastResonanceCalib = calibrationHistory
    .filter((h) => h && h.kind === "resonance")
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];

  return (
    <>
      <SubRouteHeader title="Calibración" onBack={onBack} />
      <ScrollPad>
        <div data-anchor="rmeq">
        <Section>
          <Kicker>CRONOTIPO · rMEQ</Kicker>
          {chronotypeLabel ? (
            <Card>
              <StatLine
                value={chronoScore != null ? `${chronotypeLabel} · score ${chronoScore}` : chronotypeLabel}
                caption={chronoTsFinal
                  ? `Última calibración: ${relativeTime(chronoTsFinal)}`
                  : "Calibrado en onboarding"}
              />
              <PillButton onClick={() => onNavigate && onNavigate({ action: "retake-chronotype" })}>
                Re-test
              </PillButton>
            </Card>
          ) : (
            <EmptyCard
              message="Sin calibración de cronotipo"
              subMessage="Completa el onboarding o re-calibra para detectar tu ventana óptima."
              ctaLabel="Calibrar ahora"
              onCtaPress={() => onNavigate && onNavigate({ action: "retake-chronotype" })}
            />
          )}
        </Section>
        </div>

        <div data-anchor="resonance">
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
        </div>

        <div data-anchor="hrv">
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
        </div>
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
