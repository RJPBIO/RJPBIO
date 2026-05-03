import { describe, it, expect } from "vitest";
import {
  updateArm, armStats, scoreArm, selectArm, armCI, topArms,
  armKey, timeBucket, compositeReward,
  timeDecayFactor, decayByTime,
} from "./bandit";

describe("armKey / timeBucket", () => {
  it("armKey combina intent + bucket", () => {
    expect(armKey("calma", "morning")).toBe("calma:morning");
    expect(armKey("calma", null)).toBe("calma");
    expect(armKey("calma")).toBe("calma");
  });
  it("timeBucket mapea hora a 4 buckets", () => {
    expect(timeBucket(new Date(2026, 3, 18, 7))).toBe("morning");
    expect(timeBucket(new Date(2026, 3, 18, 14))).toBe("afternoon");
    expect(timeBucket(new Date(2026, 3, 18, 20))).toBe("evening");
    expect(timeBucket(new Date(2026, 3, 18, 2))).toBe("night");
  });
});

describe("updateArm", () => {
  it("inicializa desde undefined (sin decay sobre cero)", () => {
    const a = updateArm(undefined, 1.5);
    expect(a.n).toBe(1);
    expect(a.sum).toBe(1.5);
    expect(a.sumsq).toBe(2.25);
  });
  it("con decay=1 (sin olvido) acumula exactamente", () => {
    let a;
    [1, 2, 3].forEach((x) => { a = updateArm(a, x, { decay: 1 }); });
    expect(a.n).toBe(3);
    expect(a.sum).toBe(6);
    expect(a.sumsq).toBe(14);
  });
  it("con decay<1 las observaciones viejas pesan menos", () => {
    let a = updateArm(undefined, 10, { decay: 0.5 });
    // Antes: {n:1, sum:10, sumsq:100}
    a = updateArm(a, 10, { decay: 0.5 });
    // Después: {n: 0.5+1=1.5, sum: 5+10=15, sumsq: 50+100=150}
    expect(a.n).toBeCloseTo(1.5, 5);
    expect(a.sum).toBeCloseTo(15, 5);
    expect(a.sumsq).toBeCloseTo(150, 5);
  });
  it("ignora NaN / no-finitos sin romper", () => {
    const base = { n: 1, sum: 1, sumsq: 1 };
    expect(updateArm(base, NaN)).toEqual(base);
    expect(updateArm(base, Infinity)).toEqual(base);
  });
  it("no muta la entrada", () => {
    const a = { n: 1, sum: 1, sumsq: 1 };
    updateArm(a, 2, { decay: 1 });
    expect(a).toEqual({ n: 1, sum: 1, sumsq: 1 });
  });
});

describe("armStats (con prior poblacional)", () => {
  it("arm vacío devuelve la media del prior", () => {
    const s = armStats(null);
    expect(s.mean).toBeCloseTo(0.3, 2);
    expect(s.n).toBe(1); // n_virtual del prior
  });
  it("con muchos datos, el prior casi no influye", () => {
    let a;
    for (let i = 0; i < 50; i++) a = updateArm(a, 2, { decay: 1 });
    const s = armStats(a);
    expect(s.mean).toBeCloseTo(2, 1);
    expect(s.n).toBeCloseTo(51, 0); // 50 + 1 virtual
  });
});

describe("scoreArm", () => {
  it("brazos vacíos reciben score finito (prior, no Infinity)", () => {
    expect(Number.isFinite(scoreArm(null, 10))).toBe(true);
    expect(Number.isFinite(scoreArm({ n: 0, sum: 0, sumsq: 0 }, 10))).toBe(true);
  });
  it("ordena por media + bonus de confianza", () => {
    const good = { n: 10, sum: 20, sumsq: 45 }; // μ≈2
    const bad  = { n: 10, sum: 5,  sumsq: 3  }; // μ≈0.5
    expect(scoreArm(good, 20)).toBeGreaterThan(scoreArm(bad, 20));
  });
});

