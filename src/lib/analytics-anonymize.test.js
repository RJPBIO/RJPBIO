import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { anonymize, dayKey, laplaceNoise } from "./analytics-anonymize";

/* Helper para generar rows determinísticos. */
function row(opts = {}) {
  return {
    userId: opts.userId || "user_default",
    teamId: opts.teamId,
    completedAt: opts.completedAt || new Date("2026-04-25T12:00:00Z"),
    coherenciaDelta: opts.coherenciaDelta,
    moodPre: opts.moodPre,
    moodPost: opts.moodPost,
  };
}

describe("dayKey", () => {
  it("formato YYYY-MM-DD UTC", () => {
    expect(dayKey(new Date("2026-04-26T03:00:00Z"))).toBe("2026-04-26");
    expect(dayKey(new Date("2026-04-26T23:59:59Z"))).toBe("2026-04-26");
    expect(dayKey(new Date("2026-04-27T00:00:00Z"))).toBe("2026-04-27");
  });

  it("acepta string ISO", () => {
    expect(dayKey("2026-04-26T12:00:00Z")).toBe("2026-04-26");
  });

  it("acepta epoch ms", () => {
    expect(dayKey(new Date("2026-04-26T00:00:00Z").getTime())).toBe("2026-04-26");
  });
});

describe("laplaceNoise", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scale 0 → noise = 0 (signed-zero tolerable)", () => {
    // -0 === 0 vía Object.is es false, pero matemáticamente equivalente.
    // Usamos Math.abs para tolerar -0 vs +0.
    expect(Math.abs(laplaceNoise(0))).toBe(0);
  });

  it("Math.random=0.5 (u=0) → noise = 0 (centro de distribución)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    // u = 0 → -sign(0) * scale * log(1 - 0) = 0 (con posible -0)
    expect(Math.abs(laplaceNoise(10))).toBe(0);
  });

  it("scale grande genera noise no-cero", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7);
    const n = laplaceNoise(100);
    expect(n).not.toBe(0);
    expect(Number.isFinite(n)).toBe(true);
  });
});

describe("anonymize — empty/edge inputs", () => {
  it("rows null → buckets vacíos", () => {
    expect(anonymize(null)).toEqual({ buckets: [], suppressed: 0, totalSessions: 0, k: 5 });
  });

  it("rows undefined → buckets vacíos", () => {
    expect(anonymize(undefined)).toEqual({ buckets: [], suppressed: 0, totalSessions: 0, k: 5 });
  });

  it("rows array vacío → buckets vacíos", () => {
    expect(anonymize([])).toEqual({ buckets: [], suppressed: 0, totalSessions: 0, k: 5 });
  });

  it("k custom propagated", () => {
    const r = anonymize([], { k: 10 });
    expect(r.k).toBe(10);
  });
});

describe("anonymize — k-suppression core (PRIVACY CRITICAL)", () => {
  it("4 usuarios únicos < k=5 → bucket SUPPRIMIDO", () => {
    const rows = [
      row({ userId: "a" }), row({ userId: "b" }),
      row({ userId: "c" }), row({ userId: "d" }),
    ];
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets).toHaveLength(0);
    expect(r.suppressed).toBe(1);
    expect(r.totalSessions).toBe(4);
  });

  it("5 usuarios únicos = k=5 → bucket VISIBLE", () => {
    const rows = ["a", "b", "c", "d", "e"].map((userId) => row({ userId }));
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets).toHaveLength(1);
    expect(r.suppressed).toBe(0);
    expect(r.buckets[0].uniqueUsers).toBe(5);
  });

  it("k=2 permite buckets más pequeños", () => {
    const rows = [row({ userId: "a" }), row({ userId: "b" })];
    const r = anonymize(rows, { k: 2 });
    expect(r.buckets).toHaveLength(1);
    expect(r.suppressed).toBe(0);
  });

  it("MISMO usuario, múltiples sessions → cuenta UNA sola vez para k", () => {
    // 4 sessions del mismo user no deben pasar k=5 threshold
    const rows = [
      row({ userId: "alice" }),
      row({ userId: "alice" }),
      row({ userId: "alice" }),
      row({ userId: "alice" }),
      row({ userId: "alice" }),
    ];
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets).toHaveLength(0); // suppressed por uniqueUsers=1 < 5
    expect(r.suppressed).toBe(1);
  });

  it("buckets parciales: uno suppress, otro visible", () => {
    const rows = [
      // Día 1: 5 usuarios → visible
      ...["a", "b", "c", "d", "e"].map((u) => row({ userId: u, completedAt: new Date("2026-04-25T12:00:00Z") })),
      // Día 2: 3 usuarios → suppressed
      ...["x", "y", "z"].map((u) => row({ userId: u, completedAt: new Date("2026-04-26T12:00:00Z") })),
    ];
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets).toHaveLength(1);
    expect(r.buckets[0].day).toBe("2026-04-25");
    expect(r.suppressed).toBe(1);
  });
});

