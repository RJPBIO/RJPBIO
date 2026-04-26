import { describe, it, expect } from "vitest";
import {
  isValidEmail, isValidWebhookUrl, isValidToken,
  sanitizeComponents, validateSubscribeInput,
  shouldNotifyForIncident, buildUnsubscribeUrl, buildVerifyUrl,
  formatVerifySubject, formatNotificationSubject, summarizeSubscriber,
  TOKEN_LENGTH,
} from "./incident-subscribers";

describe("isValidEmail", () => {
  it("acepta emails normales", () => {
    expect(isValidEmail("alice@acme.com")).toBe(true);
    expect(isValidEmail("a.b+c@x.io")).toBe(true);
  });
  it("rechaza sin @", () => expect(isValidEmail("not-an-email")).toBe(false));
  it("rechaza sin TLD", () => expect(isValidEmail("a@b")).toBe(false));
  it("rechaza con spaces", () => expect(isValidEmail("a @b.com")).toBe(false));
  it("rechaza non-string / vacío", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
  });
  it("rechaza > 254 chars", () => {
    expect(isValidEmail("a".repeat(250) + "@x.com")).toBe(false);
  });
});

describe("isValidWebhookUrl", () => {
  it("https acepta", () => {
    expect(isValidWebhookUrl("https://acme.com/hook")).toBe(true);
  });
  it("http rechaza", () => {
    expect(isValidWebhookUrl("http://acme.com/hook")).toBe(false);
  });
  it("javascript: / data: rechaza", () => {
    expect(isValidWebhookUrl("javascript:alert(1)")).toBe(false);
    expect(isValidWebhookUrl("data:text/html,<x>")).toBe(false);
  });
  it("URL muy larga rechaza", () => {
    expect(isValidWebhookUrl("https://" + "a".repeat(2050))).toBe(false);
  });
});

describe("isValidToken", () => {
  it("hex de TOKEN_LENGTH*2 → true", () => {
    expect(isValidToken("a".repeat(TOKEN_LENGTH * 2))).toBe(true);
    expect(isValidToken("0123456789abcdef".repeat(4))).toBe(true);
  });
  it("longitud incorrecta → false", () => {
    expect(isValidToken("a".repeat(10))).toBe(false);
    expect(isValidToken("a".repeat(TOKEN_LENGTH * 2 + 1))).toBe(false);
  });
  it("non-hex → false", () => {
    expect(isValidToken("z".repeat(TOKEN_LENGTH * 2))).toBe(false);
  });
});

describe("sanitizeComponents", () => {
  it("filtra solo conocidos", () => {
    expect(sanitizeComponents(["api", "fake", "auth"])).toEqual(["api", "auth"]);
  });
  it("dedup", () => {
    expect(sanitizeComponents(["api", "api"])).toEqual(["api"]);
  });
  it("non-array → []", () => {
    expect(sanitizeComponents(null)).toEqual([]);
    expect(sanitizeComponents("api")).toEqual([]);
  });
});

describe("validateSubscribeInput", () => {
  it("email válido", () => {
    const r = validateSubscribeInput({ email: "Alice@Acme.COM" });
    expect(r.ok).toBe(true);
    expect(r.value.email).toBe("alice@acme.com"); // normalized
    expect(r.value.components).toEqual([]);
  });

  it("webhookUrl válido", () => {
    const r = validateSubscribeInput({ webhookUrl: "https://acme.com/incidents" });
    expect(r.ok).toBe(true);
    expect(r.value.webhookUrl).toBe("https://acme.com/incidents");
  });

  it("ambos canales → exactly_one error", () => {
    const r = validateSubscribeInput({ email: "a@b.com", webhookUrl: "https://x.com" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "_channel", error: "exactly_one" });
  });

  it("ningún canal → exactly_one error", () => {
    const r = validateSubscribeInput({});
    expect(r.ok).toBe(false);
    expect(r.errors[0].error).toBe("exactly_one");
  });

  it("email inválido", () => {
    const r = validateSubscribeInput({ email: "not-an-email" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "email", error: "invalid_email" });
  });

  it("webhook http:// inválido", () => {
    const r = validateSubscribeInput({ webhookUrl: "http://x.com" });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ field: "webhookUrl" });
  });

  it("components con mix de válidos/inválidos → cleaned", () => {
    const r = validateSubscribeInput({
      email: "a@b.com",
      components: ["api", "junk", "auth"],
    });
    expect(r.ok).toBe(true);
    expect(r.value.components).toEqual(["api", "auth"]);
  });

  it("components non-array → error", () => {
    const r = validateSubscribeInput({ email: "a@b.com", components: "api" });
    expect(r.ok).toBe(false);
  });

  it("non-object input", () => {
    expect(validateSubscribeInput(null).ok).toBe(false);
    expect(validateSubscribeInput("nope").ok).toBe(false);
  });
});