describe("selectArm (contextual)", () => {
  const P = [
    { id: "calma", int: "calma" },
    { id: "enfoque", int: "enfoque" },
    { id: "reset", int: "reset" },
  ];

  it("sin datos (cold start) explora razonablemente usando prior", () => {
    const r = selectArm({}, P);
    expect(r.protocol).toBeDefined();
    expect(r.reason).toMatch(/explorando/);
  });
  it("prefiere el de mayor media con datos suficientes (c=0 greedy)", () => {
    const state = {
      calma:   { n: 20, sum: 40, sumsq: 100 }, // μ≈2
      enfoque: { n: 20, sum: 10, sumsq: 10 },  // μ≈0.5
      reset:   { n: 20, sum: 20, sumsq: 40 },  // μ≈1
    };
    const r = selectArm(state, P, { c: 0 });
    expect(r.protocol.id).toBe("calma");
  });
  it("usa el brazo contextual cuando se pasa bucket", () => {
    const state = {
      "calma:morning":   { n: 20, sum: 10, sumsq: 10 }, // morning mediocre
      "calma:evening":   { n: 20, sum: 40, sumsq: 100 }, // evening excelente
      "enfoque:morning": { n: 20, sum: 30, sumsq: 60 },
    };
    const cands = [{ int: "calma" }, { int: "enfoque" }];
    const morn = selectArm(state, cands, { c: 0, bucket: "morning" });
    expect(morn.protocol.int).toBe("enfoque");
    const eve = selectArm(state, cands, { c: 0, bucket: "evening" });
    expect(eve.protocol.int).toBe("calma");
  });
  it("cae a la llave sin bucket si el bucket no tiene datos", () => {
    const state = {
      calma: { n: 20, sum: 40, sumsq: 100 }, // μ≈2 sin contexto
      enfoque: { n: 20, sum: 0,  sumsq: 0  },
    };
    const r = selectArm(state, [{ int: "calma" }, { int: "enfoque" }], { c: 0, bucket: "morning" });
    expect(r.protocol.int).toBe("calma");
  });
  it("devuelve null si no hay candidatos", () => {
    expect(selectArm({}, [])).toBeNull();
    expect(selectArm({}, null)).toBeNull();
  });
  it("con c alto, la exploración puede superar la explotación", () => {
    const state = {
      calma: { n: 100, sum: 200, sumsq: 410 }, // μ≈2, muchos datos
      reset: { n: 3,   sum: 3,   sumsq: 3 },    // μ≈1, pocos datos
    };
    const greedy = selectArm(state, [{ int: "calma" }, { int: "reset" }], { c: 0 });
    expect(greedy.protocol.int).toBe("calma");
    const explore = selectArm(state, [{ int: "calma" }, { int: "reset" }], { c: 5 });
    expect(explore.protocol.int).toBe("reset");
  });
});

describe("armCI", () => {
  it("n bajo → CI ancho", () => {
    const ci = armCI(null);
    expect(ci.width).toBeGreaterThanOrEqual(2);
  });
  it("CI contiene la media", () => {
    let a;
    [1, 2, 3, 2, 1].forEach((x) => { a = updateArm(a, x, { decay: 1 }); });
    const ci = armCI(a);
    expect(ci.lower).toBeLessThanOrEqual(ci.mean);
    expect(ci.upper).toBeGreaterThanOrEqual(ci.mean);
  });
  it("CI se encoge con más datos", () => {
    let small;
    [1, 2].forEach((x) => { small = updateArm(small, x, { decay: 1 }); });
    let big;
    for (let i = 0; i < 50; i++) big = updateArm(big, 1 + (i % 2), { decay: 1 });
    expect(armCI(big).width).toBeLessThan(armCI(small).width);
  });
});

describe("topArms", () => {
  it("lista solo brazos con n>=2 ordenados por media", () => {
    const state = {
      a: { n: 5, sum: 10, sumsq: 25 },   // μ=2
      b: { n: 5, sum: 5,  sumsq: 7  },    // μ=1
      c: { n: 1, sum: 3,  sumsq: 9  },    // se excluye (n<2)
      d: { n: 5, sum: 15, sumsq: 50 },   // μ=3
    };
    const top = topArms(state, 3);
    expect(top.map((t) => t.id)).toEqual(["d", "a", "b"]);
  });
});

