import { describe, it, expect } from "vitest";
import { buildStreakCalendar } from "./streakCalendar";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n, now) {
  return now - n * DAY;
}

describe("buildStreakCalendar", () => {
  it("array vacío devuelve una grilla del tamaño pedido, total=0, longestStreak=0", () => {
    const now = new Date("2026-04-15T12:00:00").getTime();
    const r = buildStreakCalendar([], { weeks: 4, now });
    expect(r.weeks).toHaveLength(4);
    expect(r.weeks.every((w) => w.length === 7)).toBe(true);
    expect(r.total).toBe(0);
    expect(r.activeDays).toBe(0);
    expect(r.longestStreak).toBe(0);
  });

  it("cuenta sesiones del mismo día en una sola celda", () => {
    const now = new Date("2026-04-15T12:00:00").getTime();
    const hist = [
      { ts: now, p: "x" },
      { ts: now - 1000 * 60, p: "y" },
      { ts: now - 1000 * 60 * 30, p: "z" },
    ];
    const r = buildStreakCalendar(hist, { weeks: 4, now });
    expect(r.total).toBe(3);
    expect(r.activeDays).toBe(1);
    const today = r.weeks.flat().find((c) => !c.inFuture && c.count > 0);
    expect(today.count).toBe(3);
    expect(today.level).toBe(3); // 3 sesiones → nivel 3 (1=1,2=2,3-4=3,5+=4)
  });

  it("level 1/2/3/4 según bucket", () => {
    const now = new Date("2026-04-15T12:00:00").getTime();
    const hist = [
      { ts: daysAgo(1, now) },
      { ts: daysAgo(2, now) }, { ts: daysAgo(2, now) },
      { ts: daysAgo(3, now) }, { ts: daysAgo(3, now) }, { ts: daysAgo(3, now) },
      ...Array.from({ length: 6 }, () => ({ ts: daysAgo(4, now) })),
    ];
    const r = buildStreakCalendar(hist, { weeks: 4, now });
    const byDay = Object.fromEntries(r.weeks.flat().map((c) => [c.dayKey, c]));
    const k1 = new Date(daysAgo(1, now)); k1.setHours(0,0,0,0);
    const k2 = new Date(daysAgo(2, now)); k2.setHours(0,0,0,0);
    const k3 = new Date(daysAgo(3, now)); k3.setHours(0,0,0,0);
    const k4 = new Date(daysAgo(4, now)); k4.setHours(0,0,0,0);
    function key(d) {
      const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), dd=String(d.getDate()).padStart(2,"0");
      return `${y}-${m}-${dd}`;
    }
    expect(byDay[key(k1)].level).toBe(1);
    expect(byDay[key(k2)].level).toBe(2);
    expect(byDay[key(k3)].level).toBe(3);
    expect(byDay[key(k4)].level).toBe(4);
  });

  it("longestStreak cuenta la racha más larga en el período", () => {
    const now = new Date("2026-04-15T12:00:00").getTime();
    const hist = [0, 1, 2, 3, 6, 7, 8].map((d) => ({ ts: daysAgo(d, now) }));
    const r = buildStreakCalendar(hist, { weeks: 4, now });
    expect(r.longestStreak).toBe(4); // 4 consecutivos (hoy, -1, -2, -3)
    expect(r.activeDays).toBe(7);
  });

  it("días futuros se marcan inFuture=true y level=0", () => {
    const now = new Date("2026-04-15T12:00:00").getTime();
    const r = buildStreakCalendar([], { weeks: 2, now });
    const flat = r.weeks.flat();
    const futureDays = flat.filter((c) => c.inFuture);
    expect(futureDays.length).toBeGreaterThan(0);
    expect(futureDays.every((c) => c.level === 0)).toBe(true);
  });

  it("entradas sin ts numérico se ignoran sin romper", () => {
    const now = Date.now();
    const hist = [{ ts: "bad" }, null, { ts: now }, undefined];
    const r = buildStreakCalendar(hist, { weeks: 2, now });
    expect(r.total).toBe(1);
  });
});
