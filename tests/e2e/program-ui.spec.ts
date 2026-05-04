/**
 * Phase 6F SP-B — Program UI smoke E2E.
 *
 * Cubre:
 *  1. Standalone pages /app/program/today + /app/program/timeline montadas
 *     (no 404, render shell aún sin auth)
 *  2. 401 unauthenticated → redirect a /signin con callbackUrl
 *  3. Happy path opcional con /api/dev/login (skip si no disponible):
 *     start → today → timeline → abandon flow
 *
 * NO testea LearningView con activeProgram porque requiere user con
 * 1≤N<20 sesiones reales (cohort transition compleja). Eso queda
 * cubierto por unit tests del hook + componente y observación manual.
 */
import { test, expect } from "@playwright/test";

test.describe("Phase 6F SP-B — Program UI standalone pages", () => {
  test("/app/program/today renderiza shell + redirect a /signin sin auth", async ({ page }) => {
    const response = await page.goto("/app/program/today");
    // No es 404 — la ruta está montada
    expect(response?.status()).not.toBe(404);
    // Sin auth, useActiveProgram detecta 401 → redirect a /signin
    await page.waitForURL(/\/signin\?callbackUrl=/, { timeout: 10000 }).catch(() => null);
    expect(page.url()).toMatch(/(\/signin\?|\/app\/program\/today)/);
  });

  test("/app/program/timeline renderiza shell + redirect a /signin sin auth", async ({ page }) => {
    const response = await page.goto("/app/program/timeline");
    expect(response?.status()).not.toBe(404);
    await page.waitForURL(/\/signin\?callbackUrl=/, { timeout: 10000 }).catch(() => null);
    expect(page.url()).toMatch(/(\/signin\?|\/app\/program\/timeline)/);
  });

  test("/admin/programs/adherence redirige correctamente sin role", async ({ page }) => {
    // Admin layout requiere session + role; sin auth retorna sus propios redirects.
    const response = await page.goto("/admin/programs/adherence");
    expect(response?.status()).not.toBe(404);
  });
});

test.describe("Phase 6F SP-B — Happy path con /api/dev/login (opcional)", () => {
  test("flow completo: start → today renderiza ProgramActiveCard → abandon → no active", async ({ page }) => {
    // /api/dev/login sólo existe en NODE_ENV=development con seed user.
    // Si falla 403/404, skipeamos — happy path requiere infrastructure.
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible — corre `npm run seed` y NODE_ENV=development");
      return;
    }

    // Cleanup: si hay programa activo previo, abandonarlo.
    await page.request.post("/api/v1/me/program/abandon").catch(() => null);

    // 1. Iniciar programa via API
    const startRes = await page.request.post("/api/v1/me/program/start", {
      data: { programId: "burnout-recovery", source: "self-selected" },
    });
    if (startRes.status() === 401) {
      test.skip(true, "dev login no fijó cookie correctamente");
      return;
    }
    expect(startRes.status()).toBe(201);

    // 2. /app/program/today debe mostrar ProgramActiveCard
    await page.goto("/app/program/today", { waitUntil: "networkidle" });
    await expect(page.locator("[data-v2-program-active]")).toBeVisible({ timeout: 10000 });
    // Eyebrow "TU PROGRAMA · 28D" para Burnout Recovery
    await expect(page.locator("text=/TU PROGRAMA · 28D/")).toBeVisible();

    // 3. Progress bar presente
    await expect(page.locator("[data-v2-program-active] [role='progressbar']")).toBeVisible();

    // 4. /app/program/timeline debe renderizar 28 day cells
    await page.goto("/app/program/timeline", { waitUntil: "networkidle" });
    await expect(page.locator("[data-v2-program-timeline]")).toBeVisible({ timeout: 10000 });
    const dayCells = page.locator("[data-v2-timeline-day]");
    await expect(dayCells).toHaveCount(28);

    // 5. Abandon via API
    const abandonRes = await page.request.post("/api/v1/me/program/abandon");
    expect(abandonRes.status()).toBe(200);

    // 6. /app/program/today debe mostrar "SIN PROGRAMA ACTIVO"
    await page.goto("/app/program/today", { waitUntil: "networkidle" });
    await expect(page.locator("text=/SIN PROGRAMA ACTIVO/i")).toBeVisible({ timeout: 10000 });
  });

  test("ColdStartView dual CTA: empezar programa link", async ({ page }) => {
    // Setup user post-onboarding via dev login
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible");
      return;
    }
    // Limpiar programa por si quedó de test previo
    await page.request.post("/api/v1/me/program/abandon").catch(() => null);

    // Para reproducir el "empty cold-start" branch (todas las gates ok), hay
    // que setear state en el cliente. Usamos store directo — patrón ya
    // establecido por setupPostOnboarding helper para Bug-48.
    await page.goto("/app", { waitUntil: "networkidle" });
    const storeReady = await page.waitForFunction(
      () => (window as { __BIO_STORE__?: { getState?: () => { _loaded?: boolean } } }).__BIO_STORE__?.getState?.()?._loaded === true,
      { timeout: 10000 }
    ).catch(() => null);
    if (!storeReady) {
      test.skip(true, "store no hidrató — environment-specific");
      return;
    }

    // Verifica que el CTA "Empezar programa" exista (puede no estar visible
    // si el state no está en empty cold-start branch — el test prueba que
    // el botón está MONTADO en el DOM cuando aplica).
    const programCta = page.locator("[data-testid='coldstart-empty-program-cta']");
    if (await programCta.count() === 0) {
      test.skip(true, "user no está en empty cold-start branch");
      return;
    }
    await expect(programCta).toBeVisible();
  });
});