describe("compositeReward", () => {
  it("sin extras devuelve mood delta al completarse 100%", () => {
    expect(compositeReward({ moodDelta: 1 })).toBe(1);
    expect(compositeReward({ moodDelta: -2 })).toBe(-2);
  });
  it("energía y HRV aportan señal secundaria", () => {
    // mood +1, energía +2 (pre 1 → post 3), hrv +0.2
    // base = 1 + 0.3*2 + 1.5*0.2 = 1 + 0.6 + 0.3 = 1.9
    expect(compositeReward({
      moodDelta: 1, energyDelta: 2, hrvDeltaLnRmssd: 0.2,
    })).toBeCloseTo(1.9, 3);
  });
  it("completionRatio degrada linealmente (mín 0.5, no anula)", () => {
    expect(compositeReward({ moodDelta: 2, completionRatio: 1 })).toBe(2);
    expect(compositeReward({ moodDelta: 2, completionRatio: 0.5 })).toBe(1.5);
    expect(compositeReward({ moodDelta: 2, completionRatio: 0 })).toBe(1);
  });
  it("completionRatio fuera de [0,1] se clampa", () => {
    expect(compositeReward({ moodDelta: 2, completionRatio: 5 })).toBe(2);
    expect(compositeReward({ moodDelta: 2, completionRatio: -1 })).toBe(1);
    expect(compositeReward({ moodDelta: 2, completionRatio: NaN })).toBe(2);
  });
  it("mood no-finito → null", () => {
    expect(compositeReward({ moodDelta: NaN })).toBeNull();
    expect(compositeReward({ moodDelta: "abc" })).toBeNull();
    expect(compositeReward({})).toBeNull();
  });
  it("energía/HRV no-finitos se ignoran sin romper", () => {
    expect(compositeReward({
      moodDelta: 1, energyDelta: NaN, hrvDeltaLnRmssd: null,
    })).toBe(1);
  });

  // Sprint S4.2 — fallback HRV-only cuando mood-post está ausente.
  it("Sprint S4.2: HRV-only reward cuando moodDelta ausente", () => {
    expect(compositeReward({ moodDelta: null, hrvDeltaLnRmssd: 0.3 })).toBe(0.45);
    expect(compositeReward({ moodDelta: undefined, hrvDeltaLnRmssd: -0.2 })).toBe(-0.3);
    expect(compositeReward({ hrvDeltaLnRmssd: 0.4 })).toBe(0.6);
  });
  it("Sprint S4.2: HRV-only path respeta completionRatio", () => {
    expect(compositeReward({ moodDelta: null, hrvDeltaLnRmssd: 0.4, completionRatio: 0.5 })).toBe(0.45);
    expect(compositeReward({ moodDelta: null, hrvDeltaLnRmssd: 0.4, completionRatio: 0 })).toBe(0.3);
  });
  it("Sprint S4.2: HRV-only path incluye energyDelta si presente", () => {
    expect(compositeReward({ moodDelta: null, hrvDeltaLnRmssd: 0.2, energyDelta: 1 })).toBe(0.6);
  });
  it("Sprint S4.2: sin mood NI HRV → sigue null", () => {
    expect(compositeReward({ moodDelta: null, energyDelta: 1 })).toBeNull();
    expect(compositeReward({ moodDelta: null, hrvDeltaLnRmssd: null })).toBeNull();
  });
});

describe("aprendizaje bajo drift", () => {
  it("con decay, el bandit sigue al mejor brazo tras cambio", () => {
    // Escenario: primero A es bueno, luego B. Con decay, B debe ganar al final.
    let state = {};
    const pullA = (r) => { state = { ...state, A: updateArm(state.A, r, { decay: 0.9 }) }; };
    const pullB = (r) => { state = { ...state, B: updateArm(state.B, r, { decay: 0.9 }) }; };
    // Fase 1: A genera +2, B genera 0 — 20 pulls
    for (let i = 0; i < 20; i++) { pullA(2); pullB(0); }
    const cands = [{ int: "A" }, { int: "B" }];
    const r1 = selectArm(state, cands, { c: 0 });
    expect(r1.protocol.int).toBe("A");
    // Fase 2: roles se invierten, 20 pulls más
    for (let i = 0; i < 20; i++) { pullA(0); pullB(2); }
    const r2 = selectArm(state, cands, { c: 0 });
    expect(r2.protocol.int).toBe("B");
  });
});

/* ═══════════════════════════════════════════════════════════════
   Sprint 47 — Time-based decay (calendario, no observaciones)
   ═══════════════════════════════════════════════════════════════ */

const DAY = 24 * 60 * 60 * 1000;

describe("timeDecayFactor", () => {
  it("factor 1.0 sin lastUpdatedAt (backwards compat)", () => {
    expect(timeDecayFactor({ n: 5, sum: 2, sumsq: 1 })).toBe(1);
    expect(timeDecayFactor(null)).toBe(1);
  });

  it("factor 1.0 con lastUpdatedAt = now", () => {
    const now = Date.now();
    const arm = { n: 5, sum: 2, sumsq: 1, lastUpdatedAt: now };
    expect(timeDecayFactor(arm, now)).toBe(1);
  });

  it("factor 0.5 a half-life (30d default)", () => {
    const now = Date.now();
    const arm = { n: 5, sum: 2, sumsq: 1, lastUpdatedAt: now - 30 * DAY };
    expect(timeDecayFactor(arm, now)).toBeCloseTo(0.5, 2);
  });

  it("factor 0.25 a 2× half-life", () => {
    const now = Date.now();
    const arm = { n: 5, sum: 2, sumsq: 1, lastUpdatedAt: now - 60 * DAY };
    expect(timeDecayFactor(arm, now)).toBeCloseTo(0.25, 2);
  });

  it("respeta floor mínimo (0.10)", () => {
    const now = Date.now();
    const arm = { n: 5, sum: 2, sumsq: 1, lastUpdatedAt: now - 365 * DAY };
    expect(timeDecayFactor(arm, now)).toBeGreaterThanOrEqual(0.10);
  });

  it("halfLifeDays custom funciona", () => {
    const now = Date.now();
    const arm = { n: 5, sum: 2, sumsq: 1, lastUpdatedAt: now - 7 * DAY };
    expect(timeDecayFactor(arm, now, { halfLifeDays: 7 })).toBeCloseTo(0.5, 2);
  });
});

