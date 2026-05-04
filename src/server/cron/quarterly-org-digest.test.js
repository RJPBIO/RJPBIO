/* Tests Phase 6F SP-C — cron quarterly-org-digest */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db", () => ({ db: vi.fn() }));
vi.mock("../audit", () => ({ auditLog: vi.fn(async () => ({})) }));
vi.mock("../executiveReport", () => ({ buildExecutiveReport: vi.fn() }));
vi.mock("../email", () => ({
  sendExecutiveReportDigest: vi.fn(async () => ({ MessageID: "msg-1" })),
}));

import { runQuarterlyOrgDigest } from "./quarterly-org-digest";
import { db } from "../db";
import { auditLog } from "../audit";
import { buildExecutiveReport } from "../executiveReport";
import { sendExecutiveReportDigest } from "../email";

beforeEach(() => {
  vi.clearAllMocks();
});

function buildOrm({ orgs = [], memberships = [], users = [] } = {}) {
  return {
    org: {
      findMany: vi.fn(async () => orgs),
    },
    membership: {
      findMany: vi.fn(async ({ where }) => {
        if (where?.orgId) return memberships.filter((m) => m.orgId === where.orgId);
        return memberships;
      }),
    },
    user: {
      findMany: vi.fn(async ({ where }) => {
        if (where?.id?.in) return users.filter((u) => where.id.in.includes(u.id));
        return users;
      }),
    },
  };
}

