import { describe, it, expect } from "vitest";
import { validateCohort, INDUSTRIES, COMPANY_SIZES, SHIFTS, industryLabel } from "./orgCohort";

describe("orgCohort", () => {
  it("listas curadas no vacías", () => {
    expect(INDUSTRIES.length).toBeGreaterThanOrEqual(8);
    expect(COMPANY_SIZES.map((x) => x.id)).toContain("51-200");
    expect(SHIFTS.map((x) => x.id)).toContain("nocturno");
  });

  it("acepta ids válidos", () => {
    const r = validateCohort({ industry: "manufactura", companySize: "51-200", shift: "rotativo" });
    expect(r.ok).toBe(true);
    expect(r.value).toEqual({ industry: "manufactura", companySize: "51-200", shift: "rotativo" });
  });

  it("rechaza ids desconocidos", () => {
    const r = validateCohort({ industry: "marte", companySize: "51-200" });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain("industry");
  });

  it("null/'' limpia el campo", () => {
    const r = validateCohort({ industry: "", shift: null });
    expect(r.ok).toBe(true);
    expect(r.value).toEqual({ industry: null, shift: null });
  });

  it("solo procesa campos presentes (PATCH-style)", () => {
    const r = validateCohort({ industry: "salud" });
    expect(r.value).toEqual({ industry: "salud" });
    expect("companySize" in r.value).toBe(false);
  });

  it("industryLabel mapea id → etiqueta", () => {
    expect(industryLabel("tecnologia")).toBe("Tecnología");
  });
});
