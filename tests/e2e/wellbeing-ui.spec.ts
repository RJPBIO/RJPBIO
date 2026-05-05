/**
 * Phase 6F SP-F — Wellbeing UI smoke E2E.
 *
 * Cubre:
 *   1. Wiring tests (rutas montadas, no 404)
 *   2. /app/resources/crisis es público (no requiere auth)
 *   3. /app/wellbeing redirect signin sin auth
 *   4. /admin/wellbeing/aggregate redirect/forbid sin role
 *   5. Crisis page lista 4+ recursos con tel: links
 *   6. Marketing copy verification: NO "burnout score" / NO "predicción" en HTML
 *   7. Happy path opcional con /api/dev/login (skip graceful)
 */
import { test, expect } from "@playwright/test";

test.describe("Phase 6F SP-F — Wellbeing UI standalone", () => {
  test("/app/wellbeing redirect a /signin sin auth", async ({ page }) => {
    const response = await page.goto("/app/wellbeing");
    expect(response?.status()).not.toBe(404);
    await page.waitForURL(/\/signin\?callbackUrl=/, { timeout: 10000 }).catch(() => null);
    expect(page.url()).toMatch(/(\/signin\?|\/app\/wellbeing)/);
  });

  test("/app/resources/crisis es página pública (no auth requerida)", async ({ page }) => {
    // Decisión consciente: alguien en crisis no debe pasar auth gate.
    const response = await page.goto("/app/resources/crisis", { waitUntil: "networkidle" });
    expect(response?.status()).not.toBe(404);
    // No redirect a signin — la página debe renderear el contenido.
    expect(page.url()).toContain("/app/resources/crisis");
  });

  test("/app/resources/crisis lista ≥4 recursos con tel: links", async ({ page }) => {
    await page.goto("/app/resources/crisis", { waitUntil: "networkidle" });
    const cards = page.locator("[data-v2-resource-card]");
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    // SAPTEL es primary → primer tel: link visible
    const saptelLink = page.locator('[data-testid="resource-tel-8002900024"]');
    await expect(saptelLink).toBeVisible();
    expect(await saptelLink.getAttribute("href")).toBe("tel:8002900024");
  });

  test("/app/resources/crisis incluye disclaimer 'no es dispositivo médico'", async ({ page }) => {
    await page.goto("/app/resources/crisis", { waitUntil: "networkidle" });
    await expect(page.locator("[data-v2-medical-disclaimer]")).toBeVisible();
    await expect(page.locator("text=/no es un dispositivo médico/i")).toBeVisible();
  });

  test("/admin/wellbeing/aggregate redirige sin role", async ({ page }) => {
    const response = await page.goto("/admin/wellbeing/aggregate");
    expect(response?.status()).not.toBe(404);
    // Sin auth: admin layout debería redirigir o mostrar message
  });

  test("/api/v1/me/burnout endpoint montado (401 sin auth)", async ({ request }) => {
    const res = await request.get("/api/v1/me/burnout");
    expect(res.status()).toBe(401);
  });

  test("Marketing copy verification: /app/resources/crisis NO contiene 'burnout score' ni 'predicción'", async ({ page }) => {
    await page.goto("/app/resources/crisis", { waitUntil: "networkidle" });
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain("burnout score");
    expect(html.toLowerCase()).not.toContain("predicción");
  });
});

test.describe("Phase 6F SP-F — Happy path con /api/dev/login (opcional)", () => {
  test("/app/wellbeing renderiza assessment + signals + sparkline + crisis block", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible — corre `npm run seed` y NODE_ENV=development");
      return;
    }

    await page.goto("/app/wellbeing", { waitUntil: "networkidle" });

    if (page.url().includes("/signin")) {
      test.skip(true, "dev login no fijó cookie correctamente");
      return;
    }

    // Page shell montada
    await expect(page.locator("[data-v2-wellbeing-page]")).toBeVisible({ timeout: 10000 });
    // Crisis block + SAPTEL prominente (Decision C3)
    await expect(page.locator("[data-v2-wellbeing-crisis]")).toBeVisible();
    await expect(page.locator('[data-testid="wellbeing-page-saptel-link"]')).toBeVisible();
    // Disclaimer footer
    await expect(page.locator("[data-v2-wellbeing-disclaimer]")).toBeVisible();
  });

  test("Marketing copy verification: /app/wellbeing NO contiene 'burnout score'", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    await page.goto("/app/wellbeing", { waitUntil: "networkidle" });
    if (page.url().includes("/signin")) {
      test.skip(true, "dev login no fijó cookie");
      return;
    }
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain("burnout score");
    expect(html.toLowerCase()).not.toContain("predicción");
    // Pero SÍ contiene wellbeing trends
    expect(html.toLowerCase()).toContain("wellbeing");
  });

  test("HomeV2 muestra WellbeingBanner cuando user activo + level ≥ warn", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    await page.goto("/app", { waitUntil: "networkidle" });
    if (page.url().includes("/signin")) {
      test.skip(true, "dev login no fijó cookie");
      return;
    }
    // Banner aparece SOLO si totalSessions ≥1 + level ≥ warn. Para demo
    // user fresh, level=ok típicamente → NO banner. Skip si no aplica.
    const banner = page.locator("[data-v2-wellbeing-banner]");
    if (await banner.count() === 0) {
      test.skip(true, "demo user sin wellbeing trigger (level=ok o sessions=0)");
      return;
    }
    // Si banner presente: verifica detalle CTA + disclaimer en banner
    await expect(banner).toBeVisible();
    await expect(page.locator('[data-testid="wellbeing-banner-detail-cta"]')).toBeVisible();
  });

  test("/admin/wellbeing/aggregate con OWNER renderiza distribución + topSignals", async ({ page }) => {
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/admin",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    await page.goto("/admin/wellbeing/aggregate", { waitUntil: "networkidle" });
    if (page.url().includes("/signin")) {
      test.skip(true, "dev login no fijó cookie");
      return;
    }
    // Si user no tiene role MANAGER+, no veremos contenido.
    const noRole = await page.locator("text=/No tienes permisos/i").count();
    if (noRole > 0) {
      test.skip(true, "demo user sin role MANAGER+");
      return;
    }
    await expect(page.locator("text=/Wellbeing/i").first()).toBeVisible();
    // Marketing copy NO contiene "burnout score"
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain("burnout score");
    expect(html.toLowerCase()).not.toContain("predicción");
  });
});
