import { describe, it, expect } from "vitest";
import {
  isValidColor, normalizeColor, isValidLogoUrl, isValidDomain,
  canEditBranding, canSetCustomDomain,
  validateBranding, mergeBrandingDefaults, getPrimaryBranding, gradientFromBranding,
  BRANDING_DEFAULTS, BRANDING_EDIT_PLANS, CUSTOM_DOMAIN_PLANS,
  COACH_PERSONA_MAX,
} from "./branding";

describe("isValidColor", () => {
  it("hex 6-char", () => {
    expect(isValidColor("#059669")).toBe(true);
    expect(isValidColor("#FF0000")).toBe(true);
    expect(isValidColor("#abcdef")).toBe(true);
  });
  it("hex 3-char shorthand", () => {
    expect(isValidColor("#0A2")).toBe(true);
    expect(isValidColor("#fff")).toBe(true);
  });
  it("rechaza sin #", () => {
    expect(isValidColor("059669")).toBe(false);
  });
  it("rechaza 4 char (no es shorthand válido)", () => {
    expect(isValidColor("#abcd")).toBe(false);
  });
  it("rechaza chars no-hex", () => {
    expect(isValidColor("#GGGGGG")).toBe(false);
  });
  it("rechaza non-string", () => {
    expect(isValidColor(0xff0000)).toBe(false);
    expect(isValidColor(null)).toBe(false);
  });
});

describe("normalizeColor", () => {
  it("expande shorthand a 6-char lowercase", () => {
    expect(normalizeColor("#0A2")).toBe("#00aa22");
    expect(normalizeColor("#FFF")).toBe("#ffffff");
  });
  it("normaliza 6-char a lowercase", () => {
    expect(normalizeColor("#FF00AA")).toBe("#ff00aa");
  });
  it("trim spaces", () => {
    expect(normalizeColor("  #ff0000 ")).toBe("#ff0000");
  });
  it("inválido → null", () => {
    expect(normalizeColor("red")).toBe(null);
    expect(normalizeColor(null)).toBe(null);
  });
});

describe("isValidLogoUrl", () => {
  it("https:// válido", () => {
    expect(isValidLogoUrl("https://cdn.empresa.com/logo.svg")).toBe(true);
    expect(isValidLogoUrl("https://example.com/x.png?v=1")).toBe(true);
  });
  it("http:// rechazado (mixed-content)", () => {
    expect(isValidLogoUrl("http://example.com/logo.png")).toBe(false);
  });
  it("data: y file: rechazados", () => {
    expect(isValidLogoUrl("data:image/png;base64,abc")).toBe(false);
    expect(isValidLogoUrl("file:///tmp/logo.png")).toBe(false);
    expect(isValidLogoUrl("javascript:alert(1)")).toBe(false);
  });
  it("vacío/null → false", () => {
    expect(isValidLogoUrl("")).toBe(false);
    expect(isValidLogoUrl(null)).toBe(false);
  });
});

describe("isValidDomain", () => {
  it("dominio regular", () => {
    expect(isValidDomain("acme.com")).toBe(true);
    expect(isValidDomain("app.tu-empresa.com")).toBe(true);
    expect(isValidDomain("subdomain.example.co.uk")).toBe(true);
  });
  it("rechaza scheme", () => {
    expect(isValidDomain("https://acme.com")).toBe(false);
  });
  it("rechaza puerto", () => {
    expect(isValidDomain("acme.com:8080")).toBe(false);
  });
  it("rechaza espacios", () => {
    expect(isValidDomain("acme com")).toBe(false);
  });
  it("rechaza guión al inicio o final del label", () => {
    expect(isValidDomain("-acme.com")).toBe(false);
    expect(isValidDomain("acme-.com")).toBe(false);
  });
  it("rechaza vacío / no-string", () => {
    expect(isValidDomain("")).toBe(false);
    expect(isValidDomain(null)).toBe(false);
    expect(isValidDomain(42)).toBe(false);
  });
});

describe("canEditBranding / canSetCustomDomain", () => {
  it("GROWTH+ edita branding", () => {
    expect(canEditBranding("GROWTH")).toBe(true);
    expect(canEditBranding("ENTERPRISE")).toBe(true);
  });
  it("FREE/PRO/STARTER NO editan", () => {
    expect(canEditBranding("FREE")).toBe(false);
    expect(canEditBranding("PRO")).toBe(false);
    expect(canEditBranding("STARTER")).toBe(false);
  });
  it("custom domain solo ENTERPRISE", () => {
    expect(canSetCustomDomain("ENTERPRISE")).toBe(true);
    expect(canSetCustomDomain("GROWTH")).toBe(false);
    expect(canSetCustomDomain("FREE")).toBe(false);
  });
  it("expone constantes", () => {
    expect(BRANDING_EDIT_PLANS).toEqual(["GROWTH", "ENTERPRISE"]);
    expect(CUSTOM_DOMAIN_PLANS).toEqual(["ENTERPRISE"]);
  });
});

