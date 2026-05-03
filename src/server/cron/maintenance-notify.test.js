import { describe, it, expect, vi, beforeEach } from "vitest";

const tables = { maintenanceWindow: [] };
function makeOrm() {
  return {
    maintenanceWindow: {
      findMany: async ({ where, take = 100 }) => {
        return tables.maintenanceWindow.filter((w) => {
          if (where.status && w.status !== where.status) return false;
          if (where.notifiedT24 === false && w.notifiedT24) return false;
          if (where.notifiedT0 === false && w.notifiedT0) return false;
          if (where.notifiedComplete === false && w.notifiedComplete) return false;
          if (where.scheduledStart) {
            const ws = new Date(w.scheduledStart).getTime();
            if (where.scheduledStart.gte && ws < where.scheduledStart.gte.getTime()) return false;
            if (where.scheduledStart.lte && ws > where.scheduledStart.lte.getTime()) return false;
          }
          return true;
        }).slice(0, take);
      },
      update: async ({ where, data }) => {
        const w = tables.maintenanceWindow.find((x) => x.id === where.id);
        if (!w) throw new Error("not found");
        Object.assign(w, data);
        return w;
      },
    },
  };
}

vi.mock("../db", () => ({ db: vi.fn(async () => makeOrm()) }));
vi.mock("../audit", () => ({ auditLog: vi.fn(async () => ({})) }));

const { runMaintenanceNotify } = await import("./maintenance-notify.js");

beforeEach(() => {
  const now = Date.now();
  const HOUR = 3600_000;
  tables.maintenanceWindow = [
    // T-24 candidate (24h en futuro)
    {
      id: "w1", status: "scheduled",
      scheduledStart: new Date(now + 24 * HOUR),
      scheduledEnd: new Date(now + 25 * HOUR),
      components: ["api"],
      notifiedT24: false, notifiedT0: false, notifiedComplete: false,
    },
    // T-0 candidate (now)
    {
      id: "w2", status: "scheduled",
      scheduledStart: new Date(now),
      scheduledEnd: new Date(now + HOUR),
      components: [],
      notifiedT24: true, notifiedT0: false, notifiedComplete: false,
    },
    // Completed candidate
    {
      id: "w3", status: "completed",
      scheduledStart: new Date(now - 2 * HOUR),
      scheduledEnd: new Date(now - HOUR),
      actualEnd: new Date(now - HOUR),
      components: [],
      notifiedT24: true, notifiedT0: true, notifiedComplete: false,
    },
    // Future window not in T-24 range yet (48h) — should NOT notify.
    {
      id: "w4", status: "scheduled",
      scheduledStart: new Date(now + 48 * HOUR),
      scheduledEnd: new Date(now + 49 * HOUR),
      components: [],
      notifiedT24: false, notifiedT0: false, notifiedComplete: false,
    },
    // Already-notified window — should be skipped.
    {
      id: "w5", status: "scheduled",
      scheduledStart: new Date(now + 24 * HOUR),
      scheduledEnd: new Date(now + 25 * HOUR),
      components: [],
      notifiedT24: true, notifiedT0: false, notifiedComplete: false,
    },
  ];
});

describe("runMaintenanceNotify", () => {
  it("notifies T-24, T-0, complete windows in same run", async () => {
    const r = await runMaintenanceNotify();
    expect(r.processed).toBe(3); // w1, w2, w3
    expect(r.errors).toBe(0);
    expect(r.details.notifiedT24).toBe(1);
    expect(r.details.notifiedT0).toBe(1);
    expect(r.details.notifiedComplete).toBe(1);
  });

  it("flips flags so re-runs are idempotent", async () => {
    await runMaintenanceNotify();
    expect(tables.maintenanceWindow.find((w) => w.id === "w1").notifiedT24).toBe(true);
    expect(tables.maintenanceWindow.find((w) => w.id === "w2").notifiedT0).toBe(true);
    expect(tables.maintenanceWindow.find((w) => w.id === "w3").notifiedComplete).toBe(true);
    // Second run should be no-op.
    const r2 = await runMaintenanceNotify();
    expect(r2.processed).toBe(0);
  });

  it("ignores windows out of T-24 range", async () => {
    const r = await runMaintenanceNotify();
    // w4 is 48h away → should NOT have been notified.
    expect(tables.maintenanceWindow.find((w) => w.id === "w4").notifiedT24).toBe(false);
    expect(r.processed).toBe(3);
  });

  it("skips already-notified windows", async () => {
    await runMaintenanceNotify();
    expect(tables.maintenanceWindow.find((w) => w.id === "w5").notifiedT24).toBe(true);
    // w5 was already notified before — no double-fire.
  });
});
