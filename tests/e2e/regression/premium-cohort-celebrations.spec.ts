/**
 * Phase 6H Premium-Fix3 — E2E anti-regression cohort transition celebrations.
 *
 * Cierra finding H-4 detectado en SIMULATION_90_DAYS_PREMIUM_ANALYSIS:
 * Cohort transitions cold-start→learning (N=5) y learning→personalized (N=14)
 * eran switch silencioso. Ahora <CohortCelebrationSheet/> bottom-up con
 * choreography cyan radial pulse + count-up + CTAs staggered + auto-dismiss.
 *
 * Dedup: cohortCelebrationDoneAt persistido — no re-trigger en reload ni
 * subsequent sesiones del mismo cohort.
 */
import { test, expect } from "@playwright/test";
import {
  resetAppState,
  waitForStoreReady,
  setupPostOnboarding,
  simulateCompleteSession,
  flushStoreToIDB,
  getStoreState,
} from "../utils/helpers";

test.describe.configure({ mode: "serial" });

const SHOTS = "screenshots/phase6h-premium-fix3";

test.describe("Phase 6H Premium-Fix3 — Cohort transition celebrations", () => {
  test.setTimeout(120_000);

  test("5ª sesión dispara sheet learning con copy + count-up + CTAs", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    // 4 sesiones cold-start, sin cross todavía
    for (let i = 0; i < 4; i++) {
      await simulateCompleteSession(page, { coherence: 60 + i });
    }
    let state = await getStoreState(page);
    expect(state.pendingCelebration).toBeNull();

    // 5ª sesión cruza threshold → pendingCelebration set
    await simulateCompleteSession(page, { coherence: 65 });
    await page.waitForTimeout(800);

    // Sheet visible con copy específico de learning
    const sheet = page.locator('[data-testid="cohort-celebration-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet).toHaveAttribute("data-cohort", "learning");
    await expect(sheet.locator("text=/TRAYECTORIA EN APRENDIZAJE/i")).toBeVisible();
    await expect(sheet.locator("text=/trayectoria personalizada está aprendiendo/i")).toBeVisible();
    await expect(page.locator('[data-testid="cohort-celebration-primary"]')).toBeVisible();
    await expect(page.locator('[data-testid="cohort-celebration-dismiss"]')).toBeVisible();

    // Count-up llega a 5 tras la animation
    await page.waitForTimeout(900);
    const count = page.locator('[data-testid="cohort-celebration-count"]');
    await expect(count).toHaveText("5");

    await page.screenshot({
      path: `${SHOTS}/01-celebration-learning-mounted.png`,
      fullPage: true,
    });
  });

  test("dismiss CTA limpia pendingCelebration + persiste cohortCelebrationDoneAt", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 5; i++) {
      await simulateCompleteSession(page, { coherence: 60 });
    }
    await page.waitForTimeout(800);

    // Sheet visible
    await expect(page.locator('[data-testid="cohort-celebration-sheet"]')).toBeVisible();

    // Dismiss tras CTAs visibles (stagger ~350ms)
    await page.waitForTimeout(500);
    await page.locator('[data-testid="cohort-celebration-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Sheet desaparece
    await expect(page.locator('[data-testid="cohort-celebration-sheet"]')).toBeHidden();

    // State limpio + doneAt timestamp set
    const state = await getStoreState(page);
    expect(state.pendingCelebration).toBeNull();
    expect(state.cohortCelebrationDoneAt?.learning).toBeTruthy();
    expect(typeof state.cohortCelebrationDoneAt.learning).toBe("number");
  });

  test("reload tras dismiss → NO re-mount sheet (dedup persistido)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 5; i++) {
      await simulateCompleteSession(page, { coherence: 60 });
    }
    await page.waitForTimeout(800);
    await page.locator('[data-testid="cohort-celebration-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(300);

    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(1000);

    // Sheet NO debería aparecer (doneAt.learning persistido)
    await expect(page.locator('[data-testid="cohort-celebration-sheet"]')).toBeHidden({ timeout: 2000 });
  });

  test("14ª sesión dispara sheet personalized con copy específico", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    // 5 sesiones para cohort=learning
    for (let i = 0; i < 5; i++) {
      await simulateCompleteSession(page, { coherence: 60 });
    }
    await page.waitForTimeout(800);

    // Dismiss el sheet learning
    await page.locator('[data-testid="cohort-celebration-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(500);

    // 8 sesiones más → total 13 (still learning)
    for (let i = 0; i < 8; i++) {
      await simulateCompleteSession(page, { coherence: 65 });
    }
    let state = await getStoreState(page);
    expect(state.pendingCelebration).toBeNull();

    // 14ª sesión cruza personalized threshold
    await simulateCompleteSession(page, { coherence: 70 });
    await page.waitForTimeout(800);

    const sheet = page.locator('[data-testid="cohort-celebration-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet).toHaveAttribute("data-cohort", "personalized");
    // Strict-mode safe: eyebrow "TRAYECTORIA PERSONALIZADA" y title contienen
    // ambos la palabra "personalizada" → usar locator más específico.
    await expect(sheet.locator("text=TRAYECTORIA PERSONALIZADA").first()).toBeVisible();
    await expect(sheet.locator("text=/se activó/i")).toBeVisible();

    // Count-up llega a 14
    await page.waitForTimeout(900);
    await expect(page.locator('[data-testid="cohort-celebration-count"]')).toHaveText("14");

    await page.screenshot({
      path: `${SHOTS}/02-celebration-personalized-mounted.png`,
      fullPage: true,
    });
  });

  test("backdrop click dismiss", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 5; i++) {
      await simulateCompleteSession(page, { coherence: 60 });
    }
    await page.waitForTimeout(800);

    await expect(page.locator('[data-testid="cohort-celebration-sheet"]')).toBeVisible();

    // Click en backdrop (top-left corner) — fuera del sheet
    const backdrop = page.locator('[data-testid="cohort-celebration-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 }, timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="cohort-celebration-sheet"]')).toBeHidden();
  });

  test("prefers-reduced-motion → sheet mount instant + count-up al target sin animar", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 5; i++) {
      await simulateCompleteSession(page, { coherence: 60 });
    }
    // Sheet aparece sin esperar animation; count-up directo al target
    await expect(page.locator('[data-testid="cohort-celebration-sheet"]')).toBeVisible({ timeout: 1500 });
    // Count debería ser 5 sin esperar el delay animado
    await expect(page.locator('[data-testid="cohort-celebration-count"]')).toHaveText("5", { timeout: 1000 });
  });

  test("subsequent 6ª sesión NO re-dispara (already in learning)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 5; i++) {
      await simulateCompleteSession(page, { coherence: 60 });
    }
    await page.waitForTimeout(800);
    await page.locator('[data-testid="cohort-celebration-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(500);

    // 6ª sesión — sigue learning, NO debe disparar sheet
    await simulateCompleteSession(page, { coherence: 65 });
    await page.waitForTimeout(800);
    await expect(page.locator('[data-testid="cohort-celebration-sheet"]')).toBeHidden({ timeout: 1500 });

    const state = await getStoreState(page);
    expect(state.pendingCelebration).toBeNull();
  });

  test("capture comparativa pre vs post celebration", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 4; i++) {
      await simulateCompleteSession(page, { coherence: 60 });
    }
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SHOTS}/03-pre-celebration-4-sessions.png`,
      fullPage: true,
    });

    await simulateCompleteSession(page, { coherence: 65 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SHOTS}/04-celebration-fired.png`,
      fullPage: true,
    });
  });
});
