/**
 * Phase 6E SP-B — flow continuo post-onboarding → multi-sessions.
 *
 * Suite completa Bug-48 anti-regression. Cubre 4 escenarios:
 *   1. Reproducer original (post-skip-all + 1 session + complete instruments)
 *      → verifica EmptyColdStart visible (Fix A SP-A).
 *   2. Cohort transition 5 sessions → LearningView (Fix C SP-A).
 *   3. Cohort transition 20 sessions → PersonalizedView.
 *   4. Boundary cases N=1,2,3,4 + transición a N=5 — cada paso
 *      verifica viewport accionable.
 *
 * Mode serial: tests usan setup secuencial + IDB persistence cross-reload.
 * Usa setupPostOnboarding (state setup via store directo) en lugar de
 * ejecutar Welcome + Calibration step-by-step. El bug bajo test
 * (Bug-48) vive POST-onboarding — setear welcomeDone via store es
 * equivalente a usuario que completó welcome + skip-all calibration,
 * sin gastar 9+ clicks + transiciones flaky.
 *
 * Run manual via `npm run test:e2e:bug48`. NO está en CI smoke porque
 * los 4 escenarios toman ~30-45s total.
 */
import { test, expect } from "@playwright/test";
import {
  setupPostOnboarding,
  simulateCompleteSession,
  simulateAllGatesCompleted,
  assertHomeViewportNotEmpty,
  getStoreState,
  flushStoreToIDB,
} from "./utils/helpers";

test.describe.configure({ mode: "serial" });

test.describe("Phase 6E SP-B — Bug-48 anti-regression continuous flow", () => {
  test("Bug-48 reproducer: post-skip-all + 1 session + all gates → EmptyColdStart visible", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });

    // Simular primera sesión + completar HRV + PSS-4 + chronotype
    await simulateCompleteSession(page);
    await simulateAllGatesCompleted(page);
    await flushStoreToIDB(page);
    await page.reload();
    await page.waitForSelector("[data-v2-root]", { timeout: 8000 });

    // ASSERTION CRÍTICA Fix A SP-A
    await assertHomeViewportNotEmpty(page);

    // EmptyColdStart visible (todas las gates true → actions=[])
    await expect(page.locator("[data-v2-coldstart-empty]")).toBeVisible();

    // Greeting adaptativo
    const greeting = await page.locator("[data-v2-greeting] h1").textContent();
    expect(greeting).toMatch(/listo para tu próxima/i);

    // CTA "Nueva sesión" presente
    await expect(page.getByTestId("coldstart-empty-cta")).toBeVisible();

    // Eyebrow "TU PRÓXIMA ACCIÓN"
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toMatch(/TU PRÓXIMA ACCIÓN/);

    await page.screenshot({
      path: "screenshots/phase6e-spb-e2e/multi-01-empty-state-real.png",
      fullPage: true,
    });
  });

  test("cohort transition: 5 sessions → LearningView (Fix C SP-A)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });

    // Simular 5 sesiones
    for (let i = 1; i <= 5; i++) {
      await simulateCompleteSession(page, { coherence: 60 + i * 2 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await page.waitForSelector("[data-v2-root]", { timeout: 8000 });

    // ASSERTION CRÍTICA: LearningView mounted
    await assertHomeViewportNotEmpty(page);
    await expect(page.locator("[data-v2-learning-progress]")).toBeVisible();
    await expect(page.locator("[data-v2-recommendation]")).toBeVisible();
    await expect(page.locator("[data-v2-learning-stats]")).toBeVisible();

    // ColdStart NO visible
    await expect(page.locator("[data-v2-coldstart-empty]")).not.toBeVisible();

    // Source attribute (engine|fallback)
    const recoSource = await page
      .locator("[data-v2-recommendation-source]")
      .getAttribute("data-v2-recommendation-source");
    expect(["engine", "fallback"]).toContain(recoSource);

    // Stats grid muestra valores reales
    const statsText = await page.locator("[data-v2-learning-stats]").textContent();
    expect(statsText).toMatch(/SESIONES/);
    expect(statsText).toMatch(/RACHA/);
    expect(statsText).toMatch(/COHERENCIA/);

    await page.screenshot({
      path: "screenshots/phase6e-spb-e2e/multi-02-learning-view-real.png",
      fullPage: true,
    });
  });

  test("cohort transition: 20 sessions → PersonalizedView (default branch)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });

    // Simular 20 sesiones
    for (let i = 1; i <= 20; i++) {
      await simulateCompleteSession(page, { coherence: 55 + i * 0.5 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await page.waitForSelector("[data-v2-root]", { timeout: 8000 });

    await assertHomeViewportNotEmpty(page);

    // PersonalizedView activo
    await expect(page.locator("[data-v2-hero]")).toBeVisible();

    // Branches anteriores NO mounted
    await expect(page.locator("[data-v2-coldstart-empty]")).not.toBeVisible();
    await expect(page.locator("[data-v2-learning-progress]")).not.toBeVisible();

    // State verification
    const state = await getStoreState(page);
    expect((state?.history as unknown[]).length).toBe(20);

    await page.screenshot({
      path: "screenshots/phase6e-spb-e2e/multi-03-personalized-real.png",
      fullPage: true,
    });
  });

  test("boundary cases N=1,2,3,4 con todas gates true → cada uno EmptyColdStart visible", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });

    // Setup: completar todos gates UNA VEZ (HRV + PSS-4 + chronotype)
    await simulateAllGatesCompleted(page);

    // Iterar N=1,2,3,4 — cada uno empty state visible
    for (let n = 1; n <= 4; n++) {
      await simulateCompleteSession(page, { coherence: 60 });
      await flushStoreToIDB(page);
      await page.reload();
      await page.waitForSelector("[data-v2-root]", { timeout: 8000 });
      // Re-aplicar gates después del reload (defensivo: state-after-init
      // puede divergir si scheduleSave debounce no flusheó persisten antes)
      await simulateAllGatesCompleted(page);
      await flushStoreToIDB(page);
      await page.reload();
      await page.waitForSelector("[data-v2-root]", { timeout: 8000 });

      await assertHomeViewportNotEmpty(page);
      await expect(
        page.locator("[data-v2-coldstart-empty]"),
        `N=${n}: empty state debe estar visible`
      ).toBeVisible();

      // Copy refleja sessionsToBaseline
      const cardText = await page.locator("[data-v2-coldstart-empty]").textContent();
      expect(cardText).toMatch(new RegExp(`Sesión ${n} de 5`));

      await page.screenshot({
        path: `screenshots/phase6e-spb-e2e/multi-04-boundary-N${n}.png`,
        fullPage: true,
      });
    }

    // Transición N=4 → N=5 debe activar LearningView
    await simulateCompleteSession(page, { coherence: 60 });
    await flushStoreToIDB(page);
    await page.reload();
    await page.waitForSelector("[data-v2-root]", { timeout: 8000 });
    await assertHomeViewportNotEmpty(page);
    await expect(page.locator("[data-v2-learning-progress]")).toBeVisible();
    await expect(page.locator("[data-v2-coldstart-empty]")).not.toBeVisible();
  });
});
