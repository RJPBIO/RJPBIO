import { describe, it, expect } from "vitest";
import { suggestProgram, resolveProgramSuggestion } from "./programSuggestion";

describe("suggestProgram", () => {
  it("retorna null sin state", () => {
    expect(suggestProgram(null)).toBeNull();
    expect(suggestProgram(undefined)).toBeNull();
  });

  it("retorna null si ya hay programa activo (no spam)", () => {
    const st = { activeProgram: { id: "recovery-week" } };
    expect(
      suggestProgram(st, { burnout: { risk: "crítico" } })
    ).toBeNull();
  });

  it("burnout crítico → burnout-recovery critical urgency", () => {
    const st = { totalSessions: 20 };
    const s = suggestProgram(st, { burnout: { risk: "crítico" } });
    expect(s?.programId).toBe("burnout-recovery");
    expect(s?.urgency).toBe("critical");
  });

  it("burnout alto → burnout-recovery high urgency", () => {
    const st = { totalSessions: 10 };
    const s = suggestProgram(st, { burnout: { risk: "alto" } });
    expect(s?.programId).toBe("burnout-recovery");
    expect(s?.urgency).toBe("high");
  });

  it("burnout moderado → no sugerencia de burnout-recovery", () => {
    const st = { totalSessions: 10 };
    const s = suggestProgram(st, { burnout: { risk: "moderado" } });
    expect(s?.programId).not.toBe("burnout-recovery");
  });

  it("readiness recover + 5+ sesiones → recovery-week", () => {
    const st = { totalSessions: 7 };
    const s = suggestProgram(st, {
      readiness: { interpretation: "recover" },
    });
    expect(s?.programId).toBe("recovery-week");
    expect(s?.urgency).toBe("medium");
  });

  it("readiness recover pero <5 sesiones → no recovery-week (falta baseline)", () => {
    const st = { totalSessions: 2 };
    const s = suggestProgram(st, {
      readiness: { interpretation: "recover" },
    });
    expect(s?.programId).not.toBe("recovery-week");
  });

  it("3+ sesiones sin historial de programs → neural-baseline", () => {
    const st = { totalSessions: 4, programHistory: [] };
    const s = suggestProgram(st);
    expect(s?.programId).toBe("neural-baseline");
    expect(s?.urgency).toBe("low");
  });

  it("con historial de programs → no neural-baseline", () => {
    const st = {
      totalSessions: 4,
      programHistory: [{ id: "recovery-week", completionFraction: 1 }],
    };
    const s = suggestProgram(st);
    expect(s).toBeNull();
  });

  it("<3 sesiones → null (deja al usuario explorar)", () => {
    const st = { totalSessions: 1, programHistory: [] };
    expect(suggestProgram(st)).toBeNull();
  });

  it("prioridad: burnout crítico gana sobre recover", () => {
    const st = { totalSessions: 10 };
    const s = suggestProgram(st, {
      burnout: { risk: "crítico" },
      readiness: { interpretation: "recover" },
    });
    expect(s?.programId).toBe("burnout-recovery");
  });
});

describe("resolveProgramSuggestion", () => {
  it("retorna program completo + metadata", () => {
    const st = { totalSessions: 10 };
    const r = resolveProgramSuggestion(st, { burnout: { risk: "alto" } });
    expect(r?.program?.n).toBe("Burnout Recovery");
    expect(r?.urgency).toBe("high");
    expect(r?.programId).toBe("burnout-recovery");
  });
  it("null si no aplica", () => {
    const st = { totalSessions: 1 };
    expect(resolveProgramSuggestion(st)).toBeNull();
  });
});
