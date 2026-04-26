import { describe, it, expect } from "vitest";
import {
  isValidLevel, validateNotification, isUnread,
  summarizeBadge, formatTimeAgo, levelLabel,
  NOTIFICATION_LEVELS, TITLE_MAX, BODY_MAX, KIND_MAX,
  LEVEL_TONE_VARIANTS,
} from "./notifications-lib";

describe("isValidLevel", () => {
  it("conocidos → true", () => {
    for (const l of NOTIFICATION_LEVELS) expect(isValidLevel(l)).toBe(true);
  });
  it("desconocidos → false", () => {
    expect(isValidLevel("critical")).toBe(false);
    expect(isValidLevel(null)).toBe(false);
    expect(isValidLevel("")).toBe(false);
  });
});

describe("validateNotification", () => {
  it("válido completo", () => {
    const r = validateNotification({
      userId: "u_1", orgId: "o_1", kind: "webhook.failed",
      level: "warn", title: "Webhook failed", body: "Endpoint timeout",
      href: "/admin/webhooks",
    });
    expect(r.ok).toBe(true);
    expect(r.value.userId).toBe("u_1");
    expect(r.value.kind).toBe("webhook.failed");
    expect(r.value.href).toBe("/admin/webhooks");
  });

  it("level default → info", () => {
    const r = validateNotification({ userId: "u", kind: "x", title: "T" });
    expect(r.ok).toBe(true);
    expect(r.value.level).toBe("info");
  });

  it("userId required", () => {
    const r = validateNotification({ kind: "x", title: "T" });
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.field === "userId")).toBeDefined();
  });

  it("kind required + max length", () => {
    expect(validateNotification({ userId: "u", title: "T" }).ok).toBe(false);
    expect(validateNotification({ userId: "u", kind: "x".repeat(KIND_MAX + 1), title: "T" }).errors.find((e) => e.field === "kind").error).toBe("too_long");
  });

  it("title required + max length", () => {
    expect(validateNotification({ userId: "u", kind: "x" }).errors.find((e) => e.field === "title").error).toBe("required");
    const r = validateNotification({ userId: "u", kind: "x", title: "y".repeat(TITLE_MAX + 1) });
    expect(r.errors.find((e) => e.field === "title").error).toBe("too_long");
  });

  it("body too_long", () => {
    const r = validateNotification({
      userId: "u", kind: "x", title: "T", body: "z".repeat(BODY_MAX + 1),
    });
    expect(r.errors.find((e) => e.field === "body").error).toBe("too_long");
  });

  it("href https:// pasa", () => {
    expect(validateNotification({
      userId: "u", kind: "x", title: "T", href: "https://acme.com",
    }).ok).toBe(true);
  });

  it("href / relativo pasa", () => {
    expect(validateNotification({
      userId: "u", kind: "x", title: "T", href: "/admin/audit",
    }).ok).toBe(true);
  });

  it("href javascript: rechazado", () => {
    const r = validateNotification({
      userId: "u", kind: "x", title: "T", href: "javascript:alert(1)",
    });
    expect(r.errors.find((e) => e.field === "href").error).toBe("invalid_href");
  });

  it("href http:// rechazado (anti mixed)", () => {
    const r = validateNotification({
      userId: "u", kind: "x", title: "T", href: "http://acme.com",
    });
    expect(r.errors.find((e) => e.field === "href").error).toBe("invalid_href");
  });

  it("level inválido → error", () => {
    expect(validateNotification({
      userId: "u", kind: "x", title: "T", level: "critical",
    }).errors.find((e) => e.field === "level").error).toBe("invalid_level");
  });

  it("orgId null/undefined → out.orgId null (no error)", () => {
    expect(validateNotification({
      userId: "u", kind: "x", title: "T", orgId: null,
    }).value.orgId).toBe(null);
    expect(validateNotification({
      userId: "u", kind: "x", title: "T",
    }).value.orgId).toBe(null);
  });

  it("non-object → error", () => {
    expect(validateNotification(null).ok).toBe(false);
    expect(validateNotification("nope").ok).toBe(false);
  });
});

