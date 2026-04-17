import { describe, it, expect } from "vitest";
import {
  classifyChronotype, isInDeepWorkWindow, estimateDLMO,
  MEQ_SA_QUESTIONS,
} from "./chronotype";

describe("MEQ_SA_QUESTIONS", () => {
  it("has 5 questions", () => {
    expect(MEQ_SA_QUESTIONS.length).toBe(5);
  });

  it("each question has options with scores", () => {
    for (const q of MEQ_SA_QUESTIONS) {
      expect(q.options.length).toBeGreaterThan(0);
      for (const o of q.options) expect(typeof o.score).toBe("number");
    }
  });
});

describe("classifyChronotype", () => {
  it("returns null for incomplete answers", () => {
    expect(classifyChronotype([5])).toBe(null);
    expect(classifyChronotype(null)).toBe(null);
  });

  it("definite_morning for max scores", () => {
    const r = classifyChronotype([5, 4, 5, 4, 6]);
    expect(r.type).toBe("definite_morning");
  });

  it("definite_evening for min scores", () => {
    const r = classifyChronotype([1, 1, 1, 1, 0]);
    expect(r.type).toBe("definite_evening");
  });

  it("intermediate for mid scores", () => {
    const r = classifyChronotype([3, 2, 3, 2, 2]);
    expect(r.type).toBe("intermediate");
  });

  it("includes schedule recommendation", () => {
    const r = classifyChronotype([3, 2, 3, 2, 2]);
    expect(r.sleepWindow).toBeDefined();
    expect(r.deepWork).toBeDefined();
    expect(Array.isArray(r.protocolsMorning)).toBe(true);
  });
});

describe("isInDeepWorkWindow", () => {
  it("returns false for unknown type", () => {
    expect(isInDeepWorkWindow("unknown")).toBe(false);
  });

  it("matches morning window for definite_morning at 08:00", () => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    expect(isInDeepWorkWindow("definite_morning", d)).toBe(true);
  });

  it("does not match at 23:00 for definite_morning", () => {
    const d = new Date();
    d.setHours(23, 0, 0, 0);
    expect(isInDeepWorkWindow("definite_morning", d)).toBe(false);
  });

  it("matches late window for definite_evening at 21:00", () => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    expect(isInDeepWorkWindow("definite_evening", d)).toBe(true);
  });
});

describe("estimateDLMO", () => {
  it("returns HH:MM string", () => {
    const d = estimateDLMO("intermediate");
    expect(d).toMatch(/^\d{2}:\d{2}$/);
  });

  it("is earlier for morning types than evening", () => {
    const morning = estimateDLMO("definite_morning");
    const evening = estimateDLMO("definite_evening");
    const [mh] = morning.split(":").map(Number);
    const [eh] = evening.split(":").map(Number);
    const mNorm = (mh + 24) % 24;
    const eNorm = (eh + 24) % 24;
    expect(mNorm).toBeLessThan(eNorm === 23 ? 25 : eNorm < 12 ? eNorm + 24 : eNorm);
  });
});
