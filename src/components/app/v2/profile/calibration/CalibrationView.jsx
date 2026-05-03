"use client";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, ScrollPad } from "../primitives";
import { FIXTURE_CALIBRATION, relativeTime } from "../fixtures";

export default function CalibrationView({ onBack, onNavigate }) {
  const c = FIXTURE_CALIBRATION;
  return (
    <>
      <SubRouteHeader title="Calibración" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>CRONOTIPO · MEQ-SA</Kicker>
          <Card>
            <StatLine
              value={`${c.chronotype.label} · score ${c.chronotype.score}`}
              caption={`Última calibración: ${relativeTime(c.chronotype.lastTs)}`}
            />
            <PillButton onClick={() => onNavigate && onNavigate({ action: "retest-chronotype" })}>
              Re-test
            </PillButton>
          </Card>
        </Section>
        <Section>
          <Kicker>RESONANCIA · 5 ENSAYOS</Kicker>
          <Card>
            <StatLine
              value={`${c.resonance.rate} rpm óptima`}
              caption={`Última calibración: ${relativeTime(c.resonance.lastTs)}`}
            />
            <PillButton onClick={() => onNavigate && onNavigate({ action: "retest-resonance" })}>
              Re-test
            </PillButton>
          </Card>
        </Section>
        <Section paddingBottom={48}>
          <Kicker>VARIABILIDAD CARDÍACA</Kicker>
          <Card>
            <StatLine
              value={`RMSSD ${c.hrv.rmssd}ms baseline · n=${c.hrv.n} mediciones`}
              caption={`Última medición: ${relativeTime(c.hrv.lastTs)}`}
            />
            <PillButton onClick={() => onNavigate && onNavigate({ action: "new-hrv" })}>
              Nueva medición
            </PillButton>
          </Card>
        </Section>
      </ScrollPad>
    </>
  );
}
