import { describe, it, expect } from "vitest";
import {
  generateVerifyToken, isValidToken,
  verifyHostname, txtMatchesToken, getVerifyInstructions,
  summarizeVerificationState,
  VERIFY_TOKEN_PREFIX, VERIFY_TOKEN_HEX_LENGTH, VERIFY_SUBDOMAIN_PREFIX,
} from "./domain-verify";

describe("generateVerifyToken", () => {
  it("retorna string con prefix correcto", () => {
    const t = generateVerifyToken();
    expect(t.startsWith(VERIFY_TOKEN_PREFIX)).toBe(true);
  });
  it("hex part length match constante", () => {
    const t = generateVerifyToken();
    const hex = t.slice(VERIFY_TOKEN_PREFIX.length);
    expect(hex.length).toBe(VERIFY_TOKEN_HEX_LENGTH);
    expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
  });
  it("dos calls producen tokens distintos", () => {
    expect(generateVerifyToken()).not.toBe(generateVerifyToken());
  });
});

describe("isValidToken", () => {
  it("token recién generado → true", () => {
    expect(isValidToken(generateVerifyToken())).toBe(true);
  });
  it("token con prefix correcto + hex → true", () => {
    expect(isValidToken(`${VERIFY_TOKEN_PREFIX}0123456789abcdef01234567`)).toBe(true);
  });
  it("token con prefix erróneo → false", () => {
    expect(isValidToken(`other-prefix-0123456789abcdef01234567`)).toBe(false);
  });
  it("token con length wrong → false", () => {
    expect(isValidToken(`${VERIFY_TOKEN_PREFIX}abc123`)).toBe(false);
    expect(isValidToken(`${VERIFY_TOKEN_PREFIX}${"a".repeat(VERIFY_TOKEN_HEX_LENGTH + 1)}`)).toBe(false);
  });
  it("token con chars non-hex → false", () => {
    expect(isValidToken(`${VERIFY_TOKEN_PREFIX}${"z".repeat(VERIFY_TOKEN_HEX_LENGTH)}`)).toBe(false);
  });
  it("non-string → false", () => {
    expect(isValidToken(null)).toBe(false);
    expect(isValidToken(undefined)).toBe(false);
    expect(isValidToken(42)).toBe(false);
  });
});

describe("verifyHostname", () => {
  it("añade _bio-ignicion-verify prefix", () => {
    expect(verifyHostname("app.empresa.com")).toBe(`${VERIFY_SUBDOMAIN_PREFIX}.app.empresa.com`);
  });
  it("lowercase + trim", () => {
    expect(verifyHostname("  Acme.COM  ")).toBe(`${VERIFY_SUBDOMAIN_PREFIX}.acme.com`);
  });
  it("non-string → null", () => {
    expect(verifyHostname(null)).toBe(null);
    expect(verifyHostname(undefined)).toBe(null);
    expect(verifyHostname("")).toBe(null);
    expect(verifyHostname(42)).toBe(null);
  });
});

describe("txtMatchesToken", () => {
  const TOKEN = "bio-ign-verify-abc123def456";

  it("match exacto en string array", () => {
    expect(txtMatchesToken([TOKEN], TOKEN)).toBe(true);
  });
  it("match exacto con spaces (trim)", () => {
    expect(txtMatchesToken([`  ${TOKEN}  `], TOKEN)).toBe(true);
  });
  it("dns.resolveTxt shape (string[][]), records joineados", () => {
    // Records >255 chars vienen partidos
    expect(txtMatchesToken([["bio-ign-", "verify-abc123def456"]], TOKEN)).toBe(true);
  });
  it("token NO presente → false", () => {
    expect(txtMatchesToken(["v=spf1 -all", "google-site-verification=xxx"], TOKEN)).toBe(false);
  });
  it("partial match (token dentro de otro string) → false", () => {
    expect(txtMatchesToken([`prefix-${TOKEN}-suffix`], TOKEN)).toBe(false);
  });
  it("non-array records → false", () => {
    expect(txtMatchesToken(null, TOKEN)).toBe(false);
    expect(txtMatchesToken("string", TOKEN)).toBe(false);
  });
  it("token vacío → false", () => {
    expect(txtMatchesToken([TOKEN], "")).toBe(false);
    expect(txtMatchesToken([TOKEN], null)).toBe(false);
  });
  it("acepta múltiples records, uno match", () => {
    expect(txtMatchesToken(["v=spf1 -all", TOKEN, "other"], TOKEN)).toBe(true);
  });
});

describe("getVerifyInstructions", () => {
  const TOKEN = "bio-ign-verify-deadbeef";
  const DOMAIN = "app.empresa.com";

  it("retorna estructura completa con record info", () => {
    const r = getVerifyInstructions(DOMAIN, TOKEN);
    expect(r.record.type).toBe("TXT");
    expect(r.record.hostname).toBe(`${VERIFY_SUBDOMAIN_PREFIX}.${DOMAIN}`);
    expect(r.record.hostnameLabel).toBe(VERIFY_SUBDOMAIN_PREFIX);
    expect(r.record.value).toBe(TOKEN);
    expect(r.record.ttl).toBe(300);
    expect(Array.isArray(r.steps)).toBe(true);
    expect(r.steps.length).toBeGreaterThan(2);
  });

  it("mensaje incluye dominio y token", () => {
    const r = getVerifyInstructions(DOMAIN, TOKEN);
    expect(r.summary).toContain(DOMAIN);
    const hasToken = r.steps.some((s) => s.includes(TOKEN));
    expect(hasToken).toBe(true);
  });

  it("missing args → null", () => {
    expect(getVerifyInstructions(null, TOKEN)).toBe(null);
    expect(getVerifyInstructions(DOMAIN, null)).toBe(null);
    expect(getVerifyInstructions("", "")).toBe(null);
  });
});

describe("summarizeVerificationState", () => {
  it("verified → tone success", () => {
    const r = summarizeVerificationState({
      verified: true, verifiedAt: "2026-04-25T00:00:00Z",
    });
    expect(r.status).toBe("verified");
    expect(r.tone).toBe("success");
    expect(r.detail).toContain("2026-04-25");
  });

  it("token presente pero no verified → pending", () => {
    const r = summarizeVerificationState({
      verified: false, token: "bio-ign-verify-x",
      lastCheckedAt: "2026-04-25T12:00:00Z",
    });
    expect(r.status).toBe("pending");
    expect(r.tone).toBe("warn");
    expect(r.detail).toContain("2026-04-25");
  });

  it("pending sin lastCheckedAt → mensaje genérico", () => {
    const r = summarizeVerificationState({ verified: false, token: "bio-ign-verify-x" });
    expect(r.status).toBe("pending");
    expect(r.detail).toContain("TXT");
  });

  it("sin token → none", () => {
    expect(summarizeVerificationState({ verified: false }).status).toBe("none");
    expect(summarizeVerificationState({}).status).toBe("none");
  });
});
