import { describe, it, expect } from "vitest";
import { buildCoachContext, summarizeContext } from "./coachMemory";

const DAY = 86400000;

function base(over = {}) {
  return {
    history: [],
    moodLog: [],
    instruments: [],
    chronotype: null,
    resonanceFreq: null,
    lastSleepHours: null,
    ...over,
  };
}

describe("buildCoachContext", () => {
  it("estado vacío devuelve estructura mínima sin crashear", () => {
    const ctx = buildCoachContext(base());
    expect(ctx.lastSession).toBe(null);
    expect(ctx.favoriteProtocols).toEqual([]);
    expect(ctx.worstProtocols).toEqual([]);
    expect(ctx.moodTrajectory).toEqual({ recent: null, prior: null, delta: null });
    expect(ctx.openQuestions).toEqual(expect.arrayContaining(["chronotype", "resonance_freq", "pss4_baseline"]));
  });

  it("promedia delta por protocolo y separa favoritos de perdedores", () => {
    const now = Date.now();
    const history = [
      { ts: now - 1 * DAY, p: "Coherencia", int: "calma", mPre: 2, mPost: 4 },
      { ts: now - 2 * DAY, p: "Coherencia", int: "calma", mPre: 3, mPost: 4 },
      { ts: now - 3 * DAY, p: "Box", int: "enfoque", mPre: 4, mPost: 3 },
      { ts: now - 4 * DAY, p: "Box", int: "enfoque", mPre: 3, mPost: 2 },
    ];
    const ctx = buildCoachContext(base({ history }), { now });
    expect(ctx.favoriteProtocols[0]).toMatchObject({ name: "Coherencia", avgDelta: 1.5 });
    expect(ctx.worstProtocols[0]).toMatchObject({ name: "Box", avgDelta: -1 });
  });

  it("trayectoria de ánimo compara semana reciente vs dos anteriores", () => {
    const now = Date.now();
    const moodLog = [
      ...Array.from({ length: 4 }, (_, i) => ({ ts: now - (i + 1) * DAY, mood: 4 })),
      ...Array.from({ length: 4 }, (_, i) => ({ ts: now - (10 + i) * DAY, mood: 2 })),
    ];
    const ctx = buildCoachContext(base({ moodLog }), { now });
    expect(ctx.moodTrajectory.recent).toBe(4);
    expect(ctx.moodTrajectory.prior).toBe(2);
    expect(ctx.moodTrajectory.delta).toBe(2);
  });

  it("cuenta intents recientes y los ordena por frecuencia", () => {
    const now = Date.now();
    const history = [
      { ts: now - 1 * DAY, int: "calma" },
      { ts: now - 2 * DAY, int: "calma" },
      { ts: now - 3 * DAY, int: "enfoque" },
    ];
    const ctx = buildCoachContext(base({ history }), { now });
    expect(ctx.recentIntents[0]).toEqual({ key: "calma", count: 2 });
    expect(ctx.recentIntents[1]).toEqual({ key: "enfoque", count: 1 });
  });

  it("captura último resultado de PSS-4 con delta frente al primero", () => {
    const now = Date.now();
    const instruments = [
      { instrumentId: "pss-4", ts: now - 30 * DAY, score: 12, level: "high" },
      { instrumentId: "pss-4", ts: now - DAY, score: 7, level: "moderate" },
    ];
    const ctx = buildCoachContext(base({ instruments }), { now });
    expect(ctx.instrumentBriefs.pss4).toMatchObject({ n: 2, score: 7, delta: -5 });
  });

  it("summarizeContext genera una frase usable con señales presentes", () => {
    const ctx = buildCoachContext(base({
      history: [
        { ts: Date.now() - DAY, p: "Coherencia", int: "calma", mPre: 2, mPost: 4 },
        { ts: Date.now() - 2 * DAY, p: "Coherencia", int: "calma", mPre: 3, mPost: 4 },
      ],
    }));
    const summary = summarizeContext(ctx);
    expect(summary).toContain("Coherencia");
  });
});
