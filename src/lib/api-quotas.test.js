import { describe, it, expect } from "vitest";
import {
  getRateLimitForPlan, isKeyExpired, isKeyActive, summarizeKey,
  formatLastUsed, validateExpiryDays, computeExpiresAt, describeQuota,
  QUOTAS_BY_PLAN, PLANS, API_KEY_EXPIRY_MIN_DAYS, API_KEY_EXPIRY_MAX_DAYS,
} from "./api-quotas";

describe("QUOTAS_BY_PLAN", () => {
  it("expone constantes para cada plan", () => {
    for (const p of PLANS) {
      expect(QUOTAS_BY_PLAN[p]).toBeDefined();
      expect(QUOTAS_BY_PLAN[p].perMinute).toBeGreaterThan(0);
      expect(QUOTAS_BY_PLAN[p].perDay).toBeGreaterThan(0);
    }
  });
  it("ENTERPRISE > GROWTH > STARTER > PRO > FREE en perMinute", () => {
    expect(QUOTAS_BY_PLAN.ENTERPRISE.perMinute).toBeGreaterThan(QUOTAS_BY_PLAN.GROWTH.perMinute);
    expect(QUOTAS_BY_PLAN.GROWTH.perMinute).toBeGreaterThan(QUOTAS_BY_PLAN.STARTER.perMinute);
    expect(QUOTAS_BY_PLAN.STARTER.perMinute).toBeGreaterThan(QUOTAS_BY_PLAN.PRO.perMinute);
    expect(QUOTAS_BY_PLAN.PRO.perMinute).toBeGreaterThan(QUOTAS_BY_PLAN.FREE.perMinute);
  });
});

describe("getRateLimitForPlan", () => {
  it("plan conocido", () => {
    expect(getRateLimitForPlan("ENTERPRISE")).toEqual(QUOTAS_BY_PLAN.ENTERPRISE);
  });
  it("plan unknown → fallback FREE", () => {
    expect(getRateLimitForPlan("WUT")).toEqual(QUOTAS_BY_PLAN.FREE);
    expect(getRateLimitForPlan(null)).toEqual(QUOTAS_BY_PLAN.FREE);
    expect(getRateLimitForPlan(undefined)).toEqual(QUOTAS_BY_PLAN.FREE);
  });
});

describe("isKeyExpired / isKeyActive", () => {
  const now = new Date("2026-04-25T12:00:00Z");

  it("sin expiresAt → no expirada", () => {
    expect(isKeyExpired({ expiresAt: null }, now)).toBe(false);
    expect(isKeyExpired({}, now)).toBe(false);
  });
  it("expiresAt en futuro → no expirada", () => {
    expect(isKeyExpired({ expiresAt: "2026-12-31T00:00:00Z" }, now)).toBe(false);
  });
  it("expiresAt en pasado → expirada", () => {
    expect(isKeyExpired({ expiresAt: "2026-04-24T12:00:00Z" }, now)).toBe(true);
  });
  it("boundary: expiresAt = now → expirada", () => {
    expect(isKeyExpired({ expiresAt: now }, now)).toBe(true);
  });

  it("active = no revoked + no expired", () => {
    expect(isKeyActive({ revokedAt: null, expiresAt: null }, now)).toBe(true);
    expect(isKeyActive({ revokedAt: null, expiresAt: "2026-12-31T00:00:00Z" }, now)).toBe(true);
  });
  it("revoked → not active", () => {
    expect(isKeyActive({ revokedAt: "2026-04-01" }, now)).toBe(false);
  });
  it("expired → not active", () => {
    expect(isKeyActive({ revokedAt: null, expiresAt: "2026-04-01T00:00:00Z" }, now)).toBe(false);
  });
  it("null/undefined key → false", () => {
    expect(isKeyActive(null)).toBe(false);
    expect(isKeyActive(undefined)).toBe(false);
  });
});

