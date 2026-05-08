/**
 * Phase 6I-2 — E2E anti-regression streak milestone celebration (H-2).
 *
 * Cierra HIGH finding del repo audit: NEURAL_CONFIG.coaching.streakMilestones
 * = [7, 14, 30] existía SIN consumer. Ahora <StreakMilestoneSheet/> bottom-up
 * con choreography premium + dedup persistente per-milestone.
 *
 * Detection: store action `completeSession` chequea streak cross post-update
 * via helper puro `detectStreakMilestone`. Cuando user llega a streak 7/14/30
 * por primera vez (dedup vía streakMilestoneDoneAt), HomeV2 mounta el sheet.
 */
import { test, expect } from "@playwright/test";
import {
  resetAppState,
  waitForStoreReady,
  setupPostOnboarding,
  flushStoreToIDB,
  getStoreState,
} from "../utils/helpers";

test.describe.configure({ mode: "serial" });

const SHOTS = "screenshots/phase6i-2-streak-milestone";

test.describe("Phase 6I-2 — Streak milestone celebration (H-2)", () => {
  test.setTimeout(120_000);

  test("Milestone 7 CONSISTENCIA: completeSession cruza 7 → sheet visible", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    // Setear streak=6 y disparar completeSession con nsk=7 (engine pre-computed)
    await page.evaluate(() => {
      window.__BIO_STORE__.setState({ streak: 6, history: [] });
    });

    await page.evaluate(() => {
      window.__BIO_STORE__.getState().completeSession({
        eVC: 5, nC: 60, nR: 50, nE: 50,
        ns: 7, nsk: 7,
        nw: [0, 0, 0, 0, 0, 0, 1],
        newHist: [{ ts: Date.now(), p: "test", c: 60 }],
        ach: [], totalT: 120,
      });
    });
    await page.waitForTimeout(800);

    // Sheet visible con copy específico CONSISTENCIA
    const sheet = page.locator('[data-testid="streak-milestone-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet).toHaveAttribute("data-milestone", "7");
    // Strict-mode safe: "7 DÍAS" matchea eyebrow + statLabel — first()
    await expect(sheet.locator("text=CONSISTENCIA").first()).toBeVisible();
    await expect(sheet.locator("text=/Has mantenido 7 días consecutivos/i")).toBeVisible();
    await expect(page.locator('[data-testid="streak-milestone-primary"]')).toBeVisible();
    await expect(page.locator('[data-testid="streak-milestone-dismiss"]')).toBeVisible();

    // Count-up llega a 7 tras animation (650ms + 200ms delay)
    await page.waitForTimeout(900);
    await expect(page.locator('[data-testid="streak-milestone-count"]')).toHaveText("7");

    await page.screenshot({
      path: `${SHOTS}/01-milestone-7-consistencia.png`,
      fullPage: true,
    });
  });

  test("Milestone 14 DISCIPLINA: copy específico tier intermedio", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    // Setup directo via store (skip simulation 13 sesiones — too slow)
    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        pendingStreakMilestoneCelebration: {
          milestone: 14,
          currentStreak: 14,
          timestamp: Date.now(),
        },
      });
    });
    await page.waitForTimeout(800);

    const sheet = page.locator('[data-testid="streak-milestone-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet).toHaveAttribute("data-milestone", "14");
    await expect(sheet.locator("text=DISCIPLINA").first()).toBeVisible();
    await expect(sheet.locator("text=/2 semanas consecutivas/i")).toBeVisible();
    await page.waitForTimeout(900);
    await expect(page.locator('[data-testid="streak-milestone-count"]')).toHaveText("14");

    await page.screenshot({
      path: `${SHOTS}/02-milestone-14-disciplina.png`,
      fullPage: true,
    });
  });

  test("Milestone 30 MAESTRÍA: copy tier máximo + ctaPrimary alterno", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        pendingStreakMilestoneCelebration: {
          milestone: 30,
          currentStreak: 30,
          timestamp: Date.now(),
        },
      });
    });
    await page.waitForTimeout(800);

    const sheet = page.locator('[data-testid="streak-milestone-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet).toHaveAttribute("data-milestone", "30");
    await expect(sheet.locator("text=MAESTRÍA").first()).toBeVisible();
    await expect(sheet.locator("text=/30 días consecutivos/i")).toBeVisible();
    // Milestone 30 tiene ctaPrimary distinto: "Ver mi trayectoria"
    await expect(sheet.locator("text=/Ver mi trayectoria/i")).toBeVisible();
    await page.waitForTimeout(900);
    await expect(page.locator('[data-testid="streak-milestone-count"]')).toHaveText("30");

    await page.screenshot({
      path: `${SHOTS}/03-milestone-30-maestria.png`,
      fullPage: true,
    });
  });

  test("dismiss CTA limpia pending + persiste doneAt[7]", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        pendingStreakMilestoneCelebration: {
          milestone: 7, currentStreak: 7, timestamp: Date.now(),
        },
      });
    });
    await page.waitForTimeout(800);

    await expect(page.locator('[data-testid="streak-milestone-sheet"]')).toBeVisible();

    await page.waitForTimeout(500);
    await page.locator('[data-testid="streak-milestone-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="streak-milestone-sheet"]')).toBeHidden();

    const state = await getStoreState(page);
    expect(state.pendingStreakMilestoneCelebration).toBeNull();
    expect(state.streakMilestoneDoneAt?.[7]).toBeTruthy();
    expect(typeof state.streakMilestoneDoneAt[7]).toBe("number");
  });

  test("reload tras dismiss → NO re-mount sheet (dedup persistido)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        pendingStreakMilestoneCelebration: {
          milestone: 7, currentStreak: 7, timestamp: Date.now(),
        },
      });
    });
    await page.waitForTimeout(800);
    await page.locator('[data-testid="streak-milestone-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(300);

    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(1000);

    // Sheet NO debería aparecer (doneAt[7] persistido en IDB cifrado)
    await expect(page.locator('[data-testid="streak-milestone-sheet"]')).toBeHidden({ timeout: 2000 });
  });

  test("Streak break + rebuild a 7 → NO re-celebrate (dedup per-milestone)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    // Pre-condition: doneAt[7] ya set (user lo celebró previamente)
    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        streak: 6,
        streakMilestoneDoneAt: { 7: Date.now() - 86400000 },
      });
    });

    // Trigger completeSession con nsk=7 (rebuilding después de break)
    await page.evaluate(() => {
      window.__BIO_STORE__.getState().completeSession({
        eVC: 5, nC: 60, nR: 50, nE: 50,
        ns: 7, nsk: 7,
        nw: [0, 0, 0, 0, 0, 0, 1],
        newHist: [{ ts: Date.now(), p: "test", c: 60 }],
        ach: [], totalT: 120,
      });
    });
    await page.waitForTimeout(800);

    // Sheet NO debería aparecer (dedup per-milestone)
    await expect(page.locator('[data-testid="streak-milestone-sheet"]')).toBeHidden({ timeout: 2000 });

    // pendingCelebration null + doneAt[7] sigue intacto
    const state = await getStoreState(page);
    expect(state.pendingStreakMilestoneCelebration).toBeNull();
    expect(state.streakMilestoneDoneAt[7]).toBeTruthy();
  });

  test("backdrop click dismiss", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        pendingStreakMilestoneCelebration: {
          milestone: 14, currentStreak: 14, timestamp: Date.now(),
        },
      });
    });
    await page.waitForTimeout(800);

    await expect(page.locator('[data-testid="streak-milestone-sheet"]')).toBeVisible();

    const backdrop = page.locator('[data-testid="streak-milestone-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 }, timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="streak-milestone-sheet"]')).toBeHidden();
  });

  test("prefers-reduced-motion → instant mount + count-up al milestone sin animar", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        pendingStreakMilestoneCelebration: {
          milestone: 30, currentStreak: 30, timestamp: Date.now(),
        },
      });
    });

    // Sheet aparece sin esperar animation; count-up directo al target
    await expect(page.locator('[data-testid="streak-milestone-sheet"]')).toBeVisible({ timeout: 1500 });
    await expect(page.locator('[data-testid="streak-milestone-count"]')).toHaveText("30", { timeout: 1000 });
  });
});
