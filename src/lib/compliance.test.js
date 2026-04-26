import { describe, it, expect } from "vitest";
import {
  evaluateControl, summarizeControl, buildEvidencePack,
  formatPackAsMarkdown, formatPackAsJson, frameworkCoverage,
  DEFAULT_EVIDENCE, SOC2_CONTROLS, ISO_27001_CONTROLS,
} from "./compliance";

describe("DEFAULT_EVIDENCE + control maps", () => {
  it("expone constantes inmutables", () => {
    expect(Object.isFrozen(DEFAULT_EVIDENCE)).toBe(true);
    expect(SOC2_CONTROLS.length).toBeGreaterThan(0);
    expect(ISO_27001_CONTROLS.length).toBeGreaterThan(0);
  });

  it("cada SOC2 control tiene id, name, summary, requires[]", () => {
    for (const c of SOC2_CONTROLS) {
      expect(c.id).toMatch(/^(CC|A)\d/);
      expect(c.name).toBeTruthy();
      expect(c.summary).toBeTruthy();
      expect(Array.isArray(c.requires)).toBe(true);
      expect(c.requires.length).toBeGreaterThan(0);
    }
  });

  it("cada ISO control tiene shape consistente", () => {
    for (const c of ISO_27001_CONTROLS) {
      expect(c.id).toMatch(/^A\.\d/);
      expect(Array.isArray(c.requires)).toBe(true);
    }
  });
});

describe("evaluateControl", () => {
  const c = { id: "X", requires: ["a", "b", "c"] };

  it("todos los flags true → ok=true", () => {
    expect(evaluateControl(c, { a: true, b: true, c: true }))
      .toEqual({ ok: true, missing: [] });
  });

  it("alguno false → ok=false con missing list", () => {
    const r = evaluateControl(c, { a: true, b: false, c: true });
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(["b"]);
  });

  it("evidence sin algún flag (undefined) → missing", () => {
    const r = evaluateControl(c, { a: true });
    expect(r.missing).toEqual(["b", "c"]);
  });

  it("control inválido → ok=false", () => {
    expect(evaluateControl(null, {})).toEqual({ ok: false, missing: [] });
    expect(evaluateControl({}, {})).toEqual({ ok: false, missing: [] });
  });

  it("evidence null → todos missing", () => {
    expect(evaluateControl(c, null).ok).toBe(false);
  });
});

describe("summarizeControl", () => {
  const c = { id: "CC1", name: "Test", summary: "...", requires: ["a", "b"] };

  it("satisfied → tone success", () => {
    const r = summarizeControl(c, { a: true, b: true });
    expect(r.status).toBe("satisfied");
    expect(r.tone).toBe("success");
    expect(r.missing).toEqual([]);
  });

  it("partial parcial → warn", () => {
    const r = summarizeControl(c, { a: true, b: false });
    expect(r.status).toBe("partial");
    expect(r.tone).toBe("warn");
    expect(r.missing).toEqual(["b"]);
  });

  it("nada satisfecho → danger", () => {
    const r = summarizeControl(c, { a: false, b: false });
    expect(r.tone).toBe("danger");
  });

  it("locale en/es", () => {
    const r1 = summarizeControl(c, { a: true, b: false }, "es");
    expect(r1.detail).toContain("Falta");
    const r2 = summarizeControl(c, { a: true, b: false }, "en");
    expect(r2.detail).toContain("Missing");
  });
});

