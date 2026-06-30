import { describe, it, expect } from "vitest";
import { detectRegulationMoment } from "./regulationMoments";

const DAY = 86_400_000;
const at = (h) => new Date(2026, 5, 15, h, 0, 0).getTime();

// Baseline ~40ms para que el gemelo esté disponible; la última lectura fija el dir.
function withReading(nowTs, recentRmssd) {
  const out = [];
  for (let i = 1; i <= 20; i++) out.push({ ts: nowTs - i * 2 * DAY, rmssd: 40 + (((i % 5) - 2) * 4) });
  out.push({ ts: nowTs, rmssd: recentRmssd });
  return out;
}

describe("detectRegulationMoment", () => {
  it("noche → pre-sueño (Suspiro Fisiológico #15), sin importar el estado", () => {
    const r = detectRegulationMoment({ hrvLog: withReading(at(22), 40), now: at(22) });
    expect(r.detected).toBe(true);
    expect(r.situation).toBe("pre_sueno");
    expect(r.protocolId).toBe(15);
  });

  it("tarde-noche + por debajo de norma → transición a casa (#26)", () => {
    const r = detectRegulationMoment({ hrvLog: withReading(at(19), 24), now: at(19) });
    expect(r.situation).toBe("transicion_casa");
    expect(r.protocolId).toBe(26);
  });

  it("mañana + por debajo de norma → despertar (#2)", () => {
    const r = detectRegulationMoment({ hrvLog: withReading(at(7), 24), now: at(7) });
    expect(r.situation).toBe("despertar");
    expect(r.protocolId).toBe(2);
  });

  it("día + estado listo (en rango) → ventana creativa (#2)", () => {
    const r = detectRegulationMoment({ hrvLog: withReading(at(11), 41), now: at(11) });
    expect(r.situation).toBe("creatividad");
    expect(r.protocolId).toBe(2);
  });

  it("tarde sin desviación abajo y no listo → sin momento", () => {
    // 19h con lectura alta (above) no es transición-casa (requiere below) ni
    // creatividad (fuera de 9-18) → sin momento.
    const r = detectRegulationMoment({ hrvLog: withReading(at(19), 70), now: at(19) });
    expect(r.detected).toBe(false);
  });

  it("sin lecturas (sin gemelo) en horario diurno → sin momento", () => {
    const r = detectRegulationMoment({ hrvLog: [], now: at(11) });
    expect(r.detected).toBe(false);
  });
});
