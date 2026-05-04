/* Tests Phase 6F SP-A — programs.js v2 alternates + reEval helpers.
   Mantiene separación con programs.test.js (legacy) para que la
   atribución sea clara. */

import { describe, it, expect } from "vitest";
import {
  resolveProtocolForDay,
  nextProgramReEval,
  getProgramById,
} from "./programs";

const DAY_MS = 86400_000;

const mockProgramNoAlternates = {
  id: "test-no-alternates",
  duration: 7,
  sessions: [
    { day: 1, protocolId: 1 },
    { day: 3, protocolId: 2 },
  ],
};

const mockProgramWithAlternates = {
  id: "test-with-alternates",
  duration: 14,
  sessions: [
    { day: 1, protocolId: 15, alternates: [1, 17] },
    { day: 7, protocolId: 11, alternates: [16, 6] },
  ],
};

describe("resolveProtocolForDay — Phase 6F SP-A", () => {
  it("retorna protocolId primario si la sesión NO tiene alternates", () => {
    expect(resolveProtocolForDay(mockProgramNoAlternates, 1)).toBe(1);
    expect(resolveProtocolForDay(mockProgramNoAlternates, 3)).toBe(2);
  });

  it("retorna null si no hay sesión ese día", () => {
    expect(resolveProtocolForDay(mockProgramNoAlternates, 2)).toBeNull(); // sparse
    expect(resolveProtocolForDay(mockProgramNoAlternates, 99)).toBeNull();
  });

  it("retorna primary si banditState es null/undefined incluso con alternates", () => {
    expect(resolveProtocolForDay(mockProgramWithAlternates, 1, null)).toBe(15);
    expect(resolveProtocolForDay(mockProgramWithAlternates, 1)).toBe(15);
  });

  it("retorna primary si banditState no tiene protocolBandit map", () => {
    expect(resolveProtocolForDay(mockProgramWithAlternates, 1, { foo: "bar" })).toBe(15);
  });

  it("retorna primary si ningún candidato tiene arm con n>0", () => {
    const banditState = { protocolBandit: {} };
    expect(resolveProtocolForDay(mockProgramWithAlternates, 1, banditState)).toBe(15);
  });

  it("elige el candidato con mayor mean reward cuando hay arms", () => {
    // primary 15: mean=0.4 (sum=4, n=10)
    // alt 1: mean=0.8 (sum=8, n=10) ← mayor
    // alt 17: mean=0.5 (sum=5, n=10)
    const banditState = {
      protocolBandit: {
        15: { sum: 4, n: 10 },
        1: { sum: 8, n: 10 },
        17: { sum: 5, n: 10 },
      },
    };
    expect(resolveProtocolForDay(mockProgramWithAlternates, 1, banditState)).toBe(1);
  });

  it("ignora arms con n=0 incluso si presentes en map", () => {
    const banditState = {
      protocolBandit: {
        15: { sum: 0, n: 0 }, // primary, sin data
        1: { sum: 5, n: 5 },  // alt con data
      },
    };
    expect(resolveProtocolForDay(mockProgramWithAlternates, 1, banditState)).toBe(1);
  });

  it("acepta byProtocol como alias de protocolBandit (forwards compat)", () => {
    const banditState = {
      byProtocol: {
        15: { sum: 1, n: 5 },
        17: { sum: 4, n: 5 }, // mejor
      },
    };
    expect(resolveProtocolForDay(mockProgramWithAlternates, 1, banditState)).toBe(17);
  });

  it("retorna null para programa undefined o sin sessions", () => {
    expect(resolveProtocolForDay(null, 1)).toBeNull();
    expect(resolveProtocolForDay({}, 1)).toBeNull();
    expect(resolveProtocolForDay({ sessions: null }, 1)).toBeNull();
  });
});

describe("nextProgramReEval — Phase 6F SP-A", () => {
  it("retorna null para programa sin reEvalEvery", () => {
    const assignment = { programId: "neural-baseline", startedAt: new Date() };
    expect(nextProgramReEval(assignment)).toBeNull();
  });

  it("retorna null para assignment inválido", () => {
    expect(nextProgramReEval(null)).toBeNull();
    expect(nextProgramReEval({})).toBeNull();
    expect(nextProgramReEval({ programId: "doesnt-exist", startedAt: new Date() })).toBeNull();
  });

  it("calcula dueDate correcto para Burnout Recovery (reEvalEvery=14)", () => {
    const startedAt = new Date("2026-05-01T00:00:00Z");
    const assignment = { programId: "burnout-recovery", startedAt };
    const r = nextProgramReEval(assignment, startedAt.getTime());
    expect(r).not.toBeNull();
    expect(r.dueDate.getTime()).toBe(startedAt.getTime() + 14 * DAY_MS);
    expect(r.completed).toBe(false);
    expect(r.isDue).toBe(false); // mismo día start no es due
    expect(r.daysUntil).toBe(14);
  });

  it("isDue=true cuando now >= dueDate", () => {
    const startedAt = new Date("2026-05-01T00:00:00Z");
    const now = startedAt.getTime() + 14 * DAY_MS + 60_000; // 14d + 1min después
    const assignment = { programId: "burnout-recovery", startedAt };
    const r = nextProgramReEval(assignment, now);
    expect(r.isDue).toBe(true);
    expect(r.daysUntil).toBe(0);
  });

  it("completed=true si reEvalCompletedAt presente, isDue=false aunque pasó dueDate", () => {
    const startedAt = new Date("2026-05-01T00:00:00Z");
    const assignment = {
      programId: "burnout-recovery",
      startedAt,
      reEvalCompletedAt: new Date("2026-05-15T00:00:00Z"),
    };
    const now = startedAt.getTime() + 20 * DAY_MS; // 20d después
    const r = nextProgramReEval(assignment, now);
    expect(r.completed).toBe(true);
    expect(r.isDue).toBe(false);
    expect(r.daysUntil).toBe(0);
  });

  it("acepta shape Zustand activeProgram (id en lugar de programId)", () => {
    const startedAt = Date.now() - 10 * DAY_MS;
    const assignment = { id: "burnout-recovery", startedAt };
    const r = nextProgramReEval(assignment);
    expect(r).not.toBeNull();
    expect(r.daysUntil).toBeLessThanOrEqual(4);
    expect(r.daysUntil).toBeGreaterThanOrEqual(3); // ~14-10 = 4
  });

  it("acepta startedAt como número (timestamp ms)", () => {
    const startedAtMs = Date.parse("2026-05-01T00:00:00Z");
    const assignment = { programId: "burnout-recovery", startedAt: startedAtMs };
    const r = nextProgramReEval(assignment, startedAtMs);
    expect(r.dueDate.getTime()).toBe(startedAtMs + 14 * DAY_MS);
  });
});

describe("Burnout Recovery program — reEvalEvery shape", () => {
  it("Burnout Recovery tiene reEvalEvery=14 (PSS-4 día 14)", () => {
    const p = getProgramById("burnout-recovery");
    expect(p).not.toBeNull();
    expect(p.reEvalEvery).toBe(14);
  });

  it("otros programas NO tienen reEvalEvery (programa <14d no aplica)", () => {
    expect(getProgramById("neural-baseline").reEvalEvery).toBeUndefined();
    expect(getProgramById("recovery-week").reEvalEvery).toBeUndefined();
    expect(getProgramById("focus-sprint").reEvalEvery).toBeUndefined();
    expect(getProgramById("executive-presence").reEvalEvery).toBeUndefined();
  });
});
