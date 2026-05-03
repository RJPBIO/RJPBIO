"use client";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, ScrollPad } from "../primitives";
import { FIXTURE_INSTRUMENTS, relativeTime } from "../fixtures";

export default function InstrumentsView({ onBack, onNavigate }) {
  const i = FIXTURE_INSTRUMENTS;
  const items = [
    { kicker: "PSS-4 · TEST DE ESTRÉS PERCIBIDO",  data: i.pss4,    qCount: 4, action: "retake-pss4" },
    { kicker: "SWEMWBS-7 · BIENESTAR MENTAL",      data: i.swemwbs, qCount: 7, action: "retake-swemwbs" },
    { kicker: "PHQ-2 · SCREENING DEPRESIÓN",       data: i.phq2,    qCount: 2, action: "retake-phq2" },
  ];
  return (
    <>
      <SubRouteHeader title="Instrumentos" onBack={onBack} />
      <ScrollPad>
        {items.map((it, idx) => (
          <Section key={it.kicker} paddingBottom={idx === items.length - 1 ? 48 : 32}>
            <Kicker>{it.kicker}</Kicker>
            <Card>
              <StatLine
                value={`Score ${it.data.score}/${it.data.max} · ${it.data.level}`}
                caption={`${it.qCount} preguntas · última: ${relativeTime(it.data.lastTs)}`}
              />
              <PillButton onClick={() => onNavigate && onNavigate({ action: it.action })}>
                Tomar de nuevo
              </PillButton>
            </Card>
          </Section>
        ))}
      </ScrollPad>
    </>
  );
}
