import { describe, it, expect } from "vitest";
import {
  analyzeRTVariance,
  analyzeTouchHoldUniformity,
  analyzeTimeOfDayDistribution,
  analyzeBioQDistribution,
  analyzeDurationUniformity,
  detectGamingV2,
} from "./antiGaming";

const HOUR = 3600000;
const DAY = 24 * HOUR;
const NOW = new Date("2026-04-26T12:00:00Z").getTime();

function histAt(daysAgo, hour = 12, opts = {}) {
  const t = new Date(NOW - daysAgo * DAY);
  t.setHours(hour);
  return {
    p: opts.p || "alpha",
    ts: t.getTime(),
    c: 50,
    bioQ: opts.bioQ ?? 60,
    dur: opts.dur ?? 90,
    reactionTimes: opts.reactionTimes,
    touchHolds: opts.touchHolds,
  };
}

describe("analyzeRTVariance", () => {
  it("insufficient-data con <4 muestras", () => {
    const r = analyzeRTVariance([400, 500, 450]);
    expect(r.status).toBe("insufficient-data");
    expect(r.score).toBe(0);
  });

  it("human-like con CV en banda", () => {
    const rts = [400, 470, 360, 520, 410, 480]; // CV ≈ 0.124
    const r = analyzeRTVariance(rts);
    expect(r.status).toBe("human-like");
    expect(r.score).toBe(0);
  });

  it("robotic-low-cv con CV muy bajo", () => {
    const rts = [400, 401, 399, 400, 402, 400];
    const r = analyzeRTVariance(rts);
    expect(r.status).toBe("robotic-low-cv");
    expect(r.score).toBeGreaterThan(0);
    expect(r.evidence).toMatch(/baja/);
  });

  it("fake-high-cv con CV exagerado", () => {
    const rts = [100, 1500, 200, 1800, 50, 2000];
    const r = analyzeRTVariance(rts);
    expect(r.status).toBe("fake-high-cv");
    expect(r.score).toBeGreaterThan(0);
  });

  it("ignora valores no positivos", () => {
    const r = analyzeRTVariance([400, -1, 0, 500]);
    expect(r.status).toBe("insufficient-data");
  });
});

describe("analyzeTouchHoldUniformity", () => {
  it("insufficient-data con <3 muestras", () => {
    expect(analyzeTouchHoldUniformity([0.2, 0.3]).status).toBe("insufficient-data");
  });

  it("uniform-holds con variance casi 0", () => {
    const r = analyzeTouchHoldUniformity([0.2, 0.2, 0.2, 0.2, 0.2]);
    expect(r.status).toBe("uniform-holds");
    expect(r.score).toBeGreaterThan(0);
  });

  it("varied con holds dispares", () => {
    const r = analyzeTouchHoldUniformity([0.1, 0.5, 1.2, 0.3, 0.8]);
    expect(r.status).toBe("varied");
    expect(r.score).toBe(0);
  });
});

describe("analyzeTimeOfDayDistribution", () => {
  it("insufficient-data con <8 sesiones", () => {
    const r = analyzeTimeOfDayDistribution(Array(5).fill(histAt(0, 11)));
    expect(r.status).toBe("insufficient-data");
  });

  it("human-like con concentración natural", () => {
    // 8 sesiones, distribuidas entre 9-12h con leve variación
    const hist = [
      histAt(0, 9), histAt(1, 10), histAt(2, 11), histAt(3, 9),
      histAt(4, 12), histAt(5, 10), histAt(6, 11), histAt(7, 10),
    ];
    const r = analyzeTimeOfDayDistribution(hist);
    expect(r.status).toBe("human-like");
    expect(r.score).toBe(0);
  });

  it("anomaly por low-entropy (todas a la misma hora)", () => {
    const hist = Array(10).fill(0).map((_, i) => histAt(i, 11));
    const r = analyzeTimeOfDayDistribution(hist);
    expect(r.status).toBe("anomaly");
    expect(r.score).toBeGreaterThan(0);
    expect(r.evidence).toMatch(/misma hora/);
  });

  it("flag implausible-hour (madrugada 3am)", () => {
    const hist = [
      histAt(0, 3), histAt(1, 3), histAt(2, 3),
      histAt(3, 11), histAt(4, 11), histAt(5, 11),
      histAt(6, 11), histAt(7, 11),
    ];
    const r = analyzeTimeOfDayDistribution(hist);
    expect(r.implausibleCount).toBe(3);
    expect(r.score).toBeGreaterThan(0);
  });
});

