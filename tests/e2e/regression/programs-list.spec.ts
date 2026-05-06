/**
 * Phase 6G Fix2 P1-1 — /app/programs listing.
 *
 * Anti-regresión del bug detectado en auditoría 30 días: /app/programs
 * devolvía 404. Ahora la page existe y lista los 5 programas del
 * catálogo (lib/programs.js) con CTAs Empezar/Continuar.
 *
 * Sin auth real, /api/v1/me/program/active retorna 401 → useActiveProgram
 * redirige a /signin. Para testear UI sin auth, navegamos directo a
 * /app/programs y verificamos render del listing (que NO depende de
 * activeProgram para la grilla, solo el highlight superior).
 */
import { test, expect, Page } from "@playwright/test";
import { resetAppState, setupPostOnboarding, waitForStoreReady } from "../utils/helpers";

test.describe.configure({ mode: "serial" });
test.setTimeout(60_000);

async function mockNoActiveProgram(page: Page) {
  await page.route("**/api/v1/me/program/active", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ active: null }),
    });
  });
}

test.describe("Phase 6G Fix2 P1-1 — /app/programs", () => {
  test.beforeEach(async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    // Sin auth real, useActiveProgram retorna 401 → router.replace a /signin
    // y la page no monta el listing. Mock para devolver { active: null }
    // simula user autenticado sin programa activo (caso anchor del test).
    await mockNoActiveProgram(page);
  });

  test("Test 1: /app/programs renderea page + 5 program cards", async ({ page }) => {
    const resp = await page.goto("/app/programs", { waitUntil: "networkidle" });
    expect(resp?.status()).toBe(200);
    await expect(page.locator("[data-v2-programs-list-page]")).toBeVisible();
    const cardCount = await page.locator("[data-v2-program-card]").count();
    expect(cardCount).toBe(5);
    await page.screenshot({ path: "screenshots/phase6g-fix2/programs-01-listing.png", fullPage: true });
  });

  test("Test 2: cards tienen los 5 program ids esperados", async ({ page }) => {
    await page.goto("/app/programs", { waitUntil: "networkidle" });
    const expectedIds = [
      "neural-baseline",
      "recovery-week",
      "focus-sprint",
      "burnout-recovery",
      "executive-presence",
    ];
    for (const id of expectedIds) {
      await expect(page.locator(`[data-v2-program-card][data-program-id="${id}"]`)).toBeVisible();
    }
  });

  test("Test 3: sin activeProgram muestra 'ELIGE UN PROGRAMA' (no highlight)", async ({ page }) => {
    await page.goto("/app/programs", { waitUntil: "networkidle" });
    await expect(page.locator("text=/ELIGE UN PROGRAMA/i")).toBeVisible();
    const highlightCount = await page.locator("[data-v2-programs-active-highlight]").count();
    expect(highlightCount).toBe(0);
  });

  test("Test 4: cada card tiene CTA Empezar (data-testid)", async ({ page }) => {
    await page.goto("/app/programs", { waitUntil: "networkidle" });
    const expectedIds = [
      "neural-baseline",
      "recovery-week",
      "focus-sprint",
      "burnout-recovery",
      "executive-presence",
    ];
    for (const id of expectedIds) {
      const cta = page.getByTestId(`programs-start-${id}`);
      await expect(cta).toBeVisible();
      await expect(cta).toHaveText(/EMPEZAR/i);
    }
  });

  test("Test 5: back link → /app", async ({ page }) => {
    await page.goto("/app/programs", { waitUntil: "networkidle" });
    await page.getByTestId("programs-back-link").click();
    await page.waitForURL(/\/app(\?|$)/);
  });

  test("Test 6: header eyebrow + título correctos", async ({ page }) => {
    await page.goto("/app/programs", { waitUntil: "networkidle" });
    await expect(page.locator("text=/^PROGRAMAS$/").first()).toBeVisible();
    await expect(page.locator('h1:has-text("Trayectorias adaptativas")')).toBeVisible();
  });
});
