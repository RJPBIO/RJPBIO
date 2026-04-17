import { describe, it, expect } from "vitest";
import {
  scoreNOM035, riskLevel, actionsFor, aggregateTeam,
  NOM035_ITEMS_GUIA_II,
} from "./nom035";

describe("NOM035_ITEMS_GUIA_II", () => {
  it("has 46 items (official Guía II)", () => {
    expect(NOM035_ITEMS_GUIA_II.length).toBe(46);
  });
});

describe("scoreNOM035", () => {
  it("handles empty answers", () => {
    const r = scoreNOM035({ answers: {} });
    expect(r.total).toBe(0);
    expect(r.level.key).toBe("null_or_low");
  });

  it("reverses reverse-scored items", () => {
    const reverseItem = NOM035_ITEMS_GUIA_II.find((i) => i.reverse);
    const answers = { [reverseItem.id]: 0 };
    const r = scoreNOM035({ answers });
    expect(r.total).toBe(4);
  });

  it("sums normal items straightforwardly", () => {
    const normalItem = NOM035_ITEMS_GUIA_II.find((i) => !i.reverse);
    const answers = { [normalItem.id]: 4 };
    const r = scoreNOM035({ answers });
    expect(r.total).toBe(4);
  });

  it("populates byCat", () => {
    const answers = Object.fromEntries(NOM035_ITEMS_GUIA_II.map((i) => [i.id, 2]));
    const r = scoreNOM035({ answers });
    expect(r.byCat.factores).toBeGreaterThan(0);
    expect(r.byCat.organizacion).toBeGreaterThan(0);
  });
});

describe("riskLevel", () => {
  it("null_or_low for < 50", () => {
    expect(riskLevel(20).key).toBe("null_or_low");
  });

  it("medium for 75-98", () => {
    expect(riskLevel(80).key).toBe("medium");
  });

  it("very_high for ≥ 140", () => {
    expect(riskLevel(150).key).toBe("very_high");
  });
});

describe("actionsFor", () => {
  it("returns string for each level", () => {
    expect(actionsFor("low").length).toBeGreaterThan(0);
    expect(actionsFor("very_high").length).toBeGreaterThan(0);
  });
});

describe("aggregateTeam", () => {
  it("returns insufficient under minK", () => {
    const r = aggregateTeam([{ answers: {} }, { answers: {} }], { minK: 5 });
    expect(r.insufficient).toBe(true);
  });

  it("aggregates when ≥ minK", () => {
    const answers = Object.fromEntries(NOM035_ITEMS_GUIA_II.map((i) => [i.id, 2]));
    const responses = Array(6).fill(0).map(() => ({ answers }));
    const r = aggregateTeam(responses, { minK: 5 });
    expect(r.insufficient).toBe(false);
    expect(r.n).toBe(6);
    expect(typeof r.mean).toBe("number");
  });
});