describe("runQuarterlyOrgDigest — Phase 6F SP-C", () => {
  it("retorna processed:0 cuando no hay orgs B2B", async () => {
    db.mockResolvedValue(buildOrm({ orgs: [] }));
    const r = await runQuarterlyOrgDigest();
    expect(r.processed).toBe(0);
    expect(r.details.scanned).toBe(0);
    expect(buildExecutiveReport).not.toHaveBeenCalled();
    expect(sendExecutiveReportDigest).not.toHaveBeenCalled();
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "cron.quarterly-org-digest.tick" })
    );
  });

  it("skip cuando org no tiene admins/owners", async () => {
    db.mockResolvedValue(
      buildOrm({
        orgs: [{ id: "o1", name: "Acme", personal: false, branding: null }],
        memberships: [{ orgId: "o1", userId: "u1", role: "MEMBER" }],
      })
    );
    const r = await runQuarterlyOrgDigest();
    expect(r.details.skipped).toBe(1);
    expect(buildExecutiveReport).not.toHaveBeenCalled();
    expect(sendExecutiveReportDigest).not.toHaveBeenCalled();
  });

  it("skip cuando reporte está suppressed (k-anon)", async () => {
    db.mockResolvedValue(
      buildOrm({
        orgs: [{ id: "o1", name: "Tiny", personal: false }],
        memberships: [{ orgId: "o1", userId: "u_admin", role: "ADMIN" }],
        users: [{ id: "u_admin", email: "a@t.local", name: "Admin" }],
      })
    );
    buildExecutiveReport.mockResolvedValue({
      org: { id: "o1", activeMembers: 3 },
      suppressed: true,
      reason: "k_anonymity",
    });
    const r = await runQuarterlyOrgDigest();
    expect(r.details.skipped).toBe(1);
    expect(sendExecutiveReportDigest).not.toHaveBeenCalled();
  });

  it("envía email a cada admin/owner cuando reporte OK", async () => {
    db.mockResolvedValue(
      buildOrm({
        orgs: [{ id: "o1", name: "Acme", personal: false, branding: null, customDomainVerified: false }],
        memberships: [
          { orgId: "o1", userId: "u_owner", role: "OWNER" },
          { orgId: "o1", userId: "u_admin", role: "ADMIN" },
          { orgId: "o1", userId: "u_member", role: "MEMBER" }, // no debe recibir
        ],
        users: [
          { id: "u_owner", email: "o@t.local", name: "Owner", locale: "es" },
          { id: "u_admin", email: "a@t.local", name: "Admin", locale: "en" },
          { id: "u_member", email: "m@t.local", name: "Member" },
        ],
      })
    );
    buildExecutiveReport.mockResolvedValue({
      org: { id: "o1", activeMembers: 12, name: "Acme" },
      suppressed: false,
      kpis: { activeMembers: 12, sessionsTotal: 150, programCompletionRate: 0.6 },
    });

    const r = await runQuarterlyOrgDigest();
    expect(r.processed).toBe(2); // owner + admin (not member)
    expect(sendExecutiveReportDigest).toHaveBeenCalledTimes(2);
    expect(sendExecutiveReportDigest).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "o@t.local",
        adminName: "Owner",
        orgName: "Acme",
        highlights: expect.objectContaining({
          activeMembers: 12,
          sessionsTotal: 150,
          programCompletionRate: 0.6,
        }),
        locale: "es",
      })
    );
    expect(sendExecutiveReportDigest).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@t.local", locale: "en" })
    );
  });

  it("respeta branding del org (customDomain + locale)", async () => {
    db.mockResolvedValue(
      buildOrm({
        orgs: [{
          id: "o1",
          name: "Acme",
          personal: false,
          branding: { customDomain: "app.acme.com", logoUrl: "https://acme.com/logo.png" },
          customDomainVerified: true,
        }],
        memberships: [{ orgId: "o1", userId: "u_admin", role: "ADMIN" }],
        users: [{ id: "u_admin", email: "a@t.local", name: "Admin" }],
      })
    );
    buildExecutiveReport.mockResolvedValue({
      org: { id: "o1", activeMembers: 8 },
      suppressed: false,
      kpis: { activeMembers: 8, sessionsTotal: 50, programCompletionRate: 0.4 },
    });
    await runQuarterlyOrgDigest();
    expect(sendExecutiveReportDigest).toHaveBeenCalledWith(
      expect.objectContaining({
        branding: expect.objectContaining({ customDomain: "app.acme.com" }),
        customDomainVerified: true,
      })
    );
  });

  it("audit log fired con scanned + sent + skipped + errors", async () => {
    // Ambas orgs con admin para que mockResolvedValueOnce × 2 se consuman
    // (sin admins, el cron skipea ANTES de llamar buildReport y el mock
    // queue queda con residual que polluta tests siguientes).
    db.mockResolvedValue(
      buildOrm({
        orgs: [
          { id: "o1", name: "Big", personal: false },
          { id: "o2", name: "Small", personal: false },
        ],
        memberships: [
          { orgId: "o1", userId: "u_a", role: "ADMIN" },
          { orgId: "o2", userId: "u_b", role: "ADMIN" },
        ],
        users: [
          { id: "u_a", email: "a@t.local" },
          { id: "u_b", email: "b@t.local" },
        ],
      })
    );
    buildExecutiveReport
      .mockResolvedValueOnce({
        org: { id: "o1" }, suppressed: false, kpis: { activeMembers: 10, sessionsTotal: 50 },
      })
      .mockResolvedValueOnce({
        org: { id: "o2" }, suppressed: true, reason: "k_anonymity",
      });
    const r = await runQuarterlyOrgDigest();
    // Final tick log
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "cron.quarterly-org-digest.tick",
        payload: expect.objectContaining({
          scanned: 2,
          sent: 1,
          skipped: 1,
        }),
      })
    );
    expect(r.details.scanned).toBe(2);
    expect(r.details.sent).toBe(1);
    expect(r.details.skipped).toBe(1);
  });

  it("audit log per-org fired con orgId + activeMembers", async () => {
    db.mockResolvedValue(
      buildOrm({
        orgs: [{ id: "o1", name: "Acme", personal: false }],
        memberships: [{ orgId: "o1", userId: "u_a", role: "OWNER" }],
        users: [{ id: "u_a", email: "a@t.local" }],
      })
    );
    buildExecutiveReport.mockResolvedValue({
      org: { id: "o1" }, suppressed: false,
      kpis: { activeMembers: 8, sessionsTotal: 100, programCompletionRate: 0.5 },
    });
    await runQuarterlyOrgDigest();
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "o1",
        action: "cron.quarterly-org-digest.org",
        target: "o1",
        payload: expect.objectContaining({
          adminsTried: 1,
          activeMembers: 8,
          sessionsTotal: 100,
        }),
      })
    );
  });

  it("recupera de error en un org sin abortar otros", async () => {
    db.mockResolvedValue(
      buildOrm({
        orgs: [
          { id: "o_fail", name: "Fail", personal: false },
          { id: "o_ok", name: "OK", personal: false },
        ],
        memberships: [
          { orgId: "o_fail", userId: "u_f", role: "OWNER" },
          { orgId: "o_ok", userId: "u_o", role: "OWNER" },
        ],
        users: [
          { id: "u_f", email: "f@t.local" },
          { id: "u_o", email: "o@t.local" },
        ],
      })
    );
    // Primera org throws
    buildExecutiveReport.mockRejectedValueOnce(new Error("DB blew up"));
    // Segunda org ok
    buildExecutiveReport.mockResolvedValue({
      org: { id: "o_ok" }, suppressed: false,
      kpis: { activeMembers: 6, sessionsTotal: 30 },
    });

    const r = await runQuarterlyOrgDigest();
    expect(r.details.errors).toBe(1);
    expect(r.details.sent).toBe(1); // o_ok still sent
  });
});
