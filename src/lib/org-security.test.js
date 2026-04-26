import { describe, it, expect } from "vitest";
import {
  parseIpv4, parseCidr, isIpInCidr, isIpAllowed, formatCidr,
  validateIpAllowlist, validateSessionMaxAge, validatePolicy,
  effectivePolicy, ipPassesAllChecks,
  SESSION_MAX_AGE_MIN_MINUTES, SESSION_MAX_AGE_MAX_MINUTES, IP_ALLOWLIST_MAX,
} from "./org-security";

describe("parseIpv4", () => {
  it("dotted-quad válido → uint32", () => {
    expect(parseIpv4("0.0.0.0")).toBe(0);
    expect(parseIpv4("255.255.255.255")).toBe(0xffffffff);
    expect(parseIpv4("192.168.1.1")).toBe(0xc0a80101);
    expect(parseIpv4("10.0.0.1")).toBe(0x0a000001);
  });

  it("preserva 32 bits sin sign-extension", () => {
    expect(parseIpv4("128.0.0.0")).toBe(0x80000000);
    // 0x80000000 fitted en uint32 = 2147483648, no -2147483648
    expect(parseIpv4("128.0.0.0") > 0).toBe(true);
  });

  it("trim spaces", () => {
    expect(parseIpv4("  10.0.0.1  ")).toBe(0x0a000001);
  });

  it("rechaza octetos > 255", () => {
    expect(parseIpv4("256.0.0.0")).toBeNull();
    expect(parseIpv4("10.0.0.999")).toBeNull();
  });

  it("rechaza formatos inválidos", () => {
    expect(parseIpv4("10.0.0")).toBeNull();
    expect(parseIpv4("10.0.0.1.5")).toBeNull();
    expect(parseIpv4("a.b.c.d")).toBeNull();
    expect(parseIpv4("")).toBeNull();
    expect(parseIpv4(null)).toBeNull();
    expect(parseIpv4(undefined)).toBeNull();
    expect(parseIpv4(42)).toBeNull();
    // IPv6 no soportado
    expect(parseIpv4("::1")).toBeNull();
    expect(parseIpv4("2001:db8::1")).toBeNull();
  });
});

describe("parseCidr", () => {
  it("CIDR válido", () => {
    const c = parseCidr("10.0.0.0/8");
    expect(c.bits).toBe(8);
    expect(c.network).toBe(0x0a000000);
    expect(c.mask).toBe(0xff000000);
  });

  it("IP sin /bits → /32", () => {
    const c = parseCidr("10.0.0.1");
    expect(c.bits).toBe(32);
    expect(c.network).toBe(0x0a000001);
    expect(c.mask).toBe(0xffffffff);
  });

  it("/0 (catch-all) válido", () => {
    const c = parseCidr("0.0.0.0/0");
    expect(c.bits).toBe(0);
    expect(c.mask).toBe(0);
    expect(c.network).toBe(0);
  });

  it("/32 (host único)", () => {
    const c = parseCidr("8.8.8.8/32");
    expect(c.bits).toBe(32);
    expect(c.network).toBe(0x08080808);
    expect(c.mask).toBe(0xffffffff);
  });

  it("normaliza host bits → network", () => {
    // 10.0.0.1/8 → network es 10.0.0.0
    const c = parseCidr("10.0.0.1/8");
    expect(c.network).toBe(0x0a000000);
  });

  it("rechaza bits inválidos", () => {
    expect(parseCidr("10.0.0.0/33")).toBeNull();
    expect(parseCidr("10.0.0.0/-1")).toBeNull();
    expect(parseCidr("10.0.0.0/abc")).toBeNull();
    expect(parseCidr("10.0.0.0/")).toBeNull();
    expect(parseCidr("10.0.0.0/3.5")).toBeNull();
  });

  it("rechaza IP inválida", () => {
    expect(parseCidr("999.0.0.0/8")).toBeNull();
    expect(parseCidr("foo/24")).toBeNull();
    expect(parseCidr("")).toBeNull();
    expect(parseCidr(null)).toBeNull();
  });
});

