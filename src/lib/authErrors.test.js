import { describe, it, expect } from "vitest";
import { describeAuthError, AUTH_ERROR_MESSAGES } from "./authErrors";

describe("describeAuthError", () => {
  it("devuelve null cuando no hay código", () => {
    expect(describeAuthError(null)).toBe(null);
    expect(describeAuthError(undefined)).toBe(null);
    expect(describeAuthError("")).toBe(null);
  });

  it("traduce códigos conocidos", () => {
    expect(describeAuthError("AccessDenied")).toBe(AUTH_ERROR_MESSAGES.AccessDenied);
    expect(describeAuthError("Verification")).toBe(AUTH_ERROR_MESSAGES.Verification);
    expect(describeAuthError("OAuthCallback")).toBe(AUTH_ERROR_MESSAGES.OAuthCallback);
  });

  it("cae a Default para códigos desconocidos", () => {
    expect(describeAuthError("Blorf")).toBe(AUTH_ERROR_MESSAGES.Default);
    expect(describeAuthError("1")).toBe(AUTH_ERROR_MESSAGES.Default);
  });
});
