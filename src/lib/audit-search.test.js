import { describe, it, expect } from "vitest";
import {
  parseSearchQuery, matchesQuery, rowMatchesQueryString,
  highlightMatches, extractHighlightTerms,
  SEARCH_OPERATORS,
} from "./audit-search";

describe("parseSearchQuery", () => {
  it("vacío → isEmpty + sin operadores", () => {
    expect(parseSearchQuery("").isEmpty).toBe(true);
    expect(parseSearchQuery("   ").isEmpty).toBe(true);
    expect(parseSearchQuery(null).isEmpty).toBe(true);
  });

  it("plain text", () => {
    const r = parseSearchQuery("hello world");
    expect(r.text).toBe("hello world");
    expect(r.operators).toEqual({});
    expect(r.isEmpty).toBe(false);
  });

  it("solo operadores", () => {
    const r = parseSearchQuery("actor:alice action:auth.signin");
    expect(r.operators.actor).toBe("alice");
    expect(r.operators.action).toBe("auth.signin");
    expect(r.text).toBe("");
  });

  it("mezcla operadores + plain", () => {
    const r = parseSearchQuery("actor:alice hello action:billing.* world");
    expect(r.operators.actor).toBe("alice");
    expect(r.operators.action).toBe("billing.*");
    expect(r.text).toBe("hello world");
  });

  it("operador con value vacío → token plain", () => {
    const r = parseSearchQuery("action:");
    expect(r.operators.action).toBeUndefined();
    expect(r.text).toBe("action:");
  });

  it("operador desconocido → trata como plain", () => {
    const r = parseSearchQuery("foobar:baz hello");
    expect(r.operators.foobar).toBeUndefined();
    expect(r.text).toContain("foobar:baz");
  });

  it("orgid → orgId canonical (case)", () => {
    const r = parseSearchQuery("orgid:org_x");
    expect(r.operators.orgId).toBe("org_x");
    expect(r.operators.orgid).toBeUndefined();
  });

  it("expone SEARCH_OPERATORS", () => {
    expect(SEARCH_OPERATORS).toContain("actor");
    expect(SEARCH_OPERATORS).toContain("action");
    expect(SEARCH_OPERATORS).toContain("payload");
    expect(SEARCH_OPERATORS).toContain("orgid");
  });
});

describe("matchesQuery — operadores", () => {
  const row = {
    action: "auth.signin",
    actorEmail: "alice@acme.com",
    actorId: "u_alice",
    target: "u_xyz",
    ip: "10.0.0.1",
    orgId: "org_x",
    payload: { reason: "magic-link", domain: "acme.com" },
  };

  it("query vacío → match", () => {
    expect(matchesQuery(row, parseSearchQuery(""))).toBe(true);
  });

  it("action exact match", () => {
    expect(rowMatchesQueryString(row, "action:auth.signin")).toBe(true);
    expect(rowMatchesQueryString(row, "action:billing.x")).toBe(false);
  });

  it("action wildcard prefix", () => {
    expect(rowMatchesQueryString(row, "action:auth.*")).toBe(true);
    expect(rowMatchesQueryString(row, "action:billing.*")).toBe(false);
  });

  it("actor match en email O id", () => {
    expect(rowMatchesQueryString(row, "actor:alice")).toBe(true);
    expect(rowMatchesQueryString(row, "actor:u_alice")).toBe(true);
    expect(rowMatchesQueryString(row, "actor:bob")).toBe(false);
  });

  it("target", () => {
    expect(rowMatchesQueryString(row, "target:u_xyz")).toBe(true);
    expect(rowMatchesQueryString(row, "target:u_other")).toBe(false);
  });

  it("ip exact", () => {
    expect(rowMatchesQueryString(row, "ip:10.0.0.1")).toBe(true);
    expect(rowMatchesQueryString(row, "ip:10.0.0.2")).toBe(false);
  });

  it("orgId exact", () => {
    expect(rowMatchesQueryString(row, "orgid:org_x")).toBe(true);
    expect(rowMatchesQueryString(row, "orgid:org_y")).toBe(false);
  });

  it("payload search dentro de JSON serializado", () => {
    expect(rowMatchesQueryString(row, "payload:magic-link")).toBe(true);
    expect(rowMatchesQueryString(row, "payload:domain.com")).toBe(false);
    expect(rowMatchesQueryString(row, "payload:acme.com")).toBe(true);
  });

  it("AND de múltiples operadores", () => {
    expect(rowMatchesQueryString(row, "actor:alice action:auth.*")).toBe(true);
    expect(rowMatchesQueryString(row, "actor:alice action:billing.*")).toBe(false);
  });
});

