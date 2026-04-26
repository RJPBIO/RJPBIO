import { describe, it, expect } from "vitest";
import {
  detectBrowser, detectOS, detectDeviceClass, formatSessionLabel,
  generateJti, calculateExpiresAt, isSessionActive, activeSessions, markCurrent,
  SESSION_LABEL_MAX, SESSION_DEFAULT_TTL_HOURS,
} from "./session-tracking";

const UA = {
  chromeMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  chromeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  edgeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  safariIpad: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  operaWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
};

describe("detectBrowser", () => {
  it("Chrome en macOS", () => expect(detectBrowser(UA.chromeMac)).toBe("Chrome"));
  it("Chrome en Windows", () => expect(detectBrowser(UA.chromeWin)).toBe("Chrome"));
  it("Edge gana sobre Chrome (Edge UA contiene Chrome)", () => expect(detectBrowser(UA.edgeWin)).toBe("Edge"));
  it("Opera gana sobre Chrome", () => expect(detectBrowser(UA.operaWin)).toBe("Opera"));
  it("Firefox", () => expect(detectBrowser(UA.firefoxLinux)).toBe("Firefox"));
  it("Safari (no Chrome token)", () => expect(detectBrowser(UA.safariMac)).toBe("Safari"));
  it("Safari iOS", () => expect(detectBrowser(UA.safariIphone)).toBe("Safari"));

  it("input inválido → Unknown", () => {
    expect(detectBrowser(null)).toBe("Unknown");
    expect(detectBrowser(undefined)).toBe("Unknown");
    expect(detectBrowser("")).toBe("Unknown");
    expect(detectBrowser(42)).toBe("Unknown");
    expect(detectBrowser("RandomBot/1.0")).toBe("Unknown");
  });
});

describe("detectOS", () => {
  it("macOS", () => expect(detectOS(UA.chromeMac)).toBe("macOS"));
  it("Windows", () => expect(detectOS(UA.chromeWin)).toBe("Windows"));
  it("Linux", () => expect(detectOS(UA.firefoxLinux)).toBe("Linux"));
  it("iOS (iPhone gana sobre Mac OS X)", () => expect(detectOS(UA.safariIphone)).toBe("iOS"));
  it("iPadOS", () => expect(detectOS(UA.safariIpad)).toBe("iPadOS"));
  it("Android", () => expect(detectOS(UA.androidChrome)).toBe("Android"));
  it("ChromeOS", () => expect(detectOS("Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36")).toBe("ChromeOS"));
  it("input inválido → Unknown", () => {
    expect(detectOS(null)).toBe("Unknown");
    expect(detectOS("")).toBe("Unknown");
  });
});

describe("detectDeviceClass", () => {
  it("desktop (default)", () => {
    expect(detectDeviceClass(UA.chromeMac)).toBe("desktop");
    expect(detectDeviceClass(UA.chromeWin)).toBe("desktop");
    expect(detectDeviceClass(UA.firefoxLinux)).toBe("desktop");
  });
  it("mobile", () => {
    expect(detectDeviceClass(UA.safariIphone)).toBe("mobile");
    expect(detectDeviceClass(UA.androidChrome)).toBe("mobile");
  });
  it("tablet (iPad)", () => expect(detectDeviceClass(UA.safariIpad)).toBe("tablet"));
  it("input inválido → desktop", () => {
    expect(detectDeviceClass(null)).toBe("desktop");
    expect(detectDeviceClass("")).toBe("desktop");
  });
});

describe("formatSessionLabel", () => {
  it("formatea browser · OS · IP", () => {
    expect(formatSessionLabel({ userAgent: UA.chromeMac, ip: "8.8.8.8" }))
      .toBe("Chrome · macOS · 8.8.8.8");
  });
  it("sin IP", () => {
    expect(formatSessionLabel({ userAgent: UA.chromeMac })).toBe("Chrome · macOS");
  });
  it("sin UA, sólo IP", () => {
    expect(formatSessionLabel({ ip: "8.8.8.8" })).toBe("8.8.8.8");
  });
  it("nada → 'Sesión'", () => {
    expect(formatSessionLabel({})).toBe("Sesión");
    expect(formatSessionLabel()).toBe("Sesión");
  });
  it("trunca a SESSION_LABEL_MAX", () => {
    const long = "a".repeat(200);
    const r = formatSessionLabel({ ip: long });
    expect(r.length).toBeLessThanOrEqual(SESSION_LABEL_MAX);
    expect(r.endsWith("…")).toBe(true);
  });
});

