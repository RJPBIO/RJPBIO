/* Tests Phase 6F SP-E — cron burnout-scan.
   Mock orm + buildUserSnapshot + assessBurnoutEnhanced + enqueuePush + auditLog.
   Cubre: no users (no-op), persiste score per user, push solo en warn/alert,
   throttle 7d, errores per-user no abortan, audit log completo.

   Lección SP-C: usar mockResolvedValue (no Once) cuando el test no necesita
   sequential responses; cuando sí, asegurar que TODAS se consuman para evitar
   queue residual entre tests. */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db", () => ({ db: vi.fn() }));
vi.mock("../audit", () => ({ auditLog: vi.fn(async () => ({})) }));
vi.mock("../push-delivery", () => ({
  enqueuePush: vi.fn(async () => ({ ok: true, id: "po_1" })),
}));
vi.mock("../snapshot", () => ({ buildUserSnapshot: vi.fn() }));
vi.mock("../../lib/burnoutEnhanced", () => ({
  assessBurnoutEnhanced: vi.fn(),
}));

import { runBurnoutScan } from "./burnout-scan";
import { db } from "../db";
import { auditLog } from "../audit";
import { enqueuePush } from "../push-delivery";
import { buildUserSnapshot } from "../snapshot";
import { assessBurnoutEnhanced } from "../../lib/burnoutEnhanced";

beforeEach(() => {
  vi.clearAllMocks();
});

function buildOrm({ activeUserIds = [], recentlyNotifiedByUser = {} } = {}) {
  // activeUserIds: array de userId strings que serán "scanned"
  // recentlyNotifiedByUser: { userId: { id, notifiedAt } } — un user puede
  //   tener un previous BurnoutScore con notifiedAt en últimos 7d (throttled)
  return {
    neuralSession: {
      findMany: vi.fn(async () => activeUserIds.map((id) => ({ userId: id }))),
    },
    burnoutScore: {
      create: vi.fn(async ({ data }) => ({
        id: `bs_new_${data.userId}`,
        ...data,
        notifiedAt: null,
        computedAt: new Date(),
      })),
      findFirst: vi.fn(async ({ where }) => {
        // Solo returna recentNotified si user está en throttle map
        if (where?.userId && recentlyNotifiedByUser[where.userId]) {
          return recentlyNotifiedByUser[where.userId];
        }
        return null;
      }),
      update: vi.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    },
  };
}

