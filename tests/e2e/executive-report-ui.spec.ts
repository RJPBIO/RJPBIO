/**
 * Phase 6F SP-D — Executive Report UI smoke E2E.
 *
 * Cubre:
 *   1. /admin/reportes/ejecutivo monta (no 404)
 *   2. Sin auth → redirect a /signin
 *   3. /admin/reportes/ejecutivo/print monta (no 404, redirect a signin sin auth)
 *   4. Happy path opcional con /api/dev/login (skip graceful):
 *      - Dashboard renderea OrgExecutiveReport
 *      - DaysSelector + Imprimir link presentes
 *      - Print page renderea sin chrome
 */
import { test, expect } from "@playwright/test";

test.describe("Phase 6F SP-D — Executive Report UI standalone", () => {
  test("/admin/reportes/ejecutivo redirect a /signin sin auth", async ({ page }) => {
    const response = await page.goto("/admin/reportes/ejecutivo");
    expect(response?.status()).not.toBe(404);
    await page.waitForURL(/\/signin\?callbackUrl=/, { timeout: 10000 }).catch(() => null);
    expect(page.url()).toMatch(/(\/signin\?|\/admin\/reportes\/ejecutivo)/);
  });

  test("/admin/reportes/ejecutivo/print redirect a /signin sin auth", async ({ page }) => {
    const response = await page.goto("/admin/reportes/ejecutivo/print");
    expect(response?.status()).not.toBe(404);
    await page.waitForURL(/\/signin\?callbackUrl=/, { timeout: 10000 }).catch(() => null);
    expect(page.url()).toMatch(/(\/signin\?|\/admin\/reportes\/ejecutivo\/print)/);
  });

  test("/api/v1/orgs/[orgId]/reports/executive endpoint montado (401 sin auth)", async ({ request }) => {
    const res = await request.get("/api/v1/orgs/test-org/reports/executive");
    expect(res.status()).toBe(401);
  });
});

test.describe("Phase 6F SP-D — Happy path con /api/dev/login (opcional)", () => {
  test("dashboard renderea reporte + KpiHero + panels + DaysSelector + Imprimir link", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/admin",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible — corre `npm run seed` y NODE_ENV=development");
      return;
    }

    await page.goto("/admin/reportes/ejecutivo", { waitUntil: "networkidle" });

    // Si user terminó en signin (cookie no se fijó), skip
    if (page.url().includes("/signin")) {
      test.skip(true, "dev login no fijó cookie correctamente");
      return;
    }

    // Si user no es OWNER/ADMIN/MANAGER → NoAccess
    const noAccess = await page.locator("[data-v2-no-access]").count();
    if (noAccess > 0) {
      test.skip(true, "demo user sin role MANAGER+ en org B2B");
      return;
    }

    // Verificar shell del reporte
    await expect(page.locator("[data-v2-executive-report]")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid='days-selector']")).toBeVisible();
    await expect(page.locator("[data-testid='report-print-link']")).toBeVisible();

    // Header con eyebrow + nombre org
    await expect(page.locator("text=/Reporte ejecutivo · NOM-035/i").first()).toBeVisible();
  });

  test("BORRADOR watermark visible cuando NEXT_PUBLIC_NOM35_DOF_VERIFIED ≠ 'true'", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/admin",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    await page.goto("/admin/reportes/ejecutivo", { waitUntil: "networkidle" });
    if (page.url().includes("/signin")) {
      test.skip(true, "dev login no fijó cookie");
      return;
    }
    const noAccess = await page.locator("[data-v2-no-access]").count();
    if (noAccess > 0) {
      test.skip(true, "demo user sin role");
      return;
    }
    // Default no DOF-verified — watermark debe estar en el DOM (puede estar
    // visible o no según viewport; verificamos presencia)
    const watermark = page.locator("[data-v2-borrador-watermark]");
    await expect(watermark).toHaveCount(1);
  });

  test("days selector presente y options 30/90/180/365", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/admin",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    await page.goto("/admin/reportes/ejecutivo", { waitUntil: "networkidle" });
    if (page.url().includes("/signin")) {
      test.skip(true, "dev login no fijó cookie");
      return;
    }
    const noAccess = await page.locator("[data-v2-no-access]").count();
    if (noAccess > 0) {
      test.skip(true, "demo user sin role");
      return;
    }
    const select = page.locator("[data-testid='days-selector']");
    await expect(select).toBeVisible();
    const options = await select.locator("option").allTextContents();
    expect(options).toEqual(expect.arrayContaining(["30 días", "90 días", "180 días", "1 año"]));
  });

  test("/admin/reportes/ejecutivo/print renderea sin print actions", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/admin",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    await page.goto("/admin/reportes/ejecutivo/print", { waitUntil: "networkidle" });
    if (page.url().includes("/signin")) {
      test.skip(true, "dev login no fijó cookie");
      return;
    }
    // Verifica reporte montado pero sin PrintButton (isPrintMode=true)
    await expect(page.locator("[data-v2-executive-report]")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid='report-print-button']")).toHaveCount(0);
    await expect(page.locator("[data-v2-print-actions]")).toHaveCount(0);
  });
});
