import { describe, it, expect } from "vitest";
import {
  parsePatchBody, applyPatchOps, isDeactivateOp, isActivateOp,
  SCIM_PATCH_OPS,
} from "./scim-patch";

describe("parsePatchBody", () => {
  it("body válido con replace", () => {
    const r = parsePatchBody({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      Operations: [{ op: "replace", path: "active", value: false }],
    });
    expect(r.ok).toBe(true);
    expect(r.ops).toEqual([{ op: "replace", path: "active", value: false }]);
  });

  it("normaliza op a lowercase", () => {
    const r = parsePatchBody({ Operations: [{ op: "REPLACE", path: "x", value: 1 }] });
    expect(r.ok).toBe(true);
    expect(r.ops[0].op).toBe("replace");
  });

  it("trim path", () => {
    const r = parsePatchBody({ Operations: [{ op: "add", path: "  name  ", value: "x" }] });
    expect(r.ok).toBe(true);
    expect(r.ops[0].path).toBe("name");
  });

  it("body no-object → error", () => {
    expect(parsePatchBody(null).ok).toBe(false);
    expect(parsePatchBody("nope").ok).toBe(false);
    expect(parsePatchBody(42).ok).toBe(false);
  });

  it("Operations missing/no-array → error", () => {
    expect(parsePatchBody({}).error).toBe("operations_not_array");
    expect(parsePatchBody({ Operations: "x" }).error).toBe("operations_not_array");
  });

  it("Operations vacío → error", () => {
    expect(parsePatchBody({ Operations: [] }).error).toBe("operations_empty");
  });

  it("op inválida → error con índice", () => {
    const r = parsePatchBody({ Operations: [
      { op: "replace", path: "a", value: 1 },
      { op: "destroy", path: "x" },
    ]});
    expect(r.ok).toBe(false);
    expect(r.error).toBe("invalid_op");
    expect(r.index).toBe(1);
  });

  it("remove sin path → error", () => {
    const r = parsePatchBody({ Operations: [{ op: "remove" }] });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("remove_requires_path");
  });

  it("add/replace SIN path → ok (top-level merge)", () => {
    const r = parsePatchBody({ Operations: [{ op: "add", value: { active: true } }] });
    expect(r.ok).toBe(true);
    expect(r.ops[0].path).toBe(null);
  });

  it("expone SCIM_PATCH_OPS", () => {
    expect(SCIM_PATCH_OPS).toEqual(["add", "replace", "remove"]);
  });
});

describe("applyPatchOps", () => {
  it("replace path simple", () => {
    const r = applyPatchOps({ active: true }, [{ op: "replace", path: "active", value: false }]);
    expect(r.active).toBe(false);
  });

  it("replace path nested (auto-vivify)", () => {
    const r = applyPatchOps({}, [{ op: "replace", path: "name.givenName", value: "Alice" }]);
    expect(r).toEqual({ name: { givenName: "Alice" } });
  });

  it("replace deep nested", () => {
    const r = applyPatchOps({ a: { b: { c: 1 } } }, [{ op: "replace", path: "a.b.c", value: 2 }]);
    expect(r.a.b.c).toBe(2);
  });

  it("add se comporta igual que replace para campos simples", () => {
    const r = applyPatchOps({ x: 1 }, [{ op: "add", path: "y", value: 2 }]);
    expect(r).toEqual({ x: 1, y: 2 });
  });

  it("remove path simple", () => {
    const r = applyPatchOps({ active: true, name: "x" }, [{ op: "remove", path: "active" }]);
    expect(r).toEqual({ name: "x" });
  });

  it("remove path nested", () => {
    const r = applyPatchOps({ name: { given: "A", family: "B" } }, [{ op: "remove", path: "name.given" }]);
    expect(r.name).toEqual({ family: "B" });
  });

  it("add/replace sin path con value-objeto → merge top-level (Okta-style)", () => {
    const r = applyPatchOps({ active: true }, [
      { op: "replace", path: null, value: { name: "Alice", active: false } },
    ]);
    expect(r).toEqual({ active: false, name: "Alice" });
  });

  it("clones input — no mutation", () => {
    const target = { x: 1 };
    applyPatchOps(target, [{ op: "replace", path: "x", value: 2 }]);
    expect(target.x).toBe(1);
  });

  it("multiple ops aplicadas en orden", () => {
    const r = applyPatchOps({}, [
      { op: "add", path: "a", value: 1 },
      { op: "add", path: "b", value: 2 },
      { op: "replace", path: "a", value: 99 },
    ]);
    expect(r).toEqual({ a: 99, b: 2 });
  });

  it("ops null/undefined → returns clone of target", () => {
    expect(applyPatchOps({ x: 1 }, null)).toEqual({ x: 1 });
    expect(applyPatchOps(null, [])).toEqual({});
  });
});

describe("isDeactivateOp / isActivateOp", () => {
  it("replace path=active value=false → deactivate", () => {
    expect(isDeactivateOp([{ op: "replace", path: "active", value: false }])).toBe(true);
  });
  it("replace path=active value=true → NOT deactivate", () => {
    expect(isDeactivateOp([{ op: "replace", path: "active", value: true }])).toBe(false);
  });
  it("path=active value=true → activate", () => {
    expect(isActivateOp([{ op: "replace", path: "active", value: true }])).toBe(true);
  });
  it("Okta-style sin path con value object", () => {
    expect(isDeactivateOp([{ op: "replace", path: null, value: { active: false } }])).toBe(true);
    expect(isActivateOp([{ op: "replace", path: null, value: { active: true } }])).toBe(true);
  });
  it("ops sin active → false ambos", () => {
    expect(isDeactivateOp([{ op: "replace", path: "name", value: "x" }])).toBe(false);
    expect(isActivateOp([{ op: "replace", path: "name", value: "x" }])).toBe(false);
  });
  it("non-array → false", () => {
    expect(isDeactivateOp(null)).toBe(false);
    expect(isActivateOp(undefined)).toBe(false);
  });
});