describe("validateBranding", () => {
  it("input válido completo", () => {
    const r = validateBranding({
      logoUrl: "https://acme.com/logo.png",
      primaryColor: "#FF00AA",
      accentColor: "#00FF00",
      customDomain: "App.Acme.COM",
      coachPersona: "Tono Kaizen",
    });
    expect(r.ok).toBe(true);
    expect(r.value.primaryColor).toBe("#ff00aa"); // normalizado
    expect(r.value.customDomain).toBe("app.acme.com"); // lowercase
  });

  it("input vacío → ok con value vacío (reset)", () => {
    expect(validateBranding({})).toEqual({ ok: true, value: {} });
  });

  it("non-object → error", () => {
    expect(validateBranding(null).ok).toBe(false);
    expect(validateBranding("nope").ok).toBe(false);
    expect(validateBranding(42).ok).toBe(false);
  });

  it("logoUrl inválido → error invalid_https_url", () => {
    const r = validateBranding({ logoUrl: "http://x.com/x.png" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "logoUrl", error: "invalid_https_url" });
  });

  it("color inválido → invalid_hex", () => {
    const r = validateBranding({ primaryColor: "red" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "primaryColor", error: "invalid_hex" });
  });

  it("domain inválido → invalid_domain", () => {
    const r = validateBranding({ customDomain: "https://x.com" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "customDomain", error: "invalid_domain" });
  });

  it("coachPersona too_long", () => {
    const r = validateBranding({ coachPersona: "x".repeat(COACH_PERSONA_MAX + 1) });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "coachPersona", error: "too_long" });
  });

  it("acumula errores", () => {
    const r = validateBranding({
      logoUrl: "ftp://x",
      primaryColor: "red",
      coachPersona: "y".repeat(500),
    });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBe(3);
  });

  it("plan FREE con cualquier valor → plan_required", () => {
    const r = validateBranding({ logoUrl: "https://x.com/y.png" }, { plan: "FREE" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "_plan", error: "plan_required" });
  });

  it("plan FREE con input vacío → ok (permite reset)", () => {
    const r = validateBranding({}, { plan: "FREE" });
    expect(r.ok).toBe(true);
  });

  it("plan GROWTH puede branding pero NO custom domain", () => {
    const r = validateBranding({
      logoUrl: "https://x.com/y.png",
      customDomain: "x.com",
    }, { plan: "GROWTH" });
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.field === "customDomain")).toMatchObject({ error: "plan_required" });
  });

  it("plan ENTERPRISE puede todo", () => {
    const r = validateBranding({
      logoUrl: "https://x.com/y.png",
      customDomain: "x.com",
    }, { plan: "ENTERPRISE" });
    expect(r.ok).toBe(true);
  });

  it("plan null → no gating (admin server-side bypass)", () => {
    const r = validateBranding({ customDomain: "x.com" });
    expect(r.ok).toBe(true);
  });

  it("color vacío → reset al default", () => {
    const r = validateBranding({ primaryColor: "" });
    expect(r.ok).toBe(true);
    expect(r.value.primaryColor).toBe(BRANDING_DEFAULTS.primaryColor);
  });

  it("logoUrl null → string vacío (reset)", () => {
    const r = validateBranding({ logoUrl: null });
    expect(r.ok).toBe(true);
    expect(r.value.logoUrl).toBe("");
  });
});

describe("mergeBrandingDefaults", () => {
  it("aplica defaults a campos faltantes", () => {
    const r = mergeBrandingDefaults({ logoUrl: "https://x.com/l.png" });
    expect(r.logoUrl).toBe("https://x.com/l.png");
    expect(r.primaryColor).toBe(BRANDING_DEFAULTS.primaryColor);
  });
  it("input null/undefined → defaults completos", () => {
    expect(mergeBrandingDefaults(null)).toEqual(BRANDING_DEFAULTS);
    expect(mergeBrandingDefaults(undefined)).toEqual(BRANDING_DEFAULTS);
  });
  it("ignora campos non-string", () => {
    const r = mergeBrandingDefaults({ logoUrl: 123, primaryColor: null });
    expect(r.logoUrl).toBe(BRANDING_DEFAULTS.logoUrl);
    expect(r.primaryColor).toBe(BRANDING_DEFAULTS.primaryColor);
  });
});

describe("getPrimaryBranding", () => {
  it("primer org non-personal con branding custom", () => {
    const ms = [
      { orgId: "p", org: { personal: true, name: "P", branding: { logoUrl: "https://x.com/l.png" } } },
      { orgId: "b", org: { personal: false, name: "Acme", branding: { logoUrl: "https://acme.com/l.png", primaryColor: "#ff0000" } } },
    ];
    const r = getPrimaryBranding(ms);
    expect(r.orgId).toBe("b");
    expect(r.orgName).toBe("Acme");
    expect(r.logoUrl).toBe("https://acme.com/l.png");
  });

  it("solo personal-org → null", () => {
    const ms = [{ orgId: "p", org: { personal: true, branding: { logoUrl: "https://x.com" } } }];
    expect(getPrimaryBranding(ms)).toBe(null);
  });

  it("org sin branding o defaults solamente → null", () => {
    const ms = [{ orgId: "b", org: { personal: false, branding: {} } }];
    expect(getPrimaryBranding(ms)).toBe(null);
    const ms2 = [{ orgId: "b", org: { personal: false, branding: BRANDING_DEFAULTS } }];
    expect(getPrimaryBranding(ms2)).toBe(null);
  });

  it("non-array → null", () => {
    expect(getPrimaryBranding(null)).toBe(null);
    expect(getPrimaryBranding(undefined)).toBe(null);
  });
});

describe("gradientFromBranding", () => {
  it("usa colors del branding", () => {
    const g = gradientFromBranding({ primaryColor: "#ff0000", accentColor: "#00ff00" });
    expect(g).toBe("linear-gradient(135deg, #ff0000, #00ff00)");
  });
  it("falls back a defaults si missing", () => {
    const g = gradientFromBranding({});
    expect(g).toContain(BRANDING_DEFAULTS.primaryColor);
    expect(g).toContain(BRANDING_DEFAULTS.accentColor);
  });
});
