/* Tests — cron nom35-reapply-reminder.
   Cubre la lógica pura de selección (vencidos > 90 días) y el runner con
   orm.groupBy mockeado (encola push solo a vencidos, audit, shape de retorno). */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db", () => ({ db: vi.fn() }));
vi.mock("../audit", () => ({ auditLog: vi.fn(async () => ({})) }));
vi.mock("../push-delivery", () => ({
  enqueuePush: vi.fn(async () => ({ ok: true, id: "po_1" })),
}));

import { runNom35ReapplyReminder, selectDueForReapplication } from "./nom35-reapply-reminder";
import { db } from "../db";
import { enqueuePush } from "../push-delivery";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

describe("selectDueForReapplication", () => {
  it("marca vencido a quien tiene >90 días desde su última evaluación", () => {
    const due = selectDueForReapplication(
      [
        { userId: "viejo", completedAt: NOW - 100 * DAY },
        { userId: "reciente", completedAt: NOW - 10 * DAY },
      ],
      { now: NOW, periodDays: 90 }
    );
    expect(due).toEqual(["viejo"]);
  });

  it("incluye el borde exacto de 90 días (ts <= cutoff)", () => {
    const due = selectDueForReapplication(
      [{ userId: "borde", completedAt: NOW - 90 * DAY }],
      { now: NOW, periodDays: 90 }
    );
    expect(due).toEqual(["borde"]);
  });

  it("acepta Date, número e ISO; descarta inválidos y sin userId", () => {
    const due = selectDueForReapplication(
      [
        { userId: "date", completedAt: new Date(NOW - 120 * DAY) },
        { userId: "iso", completedAt: new Date(NOW - 200 * DAY).toISOString() },
        { userId: "num", completedAt: NOW - 95 * DAY },
        { userId: "nulo", completedAt: null },
        { userId: "", completedAt: NOW - 999 * DAY },
        { completedAt: NOW - 999 * DAY },
      ],
      { now: NOW, periodDays: 90 }
    );
    expect(due.sort()).toEqual(["date", "iso", "num"]);
  });

  it("lista vacía / undefined no rompe", () => {
    expect(selectDueForReapplication([], { now: NOW })).toEqual([]);
    expect(selectDueForReapplication(undefined, { now: NOW })).toEqual([]);
  });
});

describe("runNom35ReapplyReminder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("encola push solo a los vencidos y devuelve el resumen", async () => {
    db.mockResolvedValue({
      nom35Response: {
        groupBy: vi.fn().mockResolvedValue([
          { userId: "u1", _max: { completedAt: new Date(Date.now() - 120 * DAY) } },
          { userId: "u2", _max: { completedAt: new Date(Date.now() - 5 * DAY) } },
          { userId: "u3", _max: { completedAt: new Date(Date.now() - 100 * DAY) } },
        ]),
      },
    });

    const res = await runNom35ReapplyReminder();

    expect(enqueuePush).toHaveBeenCalledTimes(2);
    const targets = enqueuePush.mock.calls.map((c) => c[0]).sort();
    expect(targets).toEqual(["u1", "u3"]);
    expect(enqueuePush.mock.calls[0][1]).toMatchObject({ kind: "nom35-reapply", href: "/nom35/aplicador" });
    expect(res).toMatchObject({ processed: 2, errors: 0, details: { candidates: 3, due: 2 } });
  });

  it("no rompe si groupBy falla (degrada a 0)", async () => {
    db.mockResolvedValue({
      nom35Response: { groupBy: vi.fn().mockRejectedValue(new Error("db down")) },
    });
    const res = await runNom35ReapplyReminder();
    expect(enqueuePush).not.toHaveBeenCalled();
    expect(res).toMatchObject({ processed: 0, errors: 0, details: { candidates: 0, due: 0 } });
  });
});
