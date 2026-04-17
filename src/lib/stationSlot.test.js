import { describe, it, expect } from "vitest";
import {
  SLOTS, POLICIES, detectSlot, slotAllowed, dailyCompliance, protocolForSlot, hourIn,
} from "./stationSlot.js";

// Helper: fecha UTC que, en America/Mexico_City (UTC-6 sin DST), sea la hora local deseada.
const mxLocal = (hour) => new Date(Date.UTC(2026, 3, 17, hour + 6, 0, 0));

describe("hourIn", () => {
  it("extrae la hora local correcta", () => {
    expect(hourIn(mxLocal(7), "America/Mexico_City")).toBe(7);
    expect(hourIn(mxLocal(18), "America/Mexico_City")).toBe(18);
    expect(hourIn(mxLocal(23), "America/Mexico_City")).toBe(23);
  });
  it("con timezone inválido cae a UTC sin romper", () => {
    const d = new Date(Date.UTC(2026, 3, 17, 10, 0, 0));
    expect(hourIn(d, "Not/AZone")).toBe(10);
  });
});

describe("detectSlot", () => {
  it("mañana 05-11 → MORNING", () => {
    expect(detectSlot(mxLocal(5),  "America/Mexico_City")).toBe(SLOTS.MORNING);
    expect(detectSlot(mxLocal(9),  "America/Mexico_City")).toBe(SLOTS.MORNING);
    expect(detectSlot(mxLocal(10), "America/Mexico_City")).toBe(SLOTS.MORNING);
  });
  it("tarde 16-22 → EVENING", () => {
    expect(detectSlot(mxLocal(16), "America/Mexico_City")).toBe(SLOTS.EVENING);
    expect(detectSlot(mxLocal(19), "America/Mexico_City")).toBe(SLOTS.EVENING);
    expect(detectSlot(mxLocal(21), "America/Mexico_City")).toBe(SLOTS.EVENING);
  });
  it("fuera de ventanas → ADHOC", () => {
    expect(detectSlot(mxLocal(11), "America/Mexico_City")).toBe(SLOTS.ADHOC);
    expect(detectSlot(mxLocal(14), "America/Mexico_City")).toBe(SLOTS.ADHOC);
    expect(detectSlot(mxLocal(22), "America/Mexico_City")).toBe(SLOTS.ADHOC);
    expect(detectSlot(mxLocal(3),  "America/Mexico_City")).toBe(SLOTS.ADHOC);
  });
});

describe("slotAllowed", () => {
  it("ANY acepta cualquier slot", () => {
    for (const s of Object.values(SLOTS)) expect(slotAllowed(POLICIES.ANY, s)).toBe(true);
  });
  it("ENTRY_EXIT acepta mañana y tarde, no ad-hoc", () => {
    expect(slotAllowed(POLICIES.ENTRY_EXIT, SLOTS.MORNING)).toBe(true);
    expect(slotAllowed(POLICIES.ENTRY_EXIT, SLOTS.EVENING)).toBe(true);
    expect(slotAllowed(POLICIES.ENTRY_EXIT, SLOTS.ADHOC)).toBe(false);
  });
  it("MORNING_ONLY / EVENING_ONLY restringen correctamente", () => {
    expect(slotAllowed(POLICIES.MORNING_ONLY, SLOTS.MORNING)).toBe(true);
    expect(slotAllowed(POLICIES.MORNING_ONLY, SLOTS.EVENING)).toBe(false);
    expect(slotAllowed(POLICIES.EVENING_ONLY, SLOTS.EVENING)).toBe(true);
    expect(slotAllowed(POLICIES.EVENING_ONLY, SLOTS.MORNING)).toBe(false);
  });
  it("política desconocida → deniega (fail-closed)", () => {
    expect(slotAllowed("UNKNOWN", SLOTS.MORNING)).toBe(false);
  });
});

describe("dailyCompliance", () => {
  it("ambos slots presentes → minimumMet=true", () => {
    const c = dailyCompliance([{ slot: "MORNING" }, { slot: "EVENING" }, { slot: "ADHOC" }]);
    expect(c.minimumMet).toBe(true);
    expect(c.morning).toBe(true);
    expect(c.evening).toBe(true);
    expect(c.count).toBe(3);
  });
  it("solo mañana → no cumple", () => {
    const c = dailyCompliance([{ slot: "MORNING" }]);
    expect(c.minimumMet).toBe(false);
  });
  it("lista vacía", () => {
    const c = dailyCompliance([]);
    expect(c).toEqual({ morning: false, evening: false, minimumMet: false, count: 0 });
  });
});

describe("protocolForSlot", () => {
  it("mañana es Ignición corta", () => {
    const p = protocolForSlot(SLOTS.MORNING);
    expect(p.minutes).toBeLessThanOrEqual(5);
    expect(p.label).toBe("Ignición");
  });
  it("tarde es Descarga más larga", () => {
    const p = protocolForSlot(SLOTS.EVENING);
    expect(p.label).toBe("Descarga");
  });
  it("adhoc es reset breve", () => {
    const p = protocolForSlot(SLOTS.ADHOC);
    expect(p.minutes).toBeLessThanOrEqual(3);
  });
});
