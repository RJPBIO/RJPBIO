import { describe, it, expect } from "vitest";
import {
  evaluateSteps, summarizeProgress, categoryLabel, importanceLabel,
  isCriticalComplete, stepsForCategory,
  ONBOARDING_STEPS, ONBOARDING_CATEGORIES, IMPORTANCE_LEVELS,
  IMPORTANCE_TONE,
} from "./onboarding";

describe("ONBOARDING_STEPS schema", () => {
  it("cada step tiene id, label, href, category, importance, requires", () => {
    for (const s of ONBOARDING_STEPS) {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.href).toMatch(/^\//);
      expect(ONBOARDING_CATEGORIES).toContain(s.category);
      expect(IMPORTANCE_LEVELS).toContain(s.importance);
      expect(s.requires).toBeTruthy();
    }
  });

  it("ids únicos", () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cubre todas las categorías", () => {
    const cats = new Set(ONBOARDING_STEPS.map((s) => s.category));
    expect(cats.has("branding")).toBe(true);
    expect(cats.has("security")).toBe(true);
    expect(cats.has("compliance")).toBe(true);
    expect(cats.has("api")).toBe(true);
    expect(cats.has("team")).toBe(true);
  });

  it("incluye al menos un critical por categoría central", () => {
    const team = ONBOARDING_STEPS.filter((s) => s.category === "team");
    const security = ONBOARDING_STEPS.filter((s) => s.category === "security");
    const compliance = ONBOARDING_STEPS.filter((s) => s.category === "compliance");
    expect(team.some((s) => s.importance === "critical")).toBe(true);
    expect(security.some((s) => s.importance === "critical")).toBe(true);
    expect(compliance.some((s) => s.importance === "critical")).toBe(true);
  });

  it("expone categorías frozen", () => {
    expect(Object.isFrozen(ONBOARDING_STEPS)).toBe(true);
    expect(Object.isFrozen(IMPORTANCE_TONE)).toBe(true);
  });
});

describe("evaluateSteps", () => {
  it("evidence vacío → todos done=false", () => {
    const r = evaluateSteps({});
    expect(r.every((s) => s.done === false)).toBe(true);
    expect(r.length).toBe(ONBOARDING_STEPS.length);
  });

  it("flag matching → done=true", () => {
    const r = evaluateSteps({ hasMultipleMembers: true, planUpgraded: true });
    const team = r.filter((s) => s.category === "team");
    expect(team.every((s) => s.done)).toBe(true);
  });

  it("evidence null/non-object → todos false sin throw", () => {
    expect(evaluateSteps(null).every((s) => !s.done)).toBe(true);
    expect(evaluateSteps("nope").every((s) => !s.done)).toBe(true);
  });

  it("preserva campos del step original", () => {
    const r = evaluateSteps({});
    for (const s of r) {
      expect(s.id).toBeTruthy();
      expect(s.href).toBeTruthy();
      expect(s.category).toBeTruthy();
    }
  });
});

describe("summarizeProgress", () => {
  function evidenceForAll(value) {
    const all = {};
    for (const s of ONBOARDING_STEPS) all[s.requires] = value;
    return all;
  }

  it("nada done → 0% + cero per categoría", () => {
    const r = summarizeProgress(evaluateSteps({}));
    expect(r.percent).toBe(0);
    expect(r.done).toBe(0);
    expect(r.total).toBe(ONBOARDING_STEPS.length);
    for (const cat of ONBOARDING_CATEGORIES) {
      expect(r.byCategory[cat].done).toBe(0);
    }
  });

  it("todos done → 100%", () => {
    const r = summarizeProgress(evaluateSteps(evidenceForAll(true)));
    expect(r.percent).toBe(100);
    expect(r.done).toBe(r.total);
    for (const cat of ONBOARDING_CATEGORIES) {
      expect(r.byCategory[cat].done).toBe(r.byCategory[cat].total);
    }
  });

  it("breakdown by importance", () => {
    const r = summarizeProgress(evaluateSteps(evidenceForAll(true)));
    expect(r.byImportance.critical.done).toBe(r.byImportance.critical.total);
    expect(r.byImportance.recommended.done).toBe(r.byImportance.recommended.total);
    expect(r.byImportance.optional.done).toBe(r.byImportance.optional.total);
  });

  it("non-array → defaults seguros", () => {
    const r = summarizeProgress(null);
    expect(r.total).toBe(0);
    expect(r.percent).toBe(0);
  });
});

describe("isCriticalComplete", () => {
  it("solo critical done → true (incluso si optional fail)", () => {
    const evidence = {};
    for (const s of ONBOARDING_STEPS) {
      if (s.importance === "critical") evidence[s.requires] = true;
    }
    expect(isCriticalComplete(evaluateSteps(evidence))).toBe(true);
  });

  it("falta uno critical → false", () => {
    const evidence = {};
    let skipped = false;
    for (const s of ONBOARDING_STEPS) {
      if (s.importance === "critical" && !skipped) { skipped = true; continue; }
      if (s.importance === "critical") evidence[s.requires] = true;
    }
    expect(isCriticalComplete(evaluateSteps(evidence))).toBe(false);
  });

  it("non-array → false", () => {
    expect(isCriticalComplete(null)).toBe(false);
  });
});

describe("stepsForCategory", () => {
  it("filtra por categoría", () => {
    const all = evaluateSteps({});
    const security = stepsForCategory(all, "security");
    expect(security.length).toBeGreaterThan(0);
    expect(security.every((s) => s.category === "security")).toBe(true);
  });

  it("categoría desconocida → []", () => {
    expect(stepsForCategory(evaluateSteps({}), "WUT")).toEqual([]);
  });

  it("non-array → []", () => {
    expect(stepsForCategory(null, "security")).toEqual([]);
  });
});

describe("categoryLabel / importanceLabel", () => {
  it("es default", () => {
    expect(categoryLabel("security")).toBe("Seguridad");
    expect(categoryLabel("compliance")).toBe("Cumplimiento");
    expect(importanceLabel("critical")).toBe("Crítico");
  });
  it("en", () => {
    expect(categoryLabel("security", "en")).toBe("Security");
    expect(importanceLabel("critical", "en")).toBe("Critical");
  });
  it("desconocido → mismo string", () => {
    expect(categoryLabel("WUT")).toBe("WUT");
    expect(importanceLabel("WUT")).toBe("WUT");
  });
});

describe("IMPORTANCE_TONE map", () => {
  it("tones consistentes", () => {
    expect(IMPORTANCE_TONE.critical).toBe("danger");
    expect(IMPORTANCE_TONE.recommended).toBe("warn");
    expect(IMPORTANCE_TONE.optional).toBe("soft");
  });
});
