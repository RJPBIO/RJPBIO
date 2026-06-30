import { describe, it, expect } from "vitest";
import { buildPresenceTransition } from "./presenceTransition";

const DAY = 86_400_000;
// 19:00 (tarde-noche, ventana de transición).
const EVE = new Date(2026, 5, 15, 19, 0, 0).getTime();
const NOON = new Date(2026, 5, 15, 12, 0, 0).getTime();

// 20 lecturas baseline ~40ms repartidas en días previos.
function baseline(now) {
  const out = [];
  for (let i = 1; i <= 20; i++) out.push({ ts: now - i * 2 * DAY, rmssd: 40 + (((i % 5) - 2) * 4) });
  return out;
}

describe("buildPresenceTransition", () => {
  it("fuera de la ventana tarde-noche → no detecta", () => {
    const r = buildPresenceTransition({ hrvLog: [...baseline(NOON), { ts: NOON, rmssd: 26 }], now: NOON });
    expect(r.detected).toBe(false);
    expect(r.reason).toMatch(/ventana/i);
  });

  it("tarde-noche + estado por debajo de norma → detecta y propone cruzar el umbral", () => {
    const r = buildPresenceTransition({ hrvLog: [...baseline(EVE), { ts: EVE, rmssd: 25 }], now: EVE });
    expect(r.detected).toBe(true);
    expect(r.protocolId).toBe(26);
    expect(r.situation).toBe("transicion_casa");
    expect(r.message).toMatch(/umbral/i);
  });

  it("tarde-noche pero estado normal → no detecta", () => {
    const r = buildPresenceTransition({ hrvLog: [...baseline(EVE), { ts: EVE, rmssd: 41 }], now: EVE });
    expect(r.detected).toBe(false);
  });

  it("sin lectura reciente → invita a medir, no afirma", () => {
    const r = buildPresenceTransition({ hrvLog: [], now: EVE });
    expect(r.detected).toBe(false);
    expect(r.reason).toMatch(/Mide tu HRV/i);
  });
});
