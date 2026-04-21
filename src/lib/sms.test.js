import { afterEach, describe, it, expect, vi } from "vitest";
import { normalizeE164, smsEnabled } from "./sms";

describe("normalizeE164", () => {
  it("rechaza entradas vacías o sin dígitos", () => {
    expect(normalizeE164(null)).toBe(null);
    expect(normalizeE164(undefined)).toBe(null);
    expect(normalizeE164("")).toBe(null);
    expect(normalizeE164("abc")).toBe(null);
    expect(normalizeE164("+")).toBe(null);
  });

  it("preserva E.164 ya válido", () => {
    expect(normalizeE164("+526141234567")).toBe("+526141234567");
    expect(normalizeE164("+18005551234")).toBe("+18005551234");
  });

  it("elimina separadores dentro de E.164", () => {
    expect(normalizeE164("+52 614 123 4567")).toBe("+526141234567");
    expect(normalizeE164("+1-800-555-1234")).toBe("+18005551234");
    expect(normalizeE164("+52.614.123.4567")).toBe("+526141234567");
  });

  it("agrega país por default cuando son 10 dígitos locales", () => {
    expect(normalizeE164("614 123 4567")).toBe("+526141234567");
    expect(normalizeE164("6141234567")).toBe("+526141234567");
  });

  it("respeta defaultCountry custom", () => {
    expect(normalizeE164("8005551234", "1")).toBe("+18005551234");
  });

  it("acepta 11+ dígitos sin + como si ya incluyeran país", () => {
    expect(normalizeE164("526141234567")).toBe("+526141234567");
  });

  it("rechaza números demasiado cortos", () => {
    expect(normalizeE164("+123")).toBe(null);
    expect(normalizeE164("+1234567")).toBe(null);
    expect(normalizeE164("123")).toBe(null);
  });

  it("rechaza números demasiado largos (>15 dígitos)", () => {
    expect(normalizeE164("+1234567890123456")).toBe(null);
    expect(normalizeE164("1234567890123456")).toBe(null);
  });
});

describe("smsEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna true cuando SMS_PROVIDER=console explícito", () => {
    vi.stubEnv("SMS_PROVIDER", "console");
    vi.stubEnv("NODE_ENV", "production");
    expect(smsEnabled()).toBe(true);
  });

  it("retorna true cuando Twilio está completo", () => {
    vi.stubEnv("SMS_PROVIDER", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC_x");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "tok_x");
    vi.stubEnv("TWILIO_FROM", "+15550000000");
    vi.stubEnv("NODE_ENV", "production");
    expect(smsEnabled()).toBe(true);
  });

  it("retorna false en producción sin provider configurado", () => {
    vi.stubEnv("SMS_PROVIDER", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_FROM", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(smsEnabled()).toBe(false);
  });

  it("retorna false en prod con Twilio parcialmente configurado", () => {
    vi.stubEnv("SMS_PROVIDER", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC_x");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_FROM", "+15550000000");
    vi.stubEnv("NODE_ENV", "production");
    expect(smsEnabled()).toBe(false);
  });

  it("retorna true en dev aunque no haya provider (console fallback)", () => {
    vi.stubEnv("SMS_PROVIDER", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(smsEnabled()).toBe(true);
  });
});