describe("buildEvidencePack", () => {
  it("sin overrides → usa DEFAULT_EVIDENCE", () => {
    const pack = buildEvidencePack();
    expect(pack.summary.totalControls).toBe(SOC2_CONTROLS.length + ISO_27001_CONTROLS.length);
    expect(pack.soc2.length).toBe(SOC2_CONTROLS.length);
    expect(pack.iso27001.length).toBe(ISO_27001_CONTROLS.length);
    expect(pack.summary.coverage).toBeGreaterThanOrEqual(0);
    expect(pack.summary.coverage).toBeLessThanOrEqual(100);
  });

  it("con todos los flags true → coverage 100%", () => {
    const allTrue = {};
    for (const k of Object.keys(DEFAULT_EVIDENCE)) allTrue[k] = true;
    const pack = buildEvidencePack({ evidence: allTrue });
    expect(pack.summary.coverage).toBe(100);
    expect(pack.soc2.every((c) => c.status === "satisfied")).toBe(true);
    expect(pack.iso27001.every((c) => c.status === "satisfied")).toBe(true);
  });

  it("con todos los flags false → coverage 0%", () => {
    const allFalse = {};
    for (const k of Object.keys(DEFAULT_EVIDENCE)) allFalse[k] = false;
    const pack = buildEvidencePack({ evidence: allFalse });
    expect(pack.summary.coverage).toBe(0);
  });

  it("incluye org info si se pasa", () => {
    const pack = buildEvidencePack({ org: { id: "o1", name: "Acme", plan: "ENTERPRISE" } });
    expect(pack.org).toEqual({ id: "o1", name: "Acme", plan: "ENTERPRISE" });
  });

  it("generatedAt configurable", () => {
    const at = "2026-04-26T00:00:00Z";
    expect(buildEvidencePack({ generatedAt: at }).generatedAt).toBe(at);
  });

  it("merge override sobre defaults", () => {
    const pack = buildEvidencePack({ evidence: { sso: true, mfa: true, ip_allowlist: true, session_ttl: true, scim: true, audit_retention: true, audit_verify: true, webhook_rotation: true } });
    expect(pack.summary.coverage).toBeGreaterThan(50);
  });
});

describe("formatPackAsMarkdown", () => {
  const pack = buildEvidencePack({ org: { id: "o1", name: "Acme", plan: "GROWTH" } });

  it("incluye headers + summary + ambos frameworks", () => {
    const md = formatPackAsMarkdown(pack);
    expect(md).toContain("# Compliance Evidence Pack");
    expect(md).toContain("Acme");
    expect(md).toContain("SOC 2");
    expect(md).toContain("ISO/IEC 27001");
    expect(md).toContain("CC6.1");
    expect(md).toContain("A.5.15");
    expect(md).toContain("Disclaimer");
  });

  it("locale en", () => {
    const md = formatPackAsMarkdown(pack, "en");
    expect(md).toContain("Generated");
    expect(md).toContain("Coverage");
  });

  it("null pack → ''", () => {
    expect(formatPackAsMarkdown(null)).toBe("");
  });

  it("✅/⚠️ symbols por status", () => {
    const allTrue = {};
    for (const k of Object.keys(DEFAULT_EVIDENCE)) allTrue[k] = true;
    const md = formatPackAsMarkdown(buildEvidencePack({ evidence: allTrue }));
    expect(md).toContain("✅");
    expect(md).not.toContain("⚠️");
  });
});

describe("formatPackAsJson", () => {
  it("retorna JSON válido", () => {
    const pack = buildEvidencePack();
    const json = formatPackAsJson(pack);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.summary).toBeDefined();
    expect(parsed.soc2).toBeDefined();
  });

  it("null → '{}'", () => {
    expect(formatPackAsJson(null)).toBe("{}");
  });

  it("indentado a 2 espacios", () => {
    const json = formatPackAsJson(buildEvidencePack());
    expect(json).toContain('\n  "');
  });
});

describe("frameworkCoverage", () => {
  it("cuenta satisfied por framework", () => {
    const allTrue = {};
    for (const k of Object.keys(DEFAULT_EVIDENCE)) allTrue[k] = true;
    const pack = buildEvidencePack({ evidence: allTrue });
    const c = frameworkCoverage(pack);
    expect(c.soc2).toBe(SOC2_CONTROLS.length);
    expect(c.iso27001).toBe(ISO_27001_CONTROLS.length);
  });

  it("null → ceros", () => {
    expect(frameworkCoverage(null)).toEqual({ soc2: 0, iso27001: 0 });
  });
});