describe("anonymize — bucketing por día + team", () => {
  it("mismo día, mismo team → un solo bucket", () => {
    const rows = ["a", "b", "c", "d", "e"].map((u) => row({ userId: u, teamId: "team1" }));
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets).toHaveLength(1);
    expect(r.buckets[0].teamId).toBe("team1");
  });

  it("mismo día, teams distintos → buckets separados", () => {
    const sameDay = new Date("2026-04-25T12:00:00Z");
    const rows = [
      ...["a1","a2","a3","a4","a5"].map((u) => row({ userId: u, teamId: "team_a", completedAt: sameDay })),
      ...["b1","b2","b3","b4","b5"].map((u) => row({ userId: u, teamId: "team_b", completedAt: sameDay })),
    ];
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets).toHaveLength(2);
    expect(r.buckets.find((b) => b.teamId === "team_a").uniqueUsers).toBe(5);
    expect(r.buckets.find((b) => b.teamId === "team_b").uniqueUsers).toBe(5);
  });

  it("teamId null → bucket org-wide", () => {
    const rows = ["a","b","c","d","e"].map((u) => row({ userId: u }));
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets[0].teamId).toBeNull();
  });

  it("buckets ordenados por día ASC", () => {
    const u5 = ["a","b","c","d","e"];
    const rows = [
      ...u5.map((u) => row({ userId: u, completedAt: new Date("2026-04-27T12:00:00Z") })),
      ...u5.map((u) => row({ userId: u, completedAt: new Date("2026-04-25T12:00:00Z") })),
      ...u5.map((u) => row({ userId: u, completedAt: new Date("2026-04-26T12:00:00Z") })),
    ];
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets.map((b) => b.day)).toEqual(["2026-04-25", "2026-04-26", "2026-04-27"]);
  });
});

