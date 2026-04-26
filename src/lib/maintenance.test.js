import { describe, it, expect } from "vitest";
import {
  isValidStatus, canTransitionStatus, validateMaintenance,
  isUpcoming, isInProgress, isFinished,
  nextNotificationKind, formatDuration,
  statusTone, statusLabel, activeMaintenances, recentCompletedMaintenances,
  MAINTENANCE_STATUSES, TITLE_MAX, BODY_MAX,
  MIN_DURATION_MS, MAX_DURATION_MS,
} from "./maintenance";

const NOW = new Date("2026-04-25T12:00:00Z");
const FUTURE_START = new Date("2026-04-26T00:00:00Z"); // +12h
const FUTURE_END   = new Date("2026-04-26T02:00:00Z"); // +14h
const PAST = new Date("2026-04-20T00:00:00Z");

describe("isValidStatus", () => {
  it("conocidos → true", () => {
    for (const s of MAINTENANCE_STATUSES) expect(isValidStatus(s)).toBe(true);
  });
  it("desconocidos → false", () => {
    expect(isValidStatus("paused")).toBe(false);
    expect(isValidStatus(null)).toBe(false);
  });
});

describe("canTransitionStatus", () => {
  it("scheduled → in_progress | cancelled | completed", () => {
    expect(canTransitionStatus("scheduled", "in_progress")).toBe(true);
    expect(canTransitionStatus("scheduled", "cancelled")).toBe(true);
    expect(canTransitionStatus("scheduled", "completed")).toBe(true);
  });
  it("in_progress → completed | cancelled", () => {
    expect(canTransitionStatus("in_progress", "completed")).toBe(true);
    expect(canTransitionStatus("in_progress", "cancelled")).toBe(true);
  });
  it("in_progress NO → scheduled (no rewind)", () => {
    expect(canTransitionStatus("in_progress", "scheduled")).toBe(false);
  });
  it("completed/cancelled terminales", () => {
    for (const s of MAINTENANCE_STATUSES) {
      expect(canTransitionStatus("completed", s)).toBe(false);
      expect(canTransitionStatus("cancelled", s)).toBe(false);
    }
  });
  it("inválidos → false", () => {
    expect(canTransitionStatus("WUT", "completed")).toBe(false);
  });
});

describe("validateMaintenance", () => {
  it("input válido completo", () => {
    const r = validateMaintenance({
      title: "DB upgrade",
      body: "Postgres 16 migration",
      scheduledStart: FUTURE_START,
      scheduledEnd: FUTURE_END,
      components: ["api", "auth"],
    }, NOW);
    expect(r.ok).toBe(true);
    expect(r.value.components).toEqual(["api", "auth"]);
  });

  it("title required", () => {
    const r = validateMaintenance({
      scheduledStart: FUTURE_START, scheduledEnd: FUTURE_END,
    }, NOW);
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.field === "title").error).toBe("required");
  });

  it("title too_long", () => {
    const r = validateMaintenance({
      title: "x".repeat(TITLE_MAX + 1),
      scheduledStart: FUTURE_START, scheduledEnd: FUTURE_END,
    }, NOW);
    expect(r.errors.find((e) => e.field === "title").error).toBe("too_long");
  });

  it("body too_long", () => {
    const r = validateMaintenance({
      title: "x", body: "y".repeat(BODY_MAX + 1),
      scheduledStart: FUTURE_START, scheduledEnd: FUTURE_END,
    }, NOW);
    expect(r.errors.find((e) => e.field === "body")).toBeDefined();
  });

  it("scheduledStart en pasado → error", () => {
    const r = validateMaintenance({
      title: "x", scheduledStart: PAST, scheduledEnd: FUTURE_END,
    }, NOW);
    expect(r.errors.find((e) => e.field === "scheduledStart").error).toBe("must_be_future");
  });

  it("scheduledStart inválido → error", () => {
    const r = validateMaintenance({
      title: "x", scheduledStart: "not-a-date", scheduledEnd: FUTURE_END,
    }, NOW);
    expect(r.errors.find((e) => e.field === "scheduledStart").error).toBe("invalid_date");
  });

  it("scheduledEnd <= start → error", () => {
    const r = validateMaintenance({
      title: "x",
      scheduledStart: FUTURE_START,
      scheduledEnd: FUTURE_START,
    }, NOW);
    expect(r.errors.find((e) => e.field === "scheduledEnd").error).toBe("must_be_after_start");
  });

  it("duración demasiado corta → too_short", () => {
    const justAfter = new Date(FUTURE_START.getTime() + 30_000); // 30s
    const r = validateMaintenance({
      title: "x", scheduledStart: FUTURE_START, scheduledEnd: justAfter,
    }, NOW);
    expect(r.errors.find((e) => e.field === "scheduledEnd").error).toBe("too_short");
  });

  it("duración demasiado larga → too_long", () => {
    const fortyDaysLater = new Date(FUTURE_START.getTime() + 40 * 86400_000);
    const r = validateMaintenance({
      title: "x", scheduledStart: FUTURE_START, scheduledEnd: fortyDaysLater,
    }, NOW);
    expect(r.errors.find((e) => e.field === "scheduledEnd").error).toBe("too_long");
  });

  it("components filtra inválidos", () => {
    const r = validateMaintenance({
      title: "x",
      scheduledStart: FUTURE_START, scheduledEnd: FUTURE_END,
      components: ["api", "junk", "auth"],
    }, NOW);
    expect(r.value.components).toEqual(["api", "auth"]);
  });

  it("non-object → error", () => {
    expect(validateMaintenance(null).ok).toBe(false);
    expect(validateMaintenance("nope").ok).toBe(false);
  });
});