describe("matchesQuery — plain text fallback", () => {
  const row = {
    action: "billing.checkout.start",
    actorEmail: "bob@acme.com",
    target: "sub_123",
    payload: { amount: 9999, currency: "USD" },
  };

  it("substring across todos los campos", () => {
    expect(rowMatchesQueryString(row, "checkout")).toBe(true);
    expect(rowMatchesQueryString(row, "bob")).toBe(true);
  });

  it("matches en payload JSON", () => {
    expect(rowMatchesQueryString(row, "9999")).toBe(true);
    expect(rowMatchesQueryString(row, "USD")).toBe(true);
  });

  it("no match → false", () => {
    expect(rowMatchesQueryString(row, "alice")).toBe(false);
    expect(rowMatchesQueryString(row, "EUR")).toBe(false);
  });

  it("case insensitive", () => {
    expect(rowMatchesQueryString(row, "BOB")).toBe(true);
    expect(rowMatchesQueryString(row, "BILLING.CHECKOUT")).toBe(true);
  });
});

describe("matchesQuery — combinación operadores + plain", () => {
  const row = {
    action: "billing.checkout.start",
    actorEmail: "alice@acme.com",
    payload: { plan: "GROWTH" },
  };

  it("ambos deben matchear", () => {
    expect(rowMatchesQueryString(row, "actor:alice GROWTH")).toBe(true);
    expect(rowMatchesQueryString(row, "actor:alice STARTER")).toBe(false);
    expect(rowMatchesQueryString(row, "actor:bob GROWTH")).toBe(false);
  });
});

describe("matchesQuery — defensiva", () => {
  it("row null → false (excepto query vacío)", () => {
    expect(matchesQuery(null, parseSearchQuery("alice"))).toBe(false);
  });

  it("query null → match", () => {
    expect(matchesQuery({}, null)).toBe(true);
  });
});

describe("highlightMatches", () => {
  it("split por terms y mark match=true", () => {
    const r = highlightMatches("hello world", ["world"]);
    expect(r.length).toBeGreaterThanOrEqual(2);
    const matched = r.filter((p) => p.match);
    expect(matched.length).toBe(1);
    expect(matched[0].text.toLowerCase()).toBe("world");
  });

  it("case insensitive", () => {
    const r = highlightMatches("Hello World", ["world"]);
    expect(r.some((p) => p.match)).toBe(true);
  });

  it("multiple terms", () => {
    const r = highlightMatches("foo bar baz", ["foo", "baz"]);
    const matched = r.filter((p) => p.match);
    expect(matched.length).toBe(2);
  });

  it("regex chars escapados (no inyección)", () => {
    const r = highlightMatches("a.b.c hello", [".*"]);
    // ".*" debe matchear literalmente (no como wildcard regex)
    expect(r.every((p) => !p.match || p.text === ".*")).toBe(true);
  });

  it("term vacío → no highlight", () => {
    const r = highlightMatches("hello", [""]);
    expect(r.every((p) => !p.match)).toBe(true);
  });

  it("texto vacío", () => {
    expect(highlightMatches("", ["x"])).toEqual([{ text: "", match: false }]);
  });

  it("non-string input", () => {
    expect(highlightMatches(null, ["x"])).toEqual([{ text: "", match: false }]);
  });
});

describe("extractHighlightTerms", () => {
  it("plain text + operadores values", () => {
    const parsed = parseSearchQuery("actor:alice hello action:auth.signin");
    const terms = extractHighlightTerms(parsed);
    expect(terms).toContain("hello");
    expect(terms).toContain("alice");
    expect(terms).toContain("auth.signin");
  });

  it("action wildcard → strip .*", () => {
    const parsed = parseSearchQuery("action:billing.*");
    const terms = extractHighlightTerms(parsed);
    expect(terms).toContain("billing");
  });

  it("vacío → []", () => {
    expect(extractHighlightTerms(parseSearchQuery(""))).toEqual([]);
    expect(extractHighlightTerms(null)).toEqual([]);
  });
});
