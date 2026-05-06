/**
 * Phase 6G Fix2 P1-2 — Empty states /app/program/today + /timeline.
 *
 * Anti-regresión del bug "body casi vacío sin programa activo":
 * ahora ambas pages muestran <EmptyProgramState> con CTA → /app/programs.
 *
 * Sin auth real, useActiveProgram retorna 401 → page hace router.replace
 * a /signin. Para testear UI del empty state, mockeamos el endpoint
 * para devolver { active: null } (200 OK con programa null).
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

test.describe("Phase 6G Fix2 P1-2 — EmptyProgramState wired", () => {
  test.beforeEach(async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    await mockNoActiveProgram(page);
  });

  test("Test 1: /app/program/today sin programa muestra EmptyProgramState", async ({ page }) => {
    await page.goto("/app/program/today", { waitUntil: "networkidle" });
    await expect(
      page.locator('[data-v2-empty-program-state][data-context="today"]')
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("empty-program-cta")).toBeVisible();
    await expect(page.locator("text=/Empieza un programa/i")).toBeVisible();
    await page.screenshot({
      path: "screenshots/phase6g-fix2/today-empty.png",
      fullPage: true,
    });
  });

  test("Test 2: empty state CTA navega a /app/programs", async ({ page }) => {
    await page.goto("/app/program/today", { waitUntil: "networkidle" });
    await page.getByTestId("empty-program-cta").click();
    await page.waitForURL(/\/app\/programs/, { timeout: 5000 });
  });

  test("Test 3: /app/program/timeline sin programa muestra EmptyProgramState context=timeline", async ({ page }) => {
    await page.goto("/app/program/timeline", { waitUntil: "networkidle" });
    await expect(
      page.locator('[data-v2-empty-program-state][data-context="timeline"]')
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("empty-program-cta")).toBeVisible();
    await expect(page.locator("text=/Sin línea de tiempo/i")).toBeVisible();
    await page.screenshot({
      path: "screenshots/phase6g-fix2/timeline-empty.png",
      fullPage: true,
    });
  });

  test("Test 4: timeline empty state CTA navega a /app/programs", async ({ page }) => {
    await page.goto("/app/program/timeline", { waitUntil: "networkidle" });
    await page.getByTestId("empty-program-cta").click();
    await page.waitForURL(/\/app\/programs/, { timeout: 5000 });
  });
});