describe("isUpcoming / isInProgress / isFinished", () => {
  const upcoming = { status: "scheduled", scheduledStart: FUTURE_START, scheduledEnd: FUTURE_END };
  const inProgressByStatus = { status: "in_progress", scheduledStart: PAST, scheduledEnd: FUTURE_END };
  const inProgressByTime = { status: "scheduled",
    scheduledStart: new Date(NOW.getTime() - 60_000),
    scheduledEnd: new Date(NOW.getTime() + 60 * 60_000) };
  const completed = { status: "completed", scheduledStart: PAST, scheduledEnd: PAST };

  it("upcoming si scheduled + start futuro", () => {
    expect(isUpcoming(upcoming, NOW)).toBe(true);
    expect(isUpcoming(inProgressByStatus, NOW)).toBe(false);
    expect(isUpcoming(completed, NOW)).toBe(false);
  });

  it("inProgress por status explícito", () => {
    expect(isInProgress(inProgressByStatus, NOW)).toBe(true);
  });

  it("inProgress por time aunque status sea scheduled", () => {
    expect(isInProgress(inProgressByTime, NOW)).toBe(true);
  });

  it("isFinished completed/cancelled → true", () => {
    expect(isFinished(completed, NOW)).toBe(true);
    expect(isFinished({ status: "cancelled" }, NOW)).toBe(true);
  });

  it("isFinished scheduled con end pasado → true", () => {
    expect(isFinished({ status: "scheduled", scheduledEnd: PAST }, NOW)).toBe(true);
  });

  it("null safe", () => {
    expect(isUpcoming(null, NOW)).toBe(false);
    expect(isInProgress(null, NOW)).toBe(false);
    expect(isFinished(null, NOW)).toBe(false);
  });
});

