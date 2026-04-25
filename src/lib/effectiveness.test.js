import { describe, it, expect } from "vitest";
import {
  computeProtocolEffectiveness,
  effectivenessByProtocol,
  coherenceByProtocol,
  aggregateTeamCoherence,
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

describe("coherenceByProtocol", () => {
  it("agrega coherenceLive.score por protocolo", () => {
    const sessions = [
      { p: "calma", coherenceLive: { score: 75 } },
      { p: "calma", coherenceLive: { score: 80 } },
      { p: "calma", coherenceLive: { score: 70 } },
      { p: "energia", coherenceLive: { score: 50 } },
      { p: "energia", coherenceLive: { score: 55 } },
      { p: "energia", coherenceLive: { score: 45 } },
    ];
    const r = coherenceByProtocol(sessions, { minN: 3 });
    expect(r.calma.meanScore).toBe(75);
    expect(r.calma.n).toBe(3);
    expect(r.energia.meanScore).toBe(50);
  });

  it("ignora sesiones sin coherenceLive", () => {
    const sessions = [
      { p: "calma" },
      { p: "calma", coherenceLive: { score: 70 } },
      { p: "calma", coherenceLive: { score: 80 } },
      { p: "calma", coherenceLive: { score: 75 } },
    ];
    const r = coherenceByProtocol(sessions);
    expect(r.calma.n).toBe(3);
  });

  it("insufficient cuando n<minN", () => {
    const r = coherenceByProtocol(
      [{ p: "calma", coherenceLive: { score: 70 } }],
      { minN: 3 }
    );
    expect(r.calma.insufficient).toBe(true);
  });

  it("ignora sesiones sin protocolo", () => {
    const sessions = [
      { coherenceLive: { score: 70 } },
      { p: "calma", coherenceLive: { score: 70 } },
      { p: "calma", coherenceLive: { score: 80 } },
      { p: "calma", coherenceLive: { score: 75 } },
    ];
    const r = coherenceByProtocol(sessions);
    expect(Object.keys(r)).toEqual(["calma"]);
  });
});

describe("aggregateTeamCoherence", () => {
  it("returns insufficient when fewer than minK unique users", () => {
    const sessions = [
      { userId: "a", coherenceLive: { score: 70 } },
      { userId: "a", coherenceLive: { score: 75 } },
      { userId: "b", coherenceLive: { score: 80 } },
    ];
    const r = aggregateTeamCoherence(sessions, { minK: 5 });
    expect(r.insufficient).toBe(true);
    expect(r.n).toBe(2);
  });

  it("counts users not sessions for k-anon (privacy critical)", () => {
    // ONE user with 10 sessions should NOT pass minK=5
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      userId: "alice",
      coherenceLive: { score: 75 + i },
    }));
    const r = aggregateTeamCoherence(sessions, { minK: 5 });
    expect(r.insufficient).toBe(true);
  });

  it("aggregates with mean + sd when sufficient users", () => {
    const sessions = [
      { userId: "a", coherenceLive: { score: 70 } },
      { userId: "b", coherenceLive: { score: 80 } },
      { userId: "c", coherenceLive: { score: 75 } },
      { userId: "d", coherenceLive: { score: 85 } },
      { userId: "e", coherenceLive: { score: 90 } },
    ];
    const r = aggregateTeamCoherence(sessions, { minK: 5 });
    expect(r.insufficient).toBe(false);
    expect(r.uniqueUsers).toBe(5);
    expect(r.meanScore).toBe(80);
    expect(r.sd).toBeGreaterThan(0);
  });

  it("topProtocol respects k-anon per protocol", () => {
    const sessions = [
      // 5 users on calma → passes
      { userId: "a", p: "calma", coherenceLive: { score: 80 } },
      { userId: "b", p: "calma", coherenceLive: { score: 85 } },
      { userId: "c", p: "calma", coherenceLive: { score: 75 } },
      { userId: "d", p: "calma", coherenceLive: { score: 82 } },
      { userId: "e", p: "calma", coherenceLive: { score: 78 } },
      // only 2 users on energia → does NOT pass per-protocol k-anon
      { userId: "a", p: "energia", coherenceLive: { score: 95 } },
      { userId: "b", p: "energia", coherenceLive: { score: 90 } },
    ];
    const r = aggregateTeamCoherence(sessions, { minK: 5 });
    expect(r.topProtocol?.name).toBe("calma");
  });

  it("ignores sessions without coherenceLive.score", () => {
    const sessions = [
      { userId: "a" },
      { userId: "b", coherenceLive: { score: 70 } },
      { userId: "c", coherenceLive: { score: 75 } },
      { userId: "d", coherenceLive: { score: 80 } },
      { userId: "e", coherenceLive: { score: 85 } },
      { userId: "f", coherenceLive: { score: 90 } },
    ];
    const r = aggregateTeamCoherence(sessions, { minK: 5 });
    expect(r.insufficient).toBe(false);
    expect(r.uniqueUsers).toBe(5); // a got filtered
  });
});
