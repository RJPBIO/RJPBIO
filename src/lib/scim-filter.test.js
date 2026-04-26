import { describe, it, expect } from "vitest";
import { parseScimFilter, evalScimFilter, matchesScimFilter } from "./scim-filter";

describe("parseScimFilter — single comparisons", () => {
  it("eq con string", () => {
    expect(parseScimFilter('userName eq "alice"')).toEqual({
      type: "cmp", attr: "userName", op: "eq", value: "alice",
    });
  });
  it("ne con boolean", () => {
    expect(parseScimFilter("active ne true")).toEqual({
      type: "cmp", attr: "active", op: "ne", value: true,
    });
  });
  it("sw (startsWith)", () => {
    expect(parseScimFilter('userName sw "j"')).toEqual({
      type: "cmp", attr: "userName", op: "sw", value: "j",
    });
  });
  it("co (contains)", () => {
    expect(parseScimFilter('email co "@acme"')).toEqual({
      type: "cmp", attr: "email", op: "co", value: "@acme",
    });
  });
  it("gt con number", () => {
    expect(parseScimFilter("loginCount gt 5")).toEqual({
      type: "cmp", attr: "loginCount", op: "gt", value: 5,
    });
  });
  it("pr (presence)", () => {
    expect(parseScimFilter("email pr")).toEqual({ type: "pr", attr: "email" });
  });
  it("dot-path attribute", () => {
    expect(parseScimFilter('name.givenName eq "Alice"')).toEqual({
      type: "cmp", attr: "name.givenName", op: "eq", value: "Alice",
    });
  });
});

describe("parseScimFilter — combinators", () => {
  it("and", () => {
    const ast = parseScimFilter('userName eq "alice" and active eq true');
    expect(ast.type).toBe("and");
    expect(ast.left.attr).toBe("userName");
    expect(ast.right.attr).toBe("active");
  });
  it("or", () => {
    const ast = parseScimFilter('userName eq "alice" or userName eq "bob"');
    expect(ast.type).toBe("or");
  });
  it("AND precedence sobre OR (a or b and c → a or (b and c))", () => {
    const ast = parseScimFilter('userName eq "a" or active eq true and email pr');
    expect(ast.type).toBe("or");
    expect(ast.right.type).toBe("and");
  });
  it("paréntesis fuerzan agrupación", () => {
    const ast = parseScimFilter('(userName eq "a" or userName eq "b") and active eq true');
    expect(ast.type).toBe("and");
    expect(ast.left.type).toBe("or");
  });
  it("not unary", () => {
    const ast = parseScimFilter('not (active eq false)');
    expect(ast.type).toBe("not");
    expect(ast.expr.type).toBe("cmp");
  });
});

describe("parseScimFilter — edge cases", () => {
  it("null/empty → null", () => {
    expect(parseScimFilter(null)).toBe(null);
    expect(parseScimFilter(undefined)).toBe(null);
    expect(parseScimFilter("")).toBe(null);
    expect(parseScimFilter("   ")).toBe(null);
  });
  it("non-string → throw", () => {
    expect(() => parseScimFilter(42)).toThrow();
  });
  it("string con escapes", () => {
    expect(parseScimFilter('name eq "Hello \\"World\\""').value).toBe('Hello "World"');
  });
  it("operador inválido → throw", () => {
    expect(() => parseScimFilter('userName xyz "alice"')).toThrow();
  });
  it("missing value → throw", () => {
    expect(() => parseScimFilter('userName eq')).toThrow();
  });
  it("trailing token → throw", () => {
    expect(() => parseScimFilter('userName eq "a" extra')).toThrow();
  });
  it("paréntesis sin cerrar → throw", () => {
    expect(() => parseScimFilter('(userName eq "a"')).toThrow();
  });
  it("string sin terminar → throw", () => {
    expect(() => parseScimFilter('userName eq "alice')).toThrow();
  });
});

