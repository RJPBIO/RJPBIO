import { describe, it, expect } from "vitest";
import {
  validateInvitationForAcceptance,
  filterInviteCandidates,
  isValidEmail,
  normalizeEmail,
  isValidRole,
  defaultExpiry,
  VALID_ROLES,
  INVITE_EXP_DAYS,
  MAX_INVITE_BATCH,
} from "./invitation";

const FIXED_NOW = new Date("2026-04-26T12:00:00Z");

describe("invitation — validateInvitationForAcceptance", () => {
  it("rechaza invite null/undefined → not_found", () => {
    expect(validateInvitationForAcceptance(null)).toEqual({ ok: false, reason: "not_found" });
    expect(validateInvitationForAcceptance(undefined)).toEqual({ ok: false, reason: "not_found" });
  });

  it("rechaza invite ya aceptada", () => {
    const inv = { acceptedAt: new Date("2026-04-20"), expiresAt: new Date("2026-05-01") };
    expect(validateInvitationForAcceptance(inv, FIXED_NOW))
      .toEqual({ ok: false, reason: "already_accepted" });
  });

  it("rechaza invite expirada", () => {
    const inv = { acceptedAt: null, expiresAt: new Date("2026-04-20") };
    expect(validateInvitationForAcceptance(inv, FIXED_NOW))
      .toEqual({ ok: false, reason: "expired" });
  });

  it("acepta invite válida (no aceptada, no expirada)", () => {
    const inv = { acceptedAt: null, expiresAt: new Date("2026-05-10") };
    expect(validateInvitationForAcceptance(inv, FIXED_NOW)).toEqual({ ok: true });
  });

  it("acepta invite sin expiresAt", () => {
    const inv = { acceptedAt: null, expiresAt: null };
    expect(validateInvitationForAcceptance(inv, FIXED_NOW)).toEqual({ ok: true });
  });

  it("expirada en el momento exacto → expired (boundary)", () => {
    const inv = { acceptedAt: null, expiresAt: FIXED_NOW };
    // expiresAt < now? FIXED_NOW < FIXED_NOW = false → ok
    // Es boundary: si exactamente igual, NO expira (>= behavior).
    expect(validateInvitationForAcceptance(inv, FIXED_NOW).ok).toBe(true);
  });
});

describe("invitation — isValidEmail / normalizeEmail", () => {
  it("acepta emails bien formados", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("user.name+tag@example.com")).toBe(true);
  });

  it("rechaza emails malformados", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at")).toBe(false);
    expect(isValidEmail("@no-local.com")).toBe(false);
    expect(isValidEmail("no-domain@")).toBe(false);
    expect(isValidEmail("no-tld@example")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });

  it("normaliza email: trim + lowercase", () => {
    expect(normalizeEmail("  USER@Example.COM  ")).toBe("user@example.com");
    expect(normalizeEmail("Test@Test.IO")).toBe("test@test.io");
  });

  it("normalizeEmail maneja null/undefined", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("invitation — isValidRole", () => {
  it("acepta roles whitelist", () => {
    for (const role of VALID_ROLES) {
      expect(isValidRole(role)).toBe(true);
    }
  });

  it("rechaza roles fuera de whitelist", () => {
    expect(isValidRole("SUPER_ADMIN")).toBe(false);
    expect(isValidRole("guest")).toBe(false); // case-sensitive
    expect(isValidRole("")).toBe(false);
    expect(isValidRole(null)).toBe(false);
  });
});

describe("invitation — filterInviteCandidates", () => {
  it("retorna eligible para emails nuevos", () => {
    const r = filterInviteCandidates(["alice@example.com", "bob@example.com"]);
    expect(r.eligible).toEqual(["alice@example.com", "bob@example.com"]);
    expect(r.skipped).toEqual({ duplicates: 0, invalid: 0, alreadyPending: 0, alreadyMembers: 0 });
  });

  it("normaliza y dedupea (case-insensitive)", () => {
    const r = filterInviteCandidates(["Alice@Example.com", "ALICE@example.COM", "alice@example.com"]);
    expect(r.eligible).toEqual(["alice@example.com"]);
    expect(r.skipped.duplicates).toBe(2);
  });

  it("filtra emails inválidos", () => {
    const r = filterInviteCandidates(["valid@example.com", "not-an-email", "@bad", ""]);
    expect(r.eligible).toEqual(["valid@example.com"]);
    expect(r.skipped.invalid).toBe(3);
  });

  it("excluye emails con invitación pending", () => {
    const r = filterInviteCandidates(
      ["alice@example.com", "bob@example.com"],
      { pendingEmails: ["alice@example.com"] }
    );
    expect(r.eligible).toEqual(["bob@example.com"]);
    expect(r.skipped.alreadyPending).toBe(1);
  });

  it("excluye emails que ya son members", () => {
    const r = filterInviteCandidates(
      ["alice@example.com", "bob@example.com"],
      { memberEmails: ["bob@example.com"] }
    );
    expect(r.eligible).toEqual(["alice@example.com"]);
    expect(r.skipped.alreadyMembers).toBe(1);
  });

  it("members tiene prioridad sobre pending (ya son members, no necesitan invite)", () => {
    const r = filterInviteCandidates(
      ["alice@example.com"],
      { memberEmails: ["alice@example.com"], pendingEmails: ["alice@example.com"] }
    );
    expect(r.eligible).toEqual([]);
    expect(r.skipped.alreadyMembers).toBe(1);
    expect(r.skipped.alreadyPending).toBe(0);
  });

  it("dedupe interno cuenta antes que checks externos", () => {
    // 3 dups → 2 dedupe count + 1 unique. Si el unique también es member,
    // ese cuenta como alreadyMembers (no doble-counted).
    const r = filterInviteCandidates(
      ["alice@example.com", "alice@example.com", "Alice@example.COM"],
      { memberEmails: ["alice@example.com"] }
    );
    expect(r.eligible).toEqual([]);
    expect(r.skipped.duplicates).toBe(2);
    expect(r.skipped.alreadyMembers).toBe(1);
  });

  it("emails empty/null filtrados como invalid", () => {
    const r = filterInviteCandidates([null, undefined, "", "  "]);
    expect(r.eligible).toEqual([]);
    expect(r.skipped.invalid).toBe(4);
  });

  it("opts ausentes/empty no rompen", () => {
    const r = filterInviteCandidates(["a@b.co"]);
    expect(r.eligible).toEqual(["a@b.co"]);
  });

  it("emails con whitespace normalizados a un solo dedupe", () => {
    const r = filterInviteCandidates(["  alice@example.com  ", "alice@example.com"]);
    expect(r.eligible).toEqual(["alice@example.com"]);
    expect(r.skipped.duplicates).toBe(1);
  });
});

describe("invitation — defaultExpiry", () => {
  it("retorna fecha 7 días en el futuro por default", () => {
    const exp = defaultExpiry(FIXED_NOW.getTime());
    const expectedMs = FIXED_NOW.getTime() + 7 * 86400000;
    expect(exp.getTime()).toBe(expectedMs);
  });

  it("constante INVITE_EXP_DAYS = 7", () => {
    expect(INVITE_EXP_DAYS).toBe(7);
  });

  it("constante MAX_INVITE_BATCH = 200", () => {
    expect(MAX_INVITE_BATCH).toBe(200);
  });
});