describe("isIpInCidr", () => {
  it("IP en rango → true", () => {
    expect(isIpInCidr("10.0.0.5", "10.0.0.0/24")).toBe(true);
    expect(isIpInCidr("192.168.1.100", "192.168.0.0/16")).toBe(true);
    expect(isIpInCidr("8.8.8.8", "0.0.0.0/0")).toBe(true);
  });

  it("IP fuera de rango → false", () => {
    expect(isIpInCidr("10.1.0.5", "10.0.0.0/24")).toBe(false);
    expect(isIpInCidr("11.0.0.5", "10.0.0.0/8")).toBe(false);
    expect(isIpInCidr("172.16.0.1", "192.168.0.0/16")).toBe(false);
  });

  it("/32 → solo exacta", () => {
    expect(isIpInCidr("8.8.8.8", "8.8.8.8/32")).toBe(true);
    expect(isIpInCidr("8.8.8.9", "8.8.8.8/32")).toBe(false);
  });

  it("acepta CIDR ya parseado como objeto", () => {
    const c = parseCidr("10.0.0.0/8");
    expect(isIpInCidr("10.5.6.7", c)).toBe(true);
  });

  it("inputs inválidos → false", () => {
    expect(isIpInCidr("not-an-ip", "10.0.0.0/8")).toBe(false);
    expect(isIpInCidr("10.0.0.1", "not-a-cidr")).toBe(false);
    expect(isIpInCidr(null, "10.0.0.0/8")).toBe(false);
  });
});

describe("isIpAllowed", () => {
  it("allowlist vacía → true (open)", () => {
    expect(isIpAllowed("8.8.8.8", [])).toBe(true);
    expect(isIpAllowed("8.8.8.8", null)).toBe(true);
    expect(isIpAllowed("8.8.8.8", undefined)).toBe(true);
  });

  it("IP en alguna entry → true", () => {
    const list = ["10.0.0.0/8", "192.168.0.0/16"];
    expect(isIpAllowed("10.5.6.7", list)).toBe(true);
    expect(isIpAllowed("192.168.1.1", list)).toBe(true);
  });

  it("IP en ninguna entry → false", () => {
    const list = ["10.0.0.0/8", "192.168.0.0/16"];
    expect(isIpAllowed("8.8.8.8", list)).toBe(false);
    expect(isIpAllowed("172.16.0.1", list)).toBe(false);
  });

  it("entries inválidas se ignoran (no throw)", () => {
    const list = ["bogus", "10.0.0.0/8"];
    expect(isIpAllowed("10.5.6.7", list)).toBe(true);
    expect(isIpAllowed("8.8.8.8", list)).toBe(false);
  });
});

describe("formatCidr", () => {
  it("network/bits → dotted/bits", () => {
    expect(formatCidr({ network: 0x0a000000, bits: 8 })).toBe("10.0.0.0/8");
    expect(formatCidr({ network: 0xc0a80100, bits: 24 })).toBe("192.168.1.0/24");
    expect(formatCidr({ network: 0, bits: 0 })).toBe("0.0.0.0/0");
  });
});

describe("validateIpAllowlist", () => {
  it("array válido → cleaned + dedup", () => {
    const r = validateIpAllowlist(["10.0.0.0/8", "192.168.1.0/24"]);
    expect(r.ok).toBe(true);
    expect(r.value).toEqual(["10.0.0.0/8", "192.168.1.0/24"]);
  });

  it("normaliza host bits a network", () => {
    const r = validateIpAllowlist(["10.0.0.5/8"]);
    expect(r.ok).toBe(true);
    expect(r.value).toEqual(["10.0.0.0/8"]);
  });

  it("dedup", () => {
    const r = validateIpAllowlist(["10.0.0.0/8", "10.0.0.5/8", "10.0.0.0/8"]);
    expect(r.ok).toBe(true);
    expect(r.value).toEqual(["10.0.0.0/8"]);
  });

  it("rechaza no-array", () => {
    expect(validateIpAllowlist("10.0.0.0/8").ok).toBe(false);
    expect(validateIpAllowlist(null).ok).toBe(false);
  });

  it("rechaza CIDR inválido", () => {
    const r = validateIpAllowlist(["10.0.0.0/8", "bogus"]);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("invalid_cidr");
    expect(r.value).toBe("bogus");
  });

  it("rechaza non-string", () => {
    const r = validateIpAllowlist(["10.0.0.0/8", 42]);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("non_string");
  });

  it("rechaza > IP_ALLOWLIST_MAX entries", () => {
    const list = Array.from({ length: IP_ALLOWLIST_MAX + 1 }, (_, i) => `10.${i}.0.0/16`);
    const r = validateIpAllowlist(list);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("too_many");
  });

  it("array vacío → válido", () => {
    expect(validateIpAllowlist([])).toEqual({ ok: true, value: [] });
  });

  it("acepta plain IP (auto /32)", () => {
    const r = validateIpAllowlist(["8.8.8.8"]);
    expect(r.ok).toBe(true);
    expect(r.value).toEqual(["8.8.8.8/32"]);
  });
});

