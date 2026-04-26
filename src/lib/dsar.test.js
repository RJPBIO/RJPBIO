import { describe, it, expect } from "vitest";
import {
  isValidKind, isValidStatus, isAutoResolveKind,
  validateDsarRequest, validateResolve,
  canTransition, computeExpiry, isExpired, daysUntilExpiry,
  statusLabel, kindLabel, countByStatus,
  DSAR_KINDS, DSAR_STATUSES, DSAR_AUTO_RESOLVE_KINDS,
  DSAR_DEFAULT_EXPIRY_DAYS, DSAR_REASON_MAX,
} from "./dsar";

describe("isValidKind / isValidStatus / isAutoResolveKind", () => {
  it("kinds válidos", () => {
    expect(isValidKind("ACCESS")).toBe(true);
    expect(isValidKind("PORTABILITY")).toBe(true);
    expect(isValidKind("ERASURE")).toBe(true);
  });
  it("kinds inválidos", () => {
    expect(isValidKind("RECTIFICATION")).toBe(false); // no implementado
    expect(isValidKind("access")).toBe(false); // case sensitive
    expect(isValidKind(null)).toBe(false);
    expect(isValidKind(42)).toBe(false);
  });
  it("statuses válidos", () => {
    for (const s of DSAR_STATUSES) expect(isValidStatus(s)).toBe(true);
    expect(isValidStatus("UNKNOWN")).toBe(false);
  });
  it("auto-resolve solo ACCESS y PORTABILITY", () => {
    expect(isAutoResolveKind("ACCESS")).toBe(true);
    expect(isAutoResolveKind("PORTABILITY")).toBe(true);
    expect(isAutoResolveKind("ERASURE")).toBe(false);
    expect(DSAR_AUTO_RESOLVE_KINDS).toEqual(["ACCESS", "PORTABILITY"]);
  });
});

describe("validateDsarRequest", () => {
  it("válido sin reason", () => {
    expect(validateDsarRequest({ kind: "ACCESS" })).toEqual({
      ok: true, value: { kind: "ACCESS" },
    });
  });
  it("válido con reason", () => {
    const r = validateDsarRequest({ kind: "ERASURE", reason: "  Cierre laboral  " });
    expect(r.ok).toBe(true);
    expect(r.value.reason).toBe("Cierre laboral");
  });
  it("non-object → error", () => {
    expect(validateDsarRequest(null).ok).toBe(false);
    expect(validateDsarRequest("nope").ok).toBe(false);
  });
  it("kind inválido → error", () => {
    const r = validateDsarRequest({ kind: "WUT" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "kind", error: "invalid_kind" });
  });
  it("kind missing → error", () => {
    const r = validateDsarRequest({});
    expect(r.ok).toBe(false);
    expect(r.errors[0].field).toBe("kind");
  });
  it("reason too long → error", () => {
    const r = validateDsarRequest({ kind: "ACCESS", reason: "x".repeat(DSAR_REASON_MAX + 1) });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "reason", error: "too_long" });
  });
  it("reason non-string → error", () => {
    const r = validateDsarRequest({ kind: "ACCESS", reason: 42 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "reason", error: "not_string" });
  });
  it("reason vacío/null → omitido (no error)", () => {
    expect(validateDsarRequest({ kind: "ACCESS", reason: "" }).value.reason).toBeUndefined();
    expect(validateDsarRequest({ kind: "ACCESS", reason: null }).value.reason).toBeUndefined();
  });
});

describe("validateResolve", () => {
  it("APPROVED válido", () => {
    expect(validateResolve({ status: "APPROVED" })).toEqual({
      ok: true, value: { status: "APPROVED" },
    });
  });
  it("REJECTED con notes", () => {
    const r = validateResolve({ status: "REJECTED", notes: "Justificación legal" });
    expect(r.ok).toBe(true);
    expect(r.value.notes).toBe("Justificación legal");
  });
  it("status PENDING → not_resolvable (admin no puede 'resolver' a PENDING)", () => {
    const r = validateResolve({ status: "PENDING" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "status", error: "not_resolvable" });
  });
  it("status EXPIRED → not_resolvable (manejado por sweeper, no admin)", () => {
    const r = validateResolve({ status: "EXPIRED" });
    expect(r.ok).toBe(false);
  });
  it("status inválido → invalid_status", () => {
    const r = validateResolve({ status: "WUT" });
    expect(r.ok).toBe(false);
    expect(r.errors[0].error).toBe("invalid_status");
  });
  it("notes too long → error", () => {
    const r = validateResolve({ status: "APPROVED", notes: "x".repeat(DSAR_REASON_MAX + 1) });
    expect(r.ok).toBe(false);
  });
  it("non-object → error", () => {
    expect(validateResolve(null).ok).toBe(false);
  });
});

