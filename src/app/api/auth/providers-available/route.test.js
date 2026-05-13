/* /api/auth/providers-available — gate que decide qué botones
   sociales muestra /signin. Si esta route silenciosamente deja de
   reportar google:true en producción, el botón Google desaparece
   del UI sin warning. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/lib/sms", () => ({ smsEnabled: vi.fn(() => false) }));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

async function callGet() {
  const { GET } = await import("./route");
  const res = await GET();
  return { res, json: await res.json() };
}

describe("GET /api/auth/providers-available", () => {
  it("dev mode expone todos los providers aunque falten env vars", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const { json } = await callGet();
    expect(json.google).toBe(true);
    expect(json.microsoft).toBe(true);
    expect(json.apple).toBe(true);
    expect(json.okta).toBe(true);
  });

  it("prod sin env vars oculta google", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const { json } = await callGet();
    expect(json.google).toBe(false);
  });

  it("prod con GOOGLE_CLIENT_ID + SECRET expone google (anti-regression del deploy)", async () => {
    process.env.NODE_ENV = "production";
    process.env.GOOGLE_CLIENT_ID = "fake-id.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_SECRET = "GOCSPX-fake";
    const { json } = await callGet();
    expect(json.google).toBe(true);
  });

  it("prod con solo GOOGLE_CLIENT_ID (sin SECRET) NO expone google", async () => {
    process.env.NODE_ENV = "production";
    process.env.GOOGLE_CLIENT_ID = "fake-id.apps.googleusercontent.com";
    delete process.env.GOOGLE_CLIENT_SECRET;
    const { json } = await callGet();
    expect(json.google).toBe(false);
  });

  it("email magic-link siempre disponible (fallback console aceptable en pilots)", async () => {
    process.env.NODE_ENV = "production";
    const { json } = await callGet();
    expect(json.email).toBe(true);
  });

  it("phone refleja smsEnabled()", async () => {
    const sms = await import("@/lib/sms");
    sms.smsEnabled.mockReturnValueOnce(true);
    process.env.NODE_ENV = "production";
    const { json } = await callGet();
    expect(json.phone).toBe(true);
  });

  it("response es no-store (sin caching de provider list)", async () => {
    process.env.NODE_ENV = "production";
    const { res } = await callGet();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
