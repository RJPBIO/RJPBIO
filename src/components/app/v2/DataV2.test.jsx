/* DataV2.test — Phase 6D SP3 fixtures cleanup. */
import { describe, it, expect } from "vitest";
import { deriveData } from "./DataV2";

describe("DataV2.deriveData — Phase 6D SP3", () => {
  it("retorna isEmpty:true cuando store es null", () => {
    const data = deriveData(null, false);
    expect(data.isEmpty).toBe(true);
    expect(data.sessions).toEqual([]);
    expect(data.composite28d).toEqual([]);
  });

  it("retorna isEmpty:true cuando history vacío", () => {
    const data = deriveData({ history: [] }, false);
    expect(data.isEmpty).toBe(true);
    expect(data.sessions).toEqual([]);
    expect(data.composite28d).toEqual([]);
    expect(data.dimensions28d).toEqual({ focus: [], calm: [], energy: [] });
  });

  it("retorna isEmpty:true cuando ?empty=true URL param activo", () => {
    const data = deriveData({ history: [{ ts: Date.now(), c: 60 }] }, true);
    expect(data.isEmpty).toBe(true);
  });

  it("NO sirve fixtures hardcoded — sesiones < 5 retorna data REAL parcial", () => {
    const now = Date.now();
    const history = [
      { ts: now - 86400000, c: 60 },
      { ts: now - 2 * 86400000, c: 65 },
    ];
    const data = deriveData({ history, totalSessions: 2 }, false);
    expect(data.isEmpty).toBe(false);
    // Sesiones reales en sessions (no fixture FIXTURE_SESSIONS).
    expect(data.sessions).toHaveLength(2);
    // composite28d derivado del history real, no fixtureComposite28d().
    expect(data.composite28d.length).toBeGreaterThan(0);
    // NO contiene FIXTURE_ACTIVE_PROGRAM "neural-baseline" hardcoded.
    expect(data.activeProgram).toBeNull();
  });

  it("retorna data completa cuando history >= 5", () => {
    const now = Date.now();
    const history = Array.from({ length: 7 }, (_, i) => ({
      ts: now - i * 86400000,
      c: 50 + i * 3,
    }));
    const data = deriveData({ history }, false);
    expect(data.isEmpty).toBe(false);
    expect(data.sessions).toHaveLength(7);
  });

  it("propaga store.activeProgram cuando existe (no fixture)", () => {
    const data = deriveData({
      history: [{ ts: Date.now(), c: 60 }],
      activeProgram: { id: "focus-sprint", startedAt: Date.now(), completedSessionDays: [] },
    }, false);
    expect(data.activeProgram?.id).toBe("focus-sprint");
    // NO debe ser "neural-baseline" del fixture eliminado.
    expect(data.activeProgram?.id).not.toBe("neural-baseline");
  });

  it("respeta store.vCores y store.streak reales en progress (no fixture 1247)", () => {
    const data = deriveData({
      history: [{ ts: Date.now(), c: 60 }],
      vCores: 12,
      streak: 1,
      bestStreak: 1,
      achievements: ["first_session"],
    }, false);
    expect(data.progress.vCores).toBe(12);
    expect(data.progress.streak).toBe(1);
    expect(data.progress.achievementsCount).toBe(1);
  });
});