describe("anonymize — aggregate metrics", () => {
  it("sessions cuenta sessions totales (no usuarios únicos)", () => {
    // 5 users × 2 sessions cada uno = 10 sessions, 5 unique users
    const rows = [];
    for (const u of ["a","b","c","d","e"]) {
      rows.push(row({ userId: u }));
      rows.push(row({ userId: u }));
    }
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets[0].sessions).toBe(10);
    expect(r.buckets[0].uniqueUsers).toBe(5);
  });

  it("avgCoherenciaDelta promedia solo rows con valor numérico", () => {
    const rows = [
      row({ userId: "a", coherenciaDelta: 10 }),
      row({ userId: "b", coherenciaDelta: 20 }),
      row({ userId: "c", coherenciaDelta: 30 }),
      row({ userId: "d" }), // sin coherenciaDelta
      row({ userId: "e", coherenciaDelta: 40 }),
    ];
    const r = anonymize(rows, { k: 5 });
    // Promedio de [10,20,30,40] = 25
    expect(r.buckets[0].avgCoherenciaDelta).toBe(25);
  });

  it("avgCoherenciaDelta null si NINGÚN row tiene valor", () => {
    const rows = ["a","b","c","d","e"].map((u) => row({ userId: u }));
    const r = anonymize(rows, { k: 5 });
    expect(r.buckets[0].avgCoherenciaDelta).toBeNull();
  });

  it("avgMoodDelta requiere moodPre Y moodPost", () => {
    const rows = [
      row({ userId: "a", moodPre: 3, moodPost: 5 }),
      row({ userId: "b", moodPre: 2, moodPost: 4 }),
      row({ userId: "c", moodPre: null, moodPost: 5 }),  // no cuenta
      row({ userId: "d", moodPost: 4 }),                  // no cuenta
      row({ userId: "e", moodPre: 1, moodPost: 3 }),
    ];
    const r = anonymize(rows, { k: 5 });
    // moodDelta accumulator suma TODAS las sessions con ambos valores
    // moodDelta = (5-3) + (4-2) + (3-1) = 6
    // avgMoodDelta = moodDelta / sessions = 6 / 5 = 1.2
    expect(r.buckets[0].avgMoodDelta).toBeCloseTo(1.2, 5);
  });
});

describe("anonymize — differential privacy (epsilon)", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sin epsilon → sin noise (avgCoherenciaDelta exacto)", () => {
    const rows = ["a","b","c","d","e"].map((u, i) => row({ userId: u, coherenciaDelta: i * 10 }));
    const r = anonymize(rows, { k: 5 });
    // 0+10+20+30+40 = 100 / 5 = 20
    expect(r.buckets[0].avgCoherenciaDelta).toBe(20);
  });

  it("con epsilon → noise aplicado (no exacto)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7); // genera noise > 0
    const rows = ["a","b","c","d","e"].map((u, i) => row({ userId: u, coherenciaDelta: i * 10 }));
    const r = anonymize(rows, { k: 5, epsilon: 1.0 });
    expect(r.buckets[0].avgCoherenciaDelta).not.toBe(20);
    // Distancia bounded por scale = 1/epsilon = 1.0
    // Math.random()=0.7 → u=0.2 → -sign(0.2)*1.0*log(1-0.4) = -log(0.6) ≈ -(-0.5108) = 0.5108
    expect(Math.abs(r.buckets[0].avgCoherenciaDelta - 20)).toBeLessThan(2);
  });

  it("epsilon NO afecta avgCoherenciaDelta=null", () => {
    const rows = ["a","b","c","d","e"].map((u) => row({ userId: u })); // sin coherenciaDelta
    const r = anonymize(rows, { k: 5, epsilon: 1.0 });
    expect(r.buckets[0].avgCoherenciaDelta).toBeNull();
  });

  it("epsilon NO afecta uniqueUsers ni sessions (counters exactos)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7);
    const rows = ["a","b","c","d","e"].map((u) => row({ userId: u, coherenciaDelta: 10 }));
    const r = anonymize(rows, { k: 5, epsilon: 1.0 });
    expect(r.buckets[0].uniqueUsers).toBe(5);
    expect(r.buckets[0].sessions).toBe(5);
  });
});

describe("anonymize — totalSessions vs visible", () => {
  it("totalSessions cuenta input total, no solo visible", () => {
    const rows = [
      // Día 1: 5 users (visible)
      ...["a","b","c","d","e"].map((u) => row({ userId: u, completedAt: new Date("2026-04-25") })),
      // Día 2: 2 users (suppressed)
      ...["x","y"].map((u) => row({ userId: u, completedAt: new Date("2026-04-26") })),
    ];
    const r = anonymize(rows, { k: 5 });
    expect(r.totalSessions).toBe(7);  // 5 + 2 input
    expect(r.suppressed).toBe(1);
    expect(r.buckets[0].sessions).toBe(5);  // solo visible
  });
});
