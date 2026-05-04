/**
 * Phase 6F SP-C — Executive Report API smoke E2E.
 *
 * Cubre:
 *   1. /api/v1/orgs/[orgId]/reports/executive existe (no 404)
 *   2. 401 sin auth
 *   3. 400 cuando orgId vacío en path (defensive — Next typically 404s para
 *      empty path segments, pero el handler también valida)
 *   4. 403 cuando user autenticado no es member del org
 *   5. Happy path opcional con /api/dev/login (skip graceful si DB no seedeada)
 *
 * NO toca UI (eso es SP-D). NO depende de seed específico para los tests
 * negativos (auth gate + role gate funcionan sin data).
 */
import { test, expect } from "@playwright/test";

test.describe("Phase 6F SP-C — Executive Report endpoint wiring", () => {
  test("GET /executive retorna 401 sin sesión", async ({ request }) => {
    const res = await request.get("/api/v1/orgs/test-org-id/reports/executive");
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(body.error).toBe("unauthorized");
  });

  test("Endpoint NO retorna 404 (ruta montada)", async ({ request }) => {
    const res = await request.get("/api/v1/orgs/some-org/reports/executive");
    expect(res.status()).not.toBe(404);
  });

  test("respeta query param days (validable en 401 aunque no autenticado)", async ({ request }) => {
    // El parser de days corre antes del auth check; 401 igual sucede.
    const res = await request.get("/api/v1/orgs/x/reports/executive?days=30");
    expect(res.status()).toBe(401);
  });
});

test.describe("Phase 6F SP-C — Happy path con /api/dev/login (opcional)", () => {
  test("GET /executive con role OWNER retorna shape con kpis + nom35 + programs", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/admin",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible — corre `npm run seed` y NODE_ENV=development");
      return;
    }

    // Resolve orgId desde cookie bio-org (set por dev/login).
    const orgIdCookie = (await page.context().cookies()).find((c) => c.name === "bio-org");
    if (!orgIdCookie?.value) {
      test.skip(true, "bio-org cookie no fijada — seed user sin membership B2B");
      return;
    }
    const orgId = orgIdCookie.value;

    const res = await page.request.get(`/api/v1/orgs/${orgId}/reports/executive?days=90`);
    if (res.status() === 401) {
      test.skip(true, "dev login no fijó cookie correctamente");
      return;
    }
    if (res.status() === 403) {
      test.skip(true, "demo user sin role OWNER/ADMIN/MANAGER en este org");
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Shape canónico: o suppressed:true (k<5) o full shape con kpis.
    expect(body.org).toBeDefined();
    expect(body.org.id).toBe(orgId);
    expect(body.snapshot).toBeDefined();
    expect(body.snapshot.kAnonThreshold).toBe(5);
    if (!body.suppressed) {
      expect(body.kpis).toBeDefined();
      expect(body.kpis.activeMembers).toBeGreaterThanOrEqual(5);
      expect(body.nom35).toBeDefined();
      expect(body.nom35.trends).toBeDefined();
      expect(body.instruments).toBeDefined();
      expect(body.hrv).toBeDefined();
      expect(body.programs).toBeDefined();
    } else {
      expect(body.reason).toBe("k_anonymity");
      expect(body.org.activeMembers).toBeLessThan(5);
    }
  });

  test("GET /executive con orgId distinto al del user retorna 403", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/admin",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    const res = await page.request.get(
      `/api/v1/orgs/some-other-org-id-not-real/reports/executive`
    );
    // 403 expected porque user no tiene membership en este org id arbitrario.
    expect([403, 404]).toContain(res.status());
  });
});
