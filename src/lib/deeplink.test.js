import { describe, it, expect } from "vitest";
import { parseDeepLink, verifyDeepLink } from "./deeplink";

function sp(obj) { return new URLSearchParams(obj); }

describe("deeplink.parse", () => {
  it("acepta params válidos", () => {
    const l = parseDeepLink(sp({ c: "ACME", t: "entrada", e: "E123" }));
    expect(l).toEqual(expect.objectContaining({ company: "ACME", type: "entrada", employee: "E123" }));
  });

  it("rechaza chars inseguros", () => {
    expect(parseDeepLink(sp({ c: "<script>" }))).toBeNull();
  });

  it("rechaza type no permitido", () => {
    expect(parseDeepLink(sp({ t: "hacked" }))).toBeNull();
  });

  it("trunca longitudes exageradas", () => {
    const big = "A".repeat(500);
    const l = parseDeepLink(sp({ c: big }));
    expect(l).toBeNull();
  });
});

describe("deeplink.verify", () => {
  it("permite sin secret", async () => {
    const l = parseDeepLink(sp({ c: "ACME", t: "entrada" }));
    const r = await verifyDeepLink(l, null);
    expect(r.ok).toBe(true);
  });

  it("rechaza firma inválida cuando hay secret", async () => {
    const l = parseDeepLink(sp({ c: "ACME", t: "entrada", sig: "bad", ts: String(Date.now()) }));
    const r = await verifyDeepLink(l, "supersecret");
    expect(r.ok).toBe(false);
  });

  it("rechaza expirado", async () => {
    const l = parseDeepLink(sp({ c: "ACME", t: "entrada", sig: "aaa", ts: "1" }));
    const r = await verifyDeepLink(l, "supersecret");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("expired");
  });
});