describe("summarizeKey", () => {
  const now = new Date("2026-04-25T12:00:00Z");

  it("revoked → tone danger", () => {
    const r = summarizeKey({ revokedAt: "2026-04-20" }, now);
    expect(r.status).toBe("revoked");
    expect(r.tone).toBe("danger");
    expect(r.detail).toContain("Revocada");
  });

  it("expired → tone warn", () => {
    const r = summarizeKey({ expiresAt: "2026-04-20T00:00:00Z" }, now);
    expect(r.status).toBe("expired");
    expect(r.tone).toBe("warn");
  });

  it("active con expiry futuro → success + days count", () => {
    const r = summarizeKey({ expiresAt: "2026-05-25T12:00:00Z" }, now);
    expect(r.status).toBe("active");
    expect(r.tone).toBe("success");
    expect(r.daysUntilExpiry).toBe(30);
    expect(r.detail).toContain("30 días");
  });

  it("active sin expiry → success + 'sin fecha'", () => {
    const r = summarizeKey({ expiresAt: null }, now);
    expect(r.status).toBe("active");
    expect(r.detail).toMatch(/sin fecha/i);
  });

  it("null key → unknown", () => {
    expect(summarizeKey(null).status).toBe("unknown");
    expect(summarizeKey(undefined).status).toBe("unknown");
  });
});

describe("formatLastUsed", () => {
  const now = new Date("2026-04-25T12:00:00Z");

  it("nunca → 'Nunca usada'", () => {
    expect(formatLastUsed(null, null, now).text).toBe("Nunca usada");
  });
  it("hace pocos minutos", () => {
    const at = new Date(now.getTime() - 5 * 60_000);
    expect(formatLastUsed(at, null, now).text).toBe("hace 5 min");
  });
  it("hace horas", () => {
    const at = new Date(now.getTime() - 3 * 3600_000);
    expect(formatLastUsed(at, null, now).text).toBe("hace 3 h");
  });
  it("hace días", () => {
    const at = new Date(now.getTime() - 5 * 86400_000);
    expect(formatLastUsed(at, null, now).text).toBe("hace 5 d");
  });
  it("incluye IP si existe", () => {
    const at = new Date(now.getTime() - 60_000);
    expect(formatLastUsed(at, "10.0.0.1", now).text).toBe("hace 1 min · 10.0.0.1");
  });
  it("ahora (<1 min)", () => {
    expect(formatLastUsed(new Date(now.getTime() - 30_000), null, now).text).toBe("ahora");
  });
});

describe("validateExpiryDays", () => {
  it("null/undefined/empty → ok con value null (sin expiry)", () => {
    expect(validateExpiryDays(null)).toEqual({ ok: true, value: null });
    expect(validateExpiryDays(undefined)).toEqual({ ok: true, value: null });
    expect(validateExpiryDays("")).toEqual({ ok: true, value: null });
  });
  it("entero válido en rango", () => {
    expect(validateExpiryDays(30)).toEqual({ ok: true, value: 30 });
    expect(validateExpiryDays(API_KEY_EXPIRY_MIN_DAYS)).toEqual({ ok: true, value: API_KEY_EXPIRY_MIN_DAYS });
    expect(validateExpiryDays(API_KEY_EXPIRY_MAX_DAYS)).toEqual({ ok: true, value: API_KEY_EXPIRY_MAX_DAYS });
  });
  it("string numérico → coerce", () => {
    expect(validateExpiryDays("90")).toEqual({ ok: true, value: 90 });
  });
  it("rechaza < min", () => {
    expect(validateExpiryDays(0).ok).toBe(false);
    expect(validateExpiryDays(0).error).toBe("too_small");
  });
  it("rechaza > max", () => {
    expect(validateExpiryDays(API_KEY_EXPIRY_MAX_DAYS + 1).error).toBe("too_large");
  });
  it("rechaza no-entero", () => {
    expect(validateExpiryDays(30.5).error).toBe("not_integer");
    expect(validateExpiryDays("abc").error).toBe("not_integer");
  });
});

describe("computeExpiresAt", () => {
  it("days null → null", () => {
    expect(computeExpiresAt(null)).toBe(null);
    expect(computeExpiresAt(undefined)).toBe(null);
  });
  it("days inválido → null", () => {
    expect(computeExpiresAt(0)).toBe(null);
    expect(computeExpiresAt(-5)).toBe(null);
    expect(computeExpiresAt(NaN)).toBe(null);
  });
  it("days válido → Date en futuro", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const exp = computeExpiresAt(30, now);
    expect(exp.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });
});

describe("describeQuota", () => {
  it("incluye plan + perMinute + perDay + text formateado", () => {
    const r = describeQuota("GROWTH");
    expect(r.plan).toBe("GROWTH");
    expect(r.perMinute).toBe(QUOTAS_BY_PLAN.GROWTH.perMinute);
    expect(r.text).toContain("req/min");
    expect(r.text).toContain("req/día");
  });
  it("plan unknown → FREE quota", () => {
    const r = describeQuota("WUT");
    expect(r.perMinute).toBe(QUOTAS_BY_PLAN.FREE.perMinute);
  });
});