describe("nextNotificationKind", () => {
  const T_24H_BEFORE = new Date(FUTURE_START.getTime() - 23 * 3600_000);
  const T_AT_START = new Date(FUTURE_START.getTime() + 60_000);

  it("scheduled + dentro de T-24h sin notify → T24", () => {
    const r = nextNotificationKind({
      status: "scheduled",
      scheduledStart: FUTURE_START, scheduledEnd: FUTURE_END,
      notifiedT24: false,
    }, T_24H_BEFORE);
    expect(r).toBe("T24");
  });

  it("scheduled + ya pasamos start → T0", () => {
    const r = nextNotificationKind({
      status: "scheduled",
      scheduledStart: FUTURE_START, scheduledEnd: FUTURE_END,
      notifiedT24: true, notifiedT0: false,
    }, T_AT_START);
    expect(r).toBe("T0");
  });

  it("status completed sin notifiedComplete → complete", () => {
    const r = nextNotificationKind({
      status: "completed",
      notifiedT24: true, notifiedT0: true, notifiedComplete: false,
    }, NOW);
    expect(r).toBe("complete");
  });

  it("status cancelled → null (no notify)", () => {
    expect(nextNotificationKind({
      status: "cancelled", notifiedT24: false, notifiedT0: false,
    }, NOW)).toBe(null);
  });

  it("ya notificado en todos los stages → null", () => {
    expect(nextNotificationKind({
      status: "completed",
      notifiedT24: true, notifiedT0: true, notifiedComplete: true,
    }, NOW)).toBe(null);
  });

  it("muy temprano (más de 24h antes) → null", () => {
    const r = nextNotificationKind({
      status: "scheduled",
      scheduledStart: new Date(NOW.getTime() + 48 * 3600_000),
      scheduledEnd: new Date(NOW.getTime() + 50 * 3600_000),
      notifiedT24: false,
    }, NOW);
    expect(r).toBe(null);
  });

  it("null window → null", () => {
    expect(nextNotificationKind(null)).toBe(null);
  });
});

describe("formatDuration", () => {
  it("minutos", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-01T00:30:00Z");
    expect(formatDuration(start, end)).toBe("30 min");
  });
  it("horas exactas", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-01T02:00:00Z");
    expect(formatDuration(start, end)).toBe("2h");
  });
  it("horas + min", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-01T02:30:00Z");
    expect(formatDuration(start, end)).toBe("2h 30min");
  });
  it("end <= start → ''", () => {
    expect(formatDuration(new Date(), new Date())).toBe("");
  });
});

describe("statusTone / statusLabel", () => {
  it("cancelled → soft", () => {
    expect(statusTone({ status: "cancelled" })).toBe("soft");
  });
  it("completed → success", () => {
    expect(statusTone({ status: "completed" })).toBe("success");
  });
  it("in_progress → warn (visible)", () => {
    expect(statusTone({ status: "in_progress",
      scheduledStart: PAST, scheduledEnd: FUTURE_END,
    }, NOW)).toBe("warn");
  });
  it("upcoming → soft", () => {
    expect(statusTone({ status: "scheduled", scheduledStart: FUTURE_START }, NOW)).toBe("soft");
  });

  it("statusLabel es/en", () => {
    expect(statusLabel("scheduled")).toBe("Programado");
    expect(statusLabel("in_progress", "en")).toBe("In progress");
    expect(statusLabel("WUT")).toBe("WUT");
  });
});

describe("activeMaintenances", () => {
  it("filtra in-progress + upcoming, sort por start asc", () => {
    const rows = [
      { id: "later", status: "scheduled",
        scheduledStart: new Date(NOW.getTime() + 48 * 3600_000),
        scheduledEnd: new Date(NOW.getTime() + 50 * 3600_000) },
      { id: "now", status: "in_progress",
        scheduledStart: PAST, scheduledEnd: FUTURE_END },
      { id: "soon", status: "scheduled",
        scheduledStart: new Date(NOW.getTime() + 1 * 3600_000),
        scheduledEnd: new Date(NOW.getTime() + 2 * 3600_000) },
      { id: "done", status: "completed",
        scheduledStart: PAST, scheduledEnd: PAST },
    ];
    const r = activeMaintenances(rows, NOW);
    expect(r.map((x) => x.id)).toEqual(["now", "soon", "later"]);
  });
  it("non-array → []", () => {
    expect(activeMaintenances(null)).toEqual([]);
  });
});

describe("recentCompletedMaintenances", () => {
  it("últimos 14 días por defecto", () => {
    const rows = [
      { status: "completed", actualEnd: new Date("2026-04-20T00:00:00Z") },
      { status: "completed", actualEnd: new Date("2026-04-01T00:00:00Z") }, // > 14d
      { status: "in_progress" },
    ];
    const r = recentCompletedMaintenances(rows, { now: NOW });
    expect(r).toHaveLength(1);
  });

  it("cancelled cuenta como reciente si end matches", () => {
    const r = recentCompletedMaintenances([
      { status: "cancelled", scheduledEnd: new Date("2026-04-20T00:00:00Z") },
    ], { now: NOW });
    expect(r).toHaveLength(1);
  });
});
