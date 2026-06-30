import { describe, it, expect } from "vitest";
import {
  responsivenessOf,
  buildOptimalWindow,
  windowLabel,
  partOfDay,
  minutesUntilHour,
} from "./optimalWindow";

const atHour = (hour, fields = {}, dayOffset = 0) => ({
  ts: new Date(2026, 0, 1 + dayOffset, hour, 0, 0).getTime(),
  bioQ: 80,
  c: 70,
  quality: "alta",
  ...fields,
});

describe("responsivenessOf", () => {
  it("combina bioQ y coherencia cuando ambos existen", () => {
    expect(responsivenessOf({ bioQ: 90, c: 80, quality: "alta" })).toBeCloseTo(0.86, 5);
  });
  it("usa el único disponible", () => {
    expect(responsivenessOf({ bioQ: 50 })).toBeCloseTo(0.5, 5);
    expect(responsivenessOf({ c: 60 })).toBeCloseTo(0.6, 5);
  });
  it("descarta sesiones inválidas o sin señal", () => {
    expect(responsivenessOf({ bioQ: 90, quality: "inválida" })).toBeNull();
    expect(responsivenessOf({})).toBeNull();
    expect(responsivenessOf(null)).toBeNull();
  });
  it("mezcla ΔRMSSD cuando está presente (lift vagal sube responsividad)", () => {
    const base = responsivenessOf({ bioQ: 50, c: 50 });
    const lifted = responsivenessOf({ bioQ: 50, c: 50, deltaRmssd: 20 });
    expect(lifted).toBeGreaterThan(base);
  });
});

describe("windowLabel / partOfDay", () => {
  it("etiqueta franja de 2h", () => {
    expect(windowLabel(10)).toBe("10:00–12:00");
    expect(windowLabel(22)).toBe("22:00–00:00");
  });
  it("nombra la parte del día", () => {
    expect(partOfDay(10)).toBe("la mañana");
    expect(partOfDay(16)).toBe("la tarde");
    expect(partOfDay(20)).toBe("la noche");
    expect(partOfDay(3)).toBe("la madrugada");
  });
});

describe("buildOptimalWindow", () => {
  it("cold-start honesto: pocas sesiones → no disponible con faltante", () => {
    const hist = Array.from({ length: 5 }, (_, i) => atHour(10, {}, i));
    const r = buildOptimalWindow(hist, { now: Date.now() });
    expect(r.available).toBe(false);
    expect(r.maturity).toMatchObject({ sessions: 5, needed: 12, ready: false });
    expect(r.reason).toMatch(/faltan 7/);
  });

  it("detecta la mejor y peor ventana con soporte suficiente", () => {
    const hist = [
      ...Array.from({ length: 8 }, (_, i) => atHour(10, { bioQ: 90, c: 80 }, i)),
      ...Array.from({ length: 6 }, (_, i) => atHour(16, { bioQ: 40, c: 40 }, i)),
    ];
    const r = buildOptimalWindow(hist, { now: new Date(2026, 2, 1, 8, 0, 0).getTime() });
    expect(r.available).toBe(true);
    expect(r.best.hour).toBe(10);
    expect(r.best.label).toBe("10:00–12:00");
    expect(r.worst.hour).toBe(16);
    expect(r.headline).toMatch(/10:00/);
    expect(r.headline).toMatch(/mañana/);
    expect(r.profile).toHaveLength(12);
    expect(r.nextWindowMinutes).toBe(120); // 08:00 → 10:00
  });

  it("shrinkage: una franja con 1 sola sesión perfecta NO gana", () => {
    const hist = [
      ...Array.from({ length: 8 }, (_, i) => atHour(10, { bioQ: 90, c: 80 }, i)),
      ...Array.from({ length: 6 }, (_, i) => atHour(16, { bioQ: 40, c: 40 }, i)),
      atHour(22, { bioQ: 100, c: 100 }), // n=1, score perfecto pero sin soporte
    ];
    const r = buildOptimalWindow(hist, { now: Date.now() });
    expect(r.available).toBe(true);
    expect(r.best.hour).toBe(10); // no 22
  });

  it("requiere variedad de horarios: 1 sesión por franja → no comparable", () => {
    const hist = Array.from({ length: 12 }, (_, i) => atHour(i * 2, {}, i));
    const r = buildOptimalWindow(hist, { now: Date.now() });
    expect(r.maturity.ready).toBe(true);
    expect(r.available).toBe(false);
    expect(r.reason).toMatch(/variedad/);
  });

  it("lista vacía no rompe", () => {
    const r = buildOptimalWindow([], { now: Date.now() });
    expect(r.available).toBe(false);
    expect(r.profile).toEqual([]);
  });
});

describe("minutesUntilHour", () => {
  it("cuenta hasta la próxima ocurrencia (hoy)", () => {
    const now = new Date(2026, 0, 1, 8, 0, 0).getTime();
    expect(minutesUntilHour(10, now)).toBe(120);
  });
  it("salta a mañana si la hora ya pasó", () => {
    const now = new Date(2026, 0, 1, 8, 0, 0).getTime();
    expect(minutesUntilHour(6, now)).toBe(22 * 60);
  });
});