describe("isUnread", () => {
  it("readAt null → unread", () => {
    expect(isUnread({ readAt: null })).toBe(true);
    expect(isUnread({})).toBe(true);
  });
  it("readAt set → read", () => {
    expect(isUnread({ readAt: new Date() })).toBe(false);
    expect(isUnread({ readAt: "2026-04-25T00:00:00Z" })).toBe(false);
  });
  it("null → false", () => {
    expect(isUnread(null)).toBe(false);
  });
});

describe("summarizeBadge", () => {
  it("cuenta unread + tone por peor level", () => {
    const r = summarizeBadge([
      { level: "info", readAt: null },
      { level: "warn", readAt: null },
      { level: "error", readAt: null },
      { level: "info", readAt: new Date() }, // read, no count
    ]);
    expect(r.unreadCount).toBe(3);
    expect(r.byLevel.error).toBe(1);
    expect(r.byLevel.warn).toBe(1);
    expect(r.byLevel.info).toBe(1);
    expect(r.tone).toBe("danger"); // worst gana
  });

  it("solo info → soft tone", () => {
    expect(summarizeBadge([{ level: "info", readAt: null }]).tone).toBe("soft");
  });

  it("solo success → success tone", () => {
    expect(summarizeBadge([{ level: "success", readAt: null }]).tone).toBe("success");
  });

  it("vacío → neutral tone, count 0", () => {
    const r = summarizeBadge([]);
    expect(r.unreadCount).toBe(0);
    expect(r.tone).toBe("neutral");
  });

  it("non-array → empty", () => {
    expect(summarizeBadge(null).unreadCount).toBe(0);
  });

  it("level inválido → cuenta como info default", () => {
    const r = summarizeBadge([{ level: "weird", readAt: null }]);
    expect(r.unreadCount).toBe(1);
    expect(r.byLevel.info).toBe(1);
  });
});

describe("formatTimeAgo", () => {
  const NOW = new Date("2026-04-26T12:00:00Z").getTime();

  it("ahora (<1 min)", () => {
    expect(formatTimeAgo(new Date(NOW - 30_000), NOW)).toBe("ahora");
  });
  it("min", () => {
    expect(formatTimeAgo(new Date(NOW - 5 * 60_000), NOW)).toBe("hace 5 min");
  });
  it("h", () => {
    expect(formatTimeAgo(new Date(NOW - 3 * 3600_000), NOW)).toBe("hace 3 h");
  });
  it("días", () => {
    expect(formatTimeAgo(new Date(NOW - 5 * 86400_000), NOW)).toBe("hace 5 d");
  });
  it("meses", () => {
    expect(formatTimeAgo(new Date(NOW - 90 * 86400_000), NOW)).toBe("hace 3 m");
  });
  it("acepta string ISO", () => {
    expect(formatTimeAgo("2026-04-26T11:55:00Z", NOW)).toBe("hace 5 min");
  });
  it("missing/invalid → '—'", () => {
    expect(formatTimeAgo(null)).toBe("—");
    expect(formatTimeAgo("not-a-date", NOW)).toBe("—");
  });
  it("future → 'en futuro'", () => {
    expect(formatTimeAgo(new Date(NOW + 60_000), NOW)).toBe("en futuro");
  });
});

describe("LEVEL_TONE_VARIANTS / levelLabel", () => {
  it("expone constantes Badge variant", () => {
    expect(LEVEL_TONE_VARIANTS.error).toBe("danger");
    expect(LEVEL_TONE_VARIANTS.warn).toBe("warn");
    expect(LEVEL_TONE_VARIANTS.info).toBe("soft");
    expect(LEVEL_TONE_VARIANTS.success).toBe("success");
  });

  it("levelLabel es/en", () => {
    expect(levelLabel("warn")).toBe("Aviso");
    expect(levelLabel("warn", "en")).toBe("Warning");
    expect(levelLabel("error", "en")).toBe("Error");
    expect(levelLabel("WUT")).toBe("WUT");
  });
});
