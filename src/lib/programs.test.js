/* ═══════════════════════════════════════════════════════════════
   Tests para src/lib/programs.js
   ═══════════════════════════════════════════════════════════════
   Cubre:
     — getProgramById / getProtocolById
     — currentProgramDay (cálculo temporal desde startedAt)
     — programSessionForDay (sparse schedules)
     — programTodayStatus (el API principal usado por la UI)
     — programProgress (fracción completada)
     — programLagStatus (detección de atraso con grace de 1 día)
     — programRequiredSessions
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import {
  PROGRAMS,
  getProgramById,
  getProtocolById,
  currentProgramDay,
  programSessionForDay,
  programTodayStatus,
  programProgress,
  programLagStatus,
  programRequiredSessions,
} from "./programs";

const DAY_MS = 86400000;

// ─── Fixtures ──────────────────────────────────────────────────
const mockProgram = {
  id: "test-program",
  n: "Test Program",
  duration: 7,
  sessions: [
    { day: 1, protocolId: 1 },
    { day: 3, protocolId: 2 },
    { day: 5, protocolId: 3 },
    { day: 7, protocolId: 4 },
  ],
};

// ─── PROGRAMS catalog ──────────────────────────────────────────
describe("PROGRAMS catalog", () => {
  it("contiene 5 programas", () => {
    expect(PROGRAMS).toHaveLength(5);
  });

  it("cada programa tiene los campos requeridos", () => {
    PROGRAMS.forEach((p) => {
      expect(typeof p.id).toBe("string");
      expect(typeof p.n).toBe("string");
      expect(typeof p.duration).toBe("number");
      expect(p.duration).toBeGreaterThan(0);
      expect(Array.isArray(p.sessions)).toBe(true);
      expect(p.sessions.length).toBeGreaterThan(0);
      expect(typeof p.intent).toBe("string");
    });
  });

  it("cada sesión referencia un protocolId válido (1..17)", () => {
    PROGRAMS.forEach((p) => {
      p.sessions.forEach((s) => {
        expect(typeof s.protocolId).toBe("number");
        expect(s.protocolId).toBeGreaterThanOrEqual(1);
        expect(s.protocolId).toBeLessThanOrEqual(17);
        expect(getProtocolById(s.protocolId)).not.toBeNull();
      });
    });
  });

  it("los días de sesión están dentro de program.duration", () => {
    PROGRAMS.forEach((p) => {
      p.sessions.forEach((s) => {
        expect(s.day).toBeGreaterThanOrEqual(1);
        expect(s.day).toBeLessThanOrEqual(p.duration);
      });
    });
  });

  it("no hay days duplicados dentro de un programa", () => {
    PROGRAMS.forEach((p) => {
      const days = p.sessions.map((s) => s.day);
      const unique = new Set(days);
      expect(unique.size).toBe(days.length);
    });
  });
});

// ─── getProgramById / getProtocolById ──────────────────────────
describe("getProgramById", () => {
  it("retorna el programa por id", () => {
    expect(getProgramById("recovery-week")?.n).toBe("Recovery Week");
  });
  it("retorna null para id inválido", () => {
    expect(getProgramById("nonexistent")).toBeNull();
  });
  it("retorna null para argumentos no-string", () => {
    expect(getProgramById(null)).toBeNull();
    expect(getProgramById(undefined)).toBeNull();
    expect(getProgramById(123)).toBeNull();
  });
});

describe("getProtocolById", () => {
  it("retorna protocolo por id", () => {
    expect(getProtocolById(1)?.id).toBe(1);
  });
  it("retorna null para id inválido", () => {
    expect(getProtocolById(999)).toBeNull();
    expect(getProtocolById(null)).toBeNull();
    expect(getProtocolById("1")).toBeNull();
  });
});

// ─── currentProgramDay ─────────────────────────────────────────
describe("currentProgramDay", () => {
  const now = Date.now();

  it("día 1 si acaba de iniciar", () => {
    expect(currentProgramDay(mockProgram, now, now)).toBe(1);
  });

  it("día 2 al día siguiente", () => {
    const started = now - 1 * DAY_MS;
    expect(currentProgramDay(mockProgram, started, now)).toBe(2);
  });

  it("día 7 al día 7 (último)", () => {
    const started = now - 6 * DAY_MS;
    expect(currentProgramDay(mockProgram, started, now)).toBe(7);
  });

  it("clamp al último día si se pasó de duration", () => {
    const started = now - 20 * DAY_MS;
    expect(currentProgramDay(mockProgram, started, now)).toBe(7);
  });

  it("retorna 1 si startedAt es futuro (defensivo)", () => {
    const started = now + DAY_MS;
    expect(currentProgramDay(mockProgram, started, now)).toBe(1);
  });

  it("retorna 1 si program es null", () => {
    expect(currentProgramDay(null, now, now)).toBe(1);
  });
});

// ─── programSessionForDay ──────────────────────────────────────
describe("programSessionForDay", () => {
  it("retorna la sesión si existe para ese día", () => {
    expect(programSessionForDay(mockProgram, 1)?.protocolId).toBe(1);
    expect(programSessionForDay(mockProgram, 3)?.protocolId).toBe(2);
    expect(programSessionForDay(mockProgram, 7)?.protocolId).toBe(4);
  });
  it("retorna null si es día de reposo", () => {
    expect(programSessionForDay(mockProgram, 2)).toBeNull();
    expect(programSessionForDay(mockProgram, 4)).toBeNull();
    expect(programSessionForDay(mockProgram, 6)).toBeNull();
  });
  it("retorna null para argumentos inválidos", () => {
    expect(programSessionForDay(null, 1)).toBeNull();
    expect(programSessionForDay(mockProgram, 0)).toBeNull();
    expect(programSessionForDay(mockProgram, 99)).toBeNull();
  });
});

// ─── programTodayStatus ────────────────────────────────────────
describe("programTodayStatus", () => {
  const now = Date.now();

  it("día 1 recién iniciado, sesión disponible", () => {
    const active = {
      id: "recovery-week",
      startedAt: now,
      completedSessionDays: [],
    };
    const status = programTodayStatus(active, now);
    expect(status.shouldSession).toBe(true);
    expect(status.day).toBe(1);
    expect(status.session?.protocolId).toBeDefined();
    expect(status.program?.n).toBe("Recovery Week");
  });

  it("ya completó el día de hoy", () => {
    const active = {
      id: "recovery-week",
      startedAt: now,
      completedSessionDays: [1],
    };
    const status = programTodayStatus(active, now);
    expect(status.shouldSession).toBe(false);
    expect(status.day).toBe(1);
    expect(status.session).not.toBeNull();
  });

  it("día de reposo en programa con schedule sparse", () => {
    // burnout-recovery día 2 es reposo (sesiones son día 1, 3, 5, 7, ...)
    const active = {
      id: "burnout-recovery",
      startedAt: now - 1 * DAY_MS,
      completedSessionDays: [1],
    };
    const status = programTodayStatus(active, now);
    expect(status.day).toBe(2);
    expect(status.session).toBeNull();
    expect(status.shouldSession).toBe(false);
  });

  it("sin activeProgram retorna status vacío", () => {
    const status = programTodayStatus(null);
    expect(status.shouldSession).toBe(false);
    expect(status.program).toBeNull();
  });

  it("programa inválido retorna status vacío", () => {
    const status = programTodayStatus({ id: "nonexistent", startedAt: now });
    expect(status.shouldSession).toBe(false);
    expect(status.program).toBeNull();
  });
});

// ─── programProgress ───────────────────────────────────────────
describe("programProgress", () => {
  it("0/N al inicio", () => {
    const active = {
      id: "recovery-week",
      startedAt: Date.now(),
      completedSessionDays: [],
    };
    const p = programProgress(active);
    expect(p.completed).toBe(0);
    expect(p.total).toBe(7); // recovery-week tiene 7 sessions
    expect(p.fraction).toBe(0);
    expect(p.isComplete).toBe(false);
  });

  it("a mitad", () => {
    const active = {
      id: "recovery-week",
      startedAt: Date.now(),
      completedSessionDays: [1, 2, 3],
    };
    const p = programProgress(active);
    expect(p.completed).toBe(3);
    expect(p.total).toBe(7);
    expect(p.fraction).toBeCloseTo(3 / 7);
    expect(p.isComplete).toBe(false);
  });

  it("completo", () => {
    const active = {
      id: "recovery-week",
      startedAt: Date.now(),
      completedSessionDays: [1, 2, 3, 4, 5, 6, 7],
    };
    const p = programProgress(active);
    expect(p.completed).toBe(7);
    expect(p.fraction).toBe(1);
    expect(p.isComplete).toBe(true);
  });

  it("sin activeProgram", () => {
    const p = programProgress(null);
    expect(p.completed).toBe(0);
    expect(p.isComplete).toBe(false);
  });
});

// ─── programLagStatus ──────────────────────────────────────────
describe("programLagStatus", () => {
  const now = Date.now();

  it("al día, no atrasado", () => {
    // day 1 hoy, completó day 1 → al día
    const active = {
      id: "recovery-week",
      startedAt: now,
      completedSessionDays: [1],
    };
    const lag = programLagStatus(active, now);
    expect(lag.isLagging).toBe(false);
    expect(lag.daysBehind).toBe(0);
  });

  it("1 día atrasado (grace, no lagging)", () => {
    // día 2 hoy, debería haber completado [1,2] pero completó solo [1]
    // Wait — recovery-week tiene sesión cada día (días 1-7), así que:
    // day 2 → shouldHaveCompleted = 2, actually = 1 → daysBehind = 1
    const active = {
      id: "recovery-week",
      startedAt: now - 1 * DAY_MS,
      completedSessionDays: [1],
    };
    const lag = programLagStatus(active, now);
    expect(lag.daysBehind).toBe(1);
    expect(lag.isLagging).toBe(false); // grace de 1 día
  });

  it("2+ días atrasado → lagging", () => {
    // día 3, debería [1,2,3], completó [1]
    const active = {
      id: "recovery-week",
      startedAt: now - 2 * DAY_MS,
      completedSessionDays: [1],
    };
    const lag = programLagStatus(active, now);
    expect(lag.daysBehind).toBe(2);
    expect(lag.isLagging).toBe(true);
  });

  it("sparse schedule: burnout-recovery día 3 con solo día 1 hecho", () => {
    // burnout-recovery sessions en days 1, 3, 5, 7, 9, 11, ...
    // day 3 hoy → should = 2 (días 1 y 3), actually = 1 → daysBehind = 1
    const active = {
      id: "burnout-recovery",
      startedAt: now - 2 * DAY_MS,
      completedSessionDays: [1],
    };
    const lag = programLagStatus(active, now);
    expect(lag.daysBehind).toBe(1);
    expect(lag.isLagging).toBe(false); // grace
  });

  it("sin activeProgram → no lag", () => {
    const lag = programLagStatus(null);
    expect(lag.isLagging).toBe(false);
    expect(lag.daysBehind).toBe(0);
  });
});

// ─── programRequiredSessions ───────────────────────────────────
describe("programRequiredSessions", () => {
  it("cuenta sesiones correctamente", () => {
    expect(programRequiredSessions(mockProgram)).toBe(4);
  });
  it("recovery-week requiere 7", () => {
    expect(programRequiredSessions(getProgramById("recovery-week"))).toBe(7);
  });
  it("focus-sprint requiere 5", () => {
    expect(programRequiredSessions(getProgramById("focus-sprint"))).toBe(5);
  });
  it("burnout-recovery requiere 14 (sparse de 28 días)", () => {
    expect(programRequiredSessions(getProgramById("burnout-recovery"))).toBe(14);
  });
  it("null / inválido retorna 0", () => {
    expect(programRequiredSessions(null)).toBe(0);
    expect(programRequiredSessions({})).toBe(0);
  });
});