describe("validateSessionMaxAge", () => {
  it("null/undefined → valor null (default)", () => {
    expect(validateSessionMaxAge(null)).toEqual({ ok: true, value: null });
    expect(validateSessionMaxAge(undefined)).toEqual({ ok: true, value: null });
  });

  it("entero en rango → válido", () => {
    expect(validateSessionMaxAge(60).ok).toBe(true);
    expect(validateSessionMaxAge(SESSION_MAX_AGE_MIN_MINUTES).ok).toBe(true);
    expect(validateSessionMaxAge(SESSION_MAX_AGE_MAX_MINUTES).ok).toBe(true);
  });

  it("rechaza < min", () => {
    const r = validateSessionMaxAge(SESSION_MAX_AGE_MIN_MINUTES - 1);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("too_small");
  });

  it("rechaza > max", () => {
    const r = validateSessionMaxAge(SESSION_MAX_AGE_MAX_MINUTES + 1);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("too_large");
  });

  it("rechaza no-entero", () => {
    expect(validateSessionMaxAge(60.5).ok).toBe(false);
    expect(validateSessionMaxAge("60").ok).toBe(false);
    expect(validateSessionMaxAge(NaN).ok).toBe(false);
  });
});

describe("validatePolicy", () => {
  it("policy completa válida", () => {
    const r = validatePolicy({
      requireMfa: true,
      ipAllowlistEnabled: true,
      ipAllowlist: ["10.0.0.0/8"],
      sessionMaxAgeMinutes: 60,
    });
    expect(r.ok).toBe(true);
    expect(r.policy.requireMfa).toBe(true);
    expect(r.policy.ipAllowlistEnabled).toBe(true);
    expect(r.policy.ipAllowlist).toEqual(["10.0.0.0/8"]);
    expect(r.policy.sessionMaxAgeMinutes).toBe(60);
  });

  it("policy parcial — solo campos definidos se incluyen", () => {
    const r = validatePolicy({ requireMfa: true });
    expect(r.ok).toBe(true);
    expect(r.policy).toEqual({ requireMfa: true });
  });

  it("input vacío → ok con policy vacía", () => {
    expect(validatePolicy({})).toEqual({ ok: true, policy: {} });
  });

  it("requireMfa no-boolean → error", () => {
    const r = validatePolicy({ requireMfa: "true" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "requireMfa", error: "not_boolean" });
  });

  it("ipAllowlist inválido → error", () => {
    const r = validatePolicy({ ipAllowlist: ["bogus"] });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "ipAllowlist" });
  });

  it("acumula múltiples errores", () => {
    const r = validatePolicy({
      requireMfa: "yes",
      sessionMaxAgeMinutes: 999999,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBe(2);
  });

  it("requireMfa: false explícito se respeta", () => {
    const r = validatePolicy({ requireMfa: false });
    expect(r.ok).toBe(true);
    expect(r.policy.requireMfa).toBe(false);
  });

  it("sessionMaxAgeMinutes: null se respeta (clear policy)", () => {
    const r = validatePolicy({ sessionMaxAgeMinutes: null });
    expect(r.ok).toBe(true);
    expect(r.policy.sessionMaxAgeMinutes).toBe(null);
  });
});

describe("effectivePolicy", () => {
  it("array vacío → defaults", () => {
    const r = effectivePolicy([]);
    expect(r.requireMfa).toBe(false);
    expect(r.sessionMaxAgeMinutes).toBe(null);
    expect(r.ipChecks).toEqual([]);
  });

  it("requireMfa: true si ANY org requiere", () => {
    const r = effectivePolicy([
      { orgId: "a", requireMfa: false },
      { orgId: "b", requireMfa: true },
      { orgId: "c", requireMfa: false },
    ]);
    expect(r.requireMfa).toBe(true);
  });

  it("sessionMaxAgeMinutes: MIN de los definidos", () => {
    const r = effectivePolicy([
      { orgId: "a", sessionMaxAgeMinutes: 480 },
      { orgId: "b", sessionMaxAgeMinutes: 60 },
      { orgId: "c", sessionMaxAgeMinutes: null },
    ]);
    expect(r.sessionMaxAgeMinutes).toBe(60);
  });

  it("sessionMaxAgeMinutes: null si ningún org lo define", () => {
    const r = effectivePolicy([
      { orgId: "a" },
      { orgId: "b", sessionMaxAgeMinutes: null },
    ]);
    expect(r.sessionMaxAgeMinutes).toBe(null);
  });

  it("ipChecks: solo orgs con allowlist activa Y no vacía", () => {
    const r = effectivePolicy([
      { orgId: "a", ipAllowlistEnabled: true, ipAllowlist: ["10.0.0.0/8"] },
      { orgId: "b", ipAllowlistEnabled: false, ipAllowlist: ["192.168.0.0/16"] },
      { orgId: "c", ipAllowlistEnabled: true, ipAllowlist: [] },
      { orgId: "d", ipAllowlistEnabled: true, ipAllowlist: ["172.16.0.0/12"] },
    ]);
    expect(r.ipChecks.length).toBe(2);
    expect(r.ipChecks.map((c) => c.orgId).sort()).toEqual(["a", "d"]);
  });

  it("ignora null/undefined entries", () => {
    const r = effectivePolicy([null, undefined, { requireMfa: true }]);
    expect(r.requireMfa).toBe(true);
  });

  it("non-array → defaults sin throw", () => {
    expect(effectivePolicy(null).requireMfa).toBe(false);
    expect(effectivePolicy(undefined).sessionMaxAgeMinutes).toBe(null);
    expect(effectivePolicy("nope").ipChecks).toEqual([]);
  });
});