describe("shouldNotifyForIncident", () => {
  it("subscriber sin verify → false", () => {
    expect(shouldNotifyForIncident(
      { verified: false, components: [] },
      { components: ["api"] }
    )).toBe(false);
  });

  it("subscriber verified + components vacío → notifica TODO", () => {
    expect(shouldNotifyForIncident(
      { verified: true, components: [] },
      { components: ["webhooks"] }
    )).toBe(true);
    expect(shouldNotifyForIncident(
      { verified: true, components: [] },
      { components: [] }
    )).toBe(true);
  });

  it("subscriber con filter + intersección con incident → notifica", () => {
    expect(shouldNotifyForIncident(
      { verified: true, components: ["api", "auth"] },
      { components: ["api"] }
    )).toBe(true);
  });

  it("subscriber con filter sin intersección → NO notifica", () => {
    expect(shouldNotifyForIncident(
      { verified: true, components: ["api"] },
      { components: ["billing"] }
    )).toBe(false);
  });

  it("subscriber con filter + incident sin components → NO notifica", () => {
    // Caso edge: subscriber tiene filter activo, no podemos saber si aplica.
    expect(shouldNotifyForIncident(
      { verified: true, components: ["api"] },
      { components: [] }
    )).toBe(false);
  });

  it("null subscriber/incident → false", () => {
    expect(shouldNotifyForIncident(null, {})).toBe(false);
    expect(shouldNotifyForIncident({ verified: true }, null)).toBe(false);
  });
});

describe("buildUnsubscribeUrl / buildVerifyUrl", () => {
  it("construye URL bien formada", () => {
    expect(buildUnsubscribeUrl("abc123", "https://app.com"))
      .toBe("https://app.com/api/status/unsubscribe?token=abc123");
    expect(buildVerifyUrl("xyz", "https://app.com/"))
      .toBe("https://app.com/api/status/verify?token=xyz");
  });
  it("encodes URI param", () => {
    expect(buildUnsubscribeUrl("a/b+c", "https://app.com"))
      .toContain("a%2Fb%2Bc");
  });
  it("missing args → null", () => {
    expect(buildUnsubscribeUrl(null, "https://x.com")).toBe(null);
    expect(buildVerifyUrl("token", null)).toBe(null);
  });
});

describe("formatVerifySubject / formatNotificationSubject", () => {
  it("verify subject locales", () => {
    expect(formatVerifySubject("es")).toMatch(/[Cc]onfirma/);
    expect(formatVerifySubject("en")).toMatch(/[Cc]onfirm/);
  });

  it("notification subject critical → [CRITICAL]", () => {
    expect(formatNotificationSubject({
      severity: "critical", title: "API down", status: "investigating",
    })).toBe("[CRITICAL] API down");
  });

  it("resolved → [RESOLVED] / [RESUELTO]", () => {
    expect(formatNotificationSubject({
      severity: "major", title: "Latency spike", status: "resolved",
    })).toBe("[RESUELTO] Latency spike");
    expect(formatNotificationSubject({
      severity: "major", title: "Latency spike", status: "resolved",
    }, "en")).toBe("[RESOLVED] Latency spike");
  });

  it("incident sin title → fallback genérico", () => {
    const r = formatNotificationSubject({ severity: "minor", status: "monitoring" });
    expect(r).toContain("[MINOR]");
  });

  it("null incident → ''", () => {
    expect(formatNotificationSubject(null)).toBe("");
  });
});

describe("summarizeSubscriber", () => {
  it("verified email + filter", () => {
    const r = summarizeSubscriber({
      verified: true, email: "a@b.com", components: ["api"],
    });
    expect(r.tone).toBe("success");
    expect(r.channel).toBe("email:a@b.com");
    expect(r.components).toEqual(["api"]);
  });

  it("pending verify", () => {
    const r = summarizeSubscriber({
      verified: false, email: "a@b.com",
    });
    expect(r.tone).toBe("warn");
    expect(r.label).toMatch(/[Pp]endiente/);
  });

  it("webhook channel", () => {
    const r = summarizeSubscriber({ verified: true, webhookUrl: "https://x.com" });
    expect(r.channel).toBe("webhook");
  });

  it("null → neutral", () => {
    expect(summarizeSubscriber(null).tone).toBe("neutral");
  });
});
