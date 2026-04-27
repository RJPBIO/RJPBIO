import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { computeOrgNeuralHealth } from "./orgHealth";

const HOUR = 3600000;
const DAY = 24 * HOUR;
const NOW = new Date("2026-04-26T12:00:00Z").getTime();

function user(id, totalSessions, daysAgo, protoHist = null) {
  return {
    userId: id,
    totalSessions,
    lastSessionTs: daysAgo === null ? null : NOW - daysAgo * DAY,
    protocolHistogram: protoHist,
  };
}

describe("computeOrgNeuralHealth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => vi.useRealTimers());

  it("suppressed cuando hay <5 active members (k-anonymity)", () => {
    const r = computeOrgNeuralHealth([
      user("a", 3, 1),
      user("b", 5, 2),
    ]);
    expect(r.suppressed).toBe(true);
    expect(r.reason).toMatch(/k<5/);
    expect(r.totalMembers).toBe(2);
    expect(r.activeMembers).toBe(2);
  });

  it("ignora users sin sesiones (totalSessions=0)", () => {
    const r = computeOrgNeuralHealth([
      user("a", 0, null),
      user("b", 5, 1),
      user("c", 8, 3),
      user("d", 12, 5),
      user("e", 25, 2),
      user("f", 6, 4),
    ]);
    expect(r.totalMembers).toBe(6);
    expect(r.activeMembers).toBe(5);
  });

  describe("maturity distribution", () => {
    it("clasifica por sessions count", () => {
      const r = computeOrgNeuralHealth([
        user("a", 3, 1),    // cold-start
        user("b", 4, 2),    // cold-start
        user("c", 10, 3),   // learning
        user("d", 15, 4),   // learning
        user("e", 25, 5),   // personalized
        user("f", 30, 6),   // personalized
      ]);
      expect(r.maturity.coldStart).toBe(2);
      expect(r.maturity.learning).toBe(2);
      expect(r.maturity.personalized).toBe(2);
    });

    it("expone porcentajes", () => {
      const r = computeOrgNeuralHealth([
        user("a", 3, 1), user("b", 3, 1), user("c", 3, 1),
        user("d", 3, 1), user("e", 3, 1),
      ]);
      expect(r.maturityPct.coldStart).toBeCloseTo(1.0, 5);
      expect(r.maturityPct.learning).toBe(0);
      expect(r.maturityPct.personalized).toBe(0);
    });
  });

  describe("staleness distribution", () => {
    it("clasifica por gap days", () => {
      const r = computeOrgNeuralHealth([
        user("a", 5, 0),    // fresh (0d)
        user("b", 5, 5),    // fresh (≤7)
        user("c", 5, 10),   // active (8-14)
        user("d", 5, 20),   // cooling (15-30)
        user("e", 5, 45),   // stale (31-60)
        user("f", 5, 100),  // abandoned (61+)
      ]);
      expect(r.staleness.fresh).toBe(2);
      expect(r.staleness.active).toBe(1);
      expect(r.staleness.cooling).toBe(1);
      expect(r.staleness.stale).toBe(1);
      expect(r.staleness.abandoned).toBe(1);
    });

    it("recalibrationNeeded suma cooling + stale + abandoned", () => {
      const r = computeOrgNeuralHealth([
        user("a", 5, 0),    // fresh
        user("b", 5, 5),    // fresh
        user("c", 5, 20),   // cooling — recalib soft
        user("d", 5, 45),   // stale — recalib hard
        user("e", 5, 100),  // abandoned — recalib hard
      ]);
      expect(r.recalibrationNeeded).toBe(3);
      expect(r.recalibrationPct).toBeCloseTo(0.6, 2);
    });

    it("user sin lastSessionTs → cuenta como abandoned", () => {
      const r = computeOrgNeuralHealth([
        user("a", 1, null),
        user("b", 5, 0),
        user("c", 5, 1),
        user("d", 5, 2),
        user("e", 5, 3),
      ]);
      expect(r.staleness.abandoned).toBe(1);
    });
  });

  describe("topProtocols", () => {
    it("agrega histogramas y ordena descendente", () => {
      const r = computeOrgNeuralHealth([
        user("a", 5, 1, { "Reset": 3, "Calma": 2 }),
        user("b", 5, 2, { "Reset": 2, "Enfoque": 3 }),
        user("c", 5, 3, { "Calma": 4, "Enfoque": 1 }),
        user("d", 5, 4, { "Reset": 1, "Calma": 1, "Enfoque": 3 }),
        user("e", 5, 5, { "Reset": 2 }),
      ]);
      expect(r.topProtocols.length).toBeGreaterThan(0);
      expect(r.topProtocols[0].count).toBeGreaterThanOrEqual(r.topProtocols[1].count);
      // Reset = 3+2+1+2 = 8
      expect(r.topProtocols.find((p) => p.protocol === "Reset").count).toBe(8);
    });

    it("expone share como ratio del total", () => {
      const r = computeOrgNeuralHealth([
        user("a", 4, 1, { "Reset": 4 }),
        user("b", 4, 2, { "Reset": 4 }),
        user("c", 4, 3, { "Reset": 4 }),
        user("d", 4, 4, { "Reset": 4 }),
        user("e", 4, 5, { "Reset": 4 }),
      ]);
      const reset = r.topProtocols.find((p) => p.protocol === "Reset");
      expect(reset.share).toBeCloseTo(1.0, 2);
    });

    it("limita a top 5", () => {
      const r = computeOrgNeuralHealth([
        user("a", 7, 1, { p1: 1, p2: 1, p3: 1, p4: 1, p5: 1, p6: 1, p7: 1 }),
        user("b", 7, 2, { p1: 1, p2: 1, p3: 1, p4: 1, p5: 1, p6: 1, p7: 1 }),
        user("c", 7, 3, { p1: 1, p2: 1, p3: 1, p4: 1, p5: 1, p6: 1, p7: 1 }),
        user("d", 7, 4, { p1: 1, p2: 1, p3: 1, p4: 1, p5: 1, p6: 1, p7: 1 }),
        user("e", 7, 5, { p1: 1, p2: 1, p3: 1, p4: 1, p5: 1, p6: 1, p7: 1 }),
      ]);
      expect(r.topProtocols.length).toBe(5);
    });
  });

  describe("verdict", () => {
    it("at-risk cuando ≥50% necesita recalibración", () => {
      const r = computeOrgNeuralHealth([
        user("a", 5, 50), user("b", 5, 50), user("c", 5, 50),
        user("d", 5, 1),  user("e", 5, 1),
      ]);
      expect(r.verdict).toBe("at-risk");
    });

    it("mature cuando ≥50% son personalized", () => {
      const r = computeOrgNeuralHealth([
        user("a", 25, 1), user("b", 25, 1), user("c", 25, 1),
        user("d", 5, 1),  user("e", 5, 1),
      ]);
      expect(r.verdict).toBe("mature");
    });

    it("early cuando ≥50% son cold-start", () => {
      const r = computeOrgNeuralHealth([
        user("a", 2, 1), user("b", 3, 1), user("c", 4, 1),
        user("d", 10, 1), user("e", 12, 1),
      ]);
      expect(r.verdict).toBe("early");
    });
  });

  describe("actions", () => {
    it("warn por recalibración alta (≥30%)", () => {
      const r = computeOrgNeuralHealth([
        user("a", 5, 50), user("b", 5, 50),
        user("c", 5, 1),  user("d", 5, 1), user("e", 5, 1),
      ]);
      const recalibAction = r.actions.find((a) => /recalibración/i.test(a.title));
      expect(recalibAction).toBeDefined();
      expect(recalibAction.kind).toBe("warn");
    });

    it("info cuando ningún user es personalized + org ≥10", () => {
      const users = Array.from({ length: 12 }, (_, i) => user(`u${i}`, 10, 1));
      const r = computeOrgNeuralHealth(users);
      const personalizedAction = r.actions.find((a) => /personalizado/i.test(a.title));
      expect(personalizedAction).toBeDefined();
      expect(personalizedAction.kind).toBe("info");
    });

    it("ok cuando todo está saludable", () => {
      const users = Array.from({ length: 6 }, (_, i) => user(`u${i}`, 25, 1));
      const r = computeOrgNeuralHealth(users);
      expect(r.actions[0].kind).toBe("ok");
    });
  });

  it("nunca tira con input malformado", () => {
    expect(() => computeOrgNeuralHealth(null)).not.toThrow();
    expect(() => computeOrgNeuralHealth(undefined)).not.toThrow();
    expect(() => computeOrgNeuralHealth("bad")).not.toThrow();
    expect(() => computeOrgNeuralHealth([null, undefined, {}])).not.toThrow();
  });

  it("incluye now ISO en el output", () => {
    const r = computeOrgNeuralHealth([
      user("a", 5, 1), user("b", 5, 1), user("c", 5, 1),
      user("d", 5, 1), user("e", 5, 1),
    ]);
    expect(r.now).toMatch(/2026-04-26/);
  });
});