describe("analyzeBioQDistribution", () => {
  it("insufficient-data con <5", () => {
    expect(analyzeBioQDistribution([histAt(0)]).status).toBe("insufficient-data");
  });

  it("flat-low-quality con varianza baja Y mean baja", () => {
    const hist = [
      histAt(0, 11, { bioQ: 30 }), histAt(1, 11, { bioQ: 32 }),
      histAt(2, 11, { bioQ: 28 }), histAt(3, 11, { bioQ: 30 }),
      histAt(4, 11, { bioQ: 31 }),
    ];
    const r = analyzeBioQDistribution(hist);
    expect(r.status).toBe("flat-low-quality");
    expect(r.score).toBeGreaterThan(0);
  });

  it("natural cuando varianza baja PERO mean alta (usuario consistente bueno)", () => {
    const hist = [
      histAt(0, 11, { bioQ: 80 }), histAt(1, 11, { bioQ: 82 }),
      histAt(2, 11, { bioQ: 78 }), histAt(3, 11, { bioQ: 81 }),
      histAt(4, 11, { bioQ: 79 }),
    ];
    const r = analyzeBioQDistribution(hist);
    expect(r.status).toBe("natural-distribution");
    expect(r.score).toBe(0);
  });

  it("natural con varianza alta", () => {
    const hist = [
      histAt(0, 11, { bioQ: 30 }), histAt(1, 11, { bioQ: 80 }),
      histAt(2, 11, { bioQ: 50 }), histAt(3, 11, { bioQ: 75 }),
      histAt(4, 11, { bioQ: 40 }),
    ];
    const r = analyzeBioQDistribution(hist);
    expect(r.status).toBe("natural-distribution");
  });
});

describe("analyzeDurationUniformity", () => {
  it("uniform-duration cuando var muy baja", () => {
    const hist = [
      histAt(0, 11, { dur: 90 }), histAt(1, 11, { dur: 90 }),
      histAt(2, 11, { dur: 90 }), histAt(3, 11, { dur: 90 }),
      histAt(4, 11, { dur: 90 }),
    ];
    const r = analyzeDurationUniformity(hist);
    expect(r.status).toBe("uniform-duration");
    expect(r.score).toBeGreaterThan(0);
  });

  it("varied con durs distintos", () => {
    const hist = [
      histAt(0, 11, { dur: 60 }), histAt(1, 11, { dur: 120 }),
      histAt(2, 11, { dur: 90 }), histAt(3, 11, { dur: 75 }),
      histAt(4, 11, { dur: 105 }),
    ];
    const r = analyzeDurationUniformity(hist);
    expect(r.status).toBe("varied");
    expect(r.score).toBe(0);
  });
});

describe("detectGamingV2 — composer", () => {
  it("insufficient-data con history corto", () => {
    const r = detectGamingV2({ history: Array(3).fill(histAt(0)) });
    expect(r.verdict).toBe("insufficient-data");
    expect(r.gaming).toBe(false);
  });

  it("clean con sesiones humanas variadas", () => {
    const hist = [
      histAt(0, 9, { bioQ: 70, dur: 90 }),
      histAt(1, 10, { bioQ: 65, dur: 75 }),
      histAt(2, 11, { bioQ: 80, dur: 105 }),
      histAt(3, 9, { bioQ: 55, dur: 88 }),
      histAt(4, 12, { bioQ: 75, dur: 95 }),
      histAt(5, 10, { bioQ: 68, dur: 82 }),
      histAt(6, 11, { bioQ: 72, dur: 100 }),
      histAt(7, 10, { bioQ: 60, dur: 92 }),
    ];
    const r = detectGamingV2({ history: hist });
    expect(r.verdict).toBe("clean");
    expect(r.gaming).toBe(false);
  });

  it("likely-gaming con multiple bot signals", () => {
    // Todas a la misma hora, mismos durations, bioQ baja flat
    const hist = Array(10).fill(0).map((_, i) =>
      histAt(i, 3, { bioQ: 25, dur: 60 })
    );
    const r = detectGamingV2({ history: hist });
    expect(["suspicious", "likely-gaming"]).toContain(r.verdict);
    expect(r.score).toBeGreaterThan(30);
  });

  it("composes signals: rt + holds desde extra", () => {
    const hist = Array(8).fill(0).map((_, i) =>
      histAt(i, 11, { bioQ: 70, dur: 90 })
    );
    const r = detectGamingV2({ history: hist }, {
      reactionTimes: [400, 400, 400, 400, 400, 400], // robotic
      touchHolds: [0.2, 0.2, 0.2, 0.2, 0.2],         // uniform
    });
    expect(r.score).toBeGreaterThan(0);
    expect(r.signals.find((s) => s.name === "reactionTimes").status).toBe("robotic-low-cv");
    expect(r.signals.find((s) => s.name === "touchHolds").status).toBe("uniform-holds");
  });

  it("backwards-compat: shape gaming + reason", () => {
    const hist = Array(10).fill(0).map((_, i) =>
      histAt(i, 3, { bioQ: 25, dur: 60 })
    );
    const r = detectGamingV2({ history: hist });
    expect(r).toHaveProperty("gaming");
    expect(r).toHaveProperty("reason");
    if (r.gaming) {
      expect(typeof r.reason).toBe("string");
      expect(r.reason.length).toBeGreaterThan(0);
    }
  });

  it("nunca tira con state malformado", () => {
    expect(() => detectGamingV2(null)).not.toThrow();
    expect(() => detectGamingV2({ history: "bad" })).not.toThrow();
    expect(() => detectGamingV2({})).not.toThrow();
  });
});
