import { describe, it, expect } from "vitest";
import {
  buildTapUrl, buildSignedTapUrl, verifyTapParams, generateSigningKey, hmacShort, SIG_TTL_SEC,
} from "./stationSig.js";

describe("generateSigningKey", () => {
  it("produce claves >= 40 chars url-safe", () => {
    const k = generateSigningKey();
    expect(k.length).toBeGreaterThanOrEqual(40);
    expect(k).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("no colisiona en 100 generaciones", () => {
    const set = new Set();
    for (let i = 0; i < 100; i++) set.add(generateSigningKey());
    expect(set.size).toBe(100);
  });
});

describe("hmacShort", () => {
  it("es determinista para misma clave+msg", () => {
    const k = "abc";
    expect(hmacShort(k, "x|1|y")).toBe(hmacShort(k, "x|1|y"));
  });
  it("cambia con clave distinta", () => {
    expect(hmacShort("a", "msg")).not.toBe(hmacShort("b", "msg"));
  });
  it("cambia con mensaje distinto", () => {
    expect(hmacShort("k", "a")).not.toBe(hmacShort("k", "b"));
  });
  it("mide 32 chars exactos", () => {
    expect(hmacShort("k", "any message here").length).toBe(32);
  });
});

describe("buildTapUrl (QR estático)", () => {
  it("URL solo contiene stationId — sin ts/n/sig", () => {
    const url = buildTapUrl({ origin: "https://bio.test", stationId: "stn_abc" });
    const p = new URL(url);
    expect(p.pathname).toBe("/q");
    expect(p.searchParams.get("s")).toBe("stn_abc");
    expect(p.searchParams.get("t")).toBe(null);
    expect(p.searchParams.get("n")).toBe(null);
    expect(p.searchParams.get("sig")).toBe(null);
  });
  it("acepta origin con o sin trailing slash", () => {
    expect(buildTapUrl({ origin: "https://x.test",  stationId: "id" })).toBe("https://x.test/q?s=id");
    expect(buildTapUrl({ origin: "https://x.test/", stationId: "id" })).toBe("https://x.test/q?s=id");
  });
  it("lanza si falta stationId", () => {
    expect(() => buildTapUrl({ origin: "https://x", stationId: "" })).toThrow();
  });
});

describe("buildSignedTapUrl + verifyTapParams (URL firmada efímera)", () => {
  const key = generateSigningKey();
  const stationId = "stn_abc123";
  const origin = "https://bio.test";

  it("firma válida verifica ok", () => {
    const url = buildSignedTapUrl({ origin, stationId, signingKey: key });
    const p = new URL(url);
    expect(p.pathname).toBe("/q");
    const r = verifyTapParams({
      stationId,
      t: p.searchParams.get("t"),
      n: p.searchParams.get("n"),
      sig: p.searchParams.get("sig"),
      signingKey: key,
    });
    expect(r.ok).toBe(true);
  });

  it("clave distinta → bad_sig", () => {
    const url = buildSignedTapUrl({ origin, stationId, signingKey: key });
    const p = new URL(url);
    const r = verifyTapParams({
      stationId,
      t: p.searchParams.get("t"),
      n: p.searchParams.get("n"),
      sig: p.searchParams.get("sig"),
      signingKey: generateSigningKey(),
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("bad_sig");
  });

  it("expira pasado SIG_TTL_SEC", () => {
    const oldTs = Math.floor(Date.now() / 1000) - SIG_TTL_SEC - 5;
    const url = buildSignedTapUrl({ origin, stationId, signingKey: key, ts: oldTs });
    const p = new URL(url);
    const r = verifyTapParams({
      stationId,
      t: p.searchParams.get("t"),
      n: p.searchParams.get("n"),
      sig: p.searchParams.get("sig"),
      signingKey: key,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("expired");
  });

  it("parámetros faltantes → missing_params", () => {
    const r = verifyTapParams({ stationId: null, t: "1", n: "x", sig: "y", signingKey: key });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("missing_params");
  });

  it("ts no numérico → bad_ts", () => {
    const r = verifyTapParams({ stationId, t: "abc", n: "x", sig: "y", signingKey: key });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("bad_ts");
  });

  it("stationId manipulado → bad_sig (firma incluye id)", () => {
    const url = buildSignedTapUrl({ origin, stationId, signingKey: key });
    const p = new URL(url);
    const r = verifyTapParams({
      stationId: "stn_otro",
      t: p.searchParams.get("t"),
      n: p.searchParams.get("n"),
      sig: p.searchParams.get("sig"),
      signingKey: key,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("bad_sig");
  });

  it("nonce manipulado → bad_sig", () => {
    const url = buildSignedTapUrl({ origin, stationId, signingKey: key });
    const p = new URL(url);
    const r = verifyTapParams({
      stationId,
      t: p.searchParams.get("t"),
      n: "otronoonce",
      sig: p.searchParams.get("sig"),
      signingKey: key,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("bad_sig");
  });

  it("buildSignedTapUrl sin args requeridos lanza", () => {
    expect(() => buildSignedTapUrl({ origin: "https://x", stationId: "", signingKey: "k" })).toThrow();
    expect(() => buildSignedTapUrl({ origin: "https://x", stationId: "id", signingKey: "" })).toThrow();
  });
});
