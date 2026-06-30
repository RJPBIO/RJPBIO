import { describe, it, expect } from "vitest";
import { buildChronotypeDrift } from "./chronotypeDrift";

const NOW = new Date(2026, 2, 1, 12, 0, 0).getTime();
const atHour = (hour, fields, dayOffset = 0) => ({
  ts: new Date(2026, 0, 1 + dayOffset, hour, 0, 0).getTime(),
  bioQ: 80, c: 70, quality: "alta", ...fields,
});
// Historia cuya mejor ventana observada cae en `hour` (centro hour+1).
function bestAt(hour) {
  return [
    ...Array.from({ length: 8 }, (_, i) => atHour(hour, { bioQ: 92, c: 84 }, i)),
    ...Array.from({ length: 6 }, (_, i) => atHour((hour + 6) % 24, { bioQ: 42, c: 40 }, i)),
  ];
}

describe("buildChronotypeDrift", () => {
  it("sin cronotipo declarado → no disponible", () => {
    const r = buildChronotypeDrift({ chronotype: null, history: bestAt(10), now: NOW });
    expect(r.available).toBe(false);
    expect(r.reason).toMatch(/cronotipo/i);
  });

  it("sin ventana observada (pocas sesiones) → no disponible", () => {
    const r = buildChronotypeDrift({ chronotype: { type: "definite_evening" }, history: [], now: NOW });
    expect(r.available).toBe(false);
  });

  it("alineado: matutino moderado + mejor ventana 10:00", () => {
    const r = buildChronotypeDrift({ chronotype: { type: "moderate_morning" }, history: bestAt(10), now: NOW });
    expect(r.available).toBe(true);
    expect(r.drift).toBe("aligned");
    expect(r.shouldRecalibrate).toBe(false);
  });

  it("drift notable: vespertino declarado pero mejor respuesta en la mañana → recalibra", () => {
    const r = buildChronotypeDrift({ chronotype: { type: "definite_evening" }, history: bestAt(10), now: NOW });
    expect(r.drift).toBe("notable");
    expect(r.shouldRecalibrate).toBe(true);
    expect(r.message).toMatch(/recalibra/i);
    expect(r.observed.label).toBe("10:00–12:00");
  });

  it("drift leve: matutino definido vs ventana 10:00 (≈2.5h)", () => {
    const r = buildChronotypeDrift({ chronotype: { type: "definite_morning" }, history: bestAt(10), now: NOW });
    expect(r.drift).toBe("mild");
    expect(r.shouldRecalibrate).toBe(false);
  });

  it("normaliza formas adverbiales (definitely_evening)", () => {
    const r = buildChronotypeDrift({ chronotype: { type: "definitely_evening" }, history: bestAt(10), now: NOW });
    expect(r.available).toBe(true);
    expect(r.declaredType).toBe("definite_evening");
  });

  it("diferencia circular (madrugada vs vespertino)", () => {
    const r = buildChronotypeDrift({ chronotype: { type: "definite_evening" }, history: bestAt(0), now: NOW });
    // observado centro 1:00 vs esperado 19:00 → circular 6h → notable
    expect(r.diffHours).toBeLessThanOrEqual(12);
    expect(r.drift).toBe("notable");
  });
});
