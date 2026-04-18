import { describe, it, expect } from "vitest";
import {
  chronotypeOffset,
  subjectiveHour,
  circadianFromHour,
  getCircadianPersonalized,
} from "./chronoCircadian";

describe("chronotypeOffset", () => {
  it("sin chronotype → 0", () => {
    expect(chronotypeOffset(null)).toBe(0);
    expect(chronotypeOffset(undefined)).toBe(0);
    expect(chronotypeOffset({})).toBe(0);
  });
  it("mapea los 5 tipos MEQ-SA", () => {
    expect(chronotypeOffset({ type: "definite_morning" })).toBe(-2);
    expect(chronotypeOffset({ type: "moderate_morning" })).toBe(-1);
    expect(chronotypeOffset({ type: "intermediate" })).toBe(0);
    expect(chronotypeOffset({ type: "moderate_evening" })).toBe(1);
    expect(chronotypeOffset({ type: "definite_evening" })).toBe(2);
  });
  it("tipo desconocido → 0", () => {
    expect(chronotypeOffset({ type: "xxx" })).toBe(0);
  });
});

describe("subjectiveHour", () => {
  it("intermediate = hora real", () => {
    const d = new Date(2026, 3, 18, 10, 30);
    expect(subjectiveHour({ type: "intermediate" }, d)).toBeCloseTo(10.5);
  });
  it("vespertino definido a las 9am vive sus 7am subjetivas", () => {
    const d = new Date(2026, 3, 18, 9, 0);
    expect(subjectiveHour({ type: "definite_evening" }, d)).toBe(7);
  });
  it("matutino definido a las 6am vive sus 8am subjetivas", () => {
    const d = new Date(2026, 3, 18, 6, 0);
    expect(subjectiveHour({ type: "definite_morning" }, d)).toBe(8);
  });
  it("envuelve correctamente en medianoche", () => {
    const d = new Date(2026, 3, 18, 1, 0);
    // vespertino + offset 2 → subj = -1 → 23
    expect(subjectiveHour({ type: "definite_evening" }, d)).toBe(23);
  });
});

describe("circadianFromHour", () => {
  it("mapea bandas conocidas", () => {
    expect(circadianFromHour(7).period).toBe("amanecer");
    expect(circadianFromHour(10).period).toBe("mañana");
    expect(circadianFromHour(14).period).toBe("mediodía");
    expect(circadianFromHour(18).period).toBe("tarde");
    expect(circadianFromHour(21).period).toBe("noche");
    expect(circadianFromHour(3).period).toBe("madrugada");
  });
});

describe("getCircadianPersonalized", () => {
  it("vespertino a las 9am todavía está en amanecer subjetivo", () => {
    const d = new Date(2026, 3, 18, 9, 0);
    const r = getCircadianPersonalized({ type: "definite_evening" }, d);
    expect(r.period).toBe("amanecer");
    expect(r.intent).toBe("energia");
    expect(r.subjectiveHour).toBe(7);
    expect(r.offsetHours).toBe(2);
  });
  it("matutino a las 13:00 ya vive tarde subjetiva", () => {
    const d = new Date(2026, 3, 18, 13, 0);
    const r = getCircadianPersonalized({ type: "moderate_morning" }, d);
    // offset -1, subj=14
    expect(r.period).toBe("mediodía");
  });
  it("sin chronotype cae al comportamiento estándar", () => {
    const d = new Date(2026, 3, 18, 21, 0);
    const r = getCircadianPersonalized(null, d);
    expect(r.period).toBe("noche");
    expect(r.offsetHours).toBe(0);
  });
});
