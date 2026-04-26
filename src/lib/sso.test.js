import { describe, it, expect } from "vitest";
import {
  normalizeDomain, validateDomain, isValidProvider, validateSsoConfig,
  SUPPORTED_SSO_PROVIDERS, SSO_PROVIDER_LABELS,
} from "./sso";

describe("normalizeDomain", () => {
  it("lowercase + trim", () => {
    expect(normalizeDomain("  ACME.com  ")).toBe("acme.com");
    expect(normalizeDomain("Mail.ACME.CO.UK")).toBe("mail.acme.co.uk");
  });

  it("strip protocolo http/https", () => {
    expect(normalizeDomain("https://acme.com")).toBe("acme.com");
    expect(normalizeDomain("http://acme.com")).toBe("acme.com");
    expect(normalizeDomain("HTTPS://Acme.COM/")).toBe("acme.com");
  });

  it("strip path/query/fragment", () => {
    expect(normalizeDomain("acme.com/login")).toBe("acme.com");
    expect(normalizeDomain("acme.com?ref=email")).toBe("acme.com");
    expect(normalizeDomain("acme.com#section")).toBe("acme.com");
    expect(normalizeDomain("https://acme.com/path?q=1#frag")).toBe("acme.com");
  });

  it("strip puerto", () => {
    expect(normalizeDomain("acme.com:443")).toBe("acme.com");
    expect(normalizeDomain("acme.com:8080")).toBe("acme.com");
  });

  it("strip trailing dot", () => {
    expect(normalizeDomain("acme.com.")).toBe("acme.com");
  });

  it("input vacío/null → empty string", () => {
    expect(normalizeDomain("")).toBe("");
    expect(normalizeDomain(null)).toBe("");
    expect(normalizeDomain(undefined)).toBe("");
    expect(normalizeDomain(42)).toBe("");
  });

  it("user pegando URL completa funciona", () => {
    expect(normalizeDomain("  https://Acme.com/login?session=x#top  ")).toBe("acme.com");
  });
});

describe("validateDomain", () => {
  it("acepta domain bien formado", () => {
    expect(validateDomain("acme.com")).toEqual({ ok: true, normalized: "acme.com" });
    expect(validateDomain("ACME.COM")).toEqual({ ok: true, normalized: "acme.com" });
  });

  it("acepta subdomains", () => {
    expect(validateDomain("mail.acme.com")).toEqual({ ok: true, normalized: "mail.acme.com" });
    expect(validateDomain("a.b.c.example.com")).toEqual({ ok: true, normalized: "a.b.c.example.com" });
  });

  it("acepta TLDs largos", () => {
    expect(validateDomain("acme.travel")).toEqual({ ok: true, normalized: "acme.travel" });
  });

  it("rechaza vacío → empty", () => {
    expect(validateDomain("")).toEqual({ ok: false, reason: "empty" });
    expect(validateDomain(null)).toEqual({ ok: false, reason: "empty" });
  });

  it("rechaza shape inválido", () => {
    expect(validateDomain("no-tld").ok).toBe(false);
    expect(validateDomain(".com").ok).toBe(false);
    expect(validateDomain("acme.").ok).toBe(false);
    // Single-letter TLD rechazado por regex {2,}
    expect(validateDomain("acme.x").ok).toBe(false);
  });

  it("rechaza muy largo (>253)", () => {
    const long = "a".repeat(250) + ".com";
    expect(validateDomain(long).reason).toBe("too_long");
  });

  it("normaliza antes de validar (URL pegada)", () => {
    expect(validateDomain("  https://acme.com/login  ")).toEqual({
      ok: true,
      normalized: "acme.com",
    });
  });
});

describe("isValidProvider", () => {
  it("acepta providers del whitelist", () => {
    for (const p of SUPPORTED_SSO_PROVIDERS) {
      expect(isValidProvider(p)).toBe(true);
    }
  });

  it("rechaza fuera de whitelist", () => {
    expect(isValidProvider("facebook")).toBe(false);
    expect(isValidProvider("github")).toBe(false);
    expect(isValidProvider("OKTA")).toBe(false); // case sensitive
    expect(isValidProvider("")).toBe(false);
    expect(isValidProvider(null)).toBe(false);
  });

  it("incluye al menos los enterprise providers principales", () => {
    expect(SUPPORTED_SSO_PROVIDERS).toContain("okta");
    expect(SUPPORTED_SSO_PROVIDERS).toContain("azure-ad");
    expect(SUPPORTED_SSO_PROVIDERS).toContain("google");
    expect(SUPPORTED_SSO_PROVIDERS).toContain("saml");
  });
});

describe("SSO_PROVIDER_LABELS", () => {
  it("define label legible para cada provider en whitelist", () => {
    for (const p of SUPPORTED_SSO_PROVIDERS) {
      expect(SSO_PROVIDER_LABELS[p]).toBeTruthy();
      expect(typeof SSO_PROVIDER_LABELS[p]).toBe("string");
    }
  });
});

describe("validateSsoConfig", () => {
  it("acepta config válida (domain + provider)", () => {
    const r = validateSsoConfig({ domain: "acme.com", provider: "okta" });
    expect(r.ok).toBe(true);
    expect(r.config).toEqual({
      domain: "acme.com",
      provider: "okta",
      metadata: null,
    });
  });

  it("acepta con metadata objeto", () => {
    const r = validateSsoConfig({
      domain: "acme.com",
      provider: "saml",
      metadata: { entityId: "https://acme.com/saml", x509: "MII..." },
    });
    expect(r.ok).toBe(true);
    expect(r.config.metadata).toEqual({
      entityId: "https://acme.com/saml",
      x509: "MII...",
    });
  });

  it("acepta metadata null/undefined", () => {
    expect(validateSsoConfig({ domain: "acme.com", provider: "okta" }).ok).toBe(true);
    expect(validateSsoConfig({ domain: "acme.com", provider: "okta", metadata: null }).ok).toBe(true);
  });

  it("rechaza domain inválido con error específico", () => {
    const r = validateSsoConfig({ domain: "not-a-domain", provider: "okta" });
    expect(r.ok).toBe(false);
    expect(r.errors.domain).toBe("invalid");
    expect(r.errors.provider).toBeUndefined();
  });

  it("rechaza domain vacío con reason 'empty'", () => {
    const r = validateSsoConfig({ domain: "", provider: "okta" });
    expect(r.errors.domain).toBe("empty");
  });

  it("rechaza provider fuera de whitelist", () => {
    const r = validateSsoConfig({ domain: "acme.com", provider: "facebook" });
    expect(r.ok).toBe(false);
    expect(r.errors.provider).toBe("invalid_provider");
  });

  it("acumula errores de domain Y provider simultáneamente", () => {
    const r = validateSsoConfig({ domain: "", provider: "fake" });
    expect(r.ok).toBe(false);
    expect(r.errors.domain).toBe("empty");
    expect(r.errors.provider).toBe("invalid_provider");
  });

  it("rechaza metadata no-objeto", () => {
    const r = validateSsoConfig({
      domain: "acme.com",
      provider: "saml",
      metadata: "should-be-object",
    });
    expect(r.errors.metadata).toBe("must_be_object");
  });

  it("normaliza domain en config output", () => {
    const r = validateSsoConfig({
      domain: "  https://Acme.COM/  ",
      provider: "okta",
    });
    expect(r.config.domain).toBe("acme.com");
  });
});
