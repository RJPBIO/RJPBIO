import { describe, it, expect } from "vitest";
import {
  validateOverlapDays, computeOverlapExpiry,
  isOverlapActive, daysUntilOverlapExpires, summarizeRotation,
  buildSignatureHeader, shouldCleanupOverlap,
  OVERLAP_MIN_DAYS, OVERLAP_MAX_DAYS, OVERLAP_DEFAULT_DAYS,
} from "./webhook-rotation";

describe("validateOverlapDays", () => {
  it("null/undefined/empty → default", () => {
    expect(validateOverlapDays(null)).toEqual({ ok: true, value: OVERLAP_DEFAULT_DAYS });
    expect(validateOverlapDays(undefined)).toEqual({ ok: true, value: OVERLAP_DEFAULT_DAYS });
    expect(validateOverlapDays("")).toEqual({ ok: true, value: OVERLAP_DEFAULT_DAYS });
  });
  it("entero válido", () => {
    expect(validateOverlapDays(7)).toEqual({ ok: true, value: 7 });
    expect(validateOverlapDays(OVERLAP_MIN_DAYS)).toEqual({ ok: true, value: OVERLAP_MIN_DAYS });
    expect(validateOverlapDays(OVERLAP_MAX_DAYS)).toEqual({ ok: true, value: OVERLAP_MAX_DAYS });
  });
  it("string numérico → coerce", () => {
    expect(validateOverlapDays("14")).toEqual({ ok: true, value: 14 });
  });
  it("rechaza < min", () => {
    expect(validateOverlapDays(0).error).toBe("too_small");
  });
  it("rechaza > max", () => {
    expect(validateOverlapDays(OVERLAP_MAX_DAYS + 1).error).toBe("too_large");
  });
  it("rechaza no-entero", () => {
    expect(validateOverlapDays(7.5).error).toBe("not_integer");
    expect(validateOverlapDays("abc").error).toBe("not_integer");
  });
});

describe("computeOverlapExpiry", () => {
  it("days válido → futuro", () => {
    const now = new Date("2026-04-25T00:00:00Z");
    const exp = computeOverlapExpiry(7, now);
    expect(exp.toISOString()).toBe("2026-05-02T00:00:00.000Z");
  });
  it("days inválido → default", () => {
    const now = new Date("2026-04-25T00:00:00Z");
    expect(computeOverlapExpiry(0, now).toISOString()).toBe("2026-05-02T00:00:00.000Z");
    expect(computeOverlapExpiry(NaN, now).toISOString()).toBe("2026-05-02T00:00:00.000Z");
  });
});

describe("isOverlapActive", () => {
  const now = new Date("2026-04-25T12:00:00Z");

  it("sin prevSecret → false", () => {
    expect(isOverlapActive({ prevSecretExpiresAt: "2026-05-01" }, now)).toBe(false);
    expect(isOverlapActive({}, now)).toBe(false);
  });
  it("sin expiry → false", () => {
    expect(isOverlapActive({ prevSecret: "x" }, now)).toBe(false);
  });
  it("prevSecret + expiry futuro → true", () => {
    expect(isOverlapActive({
      prevSecret: "x", prevSecretExpiresAt: "2026-05-01T00:00:00Z",
    }, now)).toBe(true);
  });
  it("prevSecret + expiry pasado → false", () => {
    expect(isOverlapActive({
      prevSecret: "x", prevSecretExpiresAt: "2026-04-20T00:00:00Z",
    }, now)).toBe(false);
  });
  it("null webhook → false", () => {
    expect(isOverlapActive(null)).toBe(false);
    expect(isOverlapActive(undefined)).toBe(false);
  });
});

describe("daysUntilOverlapExpires", () => {
  const now = new Date("2026-04-25T12:00:00Z");

  it("calcula ceil de días", () => {
    // 5 días + 12h = ceil 6 días
    expect(daysUntilOverlapExpires({ prevSecretExpiresAt: "2026-05-01T00:00:00Z" }, now)).toBe(6);
  });
  it("ya expirado → 0 (no negativo)", () => {
    expect(daysUntilOverlapExpires({ prevSecretExpiresAt: "2026-04-20T00:00:00Z" }, now)).toBe(0);
  });
  it("sin expiry → Infinity", () => {
    expect(daysUntilOverlapExpires({}, now)).toBe(Infinity);
  });
});

describe("summarizeRotation", () => {
  const now = new Date("2026-04-25T12:00:00Z");

  it("overlap activo → status rotating, tone warn", () => {
    const r = summarizeRotation({
      prevSecret: "x",
      prevSecretExpiresAt: "2026-05-01T00:00:00Z",
      secretRotatedAt: "2026-04-23T00:00:00Z",
    }, now);
    expect(r.status).toBe("rotating");
    expect(r.tone).toBe("warn");
    expect(r.daysLeft).toBe(6);
  });

  it("rotado pero overlap expiró → status rotated, tone success", () => {
    const r = summarizeRotation({
      secretRotatedAt: "2026-04-01T00:00:00Z",
    }, now);
    expect(r.status).toBe("rotated");
    expect(r.tone).toBe("success");
  });

  it("nunca rotado → status original", () => {
    const r = summarizeRotation({}, now);
    expect(r.status).toBe("original");
    expect(r.tone).toBe("soft");
  });

  it("null webhook → unknown", () => {
    expect(summarizeRotation(null).status).toBe("unknown");
  });
});

describe("buildSignatureHeader", () => {
  it("una firma → solo esa", () => {
    expect(buildSignatureHeader(["v1,abc"])).toBe("v1,abc");
  });
  it("dos firmas → space-separated (Standard Webhooks v1)", () => {
    expect(buildSignatureHeader(["v1,abc", "v1,def"])).toBe("v1,abc v1,def");
  });
  it("dedup", () => {
    expect(buildSignatureHeader(["v1,abc", "v1,abc"])).toBe("v1,abc");
  });
  it("filtra empty/null/no-string", () => {
    expect(buildSignatureHeader(["v1,abc", "", null, "v1,def", undefined, 42])).toBe("v1,abc v1,def");
  });
  it("array vacío → ''", () => {
    expect(buildSignatureHeader([])).toBe("");
  });
  it("non-array → ''", () => {
    expect(buildSignatureHeader(null)).toBe("");
    expect(buildSignatureHeader("nope")).toBe("");
  });
});

describe("shouldCleanupOverlap", () => {
  const now = new Date("2026-04-25T12:00:00Z");

  it("sin prevSecret → false (nada que limpiar)", () => {
    expect(shouldCleanupOverlap({ prevSecret: null }, now)).toBe(false);
    expect(shouldCleanupOverlap({}, now)).toBe(false);
  });
  it("prevSecret + expiry futuro → false (overlap activo)", () => {
    expect(shouldCleanupOverlap({
      prevSecret: "x", prevSecretExpiresAt: "2026-05-01T00:00:00Z",
    }, now)).toBe(false);
  });
  it("prevSecret + expiry pasado → true (cleanup)", () => {
    expect(shouldCleanupOverlap({
      prevSecret: "x", prevSecretExpiresAt: "2026-04-20T00:00:00Z",
    }, now)).toBe(true);
  });
  it("prevSecret sin expiry (datos inconsistentes) → cleanup safe", () => {
    expect(shouldCleanupOverlap({ prevSecret: "x" }, now)).toBe(true);
  });
  it("null webhook → false", () => {
    expect(shouldCleanupOverlap(null)).toBe(false);
  });
});
