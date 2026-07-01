/* Harness de ESCALA — simula una empresa grande y ejercita
   buildExecutiveReport para probar que los fixes de escala (N+1,
   O(n×m) cohortes de programa, O(n×w) tendencias semanales) aguantan
   sin blowup cuadrático ni crash. La correctitud fina la cubre
   executiveReport.test.js; aquí probamos VOLUMEN. */

import { describe, test, expect } from "vitest";
import { db } from "./db";
import { buildExecutiveReport } from "./executiveReport";

const DAY = 86400000;
let SEED = 900000;
const nid = (p) => `${p}_${++SEED}`;

async function seedLargeOrg({ members = 200 } = {}) {
  const orm = await db();
  const orgId = nid("bigorg");
  await orm.org.create({ data: { id: orgId, name: "MegaCorp", slug: orgId, plan: "ENTERPRISE", personal: false, seats: 1000 } });
  const now = Date.now();
  const userIds = [];
  for (let u = 0; u < members; u++) {
    const userId = nid("u");
    userIds.push(userId);
    await orm.user.create({ data: { id: userId, email: `${userId}@mega.local`, locale: "es", timezone: "America/Mexico_City" } });
    await orm.membership.create({ data: { orgId, userId, role: "MEMBER", deactivatedAt: null } });
    // ~30 sesiones en 90d
    for (let s = 0; s < 30; s++) {
      await orm.neuralSession.create({ data: {
        orgId: `personal-${userId}`, userId, protocolId: String((s % 6) + 1),
        durationSec: 120, coherenciaDelta: 3 + (s % 5), moodPre: 4, moodPost: 6,
        completedAt: new Date(now - (s * 3) * DAY),
      }});
    }
    // ~12 lecturas HRV
    for (let h = 0; h < 12; h++) {
      await orm.hrvMeasurement.create({ data: {
        userId, orgId: null, rmssd: 40 + (h % 20), lnRmssd: Math.log(40 + (h % 20)),
        meanHr: 68, durationSec: 60, n: 60, source: "camera", measuredAt: new Date(now - (h * 7) * DAY),
      }});
    }
    // 4 instrumentos pss-4 (pre y post de un programa)
    for (let k = 0; k < 4; k++) {
      await orm.instrument.create({ data: {
        userId, orgId: null, instrumentId: "pss-4", score: 8 - k, level: "moderado",
        answers: {}, takenAt: new Date(now - (60 - k * 15) * DAY),
      }});
    }
    // 2 respuestas NOM-035
    for (let n = 0; n < 2; n++) {
      await orm.nom35Response.create({ data: {
        orgId, userId, guia: "III", answers: {}, total: 40 + n * 8, nivel: "medio",
        porDominio: { liderazgo: 10 + n, cargaTrabajo: 18 - n }, porCategoria: {},
        completedAt: new Date(now - (n * 30 + 5) * DAY),
      }});
    }
  }
  return { orgId, userIds, now };
}

describe("buildExecutiveReport — escala empresa grande", () => {
  test("200 miembros / ~9k filas → reporte válido sin blowup", async () => {
    const { orgId } = await seedLargeOrg({ members: 200 });
    const t0 = Date.now();
    const report = await buildExecutiveReport(orgId, { days: 90 });
    const ms = Date.now() - t0;

    expect(report).toBeTruthy();
    expect(report.suppressed).toBeFalsy();
    // Shape canónico presente a escala.
    expect(report.kpis).toBeTruthy();
    expect(report.engagement || report.kpis).toBeTruthy();
    expect(report.hrv || report.nom35 || report.instruments).toBeTruthy();
    // Guarda-raíl de perf: con los fixes O(n) esto corre en ~1-2s; un
    // blowup cuadrático (pre-fix) lo dispararía muy por encima. Bound
    // generoso para no ser flaky en CI lento.
    expect(ms).toBeLessThan(15000);
  }, 30000);
});
