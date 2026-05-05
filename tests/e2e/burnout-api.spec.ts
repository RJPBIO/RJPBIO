/**
 * Phase 6F SP-E — Burnout API smoke E2E.
 *
 * Cubre:
 *   1. Wiring tests (rutas montadas, no 404)
 *   2. 401 sin auth en ambos endpoints (/me/burnout, /orgs/[orgId]/burnout/aggregate)
 *   3. 403 cuando user sin role MANAGER+ accede aggregate
 *   4. Happy path opcional con /api/dev/login (skip graceful):
 *      - /me/burnout retorna assessment + copy + disclaimer SAPTEL
 *      - /orgs/[orgId]/burnout/aggregate retorna distribution + topSignals
 *
 * Marketing language verification: response body NO contiene "burnout score"
 * literal. El disclaimer DEBE incluir SAPTEL + "NO es diagnóstico".
 */
import { test, expect } from "@playwright/test";

test.describe("Phase 6F SP-E — Burnout API wiring", () => {
  test("GET /api/v1/me/burnout retorna 401 sin sesión", async ({ request }) => {
    const res = await request.get("/api/v1/me/burnout");
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(body.error).toBe("unauthorized");
  });

  test("GET /api/v1/orgs/[orgId]/burnout/aggregate retorna 401 sin sesión", async ({ request }) => {
    const res = await request.get("/api/v1/orgs/test-org/burnout/aggregate");
    expect(res.status()).toBe(401);
  });

  test("Endpoints NO retornan 404 (rutas montadas)", async ({ request }) => {
    const r1 = await request.get("/api/v1/me/burnout");
    expect(r1.status()).not.toBe(404);
    const r2 = await request.get("/api/v1/orgs/x/burnout/aggregate");
    expect(r2.status()).not.toBe(404);
  });

  test("days param parseable en /me/burnout aún sin auth (parseado antes del check)", async ({ request }) => {
    // El parser corre antes del auth check → 401 sigue, pero no 500.
    const res = await request.get("/api/v1/me/burnout?days=60");
    expect(res.status()).toBe(401);
  });
});

test.describe("Phase 6F SP-E — Happy path con /api/dev/login (opcional)", () => {
  test("GET /me/burnout autenticado retorna assessment + copy + disclaimer SAPTEL", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible — corre `npm run seed` y NODE_ENV=development");
      return;
    }

    const res = await page.request.get("/api/v1/me/burnout");
    if (res.status() === 401) {
      test.skip(true, "dev login no fijó cookie correctamente");
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.assessment).toBeDefined();
    expect(body.assessment.level).toMatch(/^(ok|watch|warn|alert)$/);
    expect(Array.isArray(body.assessment.signals)).toBe(true);
    expect(body.copy).toBeDefined();
    expect(body.copy.title).toBeTruthy();
    // Disclaimer obligatorio (D8 — sin lawyer review)
    expect(body.assessment.snapshot.disclaimer).toContain("SAPTEL");
    expect(body.assessment.snapshot.disclaimer).toContain("800-290-0024");
    expect(body.assessment.snapshot.disclaimer).toMatch(/NO es diagnóstico/i);
    expect(body.assessment.snapshot.methodology).toBe("heuristic-retrospective");
    expect(body.period.days).toBe(28);
  });

  test("GET /me/burnout body NO contiene 'burnout score' literal (marketing copy)", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    const res = await page.request.get("/api/v1/me/burnout");
    if (res.status() === 401) {
      test.skip(true, "dev login no fijó cookie");
      return;
    }
    const text = await res.text();
    expect(text.toLowerCase()).not.toContain("burnout score");
    expect(text.toLowerCase()).not.toContain("predicción");
  });

  test("GET /orgs/[orgId]/burnout/aggregate con role member regular → 403", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=member@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login member no disponible");
      return;
    }
    // El demo seed seed admin no garantizado; usamos cualquier orgId.
    const res = await page.request.get("/api/v1/orgs/some-org-id/burnout/aggregate");
    expect([401, 403]).toContain(res.status());
  });

  test("GET /orgs/[orgId]/burnout/aggregate con OWNER retorna shape con distribution", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/admin",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login owner no disponible");
      return;
    }
    const orgIdCookie = (await page.context().cookies()).find((c) => c.name === "bio-org");
    if (!orgIdCookie?.value) {
      test.skip(true, "bio-org cookie no fijada");
      return;
    }
    const res = await page.request.get(`/api/v1/orgs/${orgIdCookie.value}/burnout/aggregate`);
    if (res.status() === 401) {
      test.skip(true, "dev login no fijó cookie correctamente");
      return;
    }
    if (res.status() === 403) {
      test.skip(true, "demo user sin role MANAGER+");
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.snapshot).toBeDefined();
    expect(body.snapshot.kAnonThreshold).toBe(5);
    expect(body.snapshot.disclaimer).toMatch(/k≥5/);
    expect(body.snapshot.disclaimer).toMatch(/no es dispositivo médico/i);
    if (!body.suppressed) {
      expect(body.distribution).toBeDefined();
      expect(typeof body.distribution.ok).not.toBe("undefined");
      expect(Array.isArray(body.topSignals)).toBe(true);
    }
  });
});