describe("generateJti", () => {
  it("retorna string non-empty", () => {
    const jti = generateJti();
    expect(typeof jti).toBe("string");
    expect(jti.length).toBeGreaterThan(0);
  });
  it("dos calls producen valores distintos", () => {
    const a = generateJti();
    const b = generateJti();
    expect(a).not.toBe(b);
  });
  it("no contiene guiones (UUID estándar tiene 4)", () => {
    const jti = generateJti();
    expect(jti.includes("-")).toBe(false);
  });
});

describe("calculateExpiresAt", () => {
  it("default 8h desde now", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const exp = calculateExpiresAt(undefined, now);
    expect(exp.getTime() - now.getTime()).toBe(8 * 3600_000);
  });
  it("hours custom", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const exp = calculateExpiresAt(2, now);
    expect(exp.getTime() - now.getTime()).toBe(2 * 3600_000);
  });
  it("hours inválidas → default", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const exp = calculateExpiresAt(-5, now);
    expect(exp.getTime() - now.getTime()).toBe(SESSION_DEFAULT_TTL_HOURS * 3600_000);
    expect(calculateExpiresAt(NaN, now).getTime() - now.getTime()).toBe(SESSION_DEFAULT_TTL_HOURS * 3600_000);
  });
});

describe("isSessionActive", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  it("session válida (no revokedAt, expiresAt en futuro)", () => {
    expect(isSessionActive({
      revokedAt: null,
      expiresAt: new Date("2026-01-01T20:00:00Z"),
    }, now)).toBe(true);
  });
  it("revokedAt set → false", () => {
    expect(isSessionActive({
      revokedAt: new Date("2026-01-01T11:00:00Z"),
      expiresAt: new Date("2026-01-01T20:00:00Z"),
    }, now)).toBe(false);
  });
  it("expirada → false", () => {
    expect(isSessionActive({
      revokedAt: null,
      expiresAt: new Date("2026-01-01T11:00:00Z"),
    }, now)).toBe(false);
  });
  it("expiresAt exactamente now → false (boundary)", () => {
    expect(isSessionActive({
      revokedAt: null,
      expiresAt: now,
    }, now)).toBe(false);
  });
  it("null/undefined → false", () => {
    expect(isSessionActive(null)).toBe(false);
    expect(isSessionActive(undefined)).toBe(false);
  });
});

describe("activeSessions", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  it("filtra revoked + expired, ordena por lastSeenAt desc", () => {
    const rows = [
      { jti: "a", lastSeenAt: "2026-01-01T11:00:00Z", expiresAt: "2026-01-01T20:00:00Z", revokedAt: null },
      { jti: "b", lastSeenAt: "2026-01-01T11:30:00Z", expiresAt: "2026-01-01T20:00:00Z", revokedAt: "2026-01-01T11:45:00Z" },
      { jti: "c", lastSeenAt: "2026-01-01T11:50:00Z", expiresAt: "2026-01-01T20:00:00Z", revokedAt: null },
      { jti: "d", lastSeenAt: "2026-01-01T11:40:00Z", expiresAt: "2025-12-31T20:00:00Z", revokedAt: null },
    ];
    const r = activeSessions(rows, now);
    expect(r.map((x) => x.jti)).toEqual(["c", "a"]);
  });
  it("non-array → []", () => {
    expect(activeSessions(null)).toEqual([]);
    expect(activeSessions(undefined)).toEqual([]);
    expect(activeSessions("nope")).toEqual([]);
  });
});

describe("markCurrent", () => {
  it("marca la sesión cuyo jti coincide", () => {
    const rows = [
      { jti: "a", label: "x" },
      { jti: "b", label: "y" },
    ];
    const r = markCurrent(rows, "b");
    expect(r[0].current).toBe(false);
    expect(r[1].current).toBe(true);
  });
  it("currentJti null → todas current=false", () => {
    const rows = [{ jti: "a" }, { jti: "b" }];
    const r = markCurrent(rows, null);
    expect(r.every((s) => s.current === false)).toBe(true);
  });
  it("non-array → []", () => {
    expect(markCurrent(null, "x")).toEqual([]);
  });
});