describe("canTransition", () => {
  it("PENDING → APPROVED", () => expect(canTransition("PENDING", "APPROVED")).toBe(true));
  it("PENDING → REJECTED", () => expect(canTransition("PENDING", "REJECTED")).toBe(true));
  it("PENDING → EXPIRED", () => expect(canTransition("PENDING", "EXPIRED")).toBe(true));
  it("PENDING → COMPLETED (auto-resolve flow)", () => expect(canTransition("PENDING", "COMPLETED")).toBe(true));
  it("APPROVED → COMPLETED", () => expect(canTransition("APPROVED", "COMPLETED")).toBe(true));
  it("REJECTED es terminal", () => {
    for (const s of DSAR_STATUSES) expect(canTransition("REJECTED", s)).toBe(false);
  });
  it("COMPLETED es terminal", () => {
    for (const s of DSAR_STATUSES) expect(canTransition("COMPLETED", s)).toBe(false);
  });
  it("EXPIRED es terminal", () => {
    for (const s of DSAR_STATUSES) expect(canTransition("EXPIRED", s)).toBe(false);
  });
  it("status inválidos → false", () => {
    expect(canTransition("WUT", "PENDING")).toBe(false);
    expect(canTransition("PENDING", "WUT")).toBe(false);
  });
  it("APPROVED no puede ir back a PENDING", () => {
    expect(canTransition("APPROVED", "PENDING")).toBe(false);
  });
});

describe("computeExpiry", () => {
  it("default 30 días", () => {
    const now = new Date("2026-04-25T00:00:00Z");
    const exp = computeExpiry(undefined, now);
    expect(exp.toISOString()).toBe("2026-05-25T00:00:00.000Z");
  });
  it("custom days", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const exp = computeExpiry(7, now);
    expect(exp.toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });
  it("days inválido → default", () => {
    const now = new Date("2026-01-01");
    const exp = computeExpiry(-1, now);
    expect(exp.getTime() - now.getTime()).toBe(DSAR_DEFAULT_EXPIRY_DAYS * 86400_000);
  });
});

describe("isExpired / daysUntilExpiry", () => {
  const now = new Date("2026-04-25T12:00:00Z");

  it("PENDING con expiresAt en pasado → expired", () => {
    expect(isExpired({ status: "PENDING", expiresAt: "2026-04-24T12:00:00Z" }, now)).toBe(true);
  });
  it("PENDING con expiresAt en futuro → not expired", () => {
    expect(isExpired({ status: "PENDING", expiresAt: "2026-05-01T00:00:00Z" }, now)).toBe(false);
  });
  it("non-PENDING → false (terminal states no expiran)", () => {
    expect(isExpired({ status: "COMPLETED", expiresAt: "2026-01-01" }, now)).toBe(false);
    expect(isExpired({ status: "APPROVED", expiresAt: "2026-01-01" }, now)).toBe(false);
  });
  it("daysUntilExpiry positivo si futuro, negativo si pasado", () => {
    expect(daysUntilExpiry({ expiresAt: "2026-05-01T00:00:00Z" }, now)).toBeGreaterThan(0);
    expect(daysUntilExpiry({ expiresAt: "2026-04-24T00:00:00Z" }, now)).toBeLessThanOrEqual(0);
  });
  it("sin expiresAt → Infinity", () => {
    expect(daysUntilExpiry({}, now)).toBe(Infinity);
  });
});

describe("statusLabel / kindLabel", () => {
  it("statusLabel es", () => {
    expect(statusLabel("PENDING")).toBe("Pendiente");
    expect(statusLabel("COMPLETED")).toBe("Completada");
  });
  it("statusLabel en", () => {
    expect(statusLabel("PENDING", "en")).toBe("Pending");
    expect(statusLabel("REJECTED", "en")).toBe("Rejected");
  });
  it("statusLabel desconocido → mismo string", () => {
    expect(statusLabel("WUT")).toBe("WUT");
  });
  it("kindLabel es / en", () => {
    expect(kindLabel("ACCESS")).toBe("Acceso a mis datos (Art. 15)");
    expect(kindLabel("ERASURE", "en")).toBe("Right to erasure (Art. 17)");
  });
});

describe("countByStatus", () => {
  it("cuenta correctamente", () => {
    const rows = [
      { status: "PENDING" }, { status: "PENDING" },
      { status: "COMPLETED" }, { status: "REJECTED" },
    ];
    const c = countByStatus(rows);
    expect(c.PENDING).toBe(2);
    expect(c.COMPLETED).toBe(1);
    expect(c.REJECTED).toBe(1);
    expect(c.APPROVED).toBe(0);
  });
  it("rows null/undefined → todos en 0", () => {
    const c = countByStatus(null);
    for (const s of DSAR_STATUSES) expect(c[s]).toBe(0);
  });
  it("status desconocido se ignora", () => {
    const c = countByStatus([{ status: "WUT" }, { status: "PENDING" }]);
    expect(c.PENDING).toBe(1);
  });
});