describe("ipPassesAllChecks", () => {
  it("sin checks → true", () => {
    expect(ipPassesAllChecks("8.8.8.8", [])).toBe(true);
    expect(ipPassesAllChecks("8.8.8.8", null)).toBe(true);
  });

  it("IP debe pasar TODOS los checks (intersección de allowlists)", () => {
    const checks = [
      { orgId: "a", allowlist: ["10.0.0.0/8"] },
      { orgId: "b", allowlist: ["10.0.0.0/16"] },
    ];
    expect(ipPassesAllChecks("10.0.5.5", checks)).toBe(true);
    // En 10.0.0.0/8 pero NO en 10.0.0.0/16
    expect(ipPassesAllChecks("10.1.5.5", checks)).toBe(false);
  });

  it("falla si alguna allowlist no incluye la IP", () => {
    const checks = [
      { orgId: "a", allowlist: ["10.0.0.0/8"] },
      { orgId: "b", allowlist: ["192.168.0.0/16"] },
    ];
    // 10.0.0.5 está en (a) pero no en (b)
    expect(ipPassesAllChecks("10.0.0.5", checks)).toBe(false);
  });
});

describe("integración — flujo end-to-end", () => {
  it("admin valida policy → API guarda → middleware enforce", () => {
    // Admin envía policy
    const input = {
      requireMfa: true,
      ipAllowlistEnabled: true,
      ipAllowlist: ["10.0.0.5/8", "192.168.1.0/24"],
      sessionMaxAgeMinutes: 240,
    };

    // 1. Validación
    const v = validatePolicy(input);
    expect(v.ok).toBe(true);
    expect(v.policy.ipAllowlist).toEqual(["10.0.0.0/8", "192.168.1.0/24"]);

    // 2. JWT embebe policy del org en token (simulado)
    const orgPolicy = { orgId: "org_x", ...v.policy };

    // 3. Middleware: usuario con membership en este org
    const eff = effectivePolicy([orgPolicy]);
    expect(eff.requireMfa).toBe(true);
    expect(eff.sessionMaxAgeMinutes).toBe(240);
    expect(eff.ipChecks.length).toBe(1);

    // 4. Request desde 10.5.6.7 (en allowlist) → pasa
    expect(ipPassesAllChecks("10.5.6.7", eff.ipChecks)).toBe(true);

    // 5. Request desde 8.8.8.8 (fuera) → bloqueado
    expect(ipPassesAllChecks("8.8.8.8", eff.ipChecks)).toBe(false);
  });

  it("usuario en multi-org: most-restrictive wins", () => {
    const policies = [
      // Org personal: sin policy
      { orgId: "personal" },
      // Org enterprise: MFA + IP allowlist
      {
        orgId: "enterprise",
        requireMfa: true,
        ipAllowlistEnabled: true,
        ipAllowlist: ["10.0.0.0/8"],
        sessionMaxAgeMinutes: 60,
      },
    ];
    const eff = effectivePolicy(policies);
    expect(eff.requireMfa).toBe(true);
    expect(eff.sessionMaxAgeMinutes).toBe(60);
    expect(eff.ipChecks.length).toBe(1);
    // IP 8.8.8.8 fuera del allowlist enterprise → bloqueado en TODA la app
    expect(ipPassesAllChecks("8.8.8.8", eff.ipChecks)).toBe(false);
  });
});