describe("runBurnoutScan — Phase 6F SP-E", () => {
  it("retorna processed:0 cuando no hay users activos", async () => {
    db.mockResolvedValue(buildOrm({ activeUserIds: [] }));
    const r = await runBurnoutScan();
    expect(r.processed).toBe(0);
    expect(r.details.scanned).toBe(0);
    expect(buildUserSnapshot).not.toHaveBeenCalled();
    expect(enqueuePush).not.toHaveBeenCalled();
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "cron.burnout-scan.tick" })
    );
  });

  it("scanned counter incrementa per user activo", async () => {
    db.mockResolvedValue(buildOrm({ activeUserIds: ["u1", "u2", "u3"] }));
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u_x", orgId: null }, sessions: [], hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "ok", signals: [], metrics: {}, snapshot: {},
    });

    const r = await runBurnoutScan();
    expect(r.details.scanned).toBe(3);
    expect(buildUserSnapshot).toHaveBeenCalledTimes(3);
  });

  it("persiste BurnoutScore per user con level + signals + metrics", async () => {
    const orm = buildOrm({ activeUserIds: ["u1"] });
    db.mockResolvedValue(orm);
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u1", orgId: "org_1" }, sessions: [], hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "watch",
      signals: ["freqDrop"],
      metrics: { freqDrop: 0.4 },
      snapshot: {},
    });

    const r = await runBurnoutScan();
    expect(orm.burnoutScore.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        orgId: "org_1",
        level: "watch",
        signals: ["freqDrop"],
        metrics: { freqDrop: 0.4 },
      }),
    });
    expect(r.details.scoresCreated).toBe(1);
  });

  it("NO envía push para level=ok ni level=watch", async () => {
    db.mockResolvedValue(buildOrm({ activeUserIds: ["u_ok", "u_watch"] }));
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u_x", orgId: null }, sessions: [], hrv: [],
    });
    // First call returns ok, second returns watch
    assessBurnoutEnhanced
      .mockReturnValueOnce({ level: "ok", signals: [], metrics: {}, snapshot: {} })
      .mockReturnValueOnce({ level: "watch", signals: ["freqDrop"], metrics: {}, snapshot: {} });

    const r = await runBurnoutScan();
    expect(enqueuePush).not.toHaveBeenCalled();
    expect(r.details.notified).toBe(0);
  });

  it("envía push para level=warn cuando NO hay throttle reciente", async () => {
    const orm = buildOrm({ activeUserIds: ["u_warn"] });
    db.mockResolvedValue(orm);
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u_warn", orgId: null }, sessions: [], hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "warn",
      signals: ["freqDrop", "hrvDecline"],
      metrics: {},
      snapshot: {},
    });

    const r = await runBurnoutScan();
    expect(enqueuePush).toHaveBeenCalledWith(
      "u_warn",
      expect.objectContaining({
        kind: "wellbeing-trends",
        href: "/app",
        title: expect.stringMatching(/Patrones a revisar/i),
      })
    );
    expect(orm.burnoutScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notifiedAt: expect.any(Date) }),
      })
    );
    expect(r.details.notified).toBe(1);
  });

  it("envía push para level=alert con copy distinto de warn", async () => {
    db.mockResolvedValue(buildOrm({ activeUserIds: ["u_alert"] }));
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u_alert", orgId: null }, sessions: [], hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "alert",
      signals: ["freqDrop", "moodSlope", "hrvDecline"],
      metrics: {},
      snapshot: {},
    });

    await runBurnoutScan();
    expect(enqueuePush).toHaveBeenCalledWith(
      "u_alert",
      expect.objectContaining({
        title: expect.stringMatching(/wellbeing necesita atención/i),
      })
    );
  });

  it("throttle 7d: NO envía push si user ya recibió uno en últimos 7 días", async () => {
    const recentTs = new Date(Date.now() - 2 * 86400_000); // 2d ago
    const orm = buildOrm({
      activeUserIds: ["u_throttled"],
      recentlyNotifiedByUser: {
        u_throttled: { id: "bs_old", notifiedAt: recentTs },
      },
    });
    db.mockResolvedValue(orm);
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u_throttled", orgId: null }, sessions: [], hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "warn", signals: ["freqDrop"], metrics: {}, snapshot: {},
    });

    const r = await runBurnoutScan();
    expect(enqueuePush).not.toHaveBeenCalled();
    expect(r.details.throttled).toBe(1);
    // Score igual fue creado (siempre persistimos)
    expect(orm.burnoutScore.create).toHaveBeenCalled();
  });

  it("skip cuando buildUserSnapshot retorna null", async () => {
    db.mockResolvedValue(buildOrm({ activeUserIds: ["u_no_snap"] }));
    buildUserSnapshot.mockResolvedValue(null);

    const r = await runBurnoutScan();
    expect(r.details.skipped).toBe(1);
    expect(assessBurnoutEnhanced).not.toHaveBeenCalled();
    expect(enqueuePush).not.toHaveBeenCalled();
  });

  it("error per-user NO aborta el scan (otros users continúan)", async () => {
    db.mockResolvedValue(buildOrm({ activeUserIds: ["u_fail", "u_ok"] }));
    // u_fail: snapshot lanza
    buildUserSnapshot
      .mockRejectedValueOnce(new Error("snapshot blew up"))
      .mockResolvedValueOnce({
        user: { id: "u_ok", orgId: null }, sessions: [], hrv: [],
      });
    assessBurnoutEnhanced.mockReturnValue({
      level: "ok", signals: [], metrics: {}, snapshot: {},
    });

    const r = await runBurnoutScan();
    expect(r.details.errors).toBeGreaterThanOrEqual(1);
    // u_ok igual procesado
    expect(r.details.scanned).toBe(2);
    expect(r.details.scoresCreated).toBe(1); // solo u_ok
  });

  it("audit log final tick con todas las stats agregadas", async () => {
    db.mockResolvedValue(buildOrm({ activeUserIds: ["u1", "u2"] }));
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u_x", orgId: null }, sessions: [], hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "ok", signals: [], metrics: {}, snapshot: {},
    });

    await runBurnoutScan();
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "cron.burnout-scan.tick",
        payload: expect.objectContaining({
          scanned: 2,
          scoresCreated: 2,
          notified: 0,
          throttled: 0,
          skipped: 0,
        }),
      })
    );
  });

  it("orgId del snapshot se persiste en BurnoutScore", async () => {
    const orm = buildOrm({ activeUserIds: ["u1"] });
    db.mockResolvedValue(orm);
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u1", orgId: "org_b2b" }, sessions: [], hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "ok", signals: [], metrics: {}, snapshot: {},
    });
    await runBurnoutScan();
    expect(orm.burnoutScore.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ orgId: "org_b2b" }),
    });
  });
});