describe("evalScimFilter — comparisons", () => {
  const u = { userName: "alice", email: "alice@acme.com", active: true, loginCount: 7 };

  it("eq match", () => {
    expect(matchesScimFilter('userName eq "alice"', u)).toBe(true);
    expect(matchesScimFilter('userName eq "bob"', u)).toBe(false);
  });
  it("eq cross-type (string vs number coerce)", () => {
    expect(matchesScimFilter('loginCount eq 7', u)).toBe(true);
  });
  it("ne", () => {
    expect(matchesScimFilter('userName ne "bob"', u)).toBe(true);
  });
  it("sw case-insensitive", () => {
    expect(matchesScimFilter('userName sw "AL"', u)).toBe(true);
    expect(matchesScimFilter('userName sw "X"', u)).toBe(false);
  });
  it("ew", () => {
    expect(matchesScimFilter('email ew "@acme.com"', u)).toBe(true);
  });
  it("co", () => {
    expect(matchesScimFilter('email co "acme"', u)).toBe(true);
  });
  it("gt / ge / lt / le", () => {
    expect(matchesScimFilter('loginCount gt 5', u)).toBe(true);
    expect(matchesScimFilter('loginCount ge 7', u)).toBe(true);
    expect(matchesScimFilter('loginCount lt 10', u)).toBe(true);
    expect(matchesScimFilter('loginCount le 7', u)).toBe(true);
    expect(matchesScimFilter('loginCount gt 100', u)).toBe(false);
  });
  it("pr (presence) — true when defined non-null non-empty", () => {
    expect(matchesScimFilter('email pr', u)).toBe(true);
    expect(matchesScimFilter('email pr', { userName: "x" })).toBe(false);
    expect(matchesScimFilter('email pr', { email: null })).toBe(false);
    expect(matchesScimFilter('email pr', { email: "" })).toBe(false);
  });
});

describe("evalScimFilter — combinators end-to-end", () => {
  const u = { userName: "alice", email: "alice@acme.com", active: true };

  it("AND ambos true", () => {
    expect(matchesScimFilter('userName eq "alice" and active eq true', u)).toBe(true);
  });
  it("AND uno false → false", () => {
    expect(matchesScimFilter('userName eq "alice" and active eq false', u)).toBe(false);
  });
  it("OR cualquiera true", () => {
    expect(matchesScimFilter('userName eq "bob" or active eq true', u)).toBe(true);
  });
  it("OR ambos false → false", () => {
    expect(matchesScimFilter('userName eq "bob" or active eq false', u)).toBe(false);
  });
  it("NOT", () => {
    expect(matchesScimFilter('not (userName eq "bob")', u)).toBe(true);
    expect(matchesScimFilter('not (userName eq "alice")', u)).toBe(false);
  });
  it("paréntesis cambian agrupación", () => {
    // (a OR b) AND c — Okta-style: filtrar varios usuarios activos
    expect(matchesScimFilter(
      '(userName eq "alice" or userName eq "bob") and active eq true', u
    )).toBe(true);
  });
});

describe("evalScimFilter — dot-paths", () => {
  const u = { name: { givenName: "Alice", familyName: "Wonder" }, meta: { lastModified: "2026-04-01" } };

  it("nested attribute lookup", () => {
    expect(matchesScimFilter('name.givenName eq "Alice"', u)).toBe(true);
    expect(matchesScimFilter('name.familyName sw "Won"', u)).toBe(true);
  });
  it("missing nested → false en eq", () => {
    expect(matchesScimFilter('name.middle eq "X"', u)).toBe(false);
  });
});

describe("matchesScimFilter — defensiva", () => {
  it("filter null/empty → match-all (true)", () => {
    expect(matchesScimFilter(null, {})).toBe(true);
    expect(matchesScimFilter("", {})).toBe(true);
    expect(matchesScimFilter("   ", {})).toBe(true);
  });
  it("filter inválido → false (no throw)", () => {
    expect(matchesScimFilter('xxx broken', { x: 1 })).toBe(false);
  });
});
