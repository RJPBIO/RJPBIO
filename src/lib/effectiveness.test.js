import { describe, it, expect } from "vitest";
import {
  computeProtocolEffectiveness,
  effectivenessByProtocol,
} from "./effectiveness";

describe("computeProtocolEffectiveness", () => {
  it("insufficient cuando n<minN", () => {
    const r = computeProtocolEffectiveness(
      [{ pre: 2, mood: 3 }, { pre: 2, mood: 3 }],
      { minN: 5 }
    );
    expect(r.insufficient).toBe(true);
    expect(r.n).toBe(2);
  });

  it("ignora sesiones sin pre o mood", () => {
    const sessions = [
      { pre: 2, mood: 3 }, { pre: 2 }, { mood: 3 },
      { pre: 2, mood: 4 }, { pre: 3, mood: 4 }, { pre: 2, mood: 3 },
      { pre: 3, mood: 4 },
    ];
    const r = computeProtocolEffectiveness(sessions, { minN: 5 });
    expect(r.insufficient).toBe(false);
    expect(r.n).toBe(5);
  });

  it("detecta efecto significativo cuando CI95 inferior > 0", () => {
    // Todas las sesiones con lift consistente de +1.5 → IC95 no cruza 0
    const sessions = Array.from({ length: 10 }, () => ({ pre: 2, mood: 3.5 }));
    const r = computeProtocolEffectiveness(sessions);
    expect(r.meanLift).toBe(1.5);
    expect(r.significant).toBe(true);
    expect(r.ci95Lo).toBeGreaterThan(0);
    expect(r.magnitude).toBe("large"); // Cohen's d grande
  });

  it("no-effect cuando CI95 cruza 0", () => {
    // Lifts mixtos alrededor de cero
    const sessions = [
      { pre: 3, mood: 3 }, { pre: 3, mood: 4 }, { pre: 3, mood: 2 },
      { pre: 3, mood: 3 }, { pre: 3, mood: 4 }, { pre: 3, mood: 2 },
    ];
    const r = computeProtocolEffectiveness(sessions);
    expect(r.significant).toBe(false);
    expect(r.magnitude).toBe("no-effect");
  });

  it("calcula % positivo correctamente", () => {
    const sessions = [
      { pre: 2, mood: 3 },  // +1
      { pre: 2, mood: 2 },  // 0
      { pre: 2, mood: 4 },  // +2
      { pre: 3, mood: 2 },  // -1
      { pre: 2, mood: 3 },  // +1
      { pre: 2, mood: 4 },  // +2
    ];
    const r = computeProtocolEffectiveness(sessions);
    expect(r.positivePct).toBe(67); // 4 de 6
  });

  it("magnitud moderate cuando Cohen's d en [0.2, 0.5)", () => {
    // N=100, 70 lifts +1 y 30 lifts -1 → mean=0.4, SD≈0.92, d≈0.43 → moderate
    const sessions = [
      ...Array.from({ length: 70 }, () => ({ pre: 2, mood: 3 })),
      ...Array.from({ length: 30 }, () => ({ pre: 3, mood: 2 })),
    ];
    const r = computeProtocolEffectiveness(sessions);
    expect(r.significant).toBe(true);
    expect(r.magnitude).toBe("moderate");
    expect(r.cohensD).toBeGreaterThanOrEqual(0.2);
    expect(r.cohensD).toBeLessThan(0.5);
  });

  it("entrada null/empty retorna insufficient n=0", () => {
    expect(computeProtocolEffectiveness(null).insufficient).toBe(true);
    expect(computeProtocolEffectiveness([]).insufficient).toBe(true);
  });
});

describe("effectivenessByProtocol", () => {
  it("agrupa por protocolId (campo .proto)", () => {
    const sessions = [
      ...Array.from({ length: 6 }, () => ({ proto: "focus", pre: 2, mood: 3 })),
      ...Array.from({ length: 6 }, () => ({ proto: "calm",  pre: 3, mood: 4 })),
    ];
    const r = effectivenessByProtocol(sessions);
    expect(r.focus.n).toBe(6);
    expect(r.calm.n).toBe(6);
    expect(r.focus.meanLift).toBe(1);
    expect(r.calm.meanLift).toBe(1);
  });

  it("omite sesiones sin protocolId", () => {
    const sessions = [
      { pre: 2, mood: 3 },
      { proto: "focus", pre: 2, mood: 3 },
    ];
    const r = effectivenessByProtocol(sessions);
    expect(Object.keys(r)).toEqual(["focus"]);
  });

  it("protocolo con n<minN retorna insufficient", () => {
    const sessions = [
      { proto: "calm", pre: 2, mood: 3 },
      { proto: "calm", pre: 2, mood: 3 },
    ];
    const r = effectivenessByProtocol(sessions, { minN: 5 });
    expect(r.calm.insufficient).toBe(true);
  });
});