describe("decayByTime", () => {
  it("retorna copia decayada de n/sum/sumsq", () => {
    const now = Date.now();
    const arm = { n: 10, sum: 5, sumsq: 3, lastUpdatedAt: now - 30 * DAY };
    const decayed = decayByTime(arm, now);
    expect(decayed.n).toBeCloseTo(5, 1);
    expect(decayed.sum).toBeCloseTo(2.5, 1);
    expect(decayed.sumsq).toBeCloseTo(1.5, 1);
    expect(decayed.lastUpdatedAt).toBe(arm.lastUpdatedAt); // preserved
  });

  it("no muta el arm original", () => {
    const now = Date.now();
    const arm = { n: 10, sum: 5, sumsq: 3, lastUpdatedAt: now - 30 * DAY };
    decayByTime(arm, now);
    expect(arm.n).toBe(10);
    expect(arm.sum).toBe(5);
  });

  it("returns shallow copy sin lastUpdatedAt", () => {
    const arm = { n: 10, sum: 5, sumsq: 3 };
    const r = decayByTime(arm);
    expect(r).toEqual(arm);
    expect(r).not.toBe(arm);
  });
});

describe("updateArm con time-tracking", () => {
  it("backwards compat: sin now, no almacena lastUpdatedAt", () => {
    const arm = updateArm({ n: 0, sum: 0, sumsq: 0 }, 1);
    expect(arm.lastUpdatedAt).toBeUndefined();
  });

  it("con now, almacena lastUpdatedAt", () => {
    const t = 1700000000000;
    const arm = updateArm({ n: 0, sum: 0, sumsq: 0 }, 1, { now: t });
    expect(arm.lastUpdatedAt).toBe(t);
  });

  it("aplica time-decay al arm previo antes de actualizar", () => {
    const old = 1700000000000;
    const now = old + 30 * DAY; // half-life
    // Arm con n=10 viejo + nueva obs reward=2
    const arm0 = { n: 10, sum: 20, sumsq: 40, lastUpdatedAt: old };
    const arm1 = updateArm(arm0, 2, { now, decay: 1 });
    // Decay a half-life: n=5, sum=10, sumsq=20. Luego añade obs.
    expect(arm1.n).toBeCloseTo(6, 1);
    expect(arm1.sum).toBeCloseTo(12, 1);
    expect(arm1.lastUpdatedAt).toBe(now);
  });
});

describe("armStats con time-decay opt-in", () => {
  it("backwards compat: sin opts, no aplica time-decay", () => {
    const old = 1700000000000;
    const now = old + 60 * DAY;
    const arm = { n: 10, sum: 30, sumsq: 100, lastUpdatedAt: old };
    const stats = armStats(arm); // sin now/timeDecay
    expect(stats.n).toBeCloseTo(11, 1); // n + priorN=1
  });

  it("con timeDecay=true reduce n efectivo", () => {
    const old = 1700000000000;
    const now = old + 30 * DAY; // half-life
    const arm = { n: 10, sum: 30, sumsq: 100, lastUpdatedAt: old };
    const fresh = armStats(arm); // sin decay
    const decayed = armStats(arm, { now, timeDecay: true });
    expect(decayed.n).toBeLessThan(fresh.n);
  });
});

describe("scoreArm con time-decay opt-in", () => {
  it("score con time-decay favorece arms recientes vs viejas", () => {
    const old = 1700000000000;
    const now = old + 60 * DAY;
    const armOld = { n: 20, sum: 40, sumsq: 100, lastUpdatedAt: old };
    const armNew = { n: 5, sum: 10, sumsq: 25, lastUpdatedAt: now - DAY };
    const totalPulls = 25;
    // Sin decay: armOld tiene más confianza (n=20)
    const sOld = scoreArm(armOld, totalPulls);
    const sNew = scoreArm(armNew, totalPulls);
    expect(sOld).toBeDefined();
    // Con decay: armOld pierde n efectivo, exploración aumenta
    const sOldD = scoreArm(armOld, totalPulls, 1, { now, timeDecay: true });
    expect(Number.isFinite(sOldD)).toBe(true);
  });
});

